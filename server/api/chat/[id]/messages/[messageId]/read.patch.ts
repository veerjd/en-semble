import { markMessageRead } from '~/server/actions/messages'

export default defineEventHandler(async (event) => {
    const messageId = getRouterParam(event, 'messageId')
    if (!messageId) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }
    return await markMessageRead(event, messageId)
})
