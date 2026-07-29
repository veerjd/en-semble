import { getChatMessages } from '~~/server/actions/chats/getChatMessages'

export default defineApiHandler((event) => {
    const { before } = getQuery(event)
    return getChatMessages(
        event,
        requireParam(event, 'id'),
        typeof before === 'string' && before ? before : undefined
    )
})
