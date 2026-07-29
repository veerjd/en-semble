import { markChatRead } from '~~/server/actions/chats/markChatRead'

export default defineApiHandler((event) =>
    markChatRead(event, requireParam(event, 'id'))
)
