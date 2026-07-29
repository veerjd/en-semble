import { describe, expect, it } from 'vitest'
import {
    commonInterests,
    deriveMatchStatus,
    toMatchDTO,
    type MatchRow,
} from '~~/server/utils/mappers'

describe('deriveMatchStatus', () => {
    it('is rejected as soon as either side rejects', () => {
        expect(deriveMatchStatus('rejected', 'pending')).toBe('rejected')
        expect(deriveMatchStatus('accepted', 'rejected')).toBe('rejected')
        expect(deriveMatchStatus('rejected', 'rejected')).toBe('rejected')
    })

    it('is matched only when both accept', () => {
        expect(deriveMatchStatus('accepted', 'accepted')).toBe('matched')
    })

    it('awaits me while I have not responded', () => {
        expect(deriveMatchStatus('pending', 'pending')).toBe('awaiting_me')
        expect(deriveMatchStatus('pending', 'accepted')).toBe('awaiting_me')
    })

    it('awaits them once I accepted', () => {
        expect(deriveMatchStatus('accepted', 'pending')).toBe('awaiting_them')
    })
})

describe('commonInterests', () => {
    const interest = (id: string) => ({ id, slug: id, label: id })

    it('intersects by id', () => {
        expect(
            commonInterests(
                [interest('a'), interest('b')],
                [interest('b'), interest('c')],
            ),
        ).toEqual([interest('b')])
    })

    it('is empty when nothing overlaps', () => {
        expect(commonInterests([interest('a')], [interest('b')])).toEqual([])
    })
})

describe('toMatchDTO', () => {
    const interest = (id: string) => ({ id, slug: id, label: id })
    const row: MatchRow = {
        id: 'm1',
        user1_id: 'alice',
        user2_id: 'bob',
        user1_response: 'accepted',
        user2_response: 'pending',
        created_at: '2026-01-01T00:00:00Z',
        user1: {
            id: 'alice',
            username: 'alice',
            bio: null,
            user_interests: [
                { interest: interest('x') },
                { interest: interest('y') },
            ],
        },
        user2: {
            id: 'bob',
            username: 'bob',
            bio: 'hi',
            user_interests: [{ interest: interest('y') }],
        },
        chat: null,
    }

    it('maps from user1 perspective', () => {
        const dto = toMatchDTO(row, 'alice')
        expect(dto.otherUser.username).toBe('bob')
        expect(dto.myResponse).toBe('accepted')
        expect(dto.theirResponse).toBe('pending')
        expect(dto.status).toBe('awaiting_them')
        expect(dto.commonInterests).toEqual([interest('y')])
        expect(dto.chatId).toBeNull()
    })

    it('maps from user2 perspective', () => {
        const dto = toMatchDTO(row, 'bob')
        expect(dto.otherUser.username).toBe('alice')
        expect(dto.myResponse).toBe('pending')
        expect(dto.status).toBe('awaiting_me')
    })

    it('accepts chat as object or array (PostgREST one-to-one embed)', () => {
        expect(toMatchDTO({ ...row, chat: { id: 'c1' } }, 'alice').chatId).toBe(
            'c1',
        )
        expect(
            toMatchDTO({ ...row, chat: [{ id: 'c2' }] }, 'alice').chatId,
        ).toBe('c2')
        expect(toMatchDTO({ ...row, chat: [] }, 'alice').chatId).toBeNull()
    })
})
