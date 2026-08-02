import { describe, expect, it } from 'vitest'
import { toInviteDTO } from '~~/server/actions/invites/getSpaceInvites'
import type { Tables } from '~~/shared/types/database.types'

const base: Tables<'invites'> = {
    id: 'i1',
    space_id: 's1',
    token_hash: 'deadbeef',
    email: null,
    created_by: 'u1',
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    used_at: null,
    used_by: null,
    created_at: '2026-01-01T00:00:00Z',
}

describe('toInviteDTO', () => {
    it('derives pending for a live invite', () => {
        expect(toInviteDTO(base).status).toBe('pending')
    })

    it('derives used over expired', () => {
        expect(
            toInviteDTO({
                ...base,
                used_at: '2026-01-02T00:00:00Z',
                expires_at: '2020-01-01T00:00:00Z',
            }).status,
        ).toBe('used')
    })

    it('derives expired', () => {
        expect(
            toInviteDTO({ ...base, expires_at: '2020-01-01T00:00:00Z' }).status,
        ).toBe('expired')
    })

    it('exposes token and link only when the raw token is provided', () => {
        expect(toInviteDTO(base).token).toBeUndefined()
        expect(toInviteDTO(base).link).toBeUndefined()
        const withToken = toInviteDTO(base, 'raw-token')
        expect(withToken.token).toBe('raw-token')
        expect(withToken.link).toBe('/register/raw-token')
    })
})
