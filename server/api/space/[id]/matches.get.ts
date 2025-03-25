import { getSpaceMatches } from '~/server/actions/matches'

export default defineEventHandler(async (event) => {
    const spaceId = getRouterParam(event, 'id')
    if (!spaceId) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }
    return await getSpaceMatches(event, spaceId)
})
