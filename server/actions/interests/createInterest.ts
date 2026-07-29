import type { H3Event } from 'h3'
import type { CreateInterestInput } from '~~/shared/schemas/interest'
import type { InterestDTO } from '~~/shared/types/api'

/**
 * User-generated interests are shared across all spaces and deduplicated by
 * slug: creating an existing interest returns the existing row.
 */
export const createInterest = async (
    event: H3Event,
    input: CreateInterestInput
): Promise<InterestDTO> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const slug = slugify(input.label)
    if (!slug) apiError(400, 'invalid_label')

    const { data: existing, error: findError } = await db
        .from('interests')
        .select('id, slug, label')
        .eq('slug', slug)
        .maybeSingle()

    if (findError) throw findError
    if (existing) return existing

    const { data, error } = await db
        .from('interests')
        .insert({ slug, label: input.label.trim(), created_by: user.id })
        .select('id, slug, label')
        .single()

    if (error) {
        if (error.code === '23505') {
            // Race: someone created it between the select and the insert.
            const { data: raced, error: racedError } = await db
                .from('interests')
                .select('id, slug, label')
                .eq('slug', slug)
                .single()
            if (racedError) throw racedError
            return raced
        }
        throw error
    }
    return data
}
