import { patchInterest } from '~/server/actions/interests'
import type { PatchInterestDTO } from '~/shared/types/InterestDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'Interest ID is required',
        })
    }
    const body = (await readBody(event)) as Omit<PatchInterestDTO, 'id'>
    return await patchInterest(event, id, body)
})
