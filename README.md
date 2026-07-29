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

Prerequisites: Node 22+, Docker (for the Supabase local stack).

```bash
npm install
npx supabase start        # local Postgres/auth/realtime stack
npx supabase db reset     # applies migrations + seeds
npm run dev
```

Copy `.env.example` to `.env` and fill in the values printed by
`supabase start` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_KEY` — the service key is server-only).

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
2. `*_rls.sql` — RLS enabled everywhere (deny by default) + the two
   realtime SELECT policies + `supabase_realtime` publication.
3. `*_seed_reference.sql` — reference data: the initial space, interest
   categories (analytics-only, never shown in the UI) and ~200 interests.

After changing the schema: `npx supabase db reset && npm run generate:types`.
