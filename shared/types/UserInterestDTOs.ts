export interface UserInterestDTO {
    user_id: string
    interest_id: string
    created_at: string
}

export interface PostUserInterestDTO {
    user_id: string
    interest_id: string
}

export interface PatchUserInterestDTO {
    id: string
    user_id?: string
    interest_id?: string
}

export interface DeleteUserInterestDTO {
    id: string
}

export interface SoftDeleteUserInterestDTO {
    id: string
}
