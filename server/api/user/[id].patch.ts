import { patchUser } from '~/server/actions/users'
import type { PatchUserDTO } from '~/shared/types/UserDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }
    const body = (await readBody(event)) as PatchUserDTO
    body.id = id
    return await patchUser(event, body)
})
