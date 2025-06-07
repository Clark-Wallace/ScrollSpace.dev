import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// You'll need to replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
  created_at?: string;
}

export interface ChatUser {
  id: string;
  username: string;
  status: 'online' | 'away' | 'busy';
  last_seen: string;
  created_at?: string;
}

// Chat API functions
export const chatAPI = {
  // Send a message
  async sendMessage(username: string, message: string, type: 'message' | 'join' | 'leave' | 'system' = 'message') {
    const messageData = {
      username,
      message,
      type,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data;
  },

  // Get recent messages
  async getMessages(limit: number = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data || [];
  },

  // Subscribe to new messages
  subscribeToMessages(callback: (message: ChatMessage) => void) {
    const subscription = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return subscription;
  },

  // User presence functions
  async joinChat(username: string) {
    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('chat_users')
      .select('username')
      .eq('username', username)
      .eq('status', 'online')
      .single();

    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Add user to online users
    const userData = {
      username,
      status: 'online' as const,
      last_seen: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('chat_users')
      .upsert([userData], { onConflict: 'username' })
      .select()
      .single();

    if (error) {
      console.error('Error joining chat:', error);
      throw error;
    }

    // Send join message
    await this.sendMessage('System', `${username} has entered the chat`, 'join');

    return data;
  },

  async leaveChat(username: string) {
    // Remove user from online users
    const { error } = await supabase
      .from('chat_users')
      .delete()
      .eq('username', username);

    if (error) {
      console.error('Error leaving chat:', error);
    }

    // Send leave message
    await this.sendMessage('System', `${username} has left the chat`, 'leave');
  },

  async getOnlineUsers() {
    // Clean up stale users first (inactive for more than 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    await supabase
      .from('chat_users')
      .delete()
      .lt('last_seen', twoMinutesAgo);

    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('status', 'online')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  },

  // Heartbeat to keep user active
  async updateHeartbeat(username: string) {
    const { error } = await supabase
      .from('chat_users')
      .update({ last_seen: new Date().toISOString() })
      .eq('username', username);

    if (error) {
      console.error('Error updating heartbeat:', error);
    }
  },

  // Clean up inactive users (call this periodically)
  async cleanupInactiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Get users to be removed
    const { data: inactiveUsers } = await supabase
      .from('chat_users')
      .select('username')
      .lt('last_seen', fiveMinutesAgo);

    // Send leave messages for inactive users
    if (inactiveUsers && inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        await this.sendMessage('System', `${user.username} has left the chat (connection lost)`, 'leave');
      }
    }

    // Remove inactive users
    const { error } = await supabase
      .from('chat_users')
      .delete()
      .lt('last_seen', fiveMinutesAgo);

    if (error) {
      console.error('Error cleaning up inactive users:', error);
    }
  },

  // Subscribe to user presence changes
  subscribeToUsers(callback: (users: ChatUser[]) => void) {
    const subscription = supabase
      .channel('chat-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_users'
        },
        async () => {
          // Refresh users list when there's any change
          const users = await this.getOnlineUsers();
          callback(users);
        }
      )
      .subscribe();

    return subscription;
  },

  // Update user status
  async updateUserStatus(username: string, status: 'online' | 'away' | 'busy') {
    const { error } = await supabase
      .from('chat_users')
      .update({ 
        status, 
        last_seen: new Date().toISOString() 
      })
      .eq('username', username);

    if (error) {
      console.error('Error updating user status:', error);
    }
  },

  // Force cleanup all users (for admin use)
  async clearAllUsers() {
    const { error } = await supabase
      .from('chat_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing all users:', error);
    }
  }
};

// Database setup SQL (run this in your Supabase SQL editor)
export const setupSQL = `
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
`;