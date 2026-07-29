import type { H3Event } from 'h3'
import type { RegisterInput } from '~~/shared/schemas/auth'

/**
 * Invite-gated registration:
 * validate invite -> check username -> create auth user (confirmed) ->
 * create profile row -> consume invite. Compensates by deleting the auth
 * user if a later step fails.
 */
export const register = async (event: H3Event, input: RegisterInput) => {
    const db = useDb(event)

    const { data: invite, error: inviteError } = await db
        .from('invites')
        .select('id, space_id, expires_at, used_at')
        .eq('token_hash', hashInviteToken(input.token))
        .maybeSingle()

    if (inviteError) throw inviteError
    if (!invite) apiError(400, 'invite_invalid')
    if (invite!.used_at) apiError(400, 'invite_used')
    if (new Date(invite!.expires_at) <= new Date()) {
        apiError(400, 'invite_expired')
    }

    const { data: existing, error: usernameError } = await db
        .from('users')
        .select('id')
        .eq('username', input.username)
        .maybeSingle()

    if (usernameError) throw usernameError
    if (existing) apiError(409, 'username_taken')

    const { data: created, error: createError } =
        await db.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
        })

    if (createError) {
        if (createError.code === 'email_exists') apiError(409, 'email_taken')
        throw createError
    }

    const authUserId = created.user.id
    const rollback = async () => {
        await db.auth.admin.deleteUser(authUserId).catch(() => undefined)
    }

    const { error: profileError } = await db.from('users').insert({
        id: authUserId,
        space_id: invite!.space_id,
        username: input.username,
    })

    if (profileError) {
        await rollback()
        if (profileError.code === '23505') apiError(409, 'username_taken')
        throw profileError
    }

    const { data: consumed, error: consumeError } = await db
        .from('invites')
        .update({ used_at: new Date().toISOString(), used_by: authUserId })
        .eq('id', invite!.id)
        .is('used_at', null)
        .select('id')

    if (consumeError) {
        await rollback()
        throw consumeError
    }
    if (!consumed?.length) {
        // Someone consumed the invite between validation and now.
        await rollback()
        apiError(400, 'invite_used')
    }

    return { ok: true as const }
}
