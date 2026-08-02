import { createHash, randomBytes } from 'node:crypto'

/** Generate a URL-safe invite token (raw form, shown once). */
export const generateInviteToken = (): string =>
    randomBytes(24).toString('base64url')

/** The stored form of an invite token. */
export const hashInviteToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex')
