import { getAllInterests } from '~~/server/actions/interests/getAllInterests'

export default defineApiHandler((event) => getAllInterests(event))
