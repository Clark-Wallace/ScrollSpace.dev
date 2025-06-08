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
  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthForm(true);
  };

  const handleBypassSubmit = () => {
    if (bypassCode.toLowerCase() === 'swai') {
      // Create a temporary bypass session
      localStorage.setItem('bypass_session', 'true');
      localStorage.setItem('bypass_username', 'Guest_' + Math.floor(Math.random() * 1000));
      setShowBypass(false);
      // Refresh the page to activate bypass
      window.location.reload();
    } else {
      alert('INVALID_BYPASS_CODE');
    }
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
    <>
      <div className={`flex flex-col space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => openAuth('login')}
            className="bg-black hover:bg-green-900/30 border border-green-400 text-green-400 px-4 py-2 font-mono text-sm transition-all"
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
            NEURAL_LINK
          </motion.button>

          <motion.button
            onClick={() => openAuth('register')}
            className="bg-green-600 hover:bg-green-500 text-black px-4 py-2 font-mono text-sm font-bold transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            JOIN_MATRIX
          </motion.button>
        </div>
        
        <motion.button
          onClick={() => setShowBypass(true)}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-500 text-gray-400 px-3 py-1 font-mono text-xs transition-all w-full"
          style={{ 
            borderStyle: 'inset',
            boxShadow: 'inset 0 0 5px rgba(128, 128, 128, 0.3)'
          }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: 'inset 0 0 10px rgba(128, 128, 128, 0.5)'
          }}
          whileTap={{ scale: 0.98 }}
        >
          BYPASS_CODE
        </motion.button>
      </div>

      <AuthForm 
        isOpen={showAuthForm} 
        onClose={() => setShowAuthForm(false)}
        initialMode={authMode}
      />

      {/* Bypass Code Modal */}
      <AnimatePresence>
        {showBypass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowBypass(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black border border-gray-500 p-6 max-w-md w-full mx-4"
              style={{ 
                boxShadow: '0 0 20px rgba(128, 128, 128, 0.3), inset 1px 1px 0px rgba(128, 128, 128, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
                fontFamily: 'Courier New, monospace'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-gray-400 text-sm font-mono mb-4">
                  &gt;&gt; BYPASS_CODE_REQUIRED &lt;&lt;
                </div>
                <p className="text-gray-300 font-mono text-sm mb-6">
                  Enter authorized bypass code to access system without authentication.
                </p>
                
                <input
                  type="text"
                  value={bypassCode}
                  onChange={(e) => setBypassCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBypassSubmit()}
                  className="w-full bg-black border border-gray-500 text-gray-300 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none mb-4"
                  style={{ 
                    borderStyle: 'inset',
                    boxShadow: 'inset 0 0 10px rgba(128, 128, 128, 0.2)'
                  }}
                  placeholder="enter_bypass_code..."
                  maxLength={20}
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleBypassSubmit}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-mono font-bold py-2 text-sm transition-all"
                  >
                    EXECUTE
                  </button>
                  <button
                    onClick={() => setShowBypass(false)}
                    className="flex-1 bg-black hover:bg-gray-900 border border-gray-500 text-gray-400 font-mono py-2 text-sm transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AuthNav;