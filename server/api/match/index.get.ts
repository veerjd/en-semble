export default defineEventHandler(async (event) => {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
})
