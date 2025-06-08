import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import UserProfile from './UserProfile';

const AuthApp: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showProfile, setShowProfile] = useState(false);
  const { user, profile, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      // In a real app, you'd use router navigation
      window.location.href = '/chat';
    }
  }, [user, loading]);

  const handleAuthSuccess = () => {
    // Redirect to chat or intended page
    window.location.href = '/chat';
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-lg p-8" 
          style={{ 
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.5), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
            fontFamily: 'Courier New, monospace'
          }}
        >
          <div className="text-green-400 text-sm font-mono mb-4 animate-pulse">
            &gt;&gt; INITIALIZING_AUTH_SYSTEM...
          </div>
          
          <div className="flex justify-center space-x-2">
            {Array.from({length: 5}).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0 }}
                animate={{ y: [-5, 5, -5] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setMode('register')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};

export default AuthApp;