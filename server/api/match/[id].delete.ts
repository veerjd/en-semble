import { deleteMatch, softDeleteMatch } from '~/server/actions/matches'
import type {
    DeleteMatchDTO,
    SoftDeleteMatchDTO,
} from '~/shared/types/MatchDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const isHardDelete = query?.hard === 'true'

    if (!id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    if (isHardDelete) {
        const dto: DeleteMatchDTO = { id }
        await deleteMatch(event, dto)
    } else {
        const dto: SoftDeleteMatchDTO = { id }
        await softDeleteMatch(event, dto)
    }
    return { success: true }
})
