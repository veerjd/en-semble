export interface SpaceDTO {
    id: string
    name: string
    description?: string
    created_at?: string
}

export interface PostSpaceDTO {
    name: string
    description?: string
}

export interface PatchSpaceDTO {
    id: string
    name?: string
    description?: string
}

export interface DeleteSpaceDTO {
    id: string
}

export interface SoftDeleteSpaceDTO {
    id: string
    deleted_at?: string
}
