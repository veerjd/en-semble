import { getAllSpaces, getOneSpace } from '~/server/actions/spaces'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) return await getAllSpaces(event)
    else return await getOneSpace(event, id)
})
