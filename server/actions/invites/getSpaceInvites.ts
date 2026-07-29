import type { H3Event } from 'h3'
import type { InviteDTO } from '~~/shared/types/api'
import type { Tables } from '~~/shared/types/database.types'

export const toInviteDTO = (row: Tables<'invites'>): InviteDTO => ({
    id: row.id,
    email: row.email,
    token: row.token,
    link: `/register/${row.token}`,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    status: row.used_at
        ? 'used'
        : new Date(row.expires_at) <= new Date()
          ? 'expired'
          : 'pending',
    createdAt: row.created_at,
})

/** Invites of the caller's space, newest first. */
export const getSpaceInvites = async (event: H3Event): Promise<InviteDTO[]> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data, error } = await db
        .from('invites')
        .select('*')
        .eq('space_id', user.space_id)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(toInviteDTO)
}
