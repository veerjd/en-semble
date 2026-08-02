/**
 * Test double for the `#supabase/server` virtual module (aliased in
 * vitest.config.ts). The fake client and the authenticated auth user are
 * carried on the event context by tests/integration/support/testEvent.ts.
 */
import type { H3Event } from 'h3'

export const serverSupabaseServiceRole = <T>(event: H3Event): T =>
    (event.context.__db ?? null) as T

export const serverSupabaseUser = async (event: H3Event) =>
    (event.context.__authUser as { id: string } | undefined) ?? null
