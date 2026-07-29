// Response DTOs shared between server routes and frontend composables.
import type { Enums } from './database.types'

export type MatchResponse = Enums<'match_response'>

export interface InterestDTO {
    id: string
    slug: string
    label: string
}

export interface SpaceDTO {
    id: string
    slug: string
    name: string
}

export interface MeDTO {
    id: string
    username: string
    bio: string | null
    locale: string
    space: SpaceDTO
    interests: InterestDTO[]
}

export interface MatchUserDTO {
    id: string
    username: string
    bio: string | null
    interests: InterestDTO[]
}

/**
 * Derived match status from the caller's perspective:
 * - awaiting_me:   the other side accepted (or is pending) and I haven't responded
 * - awaiting_them: I accepted, they haven't responded
 * - matched:       both accepted (chatId is set)
 * - rejected:      either side rejected
 */
export type MatchStatus =
    | 'awaiting_me'
    | 'awaiting_them'
    | 'matched'
    | 'rejected'

export interface MatchDTO {
    id: string
    otherUser: MatchUserDTO
    myResponse: MatchResponse
    theirResponse: MatchResponse
    status: MatchStatus
    commonInterests: InterestDTO[]
    chatId: string | null
    unreadCount: number
    createdAt: string
}

export interface ChatDTO {
    id: string
    matchId: string
    otherUser: MatchUserDTO
}

export interface MessageDTO {
    id: string
    chatId: string
    userId: string
    content: string
    readAt: string | null
    createdAt: string
}

export interface InviteDTO {
    id: string
    email: string | null
    token: string
    link: string
    expiresAt: string
    usedAt: string | null
    status: 'pending' | 'used' | 'expired'
    createdAt: string
}

export interface InviteLookupDTO {
    spaceName: string
    valid: boolean
    reason: 'ok' | 'expired' | 'used' | 'not_found'
}

export interface FindMatchResultDTO {
    match: MatchDTO
}
