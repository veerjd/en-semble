import { register } from '~~/server/actions/auth/register'
import { registerSchema } from '~~/shared/schemas/auth'

export default defineApiHandler(async (event) => {
    enforceRateLimit(event, 'register', 5, 15 * 60 * 1000)
    const input = await readValidated(event, registerSchema)
    return register(event, input)
})
