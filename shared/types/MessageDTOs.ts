import type { ChatDTO } from './ChatDTOs'
import type { UserDTO } from './UserDTOs'

export interface MessageDTO {
    id: string
    chat: ChatDTO
    user: UserDTO
    content: string
    read: boolean
    created_at?: string
}

export interface PostMessageDTO {
    chat_id: string
    user_id: string
    content: string
    read: boolean
}

export interface PatchMessageDTO {
    id: string
    chat_id?: string
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
