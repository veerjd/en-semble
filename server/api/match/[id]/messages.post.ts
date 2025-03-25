import { postMessage } from '~/server/actions/messages'
import type { PostMessageDTO } from '~/shared/types/MessageDTOs'

export default defineEventHandler(async (event) => {
    const matchId = getRouterParam(event, 'id')
    if (!matchId) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }
    const body = (await readBody(event)) as Omit<PostMessageDTO, 'match_id'>
    const dto: PostMessageDTO = {
        match_id: matchId,
        ...body,
    }
    return await postMessage(event, dto)
})
