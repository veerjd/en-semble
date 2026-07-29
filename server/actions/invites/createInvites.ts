import type { H3Event } from 'h3'
import type { CreateInvitesInput } from '~~/shared/schemas/invite'
import type { InviteDTO } from '~~/shared/types/api'
import { toInviteDTO } from './getSpaceInvites'

/**
 * Create a batch of invite links for the caller's space — one per email
 * (label only, nothing is sent) or `count` anonymous ones.
 * Only the token hash is stored; the raw token (and thus the link) exists
 * solely in this response.
 */
export const createInvites = async (
    event: H3Event,
    input: CreateInvitesInput,
): Promise<InviteDTO[]> => {
    const user = await requireUser(event)
    const db = useDb(event)

    const labels: (string | null)[] =
        input.emails && input.emails.length > 0
            ? input.emails
            : Array.from({ length: input.count ?? 1 }, () => null)

    const withTokens = labels.map((email) => ({
        email,
        token: generateInviteToken(),
    }))

    const { data, error } = await db
        .from('invites')
        .insert(
            withTokens.map(({ email, token }) => ({
                space_id: user.space_id,
                email,
                token_hash: hashInviteToken(token),
                created_by: user.id,
                expires_at: input.expires_at,
            })),
        )
        .select('*')

    if (error) throw error

    const tokenByHash = new Map(
        withTokens.map(({ token }) => [hashInviteToken(token), token]),
    )
    return data.map((row) => toInviteDTO(row, tokenByHash.get(row.token_hash)))
}
