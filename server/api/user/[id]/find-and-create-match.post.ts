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
    const { user1, user2, commonInterests } = await findMatch(
        event,
        spaceId,
        userId,
    )
    const match = await postMatch(event, {
        user1_id: user1.id,
        user2_id: user2.id,
        status_id: 1,
    })
    return { match, commonInterests }
})
