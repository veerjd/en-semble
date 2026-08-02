# En-Semble

Social (non-romantic) matching app for closed communities. Users belong to
one invite-only **Space**; the product matches members by shared interests;
a match must be **accepted by both parties** before a realtime chat opens.

Built with **Nuxt 4**, **Supabase** (auth, Postgres, realtime), **PrimeVue**
and **Tailwind CSS**. UI is bilingual (French default, English) via
`@nuxtjs/i18n`.

## Architecture

-   All reads/writes go through the Nuxt server API (`server/api/*` →
    `server/actions/*`, Actions + DTOs). Request bodies are validated with
    zod (`shared/schemas/*`).
-   The browser Supabase client is used **only** for realtime subscriptions
    (`chat_messages`, `matches`), which are gated by RLS SELECT policies.
-   The server uses the service-role client (`server/utils/db.ts`);
    authorization is explicit (`requireUser`, `requireMatchParticipant`,
    `requireChatParticipant` in `server/utils/auth.ts`), with a fail-closed
    guard on `/api/**` (`server/middleware/auth.ts`).
-   Authenticated pages live under `/[space]/…` (the space slug is part of
    every URL); `app/middleware/space.global.ts` enforces membership.
-   Registration is invite-only: members create expiring invite links
    (`/{space}/invite`); nothing is emailed — links are copied and shared
    manually, and only a sha256 of each token is stored.

## Local development

Prerequisites: **Node >= 22.19** (Nuxt 4.5 requires it; enforced via
`engines`), Docker (for the Supabase local stack).

```bash
npm install
npx supabase start        # local Postgres/auth/realtime stack
npx supabase db reset     # applies migrations + seeds
npm run dev
```

Copy `.env.example` to `.env` and fill in the values printed by
`supabase start` (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY` — the secret key is server-only).

Environments:

-   `.env` — local Supabase stack, used by `npm run dev`.
-   `.env.prod` — production, used by `npm run dev:prod`.

Both are gitignored; `.env.example` is the tracked template.

### The `esbuild` override

`package.json` pins `overrides.esbuild = ^0.28.0`. Two packages disagree:
`vitest` pulls `vite@8`, whose (optional) peer wants esbuild
`^0.27 || ^0.28`, while `@nuxtjs/i18n` → `@intlify/bundle-utils` depends on
`^0.25.4`. Left alone, npm satisfies both by nesting a second copy
(`0.25.12` under bundle-utils, `0.28.1` at the root) — two ~10 MB binaries.

The override collapses that to a single esbuild 0.28.1. It is a
deduplication, not a workaround: on Node 24 the tree resolves and builds
either way, and `npm ci`, the unit suite and `nuxt build` all pass with or
without it. (On Node < 22.19 the unforced resolution did fail with
`ERESOLVE`, which is why the override was introduced.) Drop it once
bundle-utils 12 leaves alpha and the constraint ranges overlap on their own.

### Seeded dev data (`supabase/seed.sql`, local only)

-   Users `veerjd@example.com` and `demo@example.com` (password
    `password123`), both in the space `portail`, with overlapping interests
    so match-finding works immediately.
-   A long-lived invite for testing registration:
    `http://localhost:3000/register/dev-invite-token`.

## Scripts

| Script                            | Purpose                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Dev server                                                    |
| `npm run build`                   | Production build                                              |
| `npm run typecheck`               | `nuxt typecheck` (strict)                                     |
| `npm run lint` / `npm run format` | ESLint + Prettier                                             |
| `npm test`                        | Vitest unit tests (`tests/unit`)                              |
| `npm run generate:types`          | Regenerate `shared/types/database.types.ts` from the local DB |

## Database

Migrations in `supabase/migrations/`:

1. `*_schema.sql` — tables, the `respond_to_match()` RPC (atomic mutual
   accept → chat creation), triggers.
2. `*_rls.sql` — RLS enabled everywhere (deny by default) + participant
   SELECT policies on `matches`, `chats` and `chat_messages` +
   `supabase_realtime` publication. The `chats` policy is not optional:
   the `chat_messages` policy joins `chats`, and a policy subquery is
   evaluated as the caller, so without it participants see zero messages.
3. `*_seed_reference.sql` — reference data: the initial space, interest
   categories (analytics-only, never shown in the UI) and ~200 interests.
4. `*_realtime_grants.sql` — table privileges. Supabase no longer
   auto-grants DML on new projects, and `service_role`'s BYPASSRLS skips
   policies but confers no privileges — without this every API route fails
   with `42501` before RLS is consulted. Also grants `authenticated` the
   SELECT needed for realtime delivery.
5. `*_revoke_anon.sql` — strips all table privileges from `anon` (hosted
   projects provision it with baseline SELECT; local does not). Nothing in
   the app queries as anon: the server uses `service_role`, realtime
   authenticates as the user, and the pre-auth pages only call
   `client.auth.*`.

After changing the schema: `npx supabase db reset && npm run generate:types`.

## Deployment

Production runs on **Netlify** using Nitro's `netlify` preset. `npm run build`
emits two things:

-   `dist/` — static assets (the publish directory)
-   `.netlify/functions-internal/server/` — one serverless function that
    serves SSR **and** every `/api/**` route

The function declares its own `path: "/*"` route config, so there are no
`_redirects` rules to maintain. Both directories are gitignored.

`netlify.toml` pins the build command, publish directory and Node/npm
versions rather than relying on Netlify's framework auto-detection.

### Environment variables

Set these in the Netlify UI (Site configuration → Environment variables):

| Variable                   | Scope | Notes                                         |
| -------------------------- | ----- | --------------------------------------------- |
| `SUPABASE_URL`             | build | `https://<project-ref>.supabase.co`           |
| `SUPABASE_PUBLISHABLE_KEY` | build | `sb_publishable_*`; reaches the browser       |
| `SUPABASE_SECRET_KEY`      | build | `sb_secret_*`; **server-only**, never bundled |

`nuxt.config.ts` gives each of these an empty-string fallback so the keys stay
present in the serialized runtime config. That is what makes Nitro's
invocation-time overrides work, so a deploy preview can point at a different
Supabase project **without a rebuild**:

```
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_KEY
NUXT_SUPABASE_SECRET_KEY             # wins over NUXT_SUPABASE_SERVICE_KEY
NUXT_PUBLIC_SUPABASE_COOKIE_PREFIX   # optional; pins the auth cookie name
```

Scope the preview values to "Deploy previews" / "Branch deploys" in the UI.

### CI/CD

`.github/workflows/ci.yml` mirrors the pipeline used by the sibling
`machinops` project:

-   **verify** (every PR and push): typecheck → test → build (with
    `NITRO_PRESET=netlify`, so preset-specific failures surface in CI rather
    than in the deploy) → lint → `supabase db reset` to prove migrations apply
    from scratch. Superseded runs on the same ref are cancelled.
-   **deploy** (`master` only): rebuilds with the production secrets, ships
    via `netlify-cli deploy --prod`, then polls `/login` for a 200. Deploys
    are serialized (`cancel-in-progress: false`) so two never overlap.

Pull requests are covered by Netlify's own Deploy Previews; the GitHub job
deliberately does not deploy them.

Required repository secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`,
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

### Rate limiting caveat

`server/utils/rateLimit.ts` is an **in-memory** fixed-window limiter. On
Netlify each function instance has its own memory and instances scale out, so
the effective limit is `configured limit × live instances`, and buckets reset
on cold start. It still blunts naive abuse, but treat the numbers as
approximate. Move to a shared store (Netlify Blobs, Upstash Redis) before
relying on these limits for anything security-critical.
