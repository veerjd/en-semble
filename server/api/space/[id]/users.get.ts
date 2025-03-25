import { getSpaceUsers } from '~/server/actions/users'

export default defineEventHandler(async (event) => {
    const spaceId = getRouterParam(event, 'id')
    if (!spaceId) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }
    return await getSpaceUsers(event, spaceId)
})
