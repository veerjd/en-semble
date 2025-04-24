import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { getOneUser } from '~/server/actions/users/getOneUser'
import type { UserDTO } from '~/shared/types/UserDTOs'

export default defineEventHandler(async (event): Promise<UserDTO> => {
    const supabaseUser = await serverSupabaseUser(event)

    if (!supabaseUser) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    try {
        const user = await getOneUser(event, supabaseUser.id)

        if (!user)
            throw createError({ statusCode: 404, message: 'User not found' })

        return user
    } catch (error: any) {
        throw createError({ statusCode: 500, message: error.message })
    }
})
