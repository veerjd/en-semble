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
    user_id: string
    interest_id: string
}

export interface DeleteUserInterestDTO {
    user_id: string
    interest_id: string
}

export interface SoftDeleteUserInterestDTO {
    user_id: string
    interest_id: string
}
