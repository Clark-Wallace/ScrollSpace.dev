import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SimpleAuthProps {
  onJoin: (username: string) => void;
}

const SimpleAuth: React.FC<SimpleAuthProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || loading) return;

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 2) {
      alert('Username must be at least 2 characters (letters, numbers, underscore only)');
      return;
    }

    setLoading(true);
    
    // Store username in localStorage for persistence
    localStorage.setItem('scrollspace_username', cleanUsername);
    
    onJoin(cleanUsername);
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-black/90 backdrop-blur-sm border border-green-400 shadow-2xl w-full max-w-md"
        style={{ 
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.4), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
          fontFamily: 'Courier New, monospace'
        }}
      >
        {/* Terminal Header */}
        <div className="bg-black border-b border-green-400 p-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
          <div className="flex items-center space-x-2 relative z-10">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xs font-mono text-green-400 tracking-wider">
              [MATRIX_ACCESS] NEURAL_LINK_PROTOCOL
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 relative">
          {/* Scanlines Effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)'
          }}></div>

          <div className="relative z-10">
            <div className="text-green-400 text-sm font-mono mb-4 text-center">
              &gt;&gt; ENTER_THE_MATRIX &lt;&lt;
            </div>
            
            <p className="text-green-300 font-mono text-xs mb-6 text-center leading-relaxed">
              Welcome to ScrollSpace, choom. Choose your handle and jack into the neural network.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-green-400 mb-2 tracking-wider">
                  NEURAL_ID:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono text-sm focus:border-green-300 focus:outline-none"
                  style={{ 
                    borderStyle: 'inset',
                    boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                  }}
                  placeholder="your_handle_here"
                  required
                  disabled={loading}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                />
                <div className="text-xs font-mono text-green-400/60 mt-1">
                  Letters, numbers, underscore only. 2-20 chars.
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-3 text-sm transition-all disabled:opacity-50"
                style={{ 
                  borderStyle: 'outset',
                  boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
                }}
                whileHover={{ 
                  scale: loading ? 1 : 1.02,
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  '>> ESTABLISHING_CONNECTION...'
                ) : (
                  '>> JACK_INTO_MATRIX'
                )}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <div className="text-xs font-mono text-green-400/60">
                [STATUS] No registration required. Choose any available handle.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleAuth;