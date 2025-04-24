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

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  space_id uuid REFERENCES spaces,
  username text UNIQUE NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create interest categories table
CREATE TABLE IF NOT EXISTS interest_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  interest_category_id uuid REFERENCES interest_categories,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  user_id uuid REFERENCES users ON DELETE CASCADE,
  interest_id uuid REFERENCES interests ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, interest_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES users ON DELETE CASCADE,
  user2_id uuid REFERENCES users ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CHECK (user1_id < user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Set up realtime for messages
ALTER TABLE messages REPLICA IDENTITY FULL;
