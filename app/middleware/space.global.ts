/**
 * Space routing guard:
 * - loads `me` once per session for authenticated pages,
 * - redirects `/` to the user's space home,
 * - blocks access to spaces the user does not belong to (spec: users cannot
 *   access Spaces they aren't a part of).
 * Authentication itself is handled by @nuxtjs/supabase (redirects to /login).
 */
export default defineNuxtRouteMiddleware(async (to) => {
    const publicPrefixes = ['/login', '/register', '/confirm', '/logout']
    if (
        publicPrefixes.some((p) => to.path === p || to.path.startsWith(`${p}/`))
    ) {
        return
    }

    const authUser = useSupabaseUser()
    if (!authUser.value) return // supabase module will redirect to /login

    const { me, fetchMe } = useMe()
    if (!me.value) {
        try {
            await fetchMe()
        } catch {
            // No profile row (or the API is unreachable): the account cannot
            // use the app — send them back through login.
            return navigateTo('/login')
        }
    }
    if (!me.value) return navigateTo('/login')

    const spaceSlug = me.value.space.slug
    const spaceParam = to.params.space

    if (typeof spaceParam !== 'string') {
        // Non-space routes: only `/` exists; send it home.
        if (to.path === '/') return navigateTo(`/${spaceSlug}/matches`)
        return
    }

    if (spaceParam !== spaceSlug) {
        return navigateTo(`/${spaceSlug}/matches`)
    }
})
