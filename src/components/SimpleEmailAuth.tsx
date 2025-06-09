import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface SimpleEmailAuthProps {
  onAuthSuccess: (username: string, userId: string) => void;
}

const SimpleEmailAuth: React.FC<SimpleEmailAuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        // Check if username is available
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();

        if (existingProfile) {
          throw new Error('Username already taken');
        }

        // Create account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase()
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          console.log('User created:', authData.user.id);
          
          // Wait a moment for auth to settle
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create user profile with explicit error handling
          const profileData = {
            user_id: authData.user.id,
            username: username.toLowerCase(),
            display_name: username,
            total_fragments: 0,
            rare_fragments: 0,
            joined_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            is_online: true
          };
          
          console.log('Attempting to create profile:', profileData);
          
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            console.error('Error details:', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint
            });
            
            // Try to clean up the auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
            
            throw new Error(`Profile setup failed: ${profileError.message || 'Unknown error'}`);
          }

          console.log('Profile created successfully:', profile);
          
          // Auto-login after registration
          onAuthSuccess(username.toLowerCase(), authData.user.id);
        }
      } else {
        // Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        if (authData.user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', authData.user.id)
            .single();

          if (profileError || !profile) {
            throw new Error('Profile not found');
          }

          // Update last seen
          await supabase
            .from('user_profiles')
            .update({
              last_seen: new Date().toISOString(),
              is_online: true
            })
            .eq('user_id', authData.user.id);

          onAuthSuccess(profile.username, authData.user.id);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
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
              [NEURAL_ACCESS] {mode === 'login' ? 'LOGIN_PROTOCOL' : 'REGISTRATION_MATRIX'}
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
              &gt;&gt; {mode === 'login' ? 'ACCESS_MATRIX' : 'JOIN_MATRIX'} &lt;&lt;
            </div>

            {error && (
              <div className="text-red-400 text-xs font-mono mb-4 p-2 border border-red-400 bg-red-400/10">
                [ERROR] {error}
              </div>
            )}

            {/* Mode Toggle */}
            <div className="flex mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-4 text-xs font-mono border-r border-green-400 ${
                  mode === 'login' 
                    ? 'bg-green-400/20 text-green-300' 
                    : 'bg-black text-green-400 hover:bg-green-400/10'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 px-4 text-xs font-mono ${
                  mode === 'register' 
                    ? 'bg-green-400/20 text-green-300' 
                    : 'bg-black text-green-400 hover:bg-green-400/10'
                }`}
              >
                REGISTER
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono text-green-400 mb-2 tracking-wider">
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
                    placeholder="your_neural_id"
                    required
                    disabled={loading}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]+"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-green-400 mb-2 tracking-wider">
                  EMAIL:
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
                  placeholder="user@domain.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-green-400 mb-2 tracking-wider">
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

              <motion.button
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || (mode === 'register' && !username.trim())}
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
                  '>> PROCESSING...'
                ) : (
                  `>> ${mode === 'login' ? 'ACCESS_MATRIX' : 'CREATE_NEURAL_ID'}`
                )}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <div className="text-xs font-mono text-green-400/60">
                [STATUS] {mode === 'login' ? 'Existing users only' : 'New account creation'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleEmailAuth;