import { getOneMatch } from '~/server/actions/matches'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }
    return await getOneMatch(event, id)
})
