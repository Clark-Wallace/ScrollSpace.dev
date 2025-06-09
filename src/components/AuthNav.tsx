import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import AuthForm from './AuthForm';
import UserProfile from './UserProfile';

interface AuthNavProps {
  className?: string;
}

const AuthNav: React.FC<AuthNavProps> = ({ className = '' }) => {
  const { user, profile, loading } = useAuth();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthForm(true);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 border border-green-400 rounded-full animate-spin border-t-transparent"></div>
        <span className="text-xs font-mono text-green-400">LOADING...</span>
      </div>
    );
  }

  if (user && profile) {
    return (
      <>
        <div className={`flex items-center space-x-3 ${className}`}>
          {/* User Stats */}
          <div className="hidden md:flex items-center space-x-4 text-xs font-mono text-green-400">
            <div className="flex items-center space-x-1">
              <span className="text-green-400/60">FRAGMENTS:</span>
              <span className="text-green-400">{profile.total_fragments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-purple-400/60">RARE:</span>
              <span className="text-purple-400">{profile.rare_fragments}</span>
            </div>
          </div>

          {/* User Button */}
          <motion.button
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-2 bg-black/80 hover:bg-green-900/30 border border-green-400 text-green-400 px-3 py-2 font-mono text-sm transition-all"
            style={{ 
              borderStyle: 'outset',
              boxShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
            }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 0 15px rgba(0, 255, 65, 0.6)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-black font-bold text-xs">
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{profile.display_name || profile.username}</span>
            <div className={`w-2 h-2 rounded-full ml-1 ${profile.is_online ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          </motion.button>
        </div>

        <UserProfile 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
        />
      </>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.a
        href="/chat"
        className="bg-green-600 hover:bg-green-500 text-black px-4 py-2 font-mono text-sm font-bold transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        ENTER_MATRIX
      </motion.a>
    </div>
  );
};

export default AuthNav;