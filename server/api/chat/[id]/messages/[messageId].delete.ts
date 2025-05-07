import { deleteMessage, softDeleteMessage } from '~/server/actions/messages'
import type {
    DeleteMessageDTO,
    SoftDeleteMessageDTO,
} from '~/shared/types/MessageDTOs'

export default defineEventHandler(async (event) => {
    const messageId = getRouterParam(event, 'messageId')
    const query = getQuery(event)
    const isHardDelete = query?.hard === 'true'

    if (!messageId) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }

    if (isHardDelete) {
        const dto: DeleteMessageDTO = { id: messageId }
        await deleteMessage(event, dto)
    } else {
        const dto: SoftDeleteMessageDTO = { id: messageId }
        await softDeleteMessage(event, dto)
    }
    return { success: true }
})
