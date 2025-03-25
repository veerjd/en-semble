import { deleteUserInterest } from '~/server/actions/userInterests'
import type { DeleteUserInterestDTO } from '~/shared/types/UserInterestDTOs'

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    const interestId = getRouterParam(event, 'interestId')

    if (!userId || !interestId) {
        throw createError({
            statusCode: 400,
            message: 'User ID and Interest ID are required',
        })
    }

    const dto: DeleteUserInterestDTO = {
        user_id: userId,
        interest_id: interestId,
    }

    await deleteUserInterest(event, dto)
    return { success: true }
})
