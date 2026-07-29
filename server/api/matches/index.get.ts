import { getMyMatches } from '~~/server/actions/matches/getMyMatches'

export default defineApiHandler((event) => getMyMatches(event))
