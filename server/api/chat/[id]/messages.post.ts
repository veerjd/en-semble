import { postMessage } from '~/server/actions/messages'
import type { PostMessageDTO } from '~/shared/types/MessageDTOs'

export default defineEventHandler(async (event) => {
    const chatId = getRouterParam(event, 'id')
    if (!chatId) {
        throw createError({ statusCode: 400, message: 'Chat ID is required' })
    }
    const body = (await readBody(event)) as Omit<PostMessageDTO, 'chat_id'>
    const dto: PostMessageDTO = {
        chat_id: chatId,
        ...body,
    }
    return await postMessage(event, dto)
})
