import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null
      });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setEditing(false);
    setError(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !user || !profile) return null;

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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-black/90 backdrop-blur-sm border border-green-400 shadow-2xl w-full max-w-lg relative"
          style={{ 
            boxShadow: '0 0 30px rgba(0, 255, 65, 0.4), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
            fontFamily: 'Courier New, monospace'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Terminal Header */}
          <div className="bg-black border-b border-green-400 p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-mono text-green-400 tracking-wider">
                  [USER_PROFILE] {profile.username}@scrollspace.matrix
                </span>
              </div>
              <button 
                onClick={onClose}
                className="text-green-400 hover:text-green-300 text-lg font-mono"
              >
                ×
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 relative max-h-96 overflow-y-auto">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)'
            }}></div>

            <div className="relative z-10 space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center text-black font-mono font-bold text-xl">
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-mono text-green-400 font-bold">
                  {profile.display_name || profile.username}
                </h2>
                <p className="text-sm font-mono text-green-400/80">
                  @{profile.username}
                </p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${profile.is_online ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span className="text-xs font-mono text-green-400/60">
                    {profile.is_online ? 'ONLINE' : `LAST_SEEN: ${formatDate(profile.last_seen)}`}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-green-400/30 p-3 text-center">
                  <div className="text-lg font-mono font-bold text-green-400">{profile.total_fragments}</div>
                  <div className="text-xs font-mono text-green-400/60">FRAGMENTS</div>
                </div>
                <div className="bg-gray-900/50 border border-green-400/30 p-3 text-center">
                  <div className="text-lg font-mono font-bold text-purple-400">{profile.rare_fragments}</div>
                  <div className="text-xs font-mono text-green-400/60">RARE+</div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="space-y-4">
                {editing ? (
                  <>
                    {/* Edit Mode */}
                    <div>
                      <label className="block text-xs font-mono text-green-400 mb-1 tracking-wider">
                        DISPLAY_NAME:
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono text-sm focus:border-green-300 focus:outline-none"
                        style={{ 
                          borderStyle: 'inset',
                          boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                        }}
                        placeholder="Your display name"
                        maxLength={50}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-green-400 mb-1 tracking-wider">
                        BIO:
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono text-sm focus:border-green-300 focus:outline-none resize-none"
                        style={{ 
                          borderStyle: 'inset',
                          boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                        }}
                        placeholder="Tell the matrix about yourself..."
                        rows={3}
                        maxLength={200}
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <div className="text-red-400 text-xs font-mono text-center border border-red-400 p-2 bg-red-900/20">
                        [ERROR] {error}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-black font-mono py-2 text-sm transition-all disabled:opacity-50"
                      >
                        {loading ? 'SAVING...' : 'SAVE_CHANGES'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 bg-black hover:bg-gray-800 border border-green-400 text-green-400 font-mono py-2 text-sm transition-all"
                      >
                        CANCEL
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div>
                      <div className="text-xs font-mono text-green-400 mb-1 tracking-wider">BIO:</div>
                      <div className="bg-gray-900/50 border border-green-400/30 p-3 min-h-16">
                        <p className="text-sm font-mono text-green-300">
                          {profile.bio || 'No bio set. A mysterious figure in the matrix...'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-mono text-green-400 mb-2 tracking-wider">MATRIX_DATA:</div>
                      <div className="bg-gray-900/50 border border-green-400/30 p-3 space-y-2 text-xs font-mono text-green-400/80">
                        <div>EMAIL: {user.email}</div>
                        <div>JOINED: {formatDate(profile.joined_at)}</div>
                        <div>USER_ID: {user.id.substring(0, 8)}...</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditing(true)}
                      className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-2 text-sm transition-all"
                      style={{ 
                        borderStyle: 'outset',
                        boxShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
                      }}
                    >
                      EDIT_PROFILE
                    </button>
                  </>
                )}
              </div>

              {/* Danger Zone */}
              <div className="border-t border-red-400/30 pt-4">
                <div className="text-xs font-mono text-red-400 mb-2 tracking-wider">DANGER_ZONE:</div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-black hover:bg-red-900/30 border border-red-400 text-red-400 font-mono py-2 text-sm transition-all"
                  style={{ 
                    borderStyle: 'outset',
                    boxShadow: '0 0 5px rgba(255, 0, 0, 0.3)'
                  }}
                >
                  DISCONNECT_FROM_MATRIX
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfile;