import { patchMatch } from '~/server/actions/matches'
import type { PatchMatchDTO } from '~/shared/types/MatchDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }
    const body = (await readBody(event)) as Omit<PatchMatchDTO, 'id'>
    const dto: PatchMatchDTO = { id, ...body }
    return await patchMatch(event, dto)
})
