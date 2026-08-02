/**
 * Full user-journey test against the real server actions, backed by the
 * in-memory Supabase fake:
 *
 *   invites -> registration -> login -> preferences (profile + interests)
 *   -> match discovery -> mutual accept -> first two chat messages.
 *
 * Steps run in order and share state, like the two users' sessions would.
 */
import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { eventFor } from './support/testEvent'
import { FakeSupabase } from './support/fakeSupabase'
import { createInvites } from '~~/server/actions/invites/createInvites'
import { getInviteByToken } from '~~/server/actions/invites/getInviteByToken'
import { register } from '~~/server/actions/auth/register'
import { getMe } from '~~/server/actions/users/getMe'
import { patchMe } from '~~/server/actions/users/patchMe'
import { replaceMyInterests } from '~~/server/actions/interests/replaceMyInterests'
import { findAndCreateMatch } from '~~/server/actions/matches/findAndCreateMatch'
import { getMyMatches } from '~~/server/actions/matches/getMyMatches'
import { respondToMatch } from '~~/server/actions/matches/respondToMatch'
import { getChat } from '~~/server/actions/chats/getChat'
import { getChatMessages } from '~~/server/actions/chats/getChatMessages'
import { postMessage } from '~~/server/actions/chats/postMessage'
import { markChatRead } from '~~/server/actions/chats/markChatRead'
import { createInvitesSchema } from '~~/shared/schemas/invite'
import { registerSchema } from '~~/shared/schemas/auth'
import { patchMeSchema } from '~~/shared/schemas/user'
import { replaceInterestsSchema } from '~~/shared/schemas/interest'
import { postMessageSchema } from '~~/shared/schemas/message'
import { hashInviteToken } from '~~/server/utils/tokens'

const expectApiError = async (
    promise: Promise<unknown>,
    statusCode: number,
    code: string,
) => {
    const err = await promise.then(
        () => null,
        (e: unknown) => e as { statusCode?: number; message?: string },
    )
    expect(err, `expected ${statusCode} ${code} to be thrown`).not.toBeNull()
    expect(err!.statusCode).toBe(statusCode)
    expect(err!.message).toBe(code)
}

const db = new FakeSupabase()

const SPACE_ID = randomUUID()
const INVITER_AUTH = {
    id: randomUUID(),
    email: 'host@example.com',
    password: 'host-password-1',
}

const INTEREST_LABELS = ['Cinema', 'Hiking', 'Jazz', 'Cooking', 'Chess']
const interestId = (label: string) =>
    db.store.interests.find((i) => i.label === label)!.id

const ALICE = { email: 'alice@example.com', password: 'alice-password-1' }
const BOB = { email: 'bob@example.com', password: 'bob-password-12' }

// Filled in as the journey progresses.
let aliceToken = ''
let bobToken = ''
let aliceId = ''
let bobId = ''
let matchId = ''
let chatId = ''

beforeAll(() => {
    db.store.spaces.push({
        id: SPACE_ID,
        slug: 'demo-space',
        name: 'Demo Space',
        description: null,
        created_at: new Date().toISOString(),
        deleted_at: null,
    })
    db.authUsers.push({ ...INVITER_AUTH })
    db.store.users.push({
        id: INVITER_AUTH.id,
        space_id: SPACE_ID,
        username: 'host',
        bio: null,
        locale: 'fr',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        deleted_at: null,
    })
    for (const label of INTEREST_LABELS) {
        db.store.interests.push({
            id: randomUUID(),
            slug: label.toLowerCase(),
            label,
            interest_category_id: null,
            created_by: null,
            created_at: new Date().toISOString(),
        })
    }
})

describe('full cycle: invite -> register -> login -> preferences -> match -> chat', () => {
    describe('invitation sending', () => {
        it('rejects anonymous callers', async () => {
            const input = createInvitesSchema.parse({
                count: 1,
                expires_at: new Date(Date.now() + 86_400_000).toISOString(),
            })
            await expectApiError(
                createInvites(eventFor(db), input),
                401,
                'unauthenticated',
            )
        })

        it('creates one pending invite per email, revealing the token once', async () => {
            const input = createInvitesSchema.parse({
                emails: [ALICE.email, BOB.email],
                expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
            })
            const invites = await createInvites(
                eventFor(db, INVITER_AUTH.id),
                input,
            )

            expect(invites).toHaveLength(2)
            for (const invite of invites) {
                expect(invite.status).toBe('pending')
                expect(invite.token).toBeTruthy()
                expect(invite.link).toBe(`/register/${invite.token}`)
            }
            aliceToken = invites.find((i) => i.email === ALICE.email)!.token!
            bobToken = invites.find((i) => i.email === BOB.email)!.token!

            // Only the sha256 of the token is ever stored.
            const hashes = db.store.invites.map((r) => r.token_hash)
            expect(hashes).not.toContain(aliceToken)
            expect(hashes).toContain(hashInviteToken(aliceToken))
        })

        it('lets an invitee look up a live invite without an account', async () => {
            const lookup = await getInviteByToken(eventFor(db), aliceToken)
            expect(lookup).toEqual({
                spaceName: 'Demo Space',
                valid: true,
                reason: 'ok',
            })
        })

        it('reports an unknown token as invalid', async () => {
            expect(await getInviteByToken(eventFor(db), 'not-a-token')).toEqual(
                { spaceName: '', valid: false, reason: 'not_found' },
            )
        })
    })

    describe('registering', () => {
        it('rejects a bogus invite token', async () => {
            const input = registerSchema.parse({
                token: 'bogus-token',
                email: ALICE.email,
                password: ALICE.password,
                username: 'alice',
            })
            await expectApiError(
                register(eventFor(db), input),
                400,
                'invite_invalid',
            )
        })

        it('registers alice and consumes her invite', async () => {
            const input = registerSchema.parse({
                token: aliceToken,
                email: ALICE.email,
                password: ALICE.password,
                username: 'alice',
            })
            expect(await register(eventFor(db), input)).toEqual({ ok: true })

            const profile = db.store.users.find((u) => u.username === 'alice')!
            expect(profile.space_id).toBe(SPACE_ID)

            const invite = db.store.invites.find(
                (i) => i.token_hash === hashInviteToken(aliceToken),
            )!
            expect(invite.used_at).not.toBeNull()
            expect(invite.used_by).toBe(profile.id)

            const lookup = await getInviteByToken(eventFor(db), aliceToken)
            expect(lookup).toMatchObject({ valid: false, reason: 'used' })
        })

        it('refuses to reuse a consumed invite', async () => {
            const input = registerSchema.parse({
                token: aliceToken,
                email: 'mallory@example.com',
                password: 'mallory-pass-1',
                username: 'mallory',
            })
            await expectApiError(
                register(eventFor(db), input),
                400,
                'invite_used',
            )
        })

        it('rejects a taken username without consuming the invite', async () => {
            const input = registerSchema.parse({
                token: bobToken,
                email: BOB.email,
                password: BOB.password,
                username: 'alice',
            })
            await expectApiError(
                register(eventFor(db), input),
                409,
                'username_taken',
            )
            expect((await getInviteByToken(eventFor(db), bobToken)).valid).toBe(
                true,
            )
        })

        it('rejects a taken email and rolls nothing over', async () => {
            const input = registerSchema.parse({
                token: bobToken,
                email: ALICE.email,
                password: BOB.password,
                username: 'bob',
            })
            await expectApiError(
                register(eventFor(db), input),
                409,
                'email_taken',
            )
            expect((await getInviteByToken(eventFor(db), bobToken)).valid).toBe(
                true,
            )
        })

        it('registers bob with his own invite', async () => {
            const input = registerSchema.parse({
                token: bobToken,
                email: BOB.email,
                password: BOB.password,
                username: 'bob',
            })
            expect(await register(eventFor(db), input)).toEqual({ ok: true })
        })
    })

    describe('logging in', () => {
        it('rejects wrong credentials', async () => {
            const { data, error } = await db.auth.signInWithPassword({
                email: ALICE.email,
                password: 'wrong-password',
            })
            expect(data.user).toBeNull()
            expect(error?.code).toBe('invalid_credentials')
        })

        it('signs both users in', async () => {
            const alice = await db.auth.signInWithPassword(ALICE)
            const bob = await db.auth.signInWithPassword(BOB)
            expect(alice.error).toBeNull()
            expect(bob.error).toBeNull()
            aliceId = alice.data.user!.id
            bobId = bob.data.user!.id
            expect(aliceId).not.toBe(bobId)
        })

        it('serves the session profile to a logged-in user only', async () => {
            await expectApiError(getMe(eventFor(db)), 401, 'unauthenticated')

            const me = await getMe(eventFor(db, aliceId))
            expect(me.username).toBe('alice')
            expect(me.space).toMatchObject({
                slug: 'demo-space',
                name: 'Demo Space',
            })
            expect(me.interests).toEqual([])
        })
    })

    describe('setting preferences', () => {
        it('updates profile fields via patchMe', async () => {
            const input = patchMeSchema.parse({
                bio: 'Film buff and weekend hiker.',
                locale: 'en',
            })
            const me = await patchMe(eventFor(db, aliceId), input)
            expect(me.bio).toBe('Film buff and weekend hiker.')
            expect(me.locale).toBe('en')
        })

        it('rejects unknown interest ids', async () => {
            const input = replaceInterestsSchema.parse({
                interest_ids: [randomUUID()],
            })
            await expectApiError(
                replaceMyInterests(eventFor(db, aliceId), input),
                400,
                'invalid_interest',
            )
        })

        it('finds no match while alice has no interests', async () => {
            await expectApiError(
                findAndCreateMatch(eventFor(db, aliceId)),
                404,
                'no_overlap',
            )
        })

        it('replaces each user’s interest set', async () => {
            const aliceInterests = await replaceMyInterests(
                eventFor(db, aliceId),
                replaceInterestsSchema.parse({
                    interest_ids: ['Cinema', 'Hiking', 'Jazz'].map(interestId),
                }),
            )
            expect(aliceInterests.map((i) => i.label)).toEqual([
                'Cinema',
                'Hiking',
                'Jazz',
            ])

            const bobInterests = await replaceMyInterests(
                eventFor(db, bobId),
                replaceInterestsSchema.parse({
                    interest_ids: ['Hiking', 'Jazz', 'Chess'].map(interestId),
                }),
            )
            expect(bobInterests).toHaveLength(3)

            const me = await getMe(eventFor(db, aliceId))
            expect(me.interests.map((i) => i.label).sort()).toEqual([
                'Cinema',
                'Hiking',
                'Jazz',
            ])
        })
    })

    describe('seeing possible matches', () => {
        it('matches alice with bob on their shared interests', async () => {
            const match = await findAndCreateMatch(eventFor(db, aliceId))
            matchId = match.id

            expect(match.otherUser.username).toBe('bob')
            expect(match.commonInterests.map((i) => i.label).sort()).toEqual([
                'Hiking',
                'Jazz',
            ])
            expect(match.myResponse).toBe('pending')
            expect(match.status).toBe('awaiting_me')
            expect(match.chatId).toBeNull()
        })

        it('shows the pending match to both users', async () => {
            const aliceMatches = await getMyMatches(eventFor(db, aliceId))
            expect(aliceMatches).toHaveLength(1)
            expect(aliceMatches[0]!.otherUser.username).toBe('bob')

            const bobMatches = await getMyMatches(eventFor(db, bobId))
            expect(bobMatches).toHaveLength(1)
            expect(bobMatches[0]!.otherUser.username).toBe('alice')
            expect(bobMatches[0]!.status).toBe('awaiting_me')
            expect(bobMatches[0]!.unreadCount).toBe(0)
        })

        it('never re-proposes an already-paired candidate', async () => {
            // Bob is paired; only the interest-less host remains.
            await expectApiError(
                findAndCreateMatch(eventFor(db, aliceId)),
                404,
                'no_overlap',
            )
        })
    })

    describe('confirming matches', () => {
        it('keeps the chat closed until both sides accept', async () => {
            const match = await respondToMatch(
                eventFor(db, aliceId),
                matchId,
                'accepted',
            )
            expect(match.myResponse).toBe('accepted')
            expect(match.status).toBe('awaiting_them')
            expect(match.chatId).toBeNull()
            expect(db.store.chats).toHaveLength(0)
        })

        it('blocks non-participants from responding', async () => {
            await expectApiError(
                respondToMatch(
                    eventFor(db, INVITER_AUTH.id),
                    matchId,
                    'accepted',
                ),
                403,
                'not_match_participant',
            )
        })

        it('opens the chat on mutual accept', async () => {
            const match = await respondToMatch(
                eventFor(db, bobId),
                matchId,
                'accepted',
            )
            expect(match.status).toBe('matched')
            expect(match.chatId).not.toBeNull()
            chatId = match.chatId!

            expect(db.store.chats).toHaveLength(1)
            expect(db.store.chats[0]!.match_id).toBe(matchId)
        })

        it('treats repeating the same response as idempotent', async () => {
            const match = await respondToMatch(
                eventFor(db, aliceId),
                matchId,
                'accepted',
            )
            expect(match.status).toBe('matched')
            expect(match.chatId).toBe(chatId)
        })

        it('refuses to flip an accepted response to rejected', async () => {
            await expectApiError(
                respondToMatch(eventFor(db, aliceId), matchId, 'rejected'),
                409,
                'already_responded',
            )
        })
    })

    describe('sending the first two messages', () => {
        it('keeps outsiders out of the chat', async () => {
            await expectApiError(
                getChat(eventFor(db, INVITER_AUTH.id), chatId),
                403,
                'not_chat_participant',
            )
        })

        it('rejects a blank message at the schema boundary', () => {
            expect(
                postMessageSchema.safeParse({ content: '   ' }).success,
            ).toBe(false)
        })

        it('delivers alice’s first message, unread for bob', async () => {
            const message = await postMessage(
                eventFor(db, aliceId),
                chatId,
                postMessageSchema.parse({
                    content: 'Salut Bob! Hiking this weekend?',
                }),
            )
            expect(message.chatId).toBe(chatId)
            expect(message.userId).toBe(aliceId)
            expect(message.readAt).toBeNull()

            const bobMatches = await getMyMatches(eventFor(db, bobId))
            expect(bobMatches[0]!.unreadCount).toBe(1)
            const aliceMatches = await getMyMatches(eventFor(db, aliceId))
            expect(aliceMatches[0]!.unreadCount).toBe(0)
        })

        it('shows bob the chat with alice, then marks it read', async () => {
            const chat = await getChat(eventFor(db, bobId), chatId)
            expect(chat.matchId).toBe(matchId)
            expect(chat.otherUser.username).toBe('alice')

            expect(await markChatRead(eventFor(db, bobId), chatId)).toEqual({
                ok: true,
            })
            const bobMatches = await getMyMatches(eventFor(db, bobId))
            expect(bobMatches[0]!.unreadCount).toBe(0)
        })

        it('delivers bob’s reply as the second message', async () => {
            const reply = await postMessage(
                eventFor(db, bobId),
                chatId,
                postMessageSchema.parse({
                    content: 'Salut Alice! Absolutely, saturday works.',
                }),
            )
            expect(reply.userId).toBe(bobId)

            const aliceMatches = await getMyMatches(eventFor(db, aliceId))
            expect(aliceMatches[0]!.unreadCount).toBe(1)
        })

        it('returns both messages oldest-first with read state', async () => {
            const messages = await getChatMessages(
                eventFor(db, aliceId),
                chatId,
            )
            expect(messages).toHaveLength(2)

            const [first, second] = messages
            expect(first!.userId).toBe(aliceId)
            expect(first!.content).toBe('Salut Bob! Hiking this weekend?')
            expect(first!.readAt).not.toBeNull()
            expect(second!.userId).toBe(bobId)
            expect(second!.content).toBe(
                'Salut Alice! Absolutely, saturday works.',
            )
            expect(second!.readAt).toBeNull()
        })
    })
})
