import { getSuggestedInterests } from '~~/server/actions/interests/getSuggestedInterests'

export default defineApiHandler((event) => getSuggestedInterests(event))
