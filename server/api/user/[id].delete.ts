import { deleteUser, softDeleteUser } from '~/server/actions/users'
import type { DeleteUserDTO, SoftDeleteUserDTO } from '~/shared/types/UserDTOs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
  const query = getQuery(event)
    const isHardDelete = query?.hard === 'true'

    if (!id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    if (isHardDelete) {
        const dto: DeleteUserDTO = { id }
        await deleteUser(event, dto)
    } else {
        const dto: SoftDeleteUserDTO = { id }
        await softDeleteUser(event, dto)
    }
    return { success: true }
})
