import { patchMe } from '~~/server/actions/users/patchMe'
import { patchMeSchema } from '~~/shared/schemas/user'

export default defineApiHandler(async (event) => {
    const input = await readValidated(event, patchMeSchema)
    return patchMe(event, input)
})
