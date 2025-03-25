import { patchMessage } from '~/server/actions/messages'
import type { PatchMessageDTO } from '~/shared/types/MessageDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Message ID is required',
        })
    }
    const body = (await readBody(event)) as Omit<PatchMessageDTO, 'id'>
    const dto: PatchMessageDTO = { id, ...body }
    return await patchMessage(event, dto)
})
