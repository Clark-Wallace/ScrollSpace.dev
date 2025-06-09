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
  user_id?: string;
  created_at?: string;
}

export interface ChatUser {
  id: string;
  username: string;
  status: 'online' | 'away' | 'busy';
  last_seen: string;
  user_id?: string;
  created_at?: string;
}

export interface SignalFragment {
  id: string;
  fragment_id: string;
  content: string;
  content_type: 'lore' | 'puzzle' | 'flavor' | 'personalized';
  rarity: 'common' | 'rare' | 'encrypted' | 'corrupted';
  available: boolean;
  claimed_by?: string;
  claimed_by_user_id?: string;
  claimed_at?: string;
  expires_at: string;
  created_at?: string;
}

export interface FragmentPickup {
  id: string;
  fragment_id: string;
  username: string;
  user_id?: string;
  content: string;
  rarity: string;
  picked_up_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  total_fragments: number;
  rare_fragments: number;
  joined_at: string;
  last_seen: string;
  is_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserAuth {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}

// Connection message throttling
const connectionMessageThrottle = new Map<string, number>();
const CONNECTION_MESSAGE_COOLDOWN = 30000; // 30 seconds

function shouldSendConnectionMessage(username: string, type: 'join' | 'leave'): boolean {
  const key = `${username}_${type}`;
  const now = Date.now();
  const lastSent = connectionMessageThrottle.get(key);
  
  if (!lastSent || now - lastSent > CONNECTION_MESSAGE_COOLDOWN) {
    connectionMessageThrottle.set(key, now);
    return true;
  }
  
  return false;
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

    // Send join message (throttled)
    if (shouldSendConnectionMessage(username, 'join')) {
      await this.sendMessage('System', `${username} has entered the chat`, 'join');
    }

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

    // Send leave message (throttled)
    if (shouldSendConnectionMessage(username, 'leave')) {
      await this.sendMessage('System', `${username} has left the chat`, 'leave');
    }
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

    // Send leave messages for inactive users (throttled)
    if (inactiveUsers && inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        if (shouldSendConnectionMessage(user.username, 'leave')) {
          await this.sendMessage('System', `${user.username} has left the chat (connection lost)`, 'leave');
        }
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
  },

  // Signal Fragment functions
  async dropFragment(fragmentData: Omit<SignalFragment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('signal_fragments')
      .insert([fragmentData])
      .select()
      .single();

    if (error) {
      console.error('Error dropping fragment:', error);
      throw error;
    }

    // Broadcast fragment drop to all users
    await this.sendMessage('System', `[SIGNAL_FRAGMENT_DETECTED: ${fragmentData.fragment_id}] Click to /pickup`, 'system');
    
    return data;
  },

  async getActiveFragments() {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('signal_fragments')
      .select('*')
      .eq('available', true)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fragments:', error);
      return [];
    }

    return data || [];
  },

  async pickupFragment(fragmentId: string, username: string) {
    // Check if fragment is still available
    const { data: fragment, error: fetchError } = await supabase
      .from('signal_fragments')
      .select('*')
      .eq('fragment_id', fragmentId)
      .eq('available', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !fragment) {
      throw new Error('Fragment not available or already claimed');
    }

    // Claim the fragment
    const { data: updatedFragment, error: updateError } = await supabase
      .from('signal_fragments')
      .update({
        available: false,
        claimed_by: username,
        claimed_at: new Date().toISOString()
      })
      .eq('fragment_id', fragmentId)
      .eq('available', true) // Double-check it's still available
      .select()
      .single();

    if (updateError || !updatedFragment) {
      throw new Error('Failed to claim fragment - may have been claimed by another user');
    }

    // Log the pickup
    await supabase
      .from('fragment_pickups')
      .insert([{
        fragment_id: fragmentId,
        username,
        picked_up_at: new Date().toISOString()
      }]);

    // Send pickup notification
    await this.sendMessage('System', `${username} picked up fragment ${fragmentId}`, 'system');

    return updatedFragment;
  },

  async getUserFragments(username: string) {
    const { data, error } = await supabase
      .from('signal_fragments')
      .select('*')
      .eq('claimed_by', username)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching user fragments:', error);
      return [];
    }

    return data || [];
  },

  async cleanupExpiredFragments() {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('signal_fragments')
      .delete()
      .lt('expires_at', now)
      .eq('available', true);

    if (error) {
      console.error('Error cleaning up expired fragments:', error);
    }
  },

  // Subscribe to fragment events
  subscribeToFragments(callback: (fragments: SignalFragment[]) => void) {
    const subscription = supabase
      .channel('signal-fragments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signal_fragments'
        },
        async () => {
          // Refresh fragments list when there's any change
          const fragments = await this.getActiveFragments();
          callback(fragments);
        }
      )
      .subscribe();

    return subscription;
  }
};

// Authentication API functions
export const authAPI = {
  // Sign up with email/password
  async signUp(email: string, password: string, username: string, displayName?: string) {
    // Check if username is already taken
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      throw new Error('Username already taken');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username
        }
      }
    });

    if (error) throw error;
    
    if (data.user) {
      // Create user profile
      await this.createUserProfile(data.user.id, username, displayName);
    }
    
    return data;
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    
    if (data.user) {
      // Update last seen
      await this.updateUserPresence(data.user.id, true);
    }
    
    return data;
  },

  // Sign in with OAuth (GitHub, Google)
  async signInWithOAuth(provider: 'github' | 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await this.updateUserPresence(user.id, false);
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Create user profile
  async createUserProfile(userId: string, username: string, displayName?: string) {
    const profileData = {
      user_id: userId,
      username,
      display_name: displayName || username,
      total_fragments: 0,
      rare_fragments: 0,
      joined_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_online: true
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user presence
  async updateUserPresence(userId: string, isOnline: boolean) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user presence:', error);
    }
  },

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database setup SQL (run this in your Supabase SQL editor)
export const setupSQL = `
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_fragments INTEGER DEFAULT 0,
  rare_fragments INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table (updated with user_id)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'join', 'leave', 'system')),
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_users table (updated with user_id)
CREATE TABLE IF NOT EXISTS chat_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create signal_fragments table (updated with user_id)
CREATE TABLE IF NOT EXISTS signal_fragments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragment_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'lore' CHECK (content_type IN ('lore', 'puzzle', 'flavor', 'personalized')),
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'encrypted', 'corrupted')),
  available BOOLEAN DEFAULT true,
  claimed_by TEXT,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fragment_pickups table for logging (updated with user_id)
CREATE TABLE IF NOT EXISTS fragment_pickups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragment_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  rarity TEXT NOT NULL,
  picked_up_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_pickups ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Chat message policies (public access for now)
CREATE POLICY "Anyone can read messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Chat user policies  
CREATE POLICY "Anyone can read users" ON chat_users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON chat_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON chat_users FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete users" ON chat_users FOR DELETE USING (true);

-- Signal fragment policies
CREATE POLICY "Anyone can read fragments" ON signal_fragments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert fragments" ON signal_fragments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update fragments" ON signal_fragments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete fragments" ON signal_fragments FOR DELETE USING (true);

-- Fragment pickup policies
CREATE POLICY "Anyone can read pickups" ON fragment_pickups FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pickups" ON fragment_pickups FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_online ON user_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_username ON chat_users(username);
CREATE INDEX IF NOT EXISTS idx_chat_users_status ON chat_users(status);
CREATE INDEX IF NOT EXISTS idx_chat_users_user_id ON chat_users(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_fragments_fragment_id ON signal_fragments(fragment_id);
CREATE INDEX IF NOT EXISTS idx_signal_fragments_available ON signal_fragments(available);
CREATE INDEX IF NOT EXISTS idx_signal_fragments_expires_at ON signal_fragments(expires_at);
CREATE INDEX IF NOT EXISTS idx_signal_fragments_claimed_by_user_id ON signal_fragments(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_fragment_pickups_username ON fragment_pickups(username);
CREATE INDEX IF NOT EXISTS idx_fragment_pickups_user_id ON fragment_pickups(user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_users;
ALTER PUBLICATION supabase_realtime ADD TABLE signal_fragments;
ALTER PUBLICATION supabase_realtime ADD TABLE fragment_pickups;
`;