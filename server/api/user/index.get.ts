import { getAllUsers } from '~/server/actions/users'

export default defineEventHandler(async (event) => {
    return await getAllUsers(event)
})
