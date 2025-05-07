import { getChatMessages } from '~/server/actions/chats'

export default defineEventHandler(async (event) => {
    const chatId = getRouterParam(event, 'id')
    if (!chatId) {
        throw createError({ statusCode: 400, message: 'Chat ID is required' })
    }
    return await getChatMessages(event, chatId)
})
