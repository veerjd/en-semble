// server/middleware/3.response-logger.ts
// Using '3.' prefix to ensure this runs after API handlers but before sending the response

import { defineEventHandler, H3Event } from 'h3'
import { logger } from '../utils/logger'
import { ServerResponse } from 'http'

export default defineEventHandler((event: H3Event) => {
    // Original end function
    const originalEnd = event.node.res.end

    // Get data from the request logger
    const { startTime, requestId } = event.context.requestLogger || {
        startTime: Date.now(),
        requestId: 'unknown',
    }

    // Override the end method to log response details
    event.node.res.end = function (
        this: ServerResponse,
        chunk: any,
        encoding?: BufferEncoding | (() => void),
        callback?: () => void,
    ): ServerResponse {
        const endTime = Date.now()
        const responseTime = endTime - startTime
        const statusCode = event.node.res.statusCode
        const method = event.node.req.method
        const url = event.node.req.url

        // Determine log level based on status code
        let level: 'info' | 'warn' | 'error' = 'info'
        if (statusCode >= 500) {
            level = 'error'
        } else if (statusCode >= 400) {
            level = 'warn'
        }

        // Log the response
        logger.logResponse(
            {
                level,
                method,
                url,
                statusCode,
                responseTime,
                message: `Response sent: ${statusCode} ${method} ${url} (${responseTime}ms)`,
                data: {
                    headers: getResponseHeadersToLog(event),
                    requestId,
                },
            },
            startTime,
        )

        // Handle the case where encoding is actually the callback
        if (typeof encoding === 'function') {
            callback = encoding
            encoding = undefined
        }

        // Call the original end method with the correct arguments
        return originalEnd.call(
            this,
            chunk,
            encoding as BufferEncoding,
            callback,
        )
    }

    // Continue with the request
    return
})

/**
 * Get response headers to log (with sensitive information removed)
 */
function getResponseHeadersToLog(event: H3Event): Record<string, any> {
    const headers: Record<string, any> = {}

    // Get all response headers
    const headerNames = Object.keys(event.node.res.getHeaders())

    headerNames.forEach((name) => {
        const header = event.node.res.getHeader(name)

        // Skip sensitive headers
        if (['set-cookie', 'authorization'].includes(name.toLowerCase())) {
            headers[name] = '[REDACTED]'
        } else {
            headers[name] = header
        }
    })

    return headers
}
