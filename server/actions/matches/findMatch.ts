import { getSpaceUsers } from '../users/getSpaceUsers'
import { serverSupabaseClient } from '#supabase/server'
import type { UserDTO } from '~/shared/types/UserDTOs'

export const findMatch = async (
    event: any,
    spaceId: string,
    userId: string,
): Promise<{ user1: UserDTO; user2: UserDTO; commonInterests: string[] }> => {
    if (!spaceId || !userId) {
        throw createError({
            statusCode: 400,
            message: 'Space ID et User ID requis',
        })
    }

    const users = await getSpaceUsers(event, spaceId)
    if (!users || users.length < 2) {
        throw createError({
            statusCode: 404,
            message: "Pas assez d'utilisateurs dans cet espace",
        })
    }

    const user1 = users.find((u) => u.id === userId)
    if (!user1) {
        throw createError({
            statusCode: 404,
            message: 'Utilisateur de référence introuvable dans cet espace',
        })
    }

    // Get all existing matches for this user to exclude them
    const supabase = await serverSupabaseClient(event)
    const { data: existingMatches, error } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    // Extract IDs of users already matched with
    const matchedUserIds = new Set<string>()
    existingMatches?.forEach(match => {
        if (match.user1_id === userId) {
            matchedUserIds.add(match.user2_id)
        } else {
            matchedUserIds.add(match.user1_id)
        }
    })

    // Filter out already matched users and the current user
    const availableUsers = users.filter(user => 
        user.id !== userId && !matchedUserIds.has(user.id)
    )

    // Check if there are any available users to match with
    if (availableUsers.length === 0) {
        throw createError({
            statusCode: 404,
            message: 'Aucun utilisateur disponible pour un nouveau match',
        })
    }

    let bestUser: UserDTO | null = null
    let maxCommon = 0
    let bestCommonInterests: string[] = []

    for (const user of availableUsers) {
        const interests1 = user1.interests.map((it) => it.slug)
        const interests2 = user.interests.map((it) => it.slug)
        const common = interests1.filter((slug) => interests2.includes(slug))
        if (common.length > maxCommon) {
            maxCommon = common.length
            bestUser = user
            bestCommonInterests = common
        }
    }

    if (!bestUser) {
        throw createError({
            statusCode: 404,
            message: 'Aucun utilisateur avec des intérêts communs trouvé parmi les utilisateurs disponibles',
        })
    }

    return {
        user1,
        user2: bestUser,
        commonInterests: bestCommonInterests,
    }
}
