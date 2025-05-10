// server/middleware/1.request-logger.ts
// Using '1.' prefix to ensure this runs first in the middleware chain

import { defineEventHandler, H3Event } from 'h3'
import { logger } from '../utils/logger'

export default defineEventHandler((event: H3Event) => {
    // Store request start time
    const startTime = Date.now()

    // Extract request information
    const method = event.node.req.method
    const url = event.node.req.url
    const clientIp = getClientIp(event)
    const userAgent = event.node.req.headers['user-agent'] || 'Unknown'
    const referer = event.node.req.headers['referer'] || 'Direct'

    // Generate a unique request ID
    const requestId = generateRequestId()

    // Attach data to the event context for response logger
    event.context.requestLogger = {
        startTime,
        requestId,
    }

    // Get the user ID if available in the request (depends on your auth implementation)
    let userId: string | undefined
    try {
        // This is just a placeholder - implement based on your auth system
        // Example: userId = event.context.auth?.user?.id
    } catch (error) {
        // Ignore auth errors in logging
    }

    // Log the request
    logger.logRequest({
        method,
        url,
        clientIp,
        userAgent,
        referer,
        userId,
        message: `Request received: ${method} ${url}`,
        data: {
            headers: getHeadersToLog(event),
            query: getQueryParamsToLog(event),
            requestId,
        },
    })

    // Continue with the request (important!)
    return
})

/**
 * Get client IP address with proxy support
 */
function getClientIp(event: H3Event): string {
    const headers = event.node.req.headers

    // Check X-Forwarded-For header (common for proxies)
    const forwardedFor = headers['x-forwarded-for']
    if (forwardedFor) {
        return Array.isArray(forwardedFor)
            ? forwardedFor[0]?.split(',')[0]?.trim() || 'Unknown'
            : forwardedFor.split(',')[0]?.trim() || 'Unknown'
    }

    // Check X-Real-IP header (used by some proxies)
    const realIp = headers['x-real-ip']
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] || 'Unknown' : realIp
    }

    // Fall back to direct socket connection
    return event.node.req.socket?.remoteAddress || 'Unknown'
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get headers to log (with sensitive information removed)
 */
function getHeadersToLog(event: H3Event): Record<string, any> {
    const headers = { ...event.node.req.headers }

    // Remove sensitive headers
    const sensitiveHeaders = [
        'authorization',
        'cookie',
        'set-cookie',
        'x-api-key',
    ]
    sensitiveHeaders.forEach((header) => {
        if (headers[header]) {
            headers[header] = '[REDACTED]'
        }
    })

    return headers
}

/**
 * Get query parameters to log
 */
function getQueryParamsToLog(event: H3Event): Record<string, any> {
    try {
        // Get URL query parameters
        const url = new URL(
            event.node.req.url || '',
            `http://${event.node.req.headers.host || 'localhost'}`,
        )
        const params: Record<string, any> = {}

        // Convert URLSearchParams to a plain object
        url.searchParams.forEach((value, key) => {
            params[key] = value
        })

        return params
    } catch (error) {
        return {}
    }
}
