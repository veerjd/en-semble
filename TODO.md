# Multi-space profiles, onboarding, and three-way match response

## Context

Three changes to En-Semble, driven by product gaps found while tracing the invite → first-message flow.

**1. One account, many spaces.** Today `public.users.id` _is_ `auth.users.id`, and `users.space_id` is a single non-null column. One human = one space, structurally, forever. There is no way to join a second space.

**2. No onboarding.** Registration writes only `{id, space_id, username}`. A new user lands on `/{space}/matches` with zero interests, presses "Find", and gets an immediate `404 no_overlap` — the product's first impression is a dead end. The existing suggested-interests dialog is a recovery path bolted onto a failure, not an onboarding step.

**3. Match response is binary and permanent.** Accept or Decline only. `unique(user1_id, user2_id)` plus the blacklist in `findAndCreateMatch` mean one exploratory tap **permanently burns the pair for both people** — and neither is told why. In a small space a handful of taps can irreversibly exhaust the candidate pool. There is no "not right now".

Intended outcome: a user can hold profiles in several spaces from one login, arrives with interests already chosen, and can defer a match without destroying it.

## Decisions made

| Question               | Decision                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-space mechanism  | One-to-many `public.users`, **not** a `space_members` join table                                                                                                                    |
| Profile model          | **Template + instance.** `user_profiles` (one per auth user) owns username/bio/locale/interests; each `users` row is a per-space instance seeded from it and independently editable |
| Interests at signup    | Chosen **once** on the template; copied into each space instance on join                                                                                                            |
| Existing data          | **Clean rebuild** — rewrite the migration files in place, no backfill                                                                                                               |
| Active-space transport | `X-Space-Slug` header, attached by a `$fetch` plugin. Enforced in `requireSpaceMember`, **not** `requireUser`, so pre-space routes are exempt structurally                          |
| Active-space selection | `/` routes by membership count: one → that space's home; several → a template-scoped `/spaces` picker (also the navbar switcher's "all spaces" target)                              |
| Onboarding location    | Dedicated route behind a middleware gate (survives refresh/abandon)                                                                                                                 |
| Interest picker        | Category-grouped browse + search. **Must not** render the full catalog — it is already 200 and will grow                                                                            |
| "Maybe later"          | **Defer** — hidden temporarily, not blacklisted, reversible to accepted                                                                                                             |
| "Never"                | Permanent, plus a durable person-level block                                                                                                                                        |
| "Never" scope          | Per **person**-pair, scoped to the space, surviving leave/rejoin                                                                                                                    |

### Why template + instance

The alternative — one global profile read live everywhere — loses per-space bio/username divergence. The alternative in the other direction — independent profiles per space — makes the user re-onboard on every join. The template is the onboarding target and the join-time default; the instance is what matching and chat actually reference, so `matches`/`chat_messages`/`user_interests` FKs keep pointing at `users(id)` and need no rework.

### Why the header, and why only on some routes

The server currently has **no way to know which space a request targets** — `/[space]/` is client-side routing only. Every route calls `requireUser`, which resolves exactly one profile by auth id; with several profiles that becomes ambiguous. A header avoids renaming all 19 routes. But login, registration, and invite lookup all happen _before_ a space is resolvable, and `/api/user/me` must return _all_ memberships — so the requirement lives in `requireSpaceMember`, which those routes don't call.

## Risk register

Ordered by how quietly each fails.

1. **RLS policies break silently.** All three in `supabase/migrations/20260729120100_rls.sql` compare `auth.uid() in (user1_id, user2_id)` against what become _profile_ ids. Post-change every policy evaluates false and realtime simply stops delivering rows — no error, no log. Fixed with a `security definer` helper resolving `auth.uid()` → profile ids.
2. **The helper needs an explicit grant.** `20260729120300_realtime_grants.sql` documents this exact failure mode at length: a policy is not a grant. The new function needs `grant execute ... to authenticated` or realtime dies the same silent death.
3. **`deriveMatchStatus` has a catch-all fallback** (`server/utils/mappers.ts:39`). A new `deferred` enum value falls through to `awaiting_them` — a deferred match would render as "waiting for their answer" with no buttons. Must become total.
4. **`MatchStatus` exhaustiveness.** `MatchCard.vue:17-27` (severity map) and `:44` (i18n key interpolation) are exhaustive over the 4 current values and break first.
5. **`invites.used_by` is already subtly wrong** — `register.ts:66` writes an auth id into a column FK'd to `users(id)`. It works today only because of the coupling being removed.
6. **`database.types.ts` is hand-maintained** (says so in its header) despite `npm run generate:types` existing. Regenerating reformats the whole file; hand-editing risks drift.
7. **Zero coverage on the risky parts.** All four test files are pure unit tests of pure functions. No integration, API, RLS, or DB tests exist. Adding a `match_response` value breaks **no** existing test.

## Implementation

Three stages. Stage 1 must land and be verified before 2 and 3, which are independent of each other.

---

### Stage 1 — Multi-space (template + instance)

#### 1.1 Schema rewrite — `supabase/migrations/20260729120000_schema.sql`

Clean rebuild, so edit in place. New enum value included here rather than via `ALTER TYPE` (which cannot run in a transaction block):

```sql
create type match_response as enum ('pending', 'accepted', 'deferred', 'rejected');
```

Template table, new:

```sql
create table user_profiles (
    auth_user_id uuid primary key references auth.users (id) on delete cascade,
    username text not null check (char_length(username) between 3 and 30),
    bio text check (char_length(bio) <= 500),
    locale text not null default 'fr' check (locale in ('fr', 'en')),
    onboarded_at timestamptz,          -- null => onboarding incomplete
    created_at timestamptz not null default now()
);

create table profile_interests (
    auth_user_id uuid not null references user_profiles (auth_user_id) on delete cascade,
    interest_id uuid not null references interests (id) on delete cascade,
    primary key (auth_user_id, interest_id)
);
```

`users` becomes the per-space instance — surrogate PK, and username uniqueness moves from global to per-space:

```sql
create table users (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null references auth.users (id) on delete cascade,
    space_id uuid not null references spaces (id),
    username text not null check (char_length(username) between 3 and 30),
    bio text check (char_length(bio) <= 500),
    locale text not null default 'fr' check (locale in ('fr', 'en')),
    created_at timestamptz not null default now(),
    last_active timestamptz not null default now(),
    deleted_at timestamptz,
    unique (auth_user_id, space_id),
    unique (space_id, username)
);

create index users_auth_user_id_idx on users (auth_user_id);
create index users_space_id_idx on users (space_id);
```

Person-level block, surviving leave/rejoin. Ordered pair so `(a,b)` and `(b,a)` collapse:

```sql
create table match_blocks (
    space_id uuid not null references spaces (id),
    auth_a uuid not null references auth.users (id) on delete cascade,
    auth_b uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (space_id, auth_a, auth_b),
    check (auth_a < auth_b)
);
```

Also: `interest_categories` gains a `sort_order int not null default 0` for stable grouped display. `invites.used_by` repoints to `auth.users(id)` — it records _who redeemed the link_, which is a person, not a space profile. This fixes the latent bug noted in the risk register.

#### 1.2 RLS helper + policies — `20260729120100_rls.sql`

The critical piece. `auth.uid()` is no longer a profile id:

```sql
create function current_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
    select id from users
    where auth_user_id = auth.uid() and deleted_at is null
$$;

grant execute on function current_profile_ids() to authenticated;
```

The grant is not optional — see risk #2. Then all three policies become:

```sql
create policy matches_select_participant on matches
    for select using (
        user1_id in (select current_profile_ids())
        or user2_id in (select current_profile_ids())
    );
```

`chats_select_participant` and `chat_messages_select_participant` follow the same substitution inside their existing `exists (...)` subqueries.

#### 1.3 `requireUser` / `requireSpaceMember` split — `server/utils/auth.ts`

The single most important change. `requireUser` stops being space-aware and returns the **template**; `requireSpaceMember` resolves the **instance** from the header.

```ts
// requireUser -> template identity, no space needed
const { data: profile } = await db
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

// requireSpaceMember -> per-space instance, header-driven
const slug = getHeader(event, 'x-space-slug')
if (!slug) apiError(400, 'space_required')

const { data: user } = await db
    .from('users')
    .select('*, space:spaces!inner(id, slug, name)')
    .eq('auth_user_id', authUserId)
    .eq('spaces.slug', slug)
    .is('deleted_at', null)
    .maybeSingle()
if (!user) apiError(403, 'not_space_member')
```

Cache both separately on `event.context` (`_sessionProfile`, `_sessionUser`).

**Every space-scoped action switches from `requireUser` to `requireSpaceMember`.** The eight `user.space_id` call sites then keep working unchanged, because the space still comes from the resolved row:

-   `server/actions/matches/findAndCreateMatch.ts:29,70`
-   `server/actions/interests/getSuggestedInterests.ts:19`
-   `server/actions/invites/createInvites.ts:33`, `getSpaceInvites.ts:35`, `revokeInvite.ts:12`
-   `server/actions/matches/*`, `server/actions/chats/*` (via `requireMatchParticipant` / `requireChatParticipant`, which switch internally)

#### 1.4 Registration and joining

`server/actions/auth/register.ts` — now writes three rows instead of two, in order: `auth.users` → `user_profiles` (template) → `users` (instance for the invite's space), then consumes the invite. The existing `deleteUser` compensating rollback must cover all of them.

**New flow: joining a space while already logged in.** `register.ts` today unconditionally calls `auth.admin.createUser` and 409s on `email_exists`. Add `POST /api/invites/[token]/join`:

-   requires a session, no email/password
-   validates + consumes the invite exactly as registration does (same `.is('used_at', null)` race guard)
-   copies `username`/`bio` from the template, plus `profile_interests` → `user_interests`
-   on `(space_id, username)` collision, returns `409 username_taken` and the client prompts for a space-specific username

`app/pages/register/[token].vue` branches on `useSupabaseUser()`: signed in → the join flow; anonymous → the current registration form.

#### 1.5 DTO and client fallout

`shared/types/api.ts` — `MeDTO.space` (singular) is the structural blocker:

```ts
export interface MembershipDTO {
    space: SpaceDTO
    username: string
    bio: string | null
}

export interface MeDTO {
    id: string // TEMPLATE auth_user_id
    username: string // template values
    bio: string | null
    locale: string
    onboarded: boolean
    memberships: MembershipDTO[]
    interests: InterestDTO[] // template interests
}
```

**Invariant to preserve:** anything comparing against a `matches`/`chat_messages` row must use the _instance_ id, never `MeDTO.id`. `MessageList.vue:67,74,83` and `useRealtimeMatches.ts:18-19` compare ids today and would break **visually only** (message bubbles align to the wrong side) with no error. Add an explicit `activeProfileId` to the active-space state and use it at those four sites.

-   `app/middleware/space.global.ts:41-43` — stop force-redirecting out of foreign spaces; check `to.params.space` against the membership _list_, set active space, and only redirect when the user genuinely isn't a member. `/` stops hardcoding a single space home: one membership → `/{slug}/matches`; several → `/spaces`. Keep gating on `useSupabaseSession()`, not `useSupabaseUser()` — the user ref is filled asynchronously after sign-in (via `getClaims`), and checking it reintroduces the login-lands-on-a-spinner race fixed on `claude/login-redirect-bug-evb3f9`.
-   `app/pages/spaces.vue` (new) — the space-selection page. Template-scoped, so it sits **outside** `/[space]/` (same reasoning as `/onboarding`): lists the account's memberships (space name + per-space username) and navigates to `/{slug}/matches` on pick. Login lands here only via the `/` branching above — users with a single membership never see it. Also the destination of the navbar switcher's "all spaces" entry.
-   `app/components/Navbar.vue:4,17` — `me.space.slug`/`.name` become the active membership; add a space switcher when `memberships.length > 1`.
-   `app/plugins/api-space.ts` (new) — `$fetch` interceptor attaching `X-Space-Slug`. SSR needs the same header threaded through `useRequestFetch`, so set it in the plugin for both client and server contexts.
-   `supabase/seed.sql` — rewrite; it hardcodes `users.id` = auth ids at `:49-75`.
-   `shared/types/database.types.ts` — hand-maintained. Run `npm run generate:types` against a live local stack, then reconcile.

---

### Stage 2 — Onboarding

#### 2.1 Expose categories for grouping

Reverses the "analytics-only" rule at `schema.sql:38-41` — update that comment. Add `GET /api/interests/grouped` returning categories with a **capped preview** of each (say 8) plus a total, so the initial payload is small and the catalog can grow past 200 without the page growing with it. Drill-in and search hit the existing flat endpoint filtered server-side.

Category labels need i18n keys in **both** `en.json` and `fr.json` — `interest_categories` has only a `slug`, no label column. The 14 category slugs already have entries at `en.json:101-114` but are currently unused.

#### 2.2 Extract a shared picker

`app/components/InterestPicker.vue` — there are currently two ad-hoc implementations (`profile.vue:147-195`, `matches.vue:162-173`); this becomes the third unless extracted. Props: `modelValue: InterestDTO[]`, `min`. Category-grouped browse + search, chips for the selection. Must render via `useInterestLabel`, never `.label`.

Refactor `profile.vue` and the `matches.vue` suggestions dialog onto it.

#### 2.3 The gate

`app/pages/onboarding.vue` — template-scoped, so it sits **outside** `/[space]/` (it runs once per person, not per space).

`app/middleware/space.global.ts` — insert immediately after the `me` load (currently line 30), before space branching:

```ts
if (!me.value.onboarded && to.path !== '/onboarding')
    return navigateTo('/onboarding')
if (me.value.onboarded && to.path === '/onboarding') return navigateTo('/')
```

**Minimum 3 interests** to complete. One is enough to satisfy `findAndCreateMatch`, but with 200+ interests a single pick makes overlap unlikely and lands the user straight back in the `no_overlap` dialog — which is the failure this feature exists to prevent. Completing sets `onboarded_at`.

#### 2.4 Harden the write

`replaceMyInterests` is a destructive delete-then-insert with no transaction (`replaceMyInterests.ts:26-37`) — a failure between the two leaves the user with **zero** interests, which would bounce them back into onboarding. Move it into a `security definer` Postgres function, the same reasoning that put `respond_to_match` there. Add the template-scoped equivalent for `profile_interests`.

Also fix `' Folk Art Creation'` (leading space) at `seed_reference.sql:78` and `en.json:166`.

---

### Stage 3 — Accept / Maybe later / Never

#### 3.1 Enum, column, and status

Enum gains `deferred` (in the 1.1 rewrite). `matches` gains:

```sql
alter table matches add column user1_deferred_until timestamptz;
alter table matches add column user2_deferred_until timestamptz;
```

`MatchStatus` gains `deferred`. `deriveMatchStatus` (`server/utils/mappers.ts:29-40`) must become **total** — its current fallback at `:39` would silently report a deferred match as `awaiting_them`, rendering "waiting for their answer" with no buttons:

```ts
if (myResponse === 'rejected' || theirResponse === 'rejected') return 'rejected'
if (myResponse === 'accepted' && theirResponse === 'accepted') return 'matched'
if (myResponse === 'deferred') return 'deferred'
if (myResponse === 'pending') return 'awaiting_me'
return 'awaiting_them'
```

Note `theirResponse === 'deferred'` is deliberately invisible to me — I still see `awaiting_me` and can act. Deferral is private.

#### 3.2 `respond_to_match` changes

Two branches in `schema.sql:140-208`:

-   **`:180-182`** — the `already_responded` guard blocks `deferred → accepted`. Must allow it: `if v_current not in ('pending','deferred') and v_current <> p_response then raise ...`
-   **`:196-203`** — chat creation requires both `'accepted'`. **No change** — this correctly guarantees a deferred match can never open a chat.
-   Add: when `p_response = 'deferred'`, set the caller's `*_deferred_until = now() + interval '7 days'`; when accepting, clear it.

On `rejected`, insert into `match_blocks` with `least`/`greatest` on the two `auth_user_id`s — inside the same function so the block and the rejection are atomic.

#### 3.3 Resurfacing, with no cron

There is no scheduler in this project and none should be added. Deferred matches come back **lazily, on read**:

-   `getMyMatches` shows a deferred match once `deferred_until <= now()`, flipping the response back to `pending` on read (or simply deriving `awaiting_me` from the elapsed timestamp — preferred, since it avoids a write on a GET).
-   `findAndCreateMatch.ts:36-47` currently blacklists **every** prior pairing regardless of response. Deferred pairs must be **excluded from that blacklist** so the existing row can resurface — but must _not_ be re-inserted, since `unique(user1_id, user2_id)` forbids it. The resurface path is the existing row, never a new one.
-   The same function gains a `match_blocks` exclusion, joined on candidate `auth_user_id`.

#### 3.4 Routes and UI

Add `maybe.post.ts` and `never.post.ts` alongside the existing two, matching the established one-line style — `reject.post.ts` stays as an alias of `never` or is renamed with the client updated. `respondToMatch`'s `Extract<MatchResponse, 'accepted' | 'rejected'>` widens to include `'deferred'`. Its error mapping matches on substrings and does **not** map `not_participant` or `invalid_response`, which would surface as 500s — add them while here.

`MatchCard.vue` — a third emit, and the two exhaustive spots that break first: the `statusSeverity` map at `:17-27` (returns `undefined` for a new status) and the i18n interpolation at `:44` (`matches.status.${match.status}`). Three buttons plus a Tag in a `flex-wrap justify-end` row will wrap on mobile; restyle as a compact action row. Also reconcile the existing accept-uses-`:loading` / reject-uses-`:disabled` inconsistency.

`matches.vue:117-119` filters `status !== 'rejected'`; extend to hide `deferred` until it resurfaces. **Fix the silent-vanish bug while here** — today a declined card just disappears with no explanation.

New i18n keys in **both** locales: `matches.maybe`, `matches.never`, `matches.deferred`, `matches.status.deferred`, `matches.deferredUntil`.

---

## Verification

No integration, API, RLS, or DB tests exist today — all four test files are pure unit tests. The riskiest changes here are exactly the ones with no coverage, so verification is mostly manual plus targeted new tests.

**Unit tests to add** (`tests/unit/mappers.test.ts`): `deriveMatchStatus` over the full 4×4 matrix. The existing 8 assertions still pass after adding an enum value — that is the trap, not the reassurance.

**DB/RLS — the silent failure, check first.** After the migration, with a local stack:

```bash
npx supabase db reset          # clean rebuild
npm run generate:types         # then reconcile the hand-maintained file
```

Then in `psql`, as `authenticated` with a real JWT: `select * from matches;` must return exactly that user's rows. If it returns zero, the policy or the `execute` grant is wrong — and the app will show no error at all.

**Realtime — the thing that dies quietly.** Two browsers, two accounts:

1. A presses Find → B gets the "New match found!" toast. _(Proves the `matches` INSERT policy + grant.)_
2. Both accept → B auto-navigates to the chat. _(Proves the UPDATE path and `respond_to_match`.)_
3. A sends a message with B on the chat page → it appears live. _(Proves the `chat_messages` policy, which joins through `chats`.)_

If step 1 works but step 3 doesn't, the `chats` SELECT policy is the culprit — it exists solely so that join resolves.

**Multi-space:**

-   Register via `/register/dev-invite-token` → onboarding → matches.
-   Create a second space + invite. While logged in, open the invite → join flow, no password prompt, username prefilled.
-   Log in with two memberships → land on `/spaces`; pick one → that space's `/matches`. With a single membership the picker is skipped entirely (login goes straight into the space).
-   Switch spaces in the navbar; confirm matches/chats/invites are scoped and never leak across.
-   Confirm a request with a missing or foreign `X-Space-Slug` gets `400 space_required` / `403 not_space_member`.
-   Confirm `/api/user/me` works with **no** header and lists both memberships.

**Onboarding:** a fresh user cannot reach `/matches` with zero interests; refreshing mid-onboarding resumes; completing sets `onboarded_at` and is not re-prompted on the second space.

**Three-way response:** Maybe → card hides, pair is _not_ in `match_blocks`, resurfaces after the interval, and can then be accepted (this is the `deferred → accepted` transition the old guard blocked). Never → card hides, `match_blocks` row exists, and the pair is never proposed again even after leaving and rejoining the space.

Existing suite must stay green: `npm test`.
