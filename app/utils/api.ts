import type { FetchError } from 'ofetch'

/**
 * Extract the machine-readable error code from an API error so it can be
 * mapped to an i18n string (errors.<code>).
 */
export const apiErrorCode = (err: unknown): string => {
    const fetchError = err as FetchError<{
        message?: string
        data?: { code?: string }
    }>
    return (
        fetchError?.data?.data?.code ??
        fetchError?.data?.message ??
        'internal_error'
    )
}
