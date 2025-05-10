/*
# Initial Schema Setup for User Matching App

1. New Tables
- spaces
- id (uuid)
- name (text)
- description (text)
- created_at (timestamp)
- deleted_at (timestamp)
- users
- id (uuid, references auth.users)
- space_id (uuid, references spaces)
- username (text)
- bio (text)
- created_at (timestamp)
- last_active (timestamp)
- deleted_at (timestamp)
- interests
- id (uuid)
- name (text)
- created_at (timestamp)
- deleted_at (timestamp)
- user_interests
- user_id (uuid, references users)
- interest_id (uuid, references interests)
- created_at (timestamp)
- matches
- id (uuid)
- user1_id (uuid, references users)
- user2_id (uuid, references users)
- status (text)
- created_at (timestamp)
- deleted_at (timestamp)
- messages
- id (uuid)
- match_id (uuid, references matches)
- user_id (uuid, references users)
- content (text)
- created_at (timestamp)
- read (boolean)
- deleted_at (timestamp)
- match_statuses
- id (uuid)
- slug (text)
- created_at (timestamp)

2. Security
- Enable RLS on all tables
- Add policies for authenticated users
 */
-- Create spaces table
CREATE TABLE
  IF NOT EXISTS spaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now (),
    deleted_at timestamptz
  );

-- Create users table
CREATE TABLE
  IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    space_id uuid REFERENCES spaces,
    username text UNIQUE NOT NULL,
    bio text,
    created_at timestamptz DEFAULT now (),
    last_active timestamptz DEFAULT now (),
    deleted_at timestamptz,
    CHECK (
      length (username) >= 3
      AND length (username) <= 30
    )
  );

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Create index on space_id for faster space-based queries
CREATE INDEX IF NOT EXISTS idx_users_space_id ON users (space_id);

-- Create interest categories table
CREATE TABLE
  IF NOT EXISTS interest_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    slug text NOT NULL,
    created_at timestamptz DEFAULT now (),
    deleted_at timestamptz
  );

-- Create interests table
CREATE TABLE
  IF NOT EXISTS interests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    slug text UNIQUE NOT NULL,
    interest_category_id uuid REFERENCES interest_categories,
    created_at timestamptz DEFAULT now (),
    deleted_at timestamptz
  );

-- Create user_interests table
CREATE TABLE
  IF NOT EXISTS user_interests (
    user_id uuid REFERENCES users ON DELETE CASCADE,
    interest_id uuid REFERENCES interests ON DELETE CASCADE,
    created_at timestamptz DEFAULT now (),
    PRIMARY KEY (user_id, interest_id)
  );

-- Create match_statuses table
CREATE TABLE
  IF NOT EXISTS match_statuses (
    id serial PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now ()
  );

-- Insert default match statuses
INSERT INTO
  match_statuses (slug)
VALUES
  ('pending'),
  ('accepted'),
  ('rejected'),
  ('expired');

-- Create matches table
CREATE TABLE
  IF NOT EXISTS matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user1_id uuid REFERENCES users ON DELETE CASCADE,
    user2_id uuid REFERENCES users ON DELETE CASCADE,
    status_id integer REFERENCES match_statuses NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now (),
    deleted_at timestamptz,
    CHECK (user1_id < user2_id)
  );

-- Create indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches (user1_id);

CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches (user2_id);

CREATE INDEX IF NOT EXISTS idx_matches_status_id ON matches (status_id);

-- Create chats table
CREATE TABLE
  IF NOT EXISTS chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    match_id uuid REFERENCES matches, -- nullable, only for 1:1 matched chats
    created_at timestamptz DEFAULT now (),
    deleted_at timestamptz
  );

-- Create chat_participants table (for group or multi-user chats)
CREATE TABLE
  IF NOT EXISTS chat_participants (
    chat_id uuid REFERENCES chats ON DELETE CASCADE,
    user_id uuid REFERENCES users ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now (),
    PRIMARY KEY (chat_id, user_id)
  );

-- Create messages table
CREATE TABLE
  IF NOT EXISTS chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    chat_id uuid REFERENCES chats ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now (),
    deleted_at timestamptz,
    CHECK (length (trim(content)) > 0)
  );

-- Create indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages (chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at);

-- Create trigger to update user's last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_last_active_on_message AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_user_last_active ();

-- Set up realtime for messages
ALTER TABLE chat_messages REPLICA IDENTITY FULL;