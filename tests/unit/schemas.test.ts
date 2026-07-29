import { describe, expect, it } from 'vitest'
import { registerSchema } from '~~/shared/schemas/auth'
import { createInvitesSchema } from '~~/shared/schemas/invite'
import { patchMeSchema } from '~~/shared/schemas/user'
import { replaceInterestsSchema } from '~~/shared/schemas/interest'

describe('registerSchema', () => {
    const valid = {
        token: 't',
        email: 'a@b.co',
        password: 'longenough',
        username: 'user_1',
    }

    it('accepts a valid payload', () => {
        expect(registerSchema.safeParse(valid).success).toBe(true)
    })

    it.each([
        ['bad email', { ...valid, email: 'nope' }],
        ['short password', { ...valid, password: '1234567' }],
        ['short username', { ...valid, username: 'ab' }],
        ['username with spaces', { ...valid, username: 'a b c' }],
        ['missing token', { ...valid, token: '' }],
    ])('rejects %s', (_label, payload) => {
        expect(registerSchema.safeParse(payload).success).toBe(false)
    })
})

describe('createInvitesSchema', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()

    it('accepts emails with future expiry', () => {
        expect(
            createInvitesSchema.safeParse({
                emails: ['a@b.co'],
                expires_at: future,
            }).success,
        ).toBe(true)
    })

    it('accepts count instead of emails', () => {
        expect(
            createInvitesSchema.safeParse({ count: 3, expires_at: future })
                .success,
        ).toBe(true)
    })

    it('rejects when neither emails nor count is given', () => {
        expect(
            createInvitesSchema.safeParse({ expires_at: future }).success,
        ).toBe(false)
    })

    it('rejects an expiry in the past', () => {
        expect(
            createInvitesSchema.safeParse({
                count: 1,
                expires_at: new Date(Date.now() - 1000).toISOString(),
            }).success,
        ).toBe(false)
    })
})

describe('patchMeSchema', () => {
    it('rejects an empty patch', () => {
        expect(patchMeSchema.safeParse({}).success).toBe(false)
    })

    it('accepts partial updates', () => {
        expect(patchMeSchema.safeParse({ bio: 'hi' }).success).toBe(true)
        expect(patchMeSchema.safeParse({ locale: 'en' }).success).toBe(true)
        expect(patchMeSchema.safeParse({ locale: 'de' }).success).toBe(false)
    })
})

describe('replaceInterestsSchema', () => {
    it('requires UUIDs', () => {
        expect(
            replaceInterestsSchema.safeParse({ interest_ids: ['nope'] })
                .success,
        ).toBe(false)
        expect(
            replaceInterestsSchema.safeParse({
                interest_ids: ['8858337c-f4fc-47d4-8a28-6b427894f99b'],
            }).success,
        ).toBe(true)
    })
})
