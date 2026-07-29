import { postMessage } from '~~/server/actions/chats/postMessage'
import { postMessageSchema } from '~~/shared/schemas/message'

export default defineApiHandler(async (event) => {
    const input = await readValidated(event, postMessageSchema)
    return postMessage(event, requireParam(event, 'id'), input)
})
