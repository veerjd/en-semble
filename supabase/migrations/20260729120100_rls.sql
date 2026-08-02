-- Row-level security: deny by default.
-- All application reads/writes go through the Nuxt server (service role,
-- which bypasses RLS and enforces authorization explicitly). The browser's
-- anon/user client is used ONLY for realtime subscriptions, which respect
-- RLS — so the only policies here are the SELECTs realtime needs.

alter table spaces enable row level security;
alter table users enable row level security;
alter table interest_categories enable row level security;
alter table interests enable row level security;
alter table user_interests enable row level security;
alter table matches enable row level security;
alter table chats enable row level security;
alter table chat_messages enable row level security;
alter table invites enable row level security;

-- Realtime: a user may see their own matches...
create policy matches_select_participant on matches
    for select
    using (auth.uid() in (user1_id, user2_id));

-- ...and the messages of chats they participate in.
create policy chat_messages_select_participant on chat_messages
    for select
    using (
        exists (
            select 1
            from chats c
            join matches m on m.id = c.match_id
            where c.id = chat_messages.chat_id
              and auth.uid() in (m.user1_id, m.user2_id)
        )
    );

-- Realtime publication (was entirely missing before).
alter table chat_messages replica identity full;
alter table matches replica identity full;

do $$
begin
    alter publication supabase_realtime add table chat_messages;
exception
    when duplicate_object then null;
end $$;

do $$
begin
    alter publication supabase_realtime add table matches;
exception
    when duplicate_object then null;
end $$;
