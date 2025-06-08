import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signInWithOAuth, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      clearError();
      await signIn(email, password);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      clearError();
      await signInWithOAuth(provider);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-lg" 
        style={{ 
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.5), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
          fontFamily: 'Courier New, monospace'
        }}
      >
        {/* Terminal Header */}
        <div className="bg-black border-b border-green-400 p-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
          <div className="flex items-center space-x-2 relative z-10">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xs font-mono text-green-400 tracking-wider">
              [AUTH_TERMINAL] LOGIN_PROTOCOL v3.1.4
            </span>
          </div>
        </div>
        
        <div className="p-6 bg-black/50 relative">
          {/* Scanlines Effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)'
          }}></div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <div className="text-green-400 text-xs font-mono mb-2 animate-pulse">
                &gt;&gt; NEURAL_INTERFACE_READY
              </div>
              <h2 className="text-lg font-mono text-green-400 mb-1 tracking-wider">
                === JACK INTO THE MATRIX ===
              </h2>
              <div className="text-xs text-green-300 font-mono opacity-80">
                Secure connection established | ICE firewall active
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-mono text-green-400 mb-1 tracking-wider">
                  &gt; EMAIL_ADDRESS:
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none focus:shadow-lg" 
                  style={{ 
                    borderStyle: 'inset',
                    boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                  }}
                  placeholder="user@matrix.net"
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div>
                <div className="text-xs font-mono text-green-400 mb-1 tracking-wider">
                  &gt; ACCESS_CODE:
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none focus:shadow-lg" 
                  style={{ 
                    borderStyle: 'inset',
                    boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                  }}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  required
                />
              </div>
              
              <motion.button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-3 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderStyle: 'outset',
                  boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
                }}
                whileHover={{ 
                  scale: isLoading ? 1 : 1.02,
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '&gt;&gt; ESTABLISHING_CONNECTION...' : '&gt;&gt; INITIATE_LOGIN'}
              </motion.button>
            </form>

            {/* OAuth Section */}
            <div className="mt-6">
              <div className="text-xs font-mono text-green-400 mb-3 text-center border-t border-green-400/30 pt-3">
                [ALTERNATIVE_ACCESS_PROTOCOLS]
              </div>
              
              <div className="space-y-2">
                <motion.button
                  onClick={() => handleOAuthSignIn('github')}
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-600 text-gray-300 font-mono py-2 text-sm transition-all duration-200 flex items-center justify-center space-x-2"
                  style={{ 
                    borderStyle: 'outset',
                    boxShadow: '0 0 10px rgba(100, 100, 100, 0.3)'
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 0 20px rgba(100, 100, 100, 0.6)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🐙</span>
                  <span>&gt;&gt; GITHUB_AUTH_PROTOCOL</span>
                </motion.button>
                
                <motion.button
                  onClick={() => handleOAuthSignIn('google')}
                  className="w-full bg-blue-900 hover:bg-blue-800 border border-blue-600 text-blue-300 font-mono py-2 text-sm transition-all duration-200 flex items-center justify-center space-x-2"
                  style={{ 
                    borderStyle: 'outset',
                    boxShadow: '0 0 10px rgba(0, 100, 255, 0.3)'
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 0 20px rgba(0, 100, 255, 0.6)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🌐</span>
                  <span>&gt;&gt; GOOGLE_AUTH_PROTOCOL</span>
                </motion.button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 text-red-400 text-xs font-mono text-center border border-red-400 p-2 bg-red-900/20 animate-pulse">
                [AUTH_ERROR] {error.toUpperCase()}
              </div>
            )}

            {/* Switch to Register */}
            <div className="mt-6 text-center">
              <div className="text-xs text-green-400 font-mono opacity-60 mb-2">
                [NO_ACCOUNT_FOUND]
              </div>
              <button
                onClick={onSwitchToRegister}
                className="text-cyan-400 text-xs font-mono hover:text-cyan-300 transition-colors underline"
              >
                &gt;&gt; CREATE_NEW_IDENTITY
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-green-400 font-mono opacity-60">
              <div className="border-t border-green-400/30 pt-3">
                <p>[ SECURE_CONNECTION_VERIFIED ]</p>
                <p className="mt-1">256-bit encryption • Zero-knowledge protocol</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;