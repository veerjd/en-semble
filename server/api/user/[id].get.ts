import { getOneUser } from '~/server/actions/users'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required',
        })
    }

    return await getOneUser(event, id)
})
