import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './auth/UserMenu';
import UserProfile from './auth/UserProfile';

const Navigation: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="text-green-400 font-mono text-xl tracking-wider">
            &gt;&gt; SCROLLSPACE.DEV
          </div>
          <div className="text-cyan-400 font-mono text-xs opacity-80">
            v3.1.4
          </div>
        </motion.div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 font-mono text-sm">
          <a 
            href="/" 
            className="text-green-300 hover:text-green-400 transition-colors border-b border-transparent hover:border-green-400"
          >
            [HOME]
          </a>
          <a 
            href="/chat" 
            className="text-green-300 hover:text-green-400 transition-colors border-b border-transparent hover:border-green-400"
          >
            [NEURAL_NET]
          </a>
          <a 
            href="/park" 
            className="text-green-300 hover:text-green-400 transition-colors border-b border-transparent hover:border-green-400"
          >
            [DATA_PARK]
          </a>
          {user && (
            <a 
              href="/admin" 
              className="text-green-300 hover:text-green-400 transition-colors border-b border-transparent hover:border-green-400"
            >
              [ADMIN]
            </a>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-mono text-xs">
                CONNECTING...
              </span>
            </div>
          ) : user ? (
            <UserMenu onOpenProfile={() => setShowProfile(true)} />
          ) : (
            <div className="flex items-center space-x-2">
              <motion.a
                href="/auth/login"
                className="bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono px-3 py-1 text-sm transition-all duration-200"
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
                [JACK_IN]
              </motion.a>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mt-3 flex items-center justify-center space-x-4 font-mono text-xs">
        <a 
          href="/" 
          className="text-green-300 hover:text-green-400 transition-colors"
        >
          HOME
        </a>
        <span className="text-green-400">|</span>
        <a 
          href="/chat" 
          className="text-green-300 hover:text-green-400 transition-colors"
        >
          CHAT
        </a>
        <span className="text-green-400">|</span>
        <a 
          href="/park" 
          className="text-green-300 hover:text-green-400 transition-colors"
        >
          PARK
        </a>
        {user && (
          <>
            <span className="text-green-400">|</span>
            <a 
              href="/admin" 
              className="text-green-300 hover:text-green-400 transition-colors"
            >
              ADMIN
            </a>
          </>
        )}
      </div>

      {/* Connection Status */}
      <div className="mt-2 text-center">
        <div className="text-xs font-mono text-green-400/60">
          {user ? (
            <span>
              NEURAL_LINK: ESTABLISHED | USER: {profile?.username || 'UNKNOWN'} | STATUS: {profile?.status?.toUpperCase() || 'OFFLINE'}
            </span>
          ) : (
            <span>
              NEURAL_LINK: DISCONNECTED | GUEST_MODE_ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};

export default Navigation;