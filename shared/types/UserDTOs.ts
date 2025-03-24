import type { InterestDTO } from './InterestDTOs'
import type { SpaceDTO } from './SpaceDTOs'
import type {
    PatchUserInterestDTO,
    PostUserInterestDTO,
} from './UserInterestDTOs'

export interface UserDTO {
    id: string
    username: string
    bio?: string
    interest: InterestDTO[]
    space: SpaceDTO
    created_at?: string
    last_active?: string
}

export interface PostUserDTO {
    username: string
    bio?: string
    space_id: string
    interests?: PostUserInterestDTO[]
}

export interface PatchUserDTO {
    id: string
    username?: string
    bio?: string
    space_id: string
    interests?: PatchUserInterestDTO[]
}

export interface DeleteUserDTO {
    id: string
}

export interface SoftDeleteUserDTO {
    id: string
    deleted_at?: string
}
