import { postMessage } from '~~/server/actions/chats/postMessage'
import { postMessageSchema } from '~~/shared/schemas/message'

export default defineApiHandler(async (event) => {
    enforceRateLimit(event, 'post-message', 30, 60 * 1000)
    const input = await readValidated(event, postMessageSchema)
    return postMessage(event, requireParam(event, 'id'), input)
})
