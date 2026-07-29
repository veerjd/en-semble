import { respondToMatch } from '~~/server/actions/matches/respondToMatch'

export default defineApiHandler((event) =>
    respondToMatch(event, requireParam(event, 'id'), 'accepted'),
)
