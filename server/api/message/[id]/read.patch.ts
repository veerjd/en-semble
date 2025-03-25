import { markMessageRead } from '~/server/actions/messages'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }
    return await markMessageRead(event, id)
})
