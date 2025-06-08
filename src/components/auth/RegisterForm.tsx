import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp, signInWithOAuth, error, clearError } = useAuth();

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !username) {
      return 'All fields are required';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    
    if (!acceptTerms) {
      return 'You must accept the terms of service';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      // You might want to show this error in the UI
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      await signUp(email, password, username);
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

  const formError = validateForm();

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
              [IDENTITY_FORGE] REGISTRATION v2.0.7
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
                &gt;&gt; IDENTITY_CREATION_PROTOCOL
              </div>
              <h2 className="text-lg font-mono text-green-400 mb-1 tracking-wider">
                === FORGE NEW IDENTITY ===
              </h2>
              <div className="text-xs text-green-300 font-mono opacity-80">
                Establishing new neural pathway | Identity verification required
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-mono text-green-400 mb-1 tracking-wider">
                  &gt; CALLSIGN_IDENTIFIER:
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none focus:shadow-lg" 
                  style={{ 
                    borderStyle: 'inset',
                    boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                  }}
                  placeholder="unique_callsign"
                  disabled={isLoading}
                  maxLength={20}
                  required
                />
                <div className="text-xs text-green-300/60 font-mono mt-1">
                  3-20 chars • letters, numbers, hyphens, underscores only
                </div>
              </div>

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
                  placeholder="secure@matrix.net"
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
                  minLength={8}
                  required
                />
                <div className="text-xs text-green-300/60 font-mono mt-1">
                  Minimum 8 characters for neural security
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-green-400 mb-1 tracking-wider">
                  &gt; CONFIRM_ACCESS_CODE:
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <div className="flex items-start space-x-2 py-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 accent-green-400"
                  disabled={isLoading}
                  required
                />
                <label htmlFor="acceptTerms" className="text-xs font-mono text-green-300 leading-relaxed">
                  I accept the <span className="text-cyan-400 cursor-pointer hover:underline">Matrix Protocol Terms</span> and agree to the 
                  <span className="text-cyan-400 cursor-pointer hover:underline"> Neural Privacy Policy</span>
                </label>
              </div>
              
              <motion.button
                type="submit"
                disabled={isLoading || !!formError}
                className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-3 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderStyle: 'outset',
                  boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
                }}
                whileHover={{ 
                  scale: isLoading || formError ? 1 : 1.02,
                  boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '&gt;&gt; FORGING_IDENTITY...' : '&gt;&gt; CREATE_NEURAL_LINK'}
              </motion.button>
            </form>

            {/* OAuth Section */}
            <div className="mt-6">
              <div className="text-xs font-mono text-green-400 mb-3 text-center border-t border-green-400/30 pt-3">
                [QUICK_IDENTITY_PROTOCOLS]
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
                  <span>&gt;&gt; GITHUB_NEURAL_LINK</span>
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
                  <span>&gt;&gt; GOOGLE_NEURAL_LINK</span>
                </motion.button>
              </div>
            </div>
            
            {(error || formError) && (
              <div className="mt-4 text-red-400 text-xs font-mono text-center border border-red-400 p-2 bg-red-900/20 animate-pulse">
                [IDENTITY_ERROR] {(error || formError)?.toUpperCase()}
              </div>
            )}

            {/* Switch to Login */}
            <div className="mt-6 text-center">
              <div className="text-xs text-green-400 font-mono opacity-60 mb-2">
                [EXISTING_NEURAL_PATHWAY_DETECTED]
              </div>
              <button
                onClick={onSwitchToLogin}
                className="text-cyan-400 text-xs font-mono hover:text-cyan-300 transition-colors underline"
              >
                &gt;&gt; ACCESS_EXISTING_IDENTITY
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-green-400 font-mono opacity-60">
              <div className="border-t border-green-400/30 pt-3">
                <p>[ IDENTITY_ENCRYPTION_ACTIVE ]</p>
                <p className="mt-1">End-to-end security • Zero data retention policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;