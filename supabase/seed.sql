-- LOCAL DEV SEED ONLY. Applied by `supabase db reset`; never deployed.
-- Creates two confirmed auth users (password: password123), matching profile
-- rows in the 'portail' space, overlapping interests (so match-finding works
-- out of the box), and a long-lived invite with a fixed token for testing
-- the registration flow: /register/dev-invite-token

-- Dev user A: veerjd / veerjd@example.com
insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change, email_change_token_new
) values (
    '00000000-0000-0000-0000-000000000000',
    '54552ef8-dafe-4f74-9cfd-054ce5d86e3b'::uuid,
    'authenticated', 'authenticated', 'veerjd@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
);

-- Dev user B: demo / demo@example.com
insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change, email_change_token_new
) values (
    '00000000-0000-0000-0000-000000000000',
    '7b7e6f2a-9c4d-4a21-8f3e-2d1b5c9a0e47'::uuid,
    'authenticated', 'authenticated', 'demo@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
);

insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
)
select
    gen_random_uuid(), u.id, u.id::text,
    jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
    'email', now(), now(), now()
from auth.users u
where u.email in ('veerjd@example.com', 'demo@example.com');

-- Profile rows in the seeded 'portail' space
insert into public.users (id, space_id, username, bio) values
    ('54552ef8-dafe-4f74-9cfd-054ce5d86e3b'::uuid,
     'c74bc511-e68f-4ce3-95a4-6770024ba172'::uuid,
     'veerjd', 'Soli Deo Gloria'),
    ('7b7e6f2a-9c4d-4a21-8f3e-2d1b5c9a0e47'::uuid,
     'c74bc511-e68f-4ce3-95a4-6770024ba172'::uuid,
     'demo', 'Compte de démonstration');

-- Overlapping interests so findMatch has a candidate pair immediately
insert into public.user_interests (user_id, interest_id) values
    -- veerjd
    ('54552ef8-dafe-4f74-9cfd-054ce5d86e3b'::uuid, '8858337c-f4fc-47d4-8a28-6b427894f99b'::uuid), -- bible_study_methodology
    ('54552ef8-dafe-4f74-9cfd-054ce5d86e3b'::uuid, 'f27eb46d-8447-4d41-931b-0bb2375ca020'::uuid), -- prayer_journaling
    ('54552ef8-dafe-4f74-9cfd-054ce5d86e3b'::uuid, '789bdf67-74e5-499b-8398-5a527456e892'::uuid), -- theological_debate
    -- demo
    ('7b7e6f2a-9c4d-4a21-8f3e-2d1b5c9a0e47'::uuid, '8858337c-f4fc-47d4-8a28-6b427894f99b'::uuid), -- bible_study_methodology
    ('7b7e6f2a-9c4d-4a21-8f3e-2d1b5c9a0e47'::uuid, '789bdf67-74e5-499b-8398-5a527456e892'::uuid), -- theological_debate
    ('7b7e6f2a-9c4d-4a21-8f3e-2d1b5c9a0e47'::uuid, 'e2684c6e-cf4b-420b-8678-1715564cc67a'::uuid); -- worship_music_composition

-- Fixed-token dev invite for testing /register/dev-invite-token
-- (only the sha256 of the token is stored)
insert into public.invites (space_id, token_hash, created_by, expires_at) values (
    'c74bc511-e68f-4ce3-95a4-6770024ba172'::uuid,
    encode(extensions.digest('dev-invite-token', 'sha256'), 'hex'),
    '54552ef8-dafe-4f74-9cfd-054ce5d86e3b'::uuid,
    now() + interval '10 years'
);
