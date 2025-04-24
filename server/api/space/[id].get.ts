import { getOneSpace } from '~/server/actions/spaces'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Space ID is required',
        })
    }

    return await getOneSpace(event, id)
})
