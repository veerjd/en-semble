import type { MatchDTO } from './MatchDTOs'
import type { UserDTO } from '../UserDTOs'

export interface MessageDTO {
    id: string
    match: MatchDTO
    user: UserDTO
    content: string
    read: boolean
    createdAt?: string
}

export interface PostMessageDTO {
    match_id: string
    user_id: string
    content: string
    read: boolean
}

export interface PatchMessageDTO {
    id: string
    match_id?: string
    user_id?: string
    content?: string
    read?: boolean
}

export interface DeleteMessageDTO {
    id: string
}

export interface SoftDeleteMessageDTO {
    id: string
    deleted_at?: string
}
