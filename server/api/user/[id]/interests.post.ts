import { postUserInterest } from '~/server/actions/userInterests'
import type { PostUserInterestDTO } from '~/shared/types/UserInterestDTOs'

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const body = (await readBody(event)) as { interest_id: string }

    const dto: PostUserInterestDTO = {
        user_id: userId,
        interest_id: body.interest_id,
    }

    return await postUserInterest(event, dto)
})
