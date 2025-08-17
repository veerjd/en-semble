import type { UserDTO } from './UserDTOs'

export interface MatchDTO {
    id: string
    user1: UserDTO
    user2: UserDTO
    status_id: number
    status?: string
    created_at?: string
    chat?: { id: string } | null
}

export interface PostMatchDTO {
    user1_id: string
    user2_id: string
    status_id: number
}

export interface PatchMatchDTO {
    id: string
    user1_id: string
    user2_id: string
    status_id: number
}

export interface DeleteMatchDTO {
    id: string
}

export interface SoftDeleteMatchDTO {
    id: string
    deleted_at?: string
}
