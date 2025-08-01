import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authAPI, type UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Emergency loading fix - force loading to false after mount
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('EMERGENCY: Forcing loading to false after 1 second');
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(emergencyTimeout);
  }, []);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('AUTH TIMEOUT: 5 seconds reached, forcing loading to false');
      console.log('Current state - User:', user, 'Profile:', profile);
      setLoading(false);
    }, 3000); // 3 seconds max

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const currentUser = await authAPI.getCurrentUser();
        console.log('Current user from initial session:', currentUser);
        setUser(currentUser);
        
        if (currentUser) {
          console.log('Fetching initial profile for user:', currentUser.id);
          const userProfile = await authAPI.getUserProfile(currentUser.id);
          console.log('Initial profile result:', userProfile);
          setProfile(userProfile);
          
          // Update presence
          await authAPI.updateUserPresence(currentUser.id, true);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = authAPI.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        console.log('User found, setting user state');
        setUser(session.user);
        
        // Get or create user profile with timeout
        console.log('Fetching user profile for:', session.user.id);
        
        try {
          let userProfile = await Promise.race([
            authAPI.getUserProfile(session.user.id),
            new Promise((resolve) => setTimeout(() => resolve(null), 3000)) // 3 second timeout
          ]);
          
          console.log('User profile result:', userProfile);
          
          // If no profile exists (new user), create one
          if (!userProfile) {
            console.log('No profile found, creating new profile');
            try {
              const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user';
              const displayName = session.user.user_metadata?.display_name;
              console.log('Creating profile with username:', username, 'displayName:', displayName);
              
              userProfile = await Promise.race([
                authAPI.createUserProfile(session.user.id, username, displayName),
                new Promise((resolve) => setTimeout(() => resolve(null), 3000)) // 3 second timeout
              ]);
              
              console.log('Profile created:', userProfile);
            } catch (error) {
              console.error('Error creating user profile:', error);
            }
          }
          
          console.log('Setting profile state:', userProfile);
          setProfile(userProfile);
          
        } catch (error) {
          console.error('Profile operations failed:', error);
          setProfile(null);
        }
      } else {
        console.log('No session, clearing user state');
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      
      // Update presence on unmount
      if (user) {
        authAPI.updateUserPresence(user.id, false);
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user) {
        authAPI.updateUserPresence(user.id, !document.hidden);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authAPI.signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    setLoading(true);
    try {
      await authAPI.signUp(email, password, username, displayName);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };


  const signOut = async () => {
    try {
      await authAPI.signOut();
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await authAPI.updateUserProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error) {
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const userProfile = await authAPI.getUserProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;