import type {
    InterestDTO,
    MatchDTO,
    MatchResponse,
    MatchStatus,
    MatchUserDTO,
} from '~~/shared/types/api'

/** Shape of a user row selected with nested interests. */
export interface UserWithInterests {
    id: string
    username: string
    bio: string | null
    user_interests: { interest: InterestDTO | null }[]
}

export const toInterests = (
    userInterests: { interest: InterestDTO | null }[],
): InterestDTO[] =>
    userInterests.flatMap((ui) => (ui.interest ? [ui.interest] : []))

export const toMatchUser = (user: UserWithInterests): MatchUserDTO => ({
    id: user.id,
    username: user.username,
    bio: user.bio,
    interests: toInterests(user.user_interests),
})

export const deriveMatchStatus = (
    myResponse: MatchResponse,
    theirResponse: MatchResponse,
): MatchStatus => {
    if (myResponse === 'rejected' || theirResponse === 'rejected') {
        return 'rejected'
    }
    if (myResponse === 'accepted' && theirResponse === 'accepted') {
        return 'matched'
    }
    return myResponse === 'pending' ? 'awaiting_me' : 'awaiting_them'
}

export const commonInterests = (
    mine: InterestDTO[],
    theirs: InterestDTO[],
): InterestDTO[] => {
    const myIds = new Set(mine.map((i) => i.id))
    return theirs.filter((i) => myIds.has(i.id))
}

/** Row shape returned by the matches select used in match actions. */
export interface MatchRow {
    id: string
    user1_id: string
    user2_id: string
    user1_response: MatchResponse
    user2_response: MatchResponse
    created_at: string
    user1: UserWithInterests | null
    user2: UserWithInterests | null
    chat: { id: string }[] | { id: string } | null
}

export const MATCH_SELECT = `
    id, user1_id, user2_id, user1_response, user2_response, created_at,
    user1:users!matches_user1_id_fkey(
        id, username, bio, user_interests(interest:interests(id, slug, label))
    ),
    user2:users!matches_user2_id_fkey(
        id, username, bio, user_interests(interest:interests(id, slug, label))
    ),
    chat:chats(id)
` as const

export const toMatchDTO = (
    row: MatchRow,
    viewerId: string,
    unreadCount = 0,
): MatchDTO => {
    const iAmUser1 = row.user1_id === viewerId
    const me = iAmUser1 ? row.user1 : row.user2
    const other = iAmUser1 ? row.user2 : row.user1
    const myResponse = iAmUser1 ? row.user1_response : row.user2_response
    const theirResponse = iAmUser1 ? row.user2_response : row.user1_response
    const chat = Array.isArray(row.chat) ? row.chat[0] ?? null : row.chat

    const myInterests = me ? toInterests(me.user_interests) : []
    const otherUser: MatchUserDTO = other
        ? toMatchUser(other)
        : { id: '', username: '?', bio: null, interests: [] }

    return {
        id: row.id,
        otherUser,
        myResponse,
        theirResponse,
        status: deriveMatchStatus(myResponse, theirResponse),
        commonInterests: commonInterests(myInterests, otherUser.interests),
        chatId: chat?.id ?? null,
        unreadCount,
        createdAt: row.created_at,
    }
}
