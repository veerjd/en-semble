import { patchMessage } from '~/server/actions/messages'
import type { PatchMessageDTO } from '~/shared/types/MessageDTOs'

export default defineEventHandler(async (event) => {
    const messageId = getRouterParam(event, 'messageId')
    if (!messageId) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }
    const body = (await readBody(event)) as Omit<PatchMessageDTO, 'id'>
    const dto: PatchMessageDTO = { id: messageId, ...body }
    return await patchMessage(event, dto)
})
