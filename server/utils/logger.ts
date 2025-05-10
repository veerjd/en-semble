// server/utils/logger.ts

/**
 * Enhanced logger utility for Nuxt server
 */
export interface LogEntry {
    timestamp: string
    level: 'info' | 'warn' | 'error' | 'debug'
    method?: string
    url?: string
    responseTime?: number
    statusCode?: number
    clientIp?: string
    userAgent?: string
    referer?: string
    userId?: string
    message?: string
    data?: any
    error?: any
}

export class ServerLogger {
    private static instance: ServerLogger
    private environment: string
    private logToConsole: boolean
    private logToFile: boolean
    private logDirectory: string

    private constructor() {
        this.environment = process.env.NODE_ENV || 'development'
        this.logToConsole = process.env.LOG_TO_CONSOLE !== 'false'
        this.logToFile = process.env.LOG_TO_FILE === 'true'
        this.logDirectory = process.env.LOG_DIRECTORY || './logs'

        // Ensure log directory exists if logging to file
        if (this.logToFile) {
            this.ensureLogDirectoryExists()
        }
    }

    public static getInstance(): ServerLogger {
        if (!ServerLogger.instance) {
            ServerLogger.instance = new ServerLogger()
        }
        return ServerLogger.instance
    }

    /**
     * Log a request
     */
    public logRequest(entry: Partial<LogEntry>): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            ...entry,
        }

        this.log(logEntry)

        // Start timing for response time calculation
        return
    }

    /**
     * Log a response
     */
    public logResponse(entry: Partial<LogEntry>, startTime: number): void {
        const responseTime = Date.now() - startTime

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            responseTime,
            ...entry,
        }

        this.log(logEntry)
    }

    /**
     * Log an error
     */
    public logError(entry: Partial<LogEntry>): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            ...entry,
        }

        this.log(logEntry)
    }

    /**
     * General log method
     */
    private log(entry: LogEntry): void {
        // Console logging
        if (this.logToConsole) {
            this.logToConsoleOutput(entry)
        }

        // File logging
        if (this.logToFile) {
            this.logToFileOutput(entry)
        }
    }

    /**
     * Format and output to console
     */
    private logToConsoleOutput(entry: LogEntry): void {
        const {
            level,
            method,
            url,
            statusCode,
            responseTime,
            clientIp,
            message,
        } = entry

        let logFn = console.info
        let prefix = '📝'

        switch (level) {
            case 'error':
                logFn = console.error
                prefix = '❌'
                break
            case 'warn':
                logFn = console.warn
                prefix = '⚠️'
                break
            case 'debug':
                logFn = console.debug
                prefix = '🔍'
                break
        }

        if (method && url) {
            // Request/response log
            const statusStr = statusCode ? `${statusCode} ` : ''
            const timeStr = responseTime ? `(${responseTime}ms) ` : ''
            const ipStr = clientIp ? `[${clientIp}] ` : ''

            logFn(
                `${prefix} ${
                    entry.timestamp
                } ${ipStr}${method} ${url} ${statusStr}${timeStr}${
                    message || ''
                }`,
            )
        } else {
            // General log
            logFn(`${prefix} ${entry.timestamp} ${message || ''}`)

            // Log additional data if present
            if (entry.data) {
                console.dir(entry.data, { depth: null })
            }

            // Log error stack if present
            if (entry.error?.stack) {
                console.error(entry.error.stack)
            }
        }
    }

    /**
     * Log to file
     */
    private logToFileOutput(entry: LogEntry): void {
        // In a real implementation, this would write to a file
        // For production, consider using a logging library like winston
        // This is just a placeholder
        try {
            const fs = require('fs')
            const path = require('path')
            const date = new Date().toISOString().split('T')[0]
            const logFile = path.join(this.logDirectory, `server-${date}.log`)

            // Append to log file
            fs.appendFileSync(logFile, JSON.stringify(entry) + '\n')
        } catch (err) {
            console.error('Failed to write to log file:', err)
        }
    }

    /**
     * Ensure log directory exists
     */
    private ensureLogDirectoryExists(): void {
        try {
            const fs = require('fs')
            const path = require('path')
            if (!fs.existsSync(this.logDirectory)) {
                fs.mkdirSync(this.logDirectory, { recursive: true })
            }
        } catch (err) {
            console.error('Failed to create log directory:', err)
        }
    }
}

// Export singleton instance
export const logger = ServerLogger.getInstance()
