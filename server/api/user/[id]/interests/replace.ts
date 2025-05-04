import { replaceUserInterests } from '~/server/actions/userInterests'

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const body = await readBody(event)
    const interestIds = body.interestIds

    if (!Array.isArray(interestIds)) {
        throw createError({
            statusCode: 400,
            message: 'Interest IDs must be provided as an array',
        })
    }

    try {
        const results = await replaceUserInterests(event, userId, interestIds)
        return {
            success: true,
            count: interestIds.length,
            data: results,
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to replace user interests',
        })
    }
})
