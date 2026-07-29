import type { H3Event } from 'h3'
import type { InterestDTO } from '~~/shared/types/api'

export const getAllInterests = async (
    event: H3Event,
): Promise<InterestDTO[]> => {
    await requireUser(event)
    const db = useDb(event)

    const { data, error } = await db
        .from('interests')
        .select('id, slug, label')
        .order('label')

    if (error) throw error
    return data
}
