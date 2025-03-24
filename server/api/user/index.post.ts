import { postUser } from '~/server/actions/users'
import type { PostUserDTO } from '~/shared/types/UserDTOs'

export default defineEventHandler(async (event) => {
    const body = (await readBody(event)) as PostUserDTO
    return await postUser(event, body)
})
