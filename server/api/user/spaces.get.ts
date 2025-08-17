import { getUserSpaces } from '~/server/actions/users/getUserSpaces'

export default defineEventHandler(async (event) => {
    return await getUserSpaces(event)
})
