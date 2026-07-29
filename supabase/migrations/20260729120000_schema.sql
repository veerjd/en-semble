-- En-Semble schema (clean rebuild).
-- Spaces are invite-only pools of users; matches are product-generated within a
-- space and require BOTH parties to accept before a chat exists.

create extension if not exists pgcrypto with schema extensions;

create type match_response as enum ('pending', 'accepted', 'rejected');

-- ---------------------------------------------------------------------------
-- Spaces
-- ---------------------------------------------------------------------------
create table spaces (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    name text not null,
    description text,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Users (profile rows; id mirrors auth.users)
-- ---------------------------------------------------------------------------
create table users (
    id uuid primary key references auth.users (id) on delete cascade,
    space_id uuid not null references spaces (id),
    username text not null unique
        check (char_length(username) between 3 and 30),
    bio text check (char_length(bio) <= 500),
    locale text not null default 'fr' check (locale in ('fr', 'en')),
    created_at timestamptz not null default now(),
    last_active timestamptz not null default now(),
    deleted_at timestamptz
);

create index users_space_id_idx on users (space_id);

-- ---------------------------------------------------------------------------
-- Interests (user-generated, shared across all spaces).
-- Categories are analytics-only: never exposed through the API or UI.
-- ---------------------------------------------------------------------------
create table interest_categories (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    created_at timestamptz not null default now()
);

create table interests (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    label text not null check (char_length(label) between 1 and 50),
    interest_category_id uuid references interest_categories (id),
    created_by uuid references users (id), -- null = seeded
    created_at timestamptz not null default now()
);

create table user_interests (
    user_id uuid not null references users (id) on delete cascade,
    interest_id uuid not null references interests (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, interest_id)
);

create index user_interests_interest_id_idx on user_interests (interest_id);

-- ---------------------------------------------------------------------------
-- Matches: product-generated, one row per pair, per-user acceptance.
-- Overall status is derived: both accepted => matched; either rejected =>
-- rejected; otherwise pending. unique(user1_id, user2_id) means a rejected
-- pair can never be re-matched.
-- ---------------------------------------------------------------------------
create table matches (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references spaces (id),
    user1_id uuid not null references users (id),
    user2_id uuid not null references users (id),
    user1_response match_response not null default 'pending',
    user2_response match_response not null default 'pending',
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    check (user1_id < user2_id),
    unique (user1_id, user2_id)
);

create index matches_user1_id_idx on matches (user1_id);
create index matches_user2_id_idx on matches (user2_id);
create index matches_space_id_idx on matches (space_id);

-- ---------------------------------------------------------------------------
-- Chats: exactly one per mutually-accepted match. The unique constraint on
-- match_id makes concurrent double-accepts race-safe.
-- ---------------------------------------------------------------------------
create table chats (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null unique references matches (id),
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create table chat_messages (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid not null references chats (id) on delete cascade,
    user_id uuid not null references users (id),
    content text not null
        check (char_length(trim(content)) between 1 and 4000),
    read_at timestamptz,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index chat_messages_chat_id_created_at_idx
    on chat_messages (chat_id, created_at);
create index chat_messages_user_id_idx on chat_messages (user_id);

-- ---------------------------------------------------------------------------
-- Invites: expiring registration links; no email sending.
-- ---------------------------------------------------------------------------
create table invites (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references spaces (id),
    token text not null unique
        default encode(extensions.gen_random_bytes(24), 'hex'),
    email text, -- optional label for the inviter; nothing is sent
    created_by uuid references users (id),
    expires_at timestamptz not null,
    used_at timestamptz,
    used_by uuid references users (id),
    created_at timestamptz not null default now()
);

create index invites_space_id_idx on invites (space_id);

-- ---------------------------------------------------------------------------
-- Mutual-accept transition. supabase-js has no transactions, so the
-- respond -> maybe-create-chat step lives here as a single atomic call.
-- Called by the server (service role) which has already authenticated the
-- user; p_user_id is the authenticated caller's id.
-- ---------------------------------------------------------------------------
create function respond_to_match(
    p_match_id uuid,
    p_user_id uuid,
    p_response match_response
)
returns table (
    user1_response match_response,
    user2_response match_response,
    chat_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_match matches%rowtype;
    v_current match_response;
    v_chat_id uuid;
begin
    if p_response = 'pending' then
        raise exception 'invalid_response';
    end if;

    select * into v_match
    from matches
    where id = p_match_id and deleted_at is null
    for update;

    if not found then
        raise exception 'match_not_found';
    end if;

    if p_user_id = v_match.user1_id then
        v_current := v_match.user1_response;
    elsif p_user_id = v_match.user2_id then
        v_current := v_match.user2_response;
    else
        raise exception 'not_participant';
    end if;

    if v_current <> 'pending' and v_current <> p_response then
        raise exception 'already_responded';
    end if;

    if p_user_id = v_match.user1_id then
        update matches set user1_response = p_response
        where id = p_match_id
        returning matches.user1_response, matches.user2_response
        into v_match.user1_response, v_match.user2_response;
    else
        update matches set user2_response = p_response
        where id = p_match_id
        returning matches.user1_response, matches.user2_response
        into v_match.user1_response, v_match.user2_response;
    end if;

    if v_match.user1_response = 'accepted'
        and v_match.user2_response = 'accepted' then
        insert into chats (match_id)
        values (p_match_id)
        on conflict (match_id) do nothing;

        select c.id into v_chat_id from chats c where c.match_id = p_match_id;
    end if;

    return query select
        v_match.user1_response, v_match.user2_response, v_chat_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Keep users.last_active fresh as they chat.
-- ---------------------------------------------------------------------------
create function touch_user_last_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update users set last_active = now() where id = new.user_id;
    return new;
end;
$$;

create trigger update_user_last_active_on_message
    after insert on chat_messages
    for each row
    execute function touch_user_last_active();
