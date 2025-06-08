import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types
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

export interface UserPreferences {
  user_id: string;
  theme: 'cyberpunk' | 'matrix' | 'neon' | 'terminal';
  notifications_enabled: boolean;
  sound_enabled: boolean;
  auto_away_minutes: number;
  show_typing_indicator: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  // Auth state
  user: User | null;
  profile: Profile | null;
  preferences: UserPreferences | null;
  session: Session | null;
  loading: boolean;
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>;
  
  // Profile actions
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Status management
  updateUserStatus: (status: Profile['status']) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setPreferences(null);
          setLoading(false);
        }
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setPreferences(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Load preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError;
      }

      setProfile(profileData);
      setPreferences(preferencesData);
      
      // Update last seen
      if (profileData) {
        await updateLastSeen(userId);
      }
      
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const updateLastSeen = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ 
          last_seen: new Date().toISOString(),
          status: 'online'
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
    } catch (error: any) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      setLoading(true);

      // Check if username is available
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        throw new Error('Username already taken');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          }
        }
      });

      if (error) throw error;
      
    } catch (error: any) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      
      // Update status to offline before signing out
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ status: 'offline' })
          .eq('id', user.id);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
    } catch (error: any) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  const signInWithOAuth = async (provider: 'github' | 'google') => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (error) throw error;
      
    } catch (error: any) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user?.id) throw new Error('No authenticated user');
      
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      
    } catch (error: any) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      if (!user?.id) throw new Error('No authenticated user');
      
      setError(null);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setPreferences(data);
      
    } catch (error: any) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  const updateUserStatus = async (status: Profile['status']) => {
    try {
      if (!user?.id) throw new Error('No authenticated user');
      
      await updateProfile({ status });
      
    } catch (error: any) {
      console.error('Error updating user status:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getErrorMessage = (error: AuthError | Error): string => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password';
      case 'User already registered':
        return 'Account already exists';
      case 'Username already taken':
        return 'Username already taken';
      case 'Email not confirmed':
        return 'Please confirm your email address';
      default:
        return error.message || 'An unexpected error occurred';
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    preferences,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    updateProfile,
    updatePreferences,
    updateUserStatus,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;