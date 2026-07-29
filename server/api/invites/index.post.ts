import { createInvites } from '~~/server/actions/invites/createInvites'
import { createInvitesSchema } from '~~/shared/schemas/invite'

export default defineApiHandler(async (event) => {
    enforceRateLimit(event, 'invites', 20, 60 * 60 * 1000)
    const input = await readValidated(event, createInvitesSchema)
    return createInvites(event, input)
})
