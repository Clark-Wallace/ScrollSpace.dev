import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface AuthFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        await signUp(email, password, username.trim(), displayName.trim() || undefined);
      }
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setDisplayName('');
    setError(null);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-black/90 backdrop-blur-sm border border-green-400 shadow-2xl w-full max-w-md relative"
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
                  [AUTH_PROTOCOL] {mode === 'login' ? 'NEURAL_LINK' : 'IDENTITY_FORGE'}
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

          {/* Form Content */}
          <div className="p-6 relative">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)'
            }}></div>

            <div className="relative z-10">
              {/* Mode Toggle */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 px-4 font-mono text-sm transition-all ${
                    mode === 'login'
                      ? 'bg-green-600 text-black border border-green-400'
                      : 'bg-black text-green-400 border border-green-400/50 hover:border-green-400'
                  }`}
                >
                  NEURAL_LINK
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 px-4 font-mono text-sm transition-all ${
                    mode === 'register'
                      ? 'bg-green-600 text-black border border-green-400'
                      : 'bg-black text-green-400 border border-green-400/50 hover:border-green-400'
                  }`}
                >
                  IDENTITY_FORGE
                </button>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-green-400 mb-1 tracking-wider">
                    EMAIL_ADDRESS:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono text-sm focus:border-green-300 focus:outline-none"
                    style={{ 
                      borderStyle: 'inset',
                      boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                    }}
                    placeholder="user@matrix.net"
                    required
                    disabled={loading}
                  />
                </div>

                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-green-400 mb-1 tracking-wider">
                        USERNAME:
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
                        placeholder="neo_matrix"
                        required
                        disabled={loading}
                        maxLength={20}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-green-400 mb-1 tracking-wider">
                        DISPLAY_NAME (OPTIONAL):
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
                        placeholder="The One"
                        disabled={loading}
                        maxLength={50}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-mono text-green-400 mb-1 tracking-wider">
                    PASSWORD:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono text-sm focus:border-green-300 focus:outline-none"
                    style={{ 
                      borderStyle: 'inset',
                      boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                    }}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-xs font-mono text-center border border-red-400 p-2 bg-red-900/20 animate-pulse">
                    [ERROR] {error.toUpperCase()}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
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
                    mode === 'login' ? '>> ESTABLISHING_LINK...' : '>> FORGING_IDENTITY...'
                  ) : (
                    mode === 'login' ? '>> JACK_IN' : '>> CREATE_IDENTITY'
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={switchMode}
                  className="text-xs font-mono text-green-400/80 hover:text-green-400 underline"
                  disabled={loading}
                >
                  {mode === 'login' 
                    ? '[NEW_TO_MATRIX?] >> FORGE_IDENTITY' 
                    : '[EXISTING_NODE?] >> NEURAL_LINK'
                  }
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthForm;