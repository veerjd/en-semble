import { register } from '~~/server/actions/auth/register'
import { registerSchema } from '~~/shared/schemas/auth'

export default defineApiHandler(async (event) => {
    const input = await readValidated(event, registerSchema)
    return register(event, input)
})
