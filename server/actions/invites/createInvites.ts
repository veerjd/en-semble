import type { H3Event } from 'h3'
import type { CreateInvitesInput } from '~~/shared/schemas/invite'
import type { InviteDTO } from '~~/shared/types/api'
import type { TablesInsert } from '~~/shared/types/database.types'
import { toInviteDTO } from './getSpaceInvites'

/**
 * Create a batch of invite links for the caller's space — one per email
 * (label only, nothing is sent) or `count` anonymous ones.
 */
export const createInvites = async (
    event: H3Event,
    input: CreateInvitesInput,
): Promise<InviteDTO[]> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const rows: TablesInsert<'invites'>[] =
        input.emails && input.emails.length > 0
            ? input.emails.map((email) => ({
                  space_id: user.space_id,
                  email,
                  created_by: user.id,
                  expires_at: input.expires_at,
              }))
            : Array.from({ length: input.count ?? 1 }, () => ({
                  space_id: user.space_id,
                  email: null,
                  created_by: user.id,
                  expires_at: input.expires_at,
              }))

    const { data, error } = await db.from('invites').insert(rows).select('*')

    if (error) throw error
    return data.map(toInviteDTO)
}
