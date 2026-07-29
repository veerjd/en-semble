import { serverSupabaseUser } from '#supabase/server'

/**
 * Fail-closed API guard: every /api/** route requires a Supabase session
 * unless explicitly allowlisted. Individual routes still run their own
 * authorization (requireUser &co) — this only guarantees a future route
 * that forgets to cannot be reached anonymously.
 */
const PUBLIC_API = [/^\/api\/auth\/register\/?$/, /^\/api\/invites\/lookup\//]

export default defineEventHandler(async (event) => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/')) return
    if (PUBLIC_API.some((re) => re.test(path))) return

    let authenticated = false
    try {
        const user = await serverSupabaseUser(event)
        authenticated = Boolean(user)
    } catch {
        authenticated = false
    }

    if (!authenticated) {
        throw createError({
            statusCode: 401,
            message: 'unauthenticated',
            data: { code: 'unauthenticated' },
        })
    }
})
