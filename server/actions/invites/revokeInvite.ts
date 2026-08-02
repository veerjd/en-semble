import type { H3Event } from 'h3'

/** Revoke an unused invite of the caller's space (delete the row). */
export const revokeInvite = async (event: H3Event, inviteId: string) => {
    const user = await requireUser(event)
    const db = useDb(event)

    const { data, error } = await db
        .from('invites')
        .delete()
        .eq('id', inviteId)
        .eq('space_id', user.space_id)
        .is('used_at', null)
        .select('id')

    if (error) throw error
    if (!data?.length) apiError(404, 'invite_invalid')
    return { ok: true as const }
}
