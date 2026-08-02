import type { SessionUser } from './utils/auth'

declare module 'h3' {
    interface H3EventContext {
        _sessionUser?: SessionUser
    }
}

export {}
