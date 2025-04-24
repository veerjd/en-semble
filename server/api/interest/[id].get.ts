import { getOneInterest } from '~/server/actions/interests'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }

    return await getOneInterest(event, id)
})
