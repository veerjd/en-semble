import { serverSupabaseClient } from '#supabase/server'
import type { PostUserInterestDTO } from '~/shared/types/UserInterestDTOs'
import type { PostUserDTO, UserDTO } from '~/shared/types/UserDTOs'
import { getOneUser } from './getOneUser'

export const postUser = async (
    event: any,
    newUser: PostUserDTO,
): Promise<UserDTO> => {
    if (!newUser.username || !newUser.space_id) {
        throw createError({
            statusCode: 400,
            message: 'Missing required fields: username and space_id',
        })
    }

    const supabase = await serverSupabaseClient(event)

    // Insert new user
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            username: newUser.username,
            space_id: newUser.space_id,
        })
        .select('id')
        .single()

    if (userError) {
        throw createError({ statusCode: 500, message: userError.message })
    }

    // Assign interests if provided
    if (newUser.interests && newUser.interests.length > 0) {
        const interestsToAdd: PostUserInterestDTO[] = newUser.interests.map(
            (interest) => ({
                user_id: userData.id,
                interest_id: interest.interest_id,
            }),
        )

        const { error: interestError } = await supabase
            .from('user_interests')
            .insert(interestsToAdd)

        if (interestError) {
            throw createError({
                statusCode: 500,
                message: interestError.message,
            })
        }
    }

    const user = await getOneUser(event, userData.id)

    return user
}
