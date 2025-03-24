export interface InterestDTO {
    id: string
    name: string
    createdAt?: string
}

export interface PostInterestDTO {
    name: string
}

export interface PatchInterestDTO {
    name: string
}

export interface DeleteInterestDTO {
    id: string
}

export interface SoftDeleteInterestDTO {
    id: string
    deleted_at?: string
}
