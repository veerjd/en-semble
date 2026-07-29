import type { H3Event } from 'h3'
import type { InviteLookupDTO } from '~~/shared/types/api'

/**
 * Public (pre-registration) invite lookup: reveals only the space name and
 * whether the link is still usable — never who created it.
 */
export const getInviteByToken = async (
    event: H3Event,
    token: string,
): Promise<InviteLookupDTO> => {
    const db = useDb(event)

    const { data, error } = await db
        .from('invites')
        .select('expires_at, used_at, space:spaces!inner(name)')
        .eq('token', token)
        .maybeSingle()

    if (error) throw error
    if (!data) {
        return { spaceName: '', valid: false, reason: 'not_found' }
    }
    if (data.used_at) {
        return { spaceName: data.space.name, valid: false, reason: 'used' }
    }
    if (new Date(data.expires_at) <= new Date()) {
        return { spaceName: data.space.name, valid: false, reason: 'expired' }
    }
    return { spaceName: data.space.name, valid: true, reason: 'ok' }
}
