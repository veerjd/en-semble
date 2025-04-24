import { getAllInterests } from '~/server/actions/interests'

export default defineEventHandler(async (event) => {
    return await getAllInterests(event)
})
