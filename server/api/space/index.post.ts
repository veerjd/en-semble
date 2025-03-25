import { postSpace } from '~/server/actions/spaces'
import type { PostSpaceDTO } from '~/shared/types/SpaceDTOs'

export default defineEventHandler(async (event) => {
    const body = (await readBody(event)) as PostSpaceDTO
    return await postSpace(event, body)
})
