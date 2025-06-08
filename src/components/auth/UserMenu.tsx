import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface UserMenuProps {
  onOpenProfile: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onOpenProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut, updateUserStatus } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (status: 'online' | 'away' | 'busy') => {
    try {
      await updateUserStatus(status);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'busy': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'ONLINE';
      case 'away': return 'AWAY';
      case 'busy': return 'BUSY';
      default: return 'OFFLINE';
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar/Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-black border border-green-400 px-3 py-1 text-sm font-mono text-green-400 hover:bg-green-900/20 transition-colors relative"
        style={{ 
          borderStyle: 'outset',
          boxShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
        }}
        whileHover={{ 
          scale: 1.02,
          boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-6 h-6 rounded border border-green-400 object-cover"
              style={{ filter: 'brightness(0.8) contrast(1.2) hue-rotate(90deg)' }}
            />
          ) : (
            <div className="w-6 h-6 bg-black border border-green-400 flex items-center justify-center">
              <span className="text-green-400 font-mono text-xs">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${getStatusColor(profile.status)}`}></div>
        </div>
        <span className="hidden md:inline">{profile.display_name || profile.username}</span>
        <span className="text-xs">▼</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-64 bg-black/90 backdrop-blur-sm border border-green-400 shadow-2xl z-50"
            style={{ 
              boxShadow: '0 0 20px rgba(0, 255, 65, 0.4), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            {/* Menu Header */}
            <div className="bg-black border-b border-green-400 p-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-8 h-8 rounded border border-green-400 object-cover"
                        style={{ filter: 'brightness(0.8) contrast(1.2) hue-rotate(90deg)' }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-black border border-green-400 flex items-center justify-center">
                        <span className="text-green-400 font-mono text-sm">
                          {profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${getStatusColor(profile.status)}`}></div>
                  </div>
                  <div>
                    <div className="text-sm font-mono text-green-400">
                      {profile.display_name || profile.username}
                    </div>
                    <div className="text-xs font-mono text-cyan-400">
                      @{profile.username}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Profile */}
              <motion.button
                onClick={() => {
                  onOpenProfile();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-mono text-green-300 hover:bg-green-900/20 hover:text-green-400 transition-colors flex items-center space-x-2"
                whileHover={{ x: 2 }}
              >
                <span>👤</span>
                <span>[VIEW_PROFILE]</span>
              </motion.button>

              {/* Status Section */}
              <div className="px-4 py-2 border-t border-green-400/30 mt-2">
                <div className="text-xs font-mono text-green-400 mb-2">
                  [NEURAL_STATUS: {getStatusLabel(profile.status)}]
                </div>
                <div className="space-y-1">
                  {['online', 'away', 'busy'].map((status) => (
                    <motion.button
                      key={status}
                      onClick={() => handleStatusChange(status as any)}
                      className={`w-full text-left px-2 py-1 text-xs font-mono transition-colors flex items-center space-x-2 rounded ${
                        profile.status === status 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'text-green-300 hover:bg-green-900/10 hover:text-green-400'
                      }`}
                      whileHover={{ x: 2 }}
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                      <span>{status.toUpperCase()}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="px-4 py-2 border-t border-green-400/30 mt-2">
                <div className="text-xs font-mono text-green-400 mb-2">
                  [MATRIX_STATS]
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="text-green-300">
                    <div>Messages:</div>
                    <div className="text-cyan-400">{profile.total_messages}</div>
                  </div>
                  <div className="text-green-300">
                    <div>Fragments:</div>
                    <div className="text-cyan-400">{profile.fragments_collected}</div>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="border-t border-green-400/30 mt-2">
                <motion.button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm font-mono text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors flex items-center space-x-2"
                  whileHover={{ x: 2 }}
                >
                  <span>🔌</span>
                  <span>[DISCONNECT]</span>
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black border-t border-green-400 p-2">
              <div className="text-xs font-mono text-green-400/60 text-center">
                Neural link secured • End-to-end encrypted
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;