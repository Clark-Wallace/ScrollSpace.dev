-- ScrollSpace Authentication Database Setup
-- Run this SQL in your Supabase SQL Editor after enabling Authentication

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for extended user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_messages INTEGER DEFAULT 0,
  fragments_collected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'cyberpunk' CHECK (theme IN ('cyberpunk', 'matrix', 'neon', 'terminal')),
  notifications_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  auto_away_minutes INTEGER DEFAULT 5,
  show_typing_indicator BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing tables to support authentication

-- Add user_id to chat_messages
ALTER TABLE chat_messages 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS user_profile JSONB;

-- Add user_id to signal_fragments
ALTER TABLE signal_fragments 
  ADD COLUMN IF NOT EXISTS claimed_by_id UUID REFERENCES auth.users(id);

-- Add user_id to fragment_pickups
ALTER TABLE fragment_pickups 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create sessions tracking table for active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create social features tables for future use
CREATE TABLE IF NOT EXISTS public.user_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('friend', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_fragments_claimed_by_id ON signal_fragments(claimed_by_id);
CREATE INDEX IF NOT EXISTS idx_fragment_pickups_user_id ON fragment_pickups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_relationships_user_id ON user_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_target_user_id ON user_relationships(target_user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Update chat_messages policies
DROP POLICY IF EXISTS "Anyone can insert messages" ON chat_messages;
CREATE POLICY "Authenticated users can insert messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR user_id IS NULL));

-- Update signal_fragments policies
DROP POLICY IF EXISTS "Anyone can update fragments" ON signal_fragments;
CREATE POLICY "Authenticated users can update fragments" 
  ON signal_fragments FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" 
  ON user_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
  ON user_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- User relationships policies
CREATE POLICY "Users can view their relationships" 
  ON user_relationships FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create relationships" 
  ON user_relationships FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their relationships" 
  ON user_relationships FOR DELETE 
  USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Achievements are viewable by everyone" 
  ON user_achievements FOR SELECT 
  USING (true);

-- Create functions and triggers

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user statistics
CREATE OR REPLACE FUNCTION public.update_user_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles 
    SET total_messages = total_messages + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message count
CREATE TRIGGER update_message_count_on_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW 
  WHEN (NEW.type = 'message')
  EXECUTE FUNCTION update_user_message_count();

-- Function to update fragment collection count
CREATE OR REPLACE FUNCTION public.update_fragment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claimed_by_id IS NOT NULL AND OLD.claimed_by_id IS NULL THEN
    UPDATE profiles 
    SET fragments_collected = fragments_collected + 1
    WHERE id = NEW.claimed_by_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for fragment count
CREATE TRIGGER update_fragment_count_on_claim
  AFTER UPDATE ON signal_fragments
  FOR EACH ROW 
  WHEN (NEW.available = false AND OLD.available = true)
  EXECUTE FUNCTION update_fragment_count();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create initial achievements types
INSERT INTO public.user_achievements (user_id, achievement_type, achievement_data)
VALUES 
  ('00000000-0000-0000-0000-000000000000'::uuid, 'first_message', '{"name": "First Transmission", "description": "Send your first message in the matrix", "icon": "📡"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000'::uuid, 'fragment_collector', '{"name": "Data Miner", "description": "Collect 10 signal fragments", "icon": "💾"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000'::uuid, 'chat_veteran', '{"name": "Matrix Veteran", "description": "Send 100 messages", "icon": "⚡"}'::jsonb),
  ('00000000-0000-0000-0000-000000000000'::uuid, 'early_adopter', '{"name": "Early Adopter", "description": "Join ScrollSpace in the first month", "icon": "🌟"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Migration helper view for existing usernames
CREATE OR REPLACE VIEW unmigrated_users AS
SELECT DISTINCT username 
FROM chat_messages 
WHERE user_id IS NULL 
  AND username NOT IN (SELECT username FROM profiles)
  AND username != 'System'
ORDER BY username;