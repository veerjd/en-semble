/*
  # Initial Schema Setup for User Matching App

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - username (text)
      - bio (text)
      - created_at (timestamp)
      - last_active (timestamp)
    - interests
      - id (uuid)
      - name (text)
      - created_at (timestamp)
    - user_interests
      - user_id (uuid, references profiles)
      - interest_id (uuid, references interests)
      - created_at (timestamp)
    - matches
      - id (uuid)
      - user1_id (uuid, references profiles)
      - user2_id (uuid, references profiles)
      - status (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  interest_id uuid REFERENCES interests ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, interest_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CHECK (user1_id < user2_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Anyone can read interests" ON interests;
    DROP POLICY IF EXISTS "Users can read all user interests" ON user_interests;
    DROP POLICY IF EXISTS "Users can manage own interests" ON user_interests;
    DROP POLICY IF EXISTS "Users can read own matches" ON matches;
    DROP POLICY IF EXISTS "Users can create matches" ON matches;
    DROP POLICY IF EXISTS "Users can update own matches" ON matches;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Interests policies
CREATE POLICY "Anyone can read interests"
  ON interests FOR SELECT
  TO authenticated
  USING (true);

-- User interests policies
CREATE POLICY "Users can read all user interests"
  ON user_interests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own interests"
  ON user_interests FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );