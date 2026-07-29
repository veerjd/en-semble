import type { H3Event } from 'h3'
import type { ReplaceInterestsInput } from '~~/shared/schemas/interest'
import type { InterestDTO } from '~~/shared/types/api'

/** Replace the caller's interest set with the given interest ids. */
export const replaceMyInterests = async (
    event: H3Event,
    input: ReplaceInterestsInput
): Promise<InterestDTO[]> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const ids = [...new Set(input.interest_ids)]

    if (ids.length > 0) {
        const { data: found, error: findError } = await db
            .from('interests')
            .select('id')
            .in('id', ids)
        if (findError) throw findError
        if ((found?.length ?? 0) !== ids.length) {
            apiError(400, 'invalid_interest')
        }
    }

    const { error: deleteError } = await db
        .from('user_interests')
        .delete()
        .eq('user_id', user.id)
    if (deleteError) throw deleteError

    if (ids.length === 0) return []

    const { error: insertError } = await db
        .from('user_interests')
        .insert(ids.map((id) => ({ user_id: user.id, interest_id: id })))
    if (insertError) throw insertError

    const { data, error } = await db
        .from('interests')
        .select('id, slug, label')
        .in('id', ids)
        .order('label')

    if (error) throw error
    return data
}
