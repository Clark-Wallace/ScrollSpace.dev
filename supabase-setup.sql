-- ScrollSpace Chat Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'join', 'leave', 'system')),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_users table
CREATE TABLE IF NOT EXISTS chat_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Anyone can read messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read users" ON chat_users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON chat_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON chat_users FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete users" ON chat_users FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_users_username ON chat_users(username);
CREATE INDEX IF NOT EXISTS idx_chat_users_status ON chat_users(status);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_users;