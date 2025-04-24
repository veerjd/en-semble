import { getAllSpaces } from '~/server/actions/spaces'

export default defineEventHandler(async (event) => {
    return await getAllSpaces(event)
})
