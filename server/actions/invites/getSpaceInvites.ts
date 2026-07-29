import type { H3Event } from 'h3'
import type { InviteDTO } from '~~/shared/types/api'
import type { Tables } from '~~/shared/types/database.types'

/**
 * `token` is only known at creation time (the DB stores its hash), so the
 * DTO carries it — and the shareable link — only in the create response.
 */
export const toInviteDTO = (
    row: Tables<'invites'>,
    token?: string,
): InviteDTO => ({
    id: row.id,
    email: row.email,
    token,
    link: token ? `/register/${token}` : undefined,
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
    return data.map((row) => toInviteDTO(row))
}
