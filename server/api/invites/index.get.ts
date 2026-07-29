import { getSpaceInvites } from '~~/server/actions/invites/getSpaceInvites'

export default defineApiHandler((event) => getSpaceInvites(event))
