import { getOneInterest, getAllInterests } from '~/server/actions/interests'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) return await getAllInterests(event)
    else return await getOneInterest(event, id)
})
