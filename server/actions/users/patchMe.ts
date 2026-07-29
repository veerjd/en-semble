import type { H3Event } from 'h3'
import type { PatchMeInput } from '~~/shared/schemas/user'
import type { MeDTO } from '~~/shared/types/api'
import { getMe } from './getMe'

export const patchMe = async (
    event: H3Event,
    input: PatchMeInput
): Promise<MeDTO> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { error } = await db
        .from('users')
        .update({
            ...(input.username !== undefined && { username: input.username }),
            ...(input.bio !== undefined && { bio: input.bio }),
            ...(input.locale !== undefined && { locale: input.locale }),
        })
        .eq('id', user.id)

    if (error) {
        if (error.code === '23505') apiError(409, 'username_taken')
        throw error
    }

    delete event.context._sessionUser
    return getMe(event)
}
