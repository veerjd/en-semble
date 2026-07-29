import { createInvites } from '~~/server/actions/invites/createInvites'
import { createInvitesSchema } from '~~/shared/schemas/invite'

export default defineApiHandler(async (event) => {
    const input = await readValidated(event, createInvitesSchema)
    return createInvites(event, input)
})
