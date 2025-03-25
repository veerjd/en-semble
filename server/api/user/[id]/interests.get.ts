import { getUserInterests } from '~/server/actions/userInterests'

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }
    return await getUserInterests(event, userId)
})
