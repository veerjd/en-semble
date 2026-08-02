import type { H3Event } from 'h3'

interface Bucket {
    count: number
    resetAt: number
}

// In-memory fixed-window limiter — fine for a single instance; swap for a
// shared store (Redis) if the app ever runs multiple server instances.
const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

const clientKey = (event: H3Event): string => {
    const sessionUser = event.context._sessionUser
    if (sessionUser) return `u:${sessionUser.id}`
    const forwarded = getRequestHeader(event, 'x-forwarded-for')
    return `ip:${
        forwarded?.split(',')[0]?.trim() || getRequestIP(event) || 'unknown'
    }`
}

/**
 * Throw 429 when the caller exceeds `limit` calls per `windowMs` for the
 * given action.
 */
export const enforceRateLimit = (
    event: H3Event,
    action: string,
    limit: number,
    windowMs: number,
): void => {
    const now = Date.now()
    const key = `${action}:${clientKey(event)}`

    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
        if (buckets.size >= MAX_BUCKETS) {
            // Drop expired entries before accepting new keys.
            for (const [k, b] of buckets) {
                if (b.resetAt <= now) buckets.delete(k)
            }
        }
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return
    }

    bucket.count += 1
    if (bucket.count > limit) {
        setResponseHeader(
            event,
            'Retry-After',
            Math.ceil((bucket.resetAt - now) / 1000),
        )
        apiError(429, 'rate_limited')
    }
}
