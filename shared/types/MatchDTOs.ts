import type { UserDTO } from './UserDTOs'

export interface MatchDTO {
    id: string
    user1: UserDTO
    user2: UserDTO
    status: string
    createdAt?: string
}

export interface PostMatchDTO {
    user1_id: string
    user2_id: string
    status: string
}

export interface PatchMatchDTO {
    id: string
    user1_id: string
    user2_id: string
    status: string
}

export interface DeleteMatchDTO {
    id: string
}

export interface SoftDeleteMatchDTO {
    id: string
    deleted_at?: string
}
