import { createInterest } from '~~/server/actions/interests/createInterest'
import { createInterestSchema } from '~~/shared/schemas/interest'

export default defineApiHandler(async (event) => {
    const input = await readValidated(event, createInterestSchema)
    return createInterest(event, input)
})
