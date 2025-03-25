import { getMatchMessages } from '~/server/actions/messages'

export default defineEventHandler(async (event) => {
    const matchId = getRouterParam(event, 'id')
    if (!matchId) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }
    return await getMatchMessages(event, matchId)
})
