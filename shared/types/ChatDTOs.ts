import type { MatchDTO } from './MatchDTOs'
import type { UserDTO } from './UserDTOs'

export interface ChatDTO {
    id: string
    user1: UserDTO
    user2: UserDTO
    users?: UserDTO[]
    match: MatchDTO
    created_at?: string
}

export interface PostChatDTO {
    user1_id: string
    user2_id: string
    match_id: string
}

export interface PatchChatDTO {
    id: string
    user1_id?: string
    user2_id?: string
    match_id?: string
}

export interface DeleteChatDTO {
    id: string
}

export interface SoftDeleteChatDTO {
    id: string
    deleted_at?: string
}
