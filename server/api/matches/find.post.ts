import { findAndCreateMatch } from '~~/server/actions/matches/findAndCreateMatch'

export default defineApiHandler((event) => {
    enforceRateLimit(event, 'find-match', 10, 60 * 1000)
    return findAndCreateMatch(event)
})
