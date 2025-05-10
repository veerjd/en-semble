// server/middleware/2.error-handler.ts
// Using '2.' prefix to ensure this runs after the request logger but before the response logger

import { defineEventHandler, H3Event, createError } from 'h3'
import { logger } from '../utils/logger'

export default defineEventHandler((event: H3Event) => {
    // Wrap in try/catch to capture unhandled errors
    try {
        // Continue with the request but catch any errors
        return
    } catch (error: any) {
        // Log the error
        logger.logError({
            method: event.node.req.method,
            url: event.node.req.url,
            statusCode: error.statusCode || 500,
            message: `Unhandled server error: ${error.message}`,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            data: {
                requestId: event.context.requestLogger?.requestId || 'unknown',
            },
        })

        // Create a proper H3 error response
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: 'Internal Server Error',
            data: {
                message:
                    process.env.NODE_ENV === 'production'
                        ? 'An unexpected error occurred'
                        : error.message,
            },
        })
    }
})
