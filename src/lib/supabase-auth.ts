import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Enhanced Database types with auth support
export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
  user_id?: string;
  user_profile?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
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

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  total_messages: number;
  fragments_collected: number;
  created_at: string;
  updated_at: string;
}

export interface SignalFragment {
  id: string;
  fragment_id: string;
  content: string;
  content_type: 'lore' | 'puzzle' | 'flavor' | 'personalized';
  rarity: 'common' | 'rare' | 'encrypted' | 'corrupted';
  available: boolean;
  claimed_by?: string;
  claimed_by_id?: string;
  claimed_at?: string;
  expires_at: string;
  created_at?: string;
}

export interface FragmentPickup {
  id: string;
  fragment_id: string;
  username: string;
  user_id?: string;
  picked_up_at: string;
}

// Connection message throttling for auth chat
const authConnectionMessageThrottle = new Map<string, number>();
const AUTH_CONNECTION_MESSAGE_COOLDOWN = 30000; // 30 seconds

function shouldSendAuthConnectionMessage(username: string, type: 'join' | 'leave'): boolean {
  const key = `${username}_${type}`;
  const now = Date.now();
  const lastSent = authConnectionMessageThrottle.get(key);
  
  if (!lastSent || now - lastSent > AUTH_CONNECTION_MESSAGE_COOLDOWN) {
    authConnectionMessageThrottle.set(key, now);
    return true;
  }
  
  return false;
}

// Enhanced Auth-aware Chat API
export const authChatAPI = {
  // Send a message (auth-aware)
  async sendMessage(message: string, type: 'message' | 'join' | 'leave' | 'system' = 'message') {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile for message metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const messageData = {
      username: profile.username,
      message,
      type,
      timestamp: new Date().toISOString(),
      user_id: user.id,
      user_profile: {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url
      }
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

  // Join chat (auth-aware)
  async joinChat() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Update user status to online
    await supabase
      .from('profiles')
      .update({ 
        status: 'online',
        last_seen: new Date().toISOString() 
      })
      .eq('id', user.id);

    // Send join message (throttled)
    if (shouldSendAuthConnectionMessage(profile.username, 'join')) {
      await this.sendMessage(`${profile.username} has entered the chat`, 'join');
    }

    return profile;
  },

  // Leave chat (auth-aware)
  async leaveChat() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profile) {
      // Update status to offline
      await supabase
        .from('profiles')
        .update({ status: 'offline' })
        .eq('id', user.id);

      // Send leave message (throttled)
      if (shouldSendAuthConnectionMessage(profile.username, 'leave')) {
        await this.sendMessage(`${profile.username} has left the chat`, 'leave');
      }
    }
  },

  // Get online users (from profiles)
  async getOnlineUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('status', ['online', 'away', 'busy'])
      .order('last_seen', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  },

  // Update heartbeat
  async updateHeartbeat() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);
  },

  // Update user status
  async updateUserStatus(status: 'online' | 'away' | 'busy') {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({ 
        status, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Subscribe to user presence changes
  subscribeToUsers(callback: (users: Profile[]) => void) {
    const subscription = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
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

  // Clean up inactive users
  async cleanupInactiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Get users to be marked as offline
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select('username')
      .lt('last_seen', fiveMinutesAgo)
      .neq('status', 'offline');

    // Update inactive users to offline
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'offline' })
      .lt('last_seen', fiveMinutesAgo)
      .neq('status', 'offline');

    if (error) {
      console.error('Error cleaning up inactive users:', error);
    }

    return inactiveUsers || [];
  }
};

// Enhanced Fragment API with auth
export const authFragmentAPI = {
  // Drop a fragment (admin/system only)
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

    return data;
  },

  // Get active fragments
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

  // Pickup fragment (auth-aware)
  async pickupFragment(fragmentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

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
        claimed_by: profile.username,
        claimed_by_id: user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('fragment_id', fragmentId)
      .eq('available', true)
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
        username: profile.username,
        user_id: user.id,
        picked_up_at: new Date().toISOString()
      }]);

    return updatedFragment;
  },

  // Get user's fragments
  async getUserFragments(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      throw new Error('User ID required');
    }

    const { data, error } = await supabase
      .from('signal_fragments')
      .select('*')
      .eq('claimed_by_id', targetUserId)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching user fragments:', error);
      return [];
    }

    return data || [];
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
  },

  // Clean up expired fragments
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
  }
};

// Profile API
export const profileAPI = {
  // Get profile by ID or username
  async getProfile(identifier: string, byUsername = false) {
    const column = byUsername ? 'username' : 'id';
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq(column, identifier)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  // Update profile
  async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  },

  // Get user statistics
  async getUserStats(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_messages, fragments_collected, created_at')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    // Get additional stats
    const { count: messageCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: fragmentCount } = await supabase
      .from('signal_fragments')
      .select('*', { count: 'exact', head: true })
      .eq('claimed_by_id', userId);

    return {
      ...profile,
      total_messages: messageCount || profile.total_messages,
      fragments_collected: fragmentCount || profile.fragments_collected
    };
  }
};

// Backward compatibility exports
export const chatAPI = authChatAPI;