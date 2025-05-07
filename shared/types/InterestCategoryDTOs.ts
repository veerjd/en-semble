export interface InterestCategoryDTO {
    id: string
    slug: string
    created_at?: string
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
