import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'

/**
 * Wraps a route handler so that:
 * - errors thrown via createError() pass through untouched, and
 * - anything else (driver errors, bugs) becomes a sanitized 500 that never
 *   leaks raw database messages to the client.
 *
 * Error convention: createError({ statusCode, message: <code> }) where
 * <code> is a stable machine-readable key the frontend maps to an i18n
 * string (errors.<code>).
 */
export const defineApiHandler = <T extends EventHandlerRequest, D>(
    handler: (event: H3Event<T>) => Promise<D>,
): EventHandler<T, Promise<D>> =>
    defineEventHandler(async (event) => {
        try {
            return await handler(event)
        } catch (err) {
            if (isError(err)) throw err
            console.error(
                `[api] ${event.method} ${event.path}:`,
                err instanceof Error ? err.message : err,
            )
            throw createError({
                statusCode: 500,
                message: 'internal_error',
            })
        }
    })

/**
 * Throw a typed API error. `code` doubles as the h3 message and is exposed
 * to the client for i18n mapping.
 */
export const apiError = (statusCode: number, code: string): never => {
    throw createError({ statusCode, message: code, data: { code } })
}
