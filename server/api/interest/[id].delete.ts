import { deleteInterest, softDeleteInterest } from '~/server/actions/interests'
import type {
    DeleteInterestDTO,
    SoftDeleteInterestDTO,
} from '~/shared/types/InterestDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const isHardDelete = query?.hard === 'true'

    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }

    if (isHardDelete) {
        const dto: DeleteInterestDTO = { id }
        await deleteInterest(event, dto)
    } else {
        const dto: SoftDeleteInterestDTO = { id }
        await softDeleteInterest(event, dto)
    }
    return { success: true }
})
