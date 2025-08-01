-- Create simple chat messages table
CREATE TABLE IF NOT EXISTS simple_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'join', 'leave', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time for the table
ALTER TABLE simple_chat_messages REPLICA IDENTITY FULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_simple_chat_messages_created_at 
ON simple_chat_messages(created_at DESC);

-- Enable RLS (Row Level Security) but allow all operations for simplicity
ALTER TABLE simple_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anonymous users
CREATE POLICY "Allow all operations on simple_chat_messages" 
ON simple_chat_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON simple_chat_messages TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;