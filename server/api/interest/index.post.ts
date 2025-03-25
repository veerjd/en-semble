import { postInterest } from '~/server/actions/interests'
import type { PostInterestDTO } from '~/shared/types/InterestDTOs'

export default defineEventHandler(async (event) => {
    const body = (await readBody(event)) as PostInterestDTO
    return await postInterest(event, body)
})
