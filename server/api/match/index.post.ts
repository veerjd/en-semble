import { postMatch } from '~/server/actions/matches'
import type { PostMatchDTO } from '~/shared/types/MatchDTOs'

export default defineEventHandler(async (event) => {
    const body = (await readBody(event)) as PostMatchDTO
    return await postMatch(event, body)
})
