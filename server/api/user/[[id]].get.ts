import { getAllUsers, getOneUser } from '~/server/actions/users'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) return await getAllUsers(event)
    else return await getOneUser(event, id)
})
