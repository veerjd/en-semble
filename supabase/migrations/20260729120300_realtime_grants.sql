-- Table-level privileges for the API roles.
--
-- Newer Supabase provisioning (local CLI >= ~2.1xx; new hosted projects) no
-- longer auto-grants DML on public tables to anon / authenticated /
-- service_role (see config.toml [api] auto_expose_new_tables — left unset =
-- revoked). Our tables are created by migrations running as postgres, so
-- without explicit grants NO api role can touch them: every query fails with
-- `permission denied for table ...` (42501) before RLS is even consulted.
--
-- Verified on a fresh `supabase start` (2026-08-01) prior to this migration:
-- the only privileges present on public tables were REFERENCES/TRIGGER/
-- TRUNCATE. Both `set role service_role; select ... from users` and
-- `set role authenticated; select ... from matches` failed with 42501.
--
-- Two distinct consumers, two distinct grants:
--
-- 1. service_role — the server's single data-access client
--    (server/utils/db.ts). It holds rolbypassrls, but BYPASSRLS only skips
--    row-level POLICIES; it confers no table privilege. Without full DML here
--    every API route 500s. Authorization stays explicit in the require*
--    helpers (server/utils/auth.ts), unchanged by these grants.
--
-- 2. authenticated — used by the browser ONLY for realtime subscriptions
--    (app/composables/useRealtimeChat.ts, useRealtimeMatches.ts). The policies
--    in 20260729120100_rls.sql make participants' rows visible, but a policy is
--    not a grant: realtime delivers postgres_changes only if the role also
--    holds table-level SELECT. Scoped to the two tables in the
--    supabase_realtime publication; RLS still filters which rows arrive.
--
-- anon deliberately gets nothing: the app issues no pre-auth queries against
-- public tables, and realtime authenticates as the user.

-- 1. Server (service_role): full DML on every table, RLS bypassed.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- 2. Realtime (authenticated): SELECT on the published tables, PLUS the tables
--    their policies read. The chat_messages policy joins chats -> matches, and
--    a policy subquery is evaluated as the CALLER, so without SELECT on chats
--    the whole query dies with `permission denied for table chats` even though
--    chat_messages itself was granted. chats is not in the realtime
--    publication — it is granted (and given its own participant policy in
--    20260729120100_rls.sql) purely so that join resolves.
grant select on public.matches       to authenticated;
grant select on public.chat_messages to authenticated;
grant select on public.chats         to authenticated;

-- Future tables/sequences/functions created by migrations (role postgres)
-- inherit the service_role grants, so a new table does not silently 500 the
-- API. `authenticated` is intentionally NOT covered — add an explicit SELECT
-- grant when a new table joins the realtime publication.
alter default privileges for role postgres in schema public
    grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
    grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema public
    grant execute on functions to service_role;
