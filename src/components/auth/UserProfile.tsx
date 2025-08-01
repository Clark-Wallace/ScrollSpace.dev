import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, type Profile } from '../../contexts/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-black/90 backdrop-blur-sm border border-green-400 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          style={{ 
            boxShadow: '0 0 30px rgba(0, 255, 65, 0.6), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
            fontFamily: 'Courier New, monospace'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Terminal Header */}
          <div className="bg-black border-b border-green-400 p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-mono text-green-400 tracking-wider">
                  [NEURAL_PROFILE] {profile?.username}@matrix.local
                </span>
              </div>
              <motion.button
                onClick={onClose}
                className="text-red-400 hover:text-red-300 font-mono text-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                [CLOSE]
              </motion.button>
            </div>
          </div>

          <div className="p-6 relative overflow-y-auto flex-1">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)'
            }}></div>

            <div className="relative z-10">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-16 h-16 rounded border border-green-400 object-cover"
                      style={{ filter: 'brightness(0.8) contrast(1.2) hue-rotate(90deg)' }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-black border border-green-400 flex items-center justify-center">
                      <span className="text-green-400 font-mono text-xl">
                        {profile?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
                    profile?.status === 'online' ? 'bg-green-400' :
                    profile?.status === 'away' ? 'bg-yellow-400' :
                    profile?.status === 'busy' ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-mono text-green-400 tracking-wider">
                    {profile?.display_name || profile?.username}
                  </h2>
                  <div className="text-sm font-mono text-cyan-400">
                    @{profile?.username}
                  </div>
                  <div className="text-xs font-mono text-green-300 opacity-80">
                    Neural link established: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>

                <motion.button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono px-3 py-1 text-xs"
                  style={{ 
                    borderStyle: 'outset',
                    boxShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 0 15px rgba(0, 255, 65, 0.6)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEditing ? '[CANCEL]' : '[EDIT]'}
                </motion.button>
              </div>

              {isEditing ? (
                /* Edit Form */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-mono text-green-400 mb-1 block tracking-wider">
                      &gt; DISPLAY_NAME:
                    </label>
                    <input
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none"
                      style={{ 
                        borderStyle: 'inset',
                        boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                      }}
                      placeholder="Your display name"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-green-400 mb-1 block tracking-wider">
                      &gt; BIO_DATA:
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none resize-none"
                      style={{ 
                        borderStyle: 'inset',
                        boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                      }}
                      placeholder="Tell the matrix about yourself..."
                      rows={3}
                      maxLength={200}
                    />
                    <div className="text-xs text-green-300/60 font-mono mt-1">
                      {editForm.bio.length}/200 characters
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-green-400 mb-1 block tracking-wider">
                      &gt; AVATAR_URL:
                    </label>
                    <input
                      type="url"
                      value={editForm.avatar_url}
                      onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                      className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none"
                      style={{ 
                        borderStyle: 'inset',
                        boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                      }}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="flex-1 bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-2 text-sm disabled:opacity-50"
                      style={{ 
                        borderStyle: 'outset',
                        boxShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
                      }}
                      whileHover={{ 
                        scale: isUpdating ? 1 : 1.02,
                        boxShadow: '0 0 15px rgba(0, 255, 65, 0.6)'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isUpdating ? '[UPDATING...]' : '[SAVE_CHANGES]'}
                    </motion.button>
                    
                    <motion.button
                      onClick={handleCancel}
                      className="flex-1 bg-black hover:bg-red-900/30 border border-red-400 text-red-400 font-mono py-2 text-sm"
                      style={{ 
                        borderStyle: 'outset',
                        boxShadow: '0 0 5px rgba(255, 0, 0, 0.3)'
                      }}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      [DISCARD]
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  {/* Bio */}
                  <div>
                    <div className="text-xs font-mono text-green-400 mb-2 tracking-wider">
                      [BIO_DATA]
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 min-h-[60px]">
                      <p className="text-sm font-mono text-green-300 leading-relaxed">
                        {profile?.bio || 'No bio data available. User prefers to remain mysterious in the matrix.'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/50 border border-green-400/30 p-3">
                      <div className="text-xs font-mono text-green-400 mb-1">TRANSMISSIONS</div>
                      <div className="text-lg font-mono text-cyan-400">{profile?.total_messages || 0}</div>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3">
                      <div className="text-xs font-mono text-green-400 mb-1">FRAGMENTS</div>
                      <div className="text-lg font-mono text-cyan-400">{profile?.fragments_collected || 0}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="text-xs font-mono text-green-400 mb-2 tracking-wider">
                      [NEURAL_STATUS]
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          profile?.status === 'online' ? 'bg-green-400' :
                          profile?.status === 'away' ? 'bg-yellow-400' :
                          profile?.status === 'busy' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm font-mono text-green-300">
                          {profile?.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-green-300/60 mt-1">
                        Last seen: {profile?.last_seen ? new Date(profile.last_seen).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div className="mt-6 pt-4 border-t border-green-400/30">
                <div className="text-xs font-mono text-green-400 mb-2 tracking-wider">
                  [ACCOUNT_DATA]
                </div>
                <div className="space-y-1 text-xs font-mono text-green-300/80">
                  <div>User ID: {user?.id}</div>
                  <div>Email: {user?.email}</div>
                  <div>Account created: {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'Unknown'}</div>
                  <div>Profile updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : 'Never'}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfile;