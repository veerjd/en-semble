import { getChat } from '~~/server/actions/chats/getChat'

export default defineApiHandler((event) =>
    getChat(event, requireParam(event, 'id')),
)
