# En-Semble Refactor Plan

## Context

En-semble is a Nuxt 3 + Supabase social-matching app (users in an invite-only Space get product-generated matches by shared interests; mutual accept opens a realtime chat). The codebase is partially built and internally inconsistent: roughly half the code queries tables/columns that don't exist (`messages` vs `chat_messages`, a phantom `channels` table, `chats.user1_id/status`), there are three competing chat implementations, the seed migration cannot execute, realtime is never published, no RLS or authorization exists anywhere, and spec features (Register, Invite, space-slug URLs, mutual accept) are missing at every layer. This refactor makes the core loop work first, then completes the spec, then hardens.

**User decisions (binding):**

1. Full plan (spec + hardening), staged — core loop implemented first.
2. DB reset OK — rewrite migrations from scratch.
3. All reads/writes via server `/api/*` (Actions+DTOs); browser Supabase client for realtime subscriptions only.
4. True mutual acceptance (per-user response; chat created only when both accept).
5. Invites = expiring links (token + expires_at), NO email sending.
6. Full i18n via existing @nuxtjs/i18n, fr default, en+fr.
7. Matching requires interest overlap; rejected pairs never re-match; on no overlap, prompt user to add interests, suggesting interests other space members have.
8. All authenticated pages under `/[space]/` (slug in URL, per spec).
9. Migrate to **Nuxt 4** as part of this refactor.
10. Interest categories: kept as **analytics-only** — never visible in UI/DTOs; user-generated interests land uncategorized (inferable later).

**Deliverable of this session:** commit this plan as `REFACTOR_PLAN.md` to branch `claude/project-refactor-plan-0h2uek` and push. Stage implementation follows on the same branch (Stage 0 → 1 first) unless directed otherwise.

---

## Stage 0 — Foundations (Nuxt 4, schema reset, types, server infra)

### 0.0 Nuxt 4 migration (FIRST, so everything else is written once against Nuxt 4 conventions)

-   Bump `nuxt` to latest 4.x; remove `resolutions.vue: 3.3.13` pin; bump `vue` to latest 3.5.x; refresh lockfile. Use `npx codemod@latest nuxt/4/migration-recipe` as a starting point.
-   New `app/` srcDir structure: move `app.vue`, `pages/`, `components/`, `composables/`, `layouts/`, `assets/` (and new `middleware/`) under `app/`. `server/`, `shared/`, `public/`, `i18n/`, `supabase/` stay at root. Nuxt 4 makes `shared/` first-class auto-imported — fits the existing `shared/types` DTOs.
-   Module bumps for Nuxt 4 compatibility (exact versions verified at implementation): `@nuxtjs/supabase`, `@nuxtjs/i18n` (v9 → v10), `@primevue/nuxt-module`, `@nuxtjs/tailwindcss`, `@nuxtjs/color-mode`, `@nuxt/icon`, `@nuxt/devtools`.
-   Behavioral changes to write against: `useFetch`/`useAsyncData` data is now `shallowRef` defaulting to `undefined` (not `null`); set `compatibilityDate`; `import.meta.client` instead of `process.client`.

### 0.1 Migrations — delete all 3 existing files, create clean set

Delete `supabase/migrations/20250101010101_stoic_cats.sql`, `20250323015134_proud_torch.sql`, `20250414050500_filmsy_supernova.sql`.

**`<ts>_schema.sql`** — key changes vs old schema:

-   `spaces` + **`slug text not null unique`** (`^[a-z0-9-]+$`).
-   `users`: `space_id` NOT NULL, add `locale text not null default 'fr'`.
-   `interests`: add `label text not null` (display text for user-generated), `created_by uuid null` (null = seeded), `interest_category_id` nullable. `interest_categories` kept (analytics-only, never exposed).
-   `matches`: **`space_id` NOT NULL** (denormalized), **`user1_response` / `user2_response`** (`match_response` enum pending/accepted/rejected) replacing `status_id`; `CHECK (user1_id < user2_id)`; **`UNIQUE (user1_id, user2_id)`** (rejected pairs can never re-insert). **Drop `match_statuses` table.**
-   `chats`: `match_id` **NOT NULL UNIQUE** (double-accept race guard). **Drop `chat_participants`** (derivable via match).
-   `chat_messages`: `read_at timestamptz` replaces boolean `read`; content length check.
-   `invites`: `id, space_id, token unique default gen_random_bytes, email (optional label), created_by, expires_at not null, used_at, used_by, created_at`.
-   Security-definer RPC **`respond_to_match(match_id, user_id, response)`**: validates participation, sets the caller's response column, inserts the chat iff both accepted; returns `(user1_response, user2_response, chat_id)`. Keeps mutual-accept transactional (supabase-js has no transactions).
-   Keep/rewrite the `users.last_active` trigger on `chat_messages`.

**`<ts>_rls.sql`** — enable RLS on all tables (deny-by-default); exactly two browser-facing SELECT policies (realtime respects RLS): `chat_messages` (participant via chat→match) and `matches` (`auth.uid() in (user1_id,user2_id)`); `alter publication supabase_realtime add table chat_messages, matches` + `replica identity full` on both.

**`<ts>_seed_reference.sql`** — prod-safe reference data: 14 categories, ~210 interests ported from the broken seed (fix `',::uuid'` → `'…'::uuid,`, add `label`), space `('portail', 'Église le Portail')`. No users.

**`supabase/seed.sql`** (dev-only, applied by `supabase db reset`): dev auth user + identities (fixed uuid, `crypt()` password), matching `public.users` row (`veerjd`), some `user_interests`, one long-lived invite with fixed token `dev-invite-token`. Create `supabase/config.toml` via `supabase init`; disable public email signup (`enable_signup = false` — only the admin API creates users).

**Server data-access decision:** server routes use `serverSupabaseServiceRole` (configured today, never used) via one typed helper; authorization enforced by explicit helpers (0.3). RLS stays deny-all except realtime SELECT. Stage 3 moves plain reads to the user-scoped client as defense-in-depth.

### 0.2 Generated DB types

-   Fix `package.json` script: `supabase gen types typescript --local > shared/types/database.types.ts`; set `supabase.types` in `nuxt.config.ts`; commit the file. (Absence of this is why all the schema drift went uncaught.)

### 0.3 Server infrastructure (new files)

-   `server/utils/db.ts` — `useDb(event)`: typed service-role client.
-   `server/utils/auth.ts` — `requireUser(event)` (401/403, cached on `event.context`), `requireSpaceMember`, `requireMatchParticipant`, `requireChatParticipant`.
-   `server/utils/handler.ts` — `defineApiHandler()`: rethrows `createError`, maps everything else to sanitized 500 (kills ~50× copy-pasted try/catch and DB-message leaking).
-   `server/utils/validation.ts` — zod-backed `readValidatedBody`/params helpers → 400 with field details.
-   `shared/schemas/` — zod schemas per domain (`auth`, `user`, `interest`, `match`, `message`, `invite`); DTO interfaces become `z.infer` re-exports.

### 0.4 Dependency/config cleanup

-   Remove `next`, `jsonwebtoken` (+ its `vite.optimizeDeps` entry); add `zod` as direct dep.
-   `nuxt.config.ts`: `typescript: { typeCheck: true, strict: true }`.
-   `.env.example`: remove `NODE_TLS_REJECT_UNAUTHORIZED=0`; document `SUPABASE_SERVICE_KEY` as server-only.

**Verify:** `supabase start && supabase db reset` clean; `generate:types` stable; publication lists both tables; anon-key select on `users` returns 0 rows; `npm run dev` boots on Nuxt 4; record `typecheck` baseline.

---

## Stage 1 — Core loop (register → profile → match → mutual accept → realtime chat)

### 1.1 Server: rewrite actions, collapse API surface (everything not listed is deleted)

| Route                                        | Notes                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/register`                    | Invite token flow: validate token (unexpired/unused) → username availability → `auth.admin.createUser({email_confirm:true})` → insert `public.users` → mark invite used; compensating `admin.deleteUser` on failure. Fixes the fatal "no public.users row ever created" bug. Chosen over a DB trigger: validates before the auth user exists, keeps errors i18n-able. |
| `GET /api/user/me`                           | User + space `{slug,name}` + interests — the DTO the frontend keys off.                                                                                                                                                                                                                                                                                               |
| `PATCH /api/user/me`                         | username/bio/locale only (replaces `body.id`-trusting `PATCH /api/user/[id]`).                                                                                                                                                                                                                                                                                        |
| `GET /api/interests`                         | Autocomplete source (`slug`+`label`; no categories exposed).                                                                                                                                                                                                                                                                                                          |
| `POST /api/interests`                        | User-generated: slugify label, upsert-by-slug (shared across spaces).                                                                                                                                                                                                                                                                                                 |
| `PUT /api/user/me/interests`                 | `{interest_ids: uuid[]}` replace-set.                                                                                                                                                                                                                                                                                                                                 |
| `POST /api/matches/find`                     | For current user only. Fix `getSpaceUsers` parent filter (the cross-space leak), exclude soft-deleted, require overlap, insert with both responses pending + `space_id`. No candidate → 404 `data.code='NO_OVERLAP'`.                                                                                                                                                 |
| `GET /api/matches`                           | Caller's matches + other-user profile + derived status + `chat.id` + per-chat unread count.                                                                                                                                                                                                                                                                           |
| `POST /api/matches/[id]/accept` \| `/reject` | Via `requireMatchParticipant` + `respond_to_match` RPC. Fixes: no participation check, first-accept-creates-chat, forged matches.                                                                                                                                                                                                                                     |
| `GET /api/interests/suggested`               | Decision #7: interests held by other space members that caller lacks, by member count desc, limit ~20.                                                                                                                                                                                                                                                                |
| `GET /api/chat/[id]`                         | Header data (other participant).                                                                                                                                                                                                                                                                                                                                      |
| `GET /api/chat/[id]/messages`                | Fixed table `chat_messages`, `deleted_at is null`, `?before=` cursor pagination.                                                                                                                                                                                                                                                                                      |
| `POST /api/chat/[id]/messages`               | `user_id` from session, never body (fixes impersonation); `requireChatParticipant`.                                                                                                                                                                                                                                                                                   |
| `POST /api/chat/[id]/read`                   | Sets `read_at` on the other party's unread messages.                                                                                                                                                                                                                                                                                                                  |

**Deleted:** `server/api/message/**`, `server/api/space/**`, all `server/api/user/[id]*/**`, `server/api/match/*` CRUD + 405 stub; all orphaned chat actions, all `delete*/softDelete*` quartets, `getUserMessages`, `bulkAddUserInterests`, `getUserSpaces`; `shared/types/MatchStatusDTOs.ts`, `InterestCategoryDTOs.ts`, `ChatDTOs.ts`.

### 1.2 Frontend: `/[space]/` page tree (under `app/`, delete-and-recreate)

```
app/pages/
  index.vue              → redirect: authed → /{me.space.slug}/matches, else /login
  login.vue              → rewrite: remove isSignUp toggle, Toast, i18n
  register/[token].vue   → invite registration (email/password/username), unauthenticated
  confirm.vue, logout.vue → keep/simplify
  [space]/
    index.vue            → redirect to matches
    matches.vue          → MatchFinder + MatchesSection (out of the index kitchen-sink)
    profile.vue          → rewrite (username + interests; Create-Space dialog deleted)
    chat/[id].vue        → THE one chat impl (based on current pages/chat/[id].vue — best existing: correct realtime filter; just used wrong table name)
```

**Deleted:** current `pages/index.vue`, `messenger.vue`, `chats/[chat_id].vue`, `ChatComponent.vue`, `ChatSidebar.vue`, `ChatCard.vue`, `composables/useSpaceContext.ts` (space comes from URL + me DTO; one space per user).

**Middleware `app/middleware/space.global.ts`:** on `[space]` routes, load `me` (via `useMe`), redirect if `params.space !== me.space.slug`; skip login/register/confirm/logout. Auth guard stays with @nuxtjs/supabase; update `redirectOptions.exclude` to `['/login', '/register/*', '/confirm', '/logout', '/api/*']` (drop phantom `/update-password`, `/signup*`).

### 1.3 Composables (rewrite; consistent `isLoading`; `$fetch` for mutations, `useFetch` for initial GETs only)

-   `useMe.ts` (replaces `useUser`; `useState('me')` — fixes the `loading`/`isLoading` destructure bug and duplicate fetches).
-   `useMatches.ts` (find/accept/reject + refresh; drop 9 unused exports; expose suggested-interests for NO_OVERLAP).
-   `useInterests.ts` (483 → ~80 lines: list, create, replace-mine; no `onMounted` in factory, no N+1).
-   `useChat.ts` (fetch/send/markRead for one chat).
-   `useRealtimeChat.ts` — subscribe-only, removes **its own channel** on unmount (never `removeAllChannels()` — the current sibling-subscription killer).

### 1.4 Match UX for decision #7

`matches.vue`: on `NO_OVERLAP` → PrimeVue Dialog prompting to add interests, chips from `/api/interests/suggested`, one-click add, retry. `MatchCard.vue`: common interests via `$t('interests.'+slug, label)`; "waiting for the other person" state; "Open chat" when `chat.id` exists.

### 1.5 Shell fixes

-   `layouts/default.vue`: delete the dead Navbar-script copy (second colliding realtime channel).
-   `Navbar.vue`: strip space-switcher + debug block, fix leaked listener; links `/{space}/matches`, `/{space}/profile`.
-   All `alert()` → PrimeVue Toast; `<Toast/>` in layout.
-   i18n from the start for all Stage-1 copy: namespaced keys (`auth.*`, `matches.*`, `chat.*`, `profile.*`, `nav.*`, `errors.*`, existing `interests.*`) in `i18n/locales/{fr,en}.json`. Server returns error **codes** (`createError({data:{code}})`); frontend maps `errors.<code>` — server stays language-neutral.

**Verify (two browsers, supabase local):** register via `/register/dev-invite-token` → `public.users` row exists, `/api/user/me` 200; A+B accept from own sessions → chat exists only after the **second** accept; realtime messages flow both ways; third user C gets 403 on their chat/match; forged `user_id` in message body ignored; unauthenticated curl → 401 (spot-check); NO_OVERLAP suggestion dialog works; `typecheck` (strict) + `lint` green.

---

## Stage 2 — Spec completion (invites, match realtime, i18n sweep, polish)

-   **Invites:** actions (`createInvites` bulk {emails?/count, expires_at}, `getSpaceInvites` w/ derived status, `revokeInvite`, `getInviteByToken` public lookup — space name + validity only). Routes `POST/GET /api/invites`, `DELETE /api/invites/[id]`, `GET /api/invites/lookup/[token]` (unauthenticated). Page `app/pages/[space]/invite.vue`: create form (emails textarea or count + expiry DatePicker), invite table with status + **copy-link** (`${origin}/register/${token}`); Navbar link. `register/[token].vue` shows space name / expired / used states via lookup before submit.
-   **Realtime matches:** `useRealtimeMatches.ts` on `matches` (publication + policy exist from Stage 0) → refresh list + Toast on new match / acceptance; mounted in default layout.
-   **i18n sweep:** grep-driven pass for remaining hardcoded mixed EN/FR copy; locale switcher in Navbar persisting to `users.locale`; keep `strategy: no_prefix`.
-   **Polish:** unread badges from `GET /api/matches`; `markChatRead` on open; remove hardcoded `dark` class in `app.vue` (defer to color-mode); delete remaining `console.log`s.

**Verify:** invite lifecycle (create → register in incognito → lands in space; expired/used states render); second space via SQL → cross-space URL 403/redirect + no cross-space matching; live Toast on accept without reload; grep finds no hardcoded copy outside locale files.

---

## Stage 3 — Hardening

-   **Nitro auth middleware** `server/middleware/auth.ts`: reject unauthenticated `/api/**` except allowlist (`/api/auth/register`, `/api/invites/lookup/**`) — future routes fail closed.
-   **Rate limiting** (in-memory LRU keyed IP/user) on register, invite creation, match find, message post.
-   **Invite token hashing**: migration to `token_hash = sha256(token)`; raw token returned once at creation.
-   **RLS second pass**: move plain reads to user-scoped `serverSupabaseClient` + matching SELECT policies; service key only for privileged writes (register, RPC, invites).
-   **Input bounds audit**: zod `.max()` everywhere (username 3–30 + regex, bio 500, label 50, emails ≤ 100); confirm no raw Postgres errors escape `defineApiHandler`; every read filters `deleted_at is null`.
-   **Tooling**: vitest unit tests (findMatch selection, zod schemas, derived match status) + authz 403-matrix integration test; ESLint `no-explicit-any` in `server/**`, `no-console`; rewrite the 31KB `tailwind.config.js` down to real theme extensions; rewrite `README.md` (local setup, seed credentials, env); optional CI (db reset + typecheck + lint + test).

**Verify:** curl authz matrix (A/B/C/anon × every route); `supabase db reset` from zero still green; full suite + one manual Stage-1 e2e pass.

---

## Risks / notes

1. **Realtime + RLS**: the realtime socket must carry the user JWT — verify early in Stage 1; fallback `supabase.realtime.setAuth(session.access_token)` in the composable.
2. **admin.createUser + client sign-in seam**: after register 200, client signs in with the same credentials — test the UX seam.
3. **Nuxt 4 module versions**: verify exact compatible majors at implementation time (esp. `@nuxtjs/i18n` v10 config shape and `@nuxtjs/supabase` release for Nuxt 4).
4. User-generated interests display raw `label` (untranslatable by nature) — accepted trade-off; seeded ones stay `$t('interests.'+slug)`.
5. Single-space-per-user is a hard assumption (middleware, useMe, invites); pivot point if multi-space returns is `users.space_id` → membership table.

## Key existing files (reference points)

-   `supabase/migrations/20250323015134_proud_torch.sql` — old schema being replaced (source of truth for what exists today)
-   `server/actions/matches/findMatch.ts` — matching logic to fix/extend
-   `server/api/match/[id]/accept.post.ts` — mutual-accept rewrite target
-   `pages/chat/[id].vue` — best existing chat impl, basis for the single implementation
-   `nuxt.config.ts` — touched in every stage

---

## Implementation status (2026-07-29)

-   **Stage 0 — DONE.** Nuxt 4.5 migration (app/ srcDir, module bumps, strict TS, project-references tsconfig), clean migration set validated on Postgres 16 (8 functional assertions on `respond_to_match` pass), typed DB types wired, server utils + zod schemas, dependency cleanup.
-   **Stage 1 — DONE.** 15-route authorized/validated API (register, me, interests + suggested, matches find/accept/reject, chat); `/[space]/` page tree with membership middleware; rewritten composables; single realtime chat implementation; no-overlap suggestion flow; full i18n on all new copy. Typecheck strict: 0 errors (baseline was 118).
-   **Stage 2 — DONE.** Invite links with expiry (bulk create, list, revoke, public lookup), invite page + register pre-validation, realtime match notifications, color-mode dark theme.
-   **Stage 3 — mostly done.** Fail-closed `/api/**` auth middleware, rate limiting (register/invites/find/messages), invite tokens stored as sha256 (folded into the base schema migration since nothing was deployed), 30 vitest unit tests, tailwind config reduced from 1084 lines to its single real customization, README rewritten.
    -   **Deferred:** RLS second pass (moving plain reads to the user-scoped client) — needs a running Supabase stack to verify; ESLint currently doesn't parse TS/Vue files (pre-existing; migrate to `@nuxt/eslint` flat config when convenient).
-   **Verification still needed on a machine with Docker:** `supabase start && supabase db reset`, the two-browser end-to-end script from Stage 1 (register via dev invite → mutual accept → realtime chat), and `npm run generate:types` to replace the hand-maintained `database.types.ts`.
