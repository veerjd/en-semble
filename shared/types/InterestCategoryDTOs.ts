export interface InterestCategoryDTO {
    id: string
    slug: string
    createdAt?: string
}

export interface PostInterestCategoryDTO {
    slug: string
}

export interface PatchInterestCategoryDTO {
    slug: string
}

export interface DeleteInterestCategoryDTO {
    id: string
}

export interface SoftDeleteInterestCategoryDTO {
    id: string
    deleted_at?: string
}
