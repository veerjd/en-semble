import { replaceMyInterests } from '~~/server/actions/interests/replaceMyInterests'
import { replaceInterestsSchema } from '~~/shared/schemas/interest'

export default defineApiHandler(async (event) => {
    const input = await readValidated(event, replaceInterestsSchema)
    return replaceMyInterests(event, input)
})
