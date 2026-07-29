import { getInviteByToken } from '~~/server/actions/invites/getInviteByToken'

// Public route: consulted by the registration page before the user submits.
export default defineApiHandler((event) =>
    getInviteByToken(event, requireParam(event, 'token', { uuid: false })),
)
