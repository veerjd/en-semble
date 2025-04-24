import type { InterestCategoryDTO } from "./InterestCategoryDTOs"

export interface InterestDTO {
    id: string
    slug: string
    category: InterestCategoryDTO
    createdAt?: string
}

export interface PostInterestDTO {
    slug: string
    category_id: string
}

export interface PatchInterestDTO {
    slug?: string
    category_id?: string
}

export interface DeleteInterestDTO {
    id: string
}

export interface SoftDeleteInterestDTO {
    id: string
    deleted_at?: string
}
