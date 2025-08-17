import { findMatch } from '~/server/actions/matches/findMatch'
import { postMatch } from '~/server/actions/matches/postMatch'

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    const { spaceId } = await readBody(event)
    if (!userId || !spaceId) {
        throw createError({
            statusCode: 400,
            message: 'User ID et Space ID requis',
        })
    }

    // findMatch now ensures we only get users not already matched with
    const { user1, user2, commonInterests } = await findMatch(
        event,
        spaceId,
        userId,
    )

    // Create new match - findMatch guarantees this won't be a duplicate
    const match = await postMatch(event, {
        user1_id: user1.id,
        user2_id: user2.id,
        status_id: 1,
    })

    return { match, commonInterests, isExisting: false }
})
