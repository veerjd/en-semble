import { deleteSpace, softDeleteSpace } from '~/server/actions/spaces'
import type {
    DeleteSpaceDTO,
    SoftDeleteSpaceDTO,
} from '~/shared/types/SpaceDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const isHardDelete = query?.hard === 'true'

    if (!id) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }

    if (isHardDelete) {
        const dto: DeleteSpaceDTO = { id }
        await deleteSpace(event, dto)
    } else {
        const dto: SoftDeleteSpaceDTO = { id }
        await softDeleteSpace(event, dto)
    }
    return { success: true }
})
