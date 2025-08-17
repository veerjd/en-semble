import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const matchId = getRouterParam(event, 'id')
    if (!matchId) {
        throw createError({ statusCode: 400, message: 'Match ID is required' })
    }

    const supabase = await serverSupabaseClient(event)

    try {
        // Update match status to rejected (status_id = 3)
        const { error } = await supabase
            .from('matches')
            .update({ status_id: 3 })
            .eq('id', matchId)

        if (error) {
            throw createError({ statusCode: 500, message: error.message })
        }

        return { message: 'Match rejected' }
    } catch (error: any) {
        throw createError({ statusCode: 500, message: error.message })
    }
})
