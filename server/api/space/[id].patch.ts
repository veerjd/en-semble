import { patchSpace } from '~/server/actions/spaces'
import type { PatchSpaceDTO } from '~/shared/types/SpaceDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, message: 'Space ID is required' })
    }
    const body = (await readBody(event)) as Omit<PatchSpaceDTO, 'id'>
    const dto: PatchSpaceDTO = { id, ...body }
    return await patchSpace(event, dto)
})
