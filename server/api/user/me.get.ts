import { getMe } from '~~/server/actions/users/getMe'

export default defineApiHandler((event) => getMe(event))
