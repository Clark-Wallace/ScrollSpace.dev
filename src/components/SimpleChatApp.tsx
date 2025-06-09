import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SimpleAuth from './SimpleAuth';
import SimpleEmailAuth from './SimpleEmailAuth';
import SimpleChatRoom from './SimpleChatRoom';
import { supabase } from '../lib/supabase';

const SimpleChatApp: React.FC = () => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [isInChat, setIsInChat] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'account' | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log('SimpleChatApp mounted, checking session...');
      
      // Check for authenticated user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Found authenticated user:', user.id);
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          console.log('Found user profile:', profile.username);
          setUsername(profile.username);
          setUserId(user.id);
          setIsInChat(true);
          setLoading(false);
          return;
        }
      }
      
      // Fall back to guest mode check
      const savedUsername = localStorage.getItem('scrollspace_username');
      console.log('Saved guest username:', savedUsername);
      if (savedUsername) {
        setUsername(savedUsername);
        setIsInChat(true);
      }
      
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleGuestJoin = (newUsername: string) => {
    console.log('Joining as guest with username:', newUsername);
    setUsername(newUsername);
    setIsInChat(true);
  };

  const handleAuthSuccess = (newUsername: string, newUserId: string) => {
    console.log('Auth successful:', newUsername, newUserId);
    setUsername(newUsername);
    setUserId(newUserId);
    setIsInChat(true);
  };

  const handleLeave = async () => {
    console.log('Leaving chat...');
    
    if (userId) {
      // Authenticated user - sign out
      await supabase.auth.signOut();
      setUserId('');
    } else {
      // Guest user - clear localStorage
      localStorage.removeItem('scrollspace_username');
    }
    
    setUsername('');
    setIsInChat(false);
    setAuthMode(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
        <div className="text-green-400 font-mono">
          <div className="w-6 h-6 border border-green-400 rounded-full animate-spin border-t-transparent mx-auto mb-2"></div>
          INITIALIZING NEURAL LINK...
        </div>
      </div>
    );
  }

  console.log('SimpleChatApp render - isInChat:', isInChat, 'username:', username, 'authMode:', authMode);

  if (!isInChat) {
    if (!authMode) {
      // Show auth mode selection
      return (
        <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-black/90 backdrop-blur-sm border border-green-400 shadow-2xl w-full max-w-md"
            style={{ 
              boxShadow: '0 0 30px rgba(0, 255, 65, 0.4)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            <div className="bg-black border-b border-green-400 p-3">
              <div className="text-xs font-mono text-green-400 tracking-wider text-center">
                [MATRIX_ACCESS] SELECT_ENTRY_MODE
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-green-400 text-sm font-mono mb-6 text-center">
                &gt;&gt; CHOOSE ACCESS METHOD &lt;&lt;
              </div>
              
              <motion.button
                onClick={() => setAuthMode('account')}
                className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-3 text-sm transition-all"
                style={{ 
                  borderStyle: 'outset',
                  boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                &gt;&gt; AUTHENTICATED_ACCESS
              </motion.button>
              
              <motion.button
                onClick={() => setAuthMode('guest')}
                className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-3 text-sm transition-all"
                style={{ 
                  borderStyle: 'outset',
                  boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                &gt;&gt; GUEST_ACCESS
              </motion.button>
              
              <div className="text-xs font-mono text-green-400/60 text-center mt-4">
                [INFO] Authenticated users get persistent profiles and fragments
              </div>
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (authMode === 'guest') {
      return <SimpleAuth onJoin={handleGuestJoin} />;
    }
    
    if (authMode === 'account') {
      return <SimpleEmailAuth onAuthSuccess={handleAuthSuccess} />;
    }
  }

  return (
    <SimpleChatRoom 
      username={username} 
      onLeave={handleLeave}
      isAuthenticated={!!userId}
      userId={userId}
    />
  );
};

export default SimpleChatApp;