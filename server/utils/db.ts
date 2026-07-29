import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

/**
 * Typed service-role Supabase client — the single data-access point for
 * server routes. RLS is bypassed; authorization is enforced explicitly via
 * the require* helpers in server/utils/auth.ts.
 */
export const useDb = (event: H3Event) =>
    serverSupabaseServiceRole<Database>(event)
