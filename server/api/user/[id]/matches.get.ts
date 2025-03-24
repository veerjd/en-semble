import { getUserMatches } from '~/server/actions/matches'

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }
    return await getUserMatches(event, userId)
})
