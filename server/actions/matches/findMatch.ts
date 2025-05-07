import { getSpaceUsers } from '../users/getSpaceUsers'
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

    let bestUser: UserDTO | null = null
    let maxCommon = 0
    let bestCommonInterests: string[] = []

    for (const user of users) {
        if (user.id === userId) continue
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
            message: 'Aucun utilisateur avec des intérêts communs trouvé',
        })
    }

    return {
        user1,
        user2: bestUser,
        commonInterests: bestCommonInterests,
    }
}
