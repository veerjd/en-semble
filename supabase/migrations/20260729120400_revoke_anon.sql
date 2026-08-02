-- Revoke all table privileges from `anon`.
--
-- Hosted projects provision `anon` with baseline SELECT on public tables; a
-- fresh local stack does not. That divergence meant prod answered anonymous
-- reads with `200 []` (RLS filtering the rows) where local answered
-- `permission denied` — safe either way, but prod leaned on RLS as the only
-- barrier instead of failing at the privilege check first.
--
-- Nothing in the app queries as anon:
--   * every server route uses the service_role client (server/utils/db.ts);
--   * realtime subscribes as the logged-in user (`authenticated`);
--   * the only pre-auth pages (login.vue, register/[token].vue, logout.vue)
--     call client.auth.* (GoTrue) and never .from() a table — registration
--     posts to /api/auth/register, which runs server-side.
--
-- So anon needs no table access at all. Revoking makes prod match local and
-- restores privilege checks as the first line of defense, with RLS behind it.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- Future tables created by migrations (role postgres) must not silently
-- re-grant anon; this mirrors the service_role defaults in 20260729120300.
alter default privileges for role postgres in schema public
    revoke all on tables from anon;
alter default privileges for role postgres in schema public
    revoke all on sequences from anon;
alter default privileges for role postgres in schema public
    revoke all on functions from anon;
