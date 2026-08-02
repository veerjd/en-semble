/**
 * Registers the Nitro/h3 auto-imports the server actions rely on as
 * globals (vitest runs outside the Nuxt server bundle), and builds fake
 * H3 events carrying the in-memory Supabase client + session user.
 */
import type { H3Event } from 'h3'
import {
    createError,
    defineEventHandler,
    getRouterParam,
    isError,
    readBody,
} from 'h3'
import { apiError, defineApiHandler } from '~~/server/utils/handler'
import { useDb } from '~~/server/utils/db'
import {
    requireChatParticipant,
    requireMatchParticipant,
    requireSpaceMember,
    requireUser,
} from '~~/server/utils/auth'
import { generateInviteToken, hashInviteToken } from '~~/server/utils/tokens'
import {
    MATCH_SELECT,
    commonInterests,
    deriveMatchStatus,
    toInterests,
    toMatchDTO,
    toMatchUser,
} from '~~/server/utils/mappers'
import { readValidated, requireParam } from '~~/server/utils/validation'
import type { FakeSupabase } from './fakeSupabase'

Object.assign(globalThis, {
    // h3 auto-imports
    createError,
    defineEventHandler,
    getRouterParam,
    isError,
    readBody,
    // server/utils auto-imports
    apiError,
    defineApiHandler,
    useDb,
    requireChatParticipant,
    requireMatchParticipant,
    requireSpaceMember,
    requireUser,
    generateInviteToken,
    hashInviteToken,
    MATCH_SELECT,
    commonInterests,
    deriveMatchStatus,
    toInterests,
    toMatchDTO,
    toMatchUser,
    readValidated,
    requireParam,
})

/**
 * Build an event as seen by the server actions: anonymous when no user id
 * is given, authenticated as that auth user otherwise.
 */
export const eventFor = (db: FakeSupabase, authUserId?: string): H3Event =>
    ({
        context: {
            __db: db,
            __authUser: authUserId ? { id: authUserId } : null,
        },
    }) as unknown as H3Event
