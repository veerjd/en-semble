import { revokeInvite } from '~~/server/actions/invites/revokeInvite'

export default defineApiHandler((event) =>
    revokeInvite(event, requireParam(event, 'id')),
)
