import type { H3Event } from 'h3'
import type { MeDTO } from '~~/shared/types/api'

export const getMe = async (event: H3Event): Promise<MeDTO> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data, error } = await db
        .from('users')
        .select(
            `id, username, bio, locale,
             space:spaces!inner(id, slug, name),
             user_interests(interest:interests(id, slug, label))`
        )
        .eq('id', user.id)
        .single()

    if (error) throw error

    return {
        id: data.id,
        username: data.username,
        bio: data.bio,
        locale: data.locale,
        space: data.space,
        interests: toInterests(data.user_interests),
    }
}
