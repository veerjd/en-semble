/**
 * Turn a user-provided interest label into a slug matching the seeded style
 * (lowercase, underscore-separated, ascii).
 */
export const slugify = (label: string): string =>
    label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
