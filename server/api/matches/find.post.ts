import { findAndCreateMatch } from '~~/server/actions/matches/findAndCreateMatch'

export default defineApiHandler((event) => findAndCreateMatch(event))
