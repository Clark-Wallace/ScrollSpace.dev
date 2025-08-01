import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  requireAuth = true,
  redirectTo 
}) => {
  const { user, profile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-lg p-8" 
          style={{ 
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.5), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
            fontFamily: 'Courier New, monospace'
          }}
        >
          {/* Terminal Header */}
          <div className="bg-black border-b border-green-400 p-2 relative overflow-hidden mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
            <div className="flex items-center space-x-2 relative z-10">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xs font-mono text-green-400 tracking-wider">
                [AUTH_SYSTEM] NEURAL_LINK_VERIFICATION
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-green-400 text-sm font-mono mb-4 animate-pulse">
              &gt;&gt; VERIFYING_NEURAL_PATHWAY...
            </div>
            
            {/* Matrix Rain Effect */}
            <div className="relative h-24 overflow-hidden">
              <div className="absolute inset-0 flex justify-center items-center space-x-2">
                {Array.from({length: 5}).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="text-green-400 font-mono text-lg"
                  >
                    {Math.random() > 0.5 ? '1' : '0'}
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="text-xs font-mono text-green-300 opacity-80">
              Establishing secure connection to the matrix...
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !user) {
    // If redirectTo is provided, redirect (in a real app, you'd use router)
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    // Show fallback or default unauthorized message
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 backdrop-blur-sm border border-red-400 shadow-lg max-w-md" 
          style={{ 
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.5), inset 1px 1px 0px rgba(255, 0, 0, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
            fontFamily: 'Courier New, monospace'
          }}
        >
          {/* Terminal Header */}
          <div className="bg-black border-b border-red-400 p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/10 to-transparent animate-pulse"></div>
            <div className="flex items-center space-x-2 relative z-10">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xs font-mono text-red-400 tracking-wider">
                [SECURITY_BREACH] ACCESS_DENIED
              </span>
            </div>
          </div>
          
          <div className="p-6 text-center">
            <div className="text-red-400 text-lg font-mono mb-4 animate-pulse">
              ⚠️ UNAUTHORIZED ACCESS ATTEMPT ⚠️
            </div>
            
            <div className="text-red-300 text-sm font-mono mb-4 leading-relaxed">
              Neural pathway not established. Authentication required to access this sector of the matrix.
            </div>
            
            <motion.button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-black hover:bg-red-900/30 border border-red-400 text-red-400 font-mono py-2 px-4 text-sm transition-all duration-200"
              style={{ 
                borderStyle: 'outset',
                boxShadow: '0 0 10px rgba(255, 0, 0, 0.3)'
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.6)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              &gt;&gt; ESTABLISH_NEURAL_LINK
            </motion.button>
            
            <div className="text-xs font-mono text-red-400/60 mt-4 border-t border-red-400/30 pt-4">
              ICE protection active • Unauthorized access logged
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // If requireAuth is false and user is authenticated, don't show children
  if (!requireAuth && user) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
  }

  // Show children if auth requirements are met
  return <>{children}</>;
};

export default AuthGuard;