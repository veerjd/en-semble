import { deleteMessage, softDeleteMessage } from '~/server/actions/messages'
import type {
    DeleteMessageDTO,
    SoftDeleteMessageDTO,
} from '~/shared/types/MessageDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const isHardDelete = query?.hard === 'true'

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }

    if (isHardDelete) {
        const dto: DeleteMessageDTO = { id }
        await deleteMessage(event, dto)
    } else {
        const dto: SoftDeleteMessageDTO = { id }
        await softDeleteMessage(event, dto)
    }
    return { success: true }
})
