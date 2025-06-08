import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI, type ChatMessage, type ChatUser, type SignalFragment, authAPI } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import SignalFragment from './SignalFragment';
import FragmentModal from './FragmentModal';
import { selectRandomFragment, generateFragmentId, personalizeFragment, shouldDropFragment } from '../lib/fragmentContent';
import { autoSetup } from '../lib/setupDatabase';
import { useAuth } from './AuthContext';
import AuthForm from './AuthForm';

const AuthenticatedChatRoom: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  
  // Signal Fragment state
  const [activeFragments, setActiveFragments] = useState<SignalFragment[]>([]);
  const [claimedFragment, setClaimedFragment] = useState<SignalFragment | null>(null);
  const [showFragmentModal, setShowFragmentModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messageSubscription = useRef<RealtimeChannel | null>(null);
  const userSubscription = useRef<RealtimeChannel | null>(null);
  const fragmentSubscription = useRef<RealtimeChannel | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);
  const fragmentDropInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when user is authenticated
  useEffect(() => {
    if (user && profile && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [user, profile]);

  // Load initial chat data and set up subscriptions
  useEffect(() => {
    if (user) {
      joinChat();
    }
    
    return () => {
      // Clean up subscriptions
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
      if (userSubscription.current) {
        userSubscription.current.unsubscribe();
      }
      if (fragmentSubscription.current) {
        fragmentSubscription.current.unsubscribe();
      }
    };
  }, [user]);

  // Handle leaving chat when component unmounts or user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && profile) {
        leaveChat();
      }
    };

    const handleVisibilityChange = () => {
      if (user && profile) {
        if (document.hidden) {
          chatAPI.updateUserStatus(profile.username, 'away');
        } else {
          chatAPI.updateUserStatus(profile.username, 'online');
          chatAPI.updateHeartbeat(profile.username);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (user && profile) {
        leaveChat();
      }
    };
  }, [user, profile]);

  // Set up heartbeat and cleanup intervals when user joins
  useEffect(() => {
    if (user && profile) {
      // Send heartbeat every 30 seconds
      heartbeatInterval.current = setInterval(() => {
        chatAPI.updateHeartbeat(profile.username);
      }, 30000);

      // Clean up inactive users every 2 minutes
      cleanupInterval.current = setInterval(() => {
        chatAPI.cleanupInactiveUsers();
      }, 120000);

      // Random fragment drops every 1-3 minutes
      fragmentDropInterval.current = setInterval(async () => {
        if (shouldDropFragment()) {
          await dropRandomFragment();
        }
      }, 60000); // Check every minute
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
      if (fragmentDropInterval.current) {
        clearInterval(fragmentDropInterval.current);
      }
    };
  }, [user, profile]);

  const joinChat = async () => {
    // Create a fallback profile if none exists
    const currentUser = profile || { 
      username: user?.email?.split('@')[0] || 'user',
      display_name: user?.email?.split('@')[0] || 'User'
    };
    if (!currentUser) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Auto-setup database if needed
      await autoSetup();
      
      // Join chat with authenticated user info
      await chatAPI.joinChat(currentUser.username);
      
      // Load recent messages
      const recentMessages = await chatAPI.getMessages(50);
      const formattedMessages = recentMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(formattedMessages);

      // Load online users
      const onlineUsers = await chatAPI.getOnlineUsers();
      setUsers(onlineUsers);

      // Load active fragments
      const fragments = await chatAPI.getActiveFragments();
      setActiveFragments(fragments);

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
      
    } catch (error) {
      console.error('Failed to join chat:', error);
      setError('Failed to connect to chat server. Please check your connection and Supabase configuration.');
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveChat = async () => {
    if (!profile) return;
    
    try {
      await chatAPI.leaveChat(profile.username);
      if (user) {
        await authAPI.updateUserPresence(user.id, false);
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    messageSubscription.current = chatAPI.subscribeToMessages((message) => {
      const formattedMessage = {
        ...message,
        timestamp: new Date(message.timestamp)
      };
      setMessages(prev => [...prev, formattedMessage]);
    });

    // Subscribe to user presence changes
    userSubscription.current = chatAPI.subscribeToUsers((users) => {
      setUsers(users);
    });

    // Subscribe to fragment changes
    fragmentSubscription.current = chatAPI.subscribeToFragments((fragments) => {
      setActiveFragments(fragments);
    });
  };

  const sendMessage = async () => {
    const currentUser = profile;
    if (!currentMessage.trim() || !currentUser) return;

    // Handle commands locally
    if (currentMessage.startsWith('/')) {
      handleCommand(currentMessage);
      setCurrentMessage('');
      return;
    }

    const messageText = currentMessage;
    setCurrentMessage('');

    try {
      await chatAPI.sendMessage(currentUser.username, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the message to the input if it failed
      setCurrentMessage(messageText);
      setError('Transmission failed. Retry protocol.');
    }
  };

  const handleCommand = async (command: string) => {
    const currentUser = profile;
    if (!currentUser) return;
    
    const cmd = command.toLowerCase();
    
    const addLocalMessage = (message: string) => {
      const localMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setMessages(prev => [...prev, { ...localMessage, timestamp: new Date(localMessage.timestamp) }]);
    };
    
    if (cmd === '/help') {
      addLocalMessage('[SYS] Available protocols: /help, /users, /time, /clear, /away, /back, /cleanup, /matrix, /fragments, /pickup <id>, /drop, /profile');
    } else if (cmd === '/users') {
      const userList = users.map(u => `${u.username} (${u.status})`).join(', ');
      addLocalMessage(`[NET] Active nodes: ${userList}`);
    } else if (cmd === '/profile') {
      const fragments = profile?.total_fragments || 0;
      const rareFragments = profile?.rare_fragments || 0;
      const status = profile?.is_online ? 'ONLINE' : 'OFFLINE';
      addLocalMessage(`[PROFILE] Neural ID: ${currentUser.username} | Fragments: ${fragments} | Rare: ${rareFragments} | Status: ${status}`);
    } else if (cmd === '/time') {
      addLocalMessage(`[CLOCK] Matrix time: ${new Date().toLocaleString()}`);
    } else if (cmd === '/clear') {
      setMessages([]);
      addLocalMessage('[SYS] Terminal buffer cleared');
    } else if (cmd === '/away') {
      try {
        await chatAPI.updateUserStatus(currentUser.username, 'away');
        addLocalMessage('[STATUS] Stealth mode: ACTIVE');
      } catch (error) {
        addLocalMessage('[ERROR] Status update failed');
      }
    } else if (cmd === '/back') {
      try {
        await chatAPI.updateUserStatus(currentUser.username, 'online');
        addLocalMessage('[STATUS] Neural link: RESTORED');
      } catch (error) {
        addLocalMessage('[ERROR] Status update failed');
      }
    } else if (cmd === '/cleanup') {
      try {
        await chatAPI.cleanupInactiveUsers();
        addLocalMessage('[MAINT] Purged inactive nodes from matrix');
      } catch (error) {
        addLocalMessage('[ERROR] Cleanup protocol failed');
      }
    } else if (cmd === '/matrix') {
      addLocalMessage('[SYSTEM] Welcome to the ScrollSpace Matrix, choom. Reality is just another ICE to break.');
    } else if (cmd === '/fragments') {
      try {
        const userFragments = await chatAPI.getUserFragments(currentUser.username);
        if (userFragments.length === 0) {
          addLocalMessage('[FRAGMENT] No data shards in your collection.');
        } else {
          addLocalMessage(`[FRAGMENT] You have collected ${userFragments.length} data shards:`);
          userFragments.forEach((frag, i) => {
            addLocalMessage(`  ${i + 1}. ${frag.fragment_id} (${frag.rarity}) - ${frag.content_type}`);
          });
        }
      } catch (error) {
        addLocalMessage('[ERROR] Failed to access fragment database.');
      }
    } else if (cmd === '/drop') {
      // Admin command to manually drop a fragment
      await dropRandomFragment();
      addLocalMessage('[ADMIN] Signal fragment deployed to the matrix.');
    } else if (cmd.startsWith('/pickup ')) {
      const fragmentId = cmd.split(' ')[1];
      if (fragmentId) {
        await handleFragmentPickup(fragmentId);
      } else {
        addLocalMessage('[ERROR] Usage: /pickup <fragment_id>');
      }
    } else {
      addLocalMessage('[ERROR] Unknown protocol. Type /help for available commands.');
    }
  };

  // Signal Fragment functions
  const dropRandomFragment = async () => {
    const currentUser = profile;
    if (!currentUser) return;
    
    try {
      const template = selectRandomFragment();
      const fragmentId = generateFragmentId();
      const expiresAt = new Date(Date.now() + 30000).toISOString(); // 30 seconds
      
      let content = template.content;
      if (template.type === 'personalized') {
        content = personalizeFragment(content, currentUser.username);
      }

      await chatAPI.dropFragment({
        fragment_id: fragmentId,
        content,
        content_type: template.type,
        rarity: template.rarity,
        available: true,
        expires_at: expiresAt
      });
      
      // Add system message about the fragment
      const systemMsg: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message: `[FRAGMENT] Signal detected! ID: ${fragmentId} (${template.rarity}) - 30 seconds to claim!`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setMessages(prev => [...prev, { ...systemMsg, timestamp: new Date(systemMsg.timestamp) }]);
    } catch (error) {
      console.error('Failed to drop fragment:', error);
    }
  };

  const handleFragmentPickup = async (fragmentId: string) => {
    const currentUser = profile;
    if (!currentUser) return;
    
    try {
      const fragment = await chatAPI.pickupFragment(fragmentId, currentUser.username);
      setClaimedFragment(fragment);
      setShowFragmentModal(true);
      
      // Update user's fragment count (only for authenticated users)
      if (user && profile) {
        await authAPI.updateUserProfile(user.id, {
          total_fragments: profile.total_fragments + 1,
          rare_fragments: ['rare', 'encrypted', 'corrupted'].includes(fragment.rarity) 
            ? profile.rare_fragments + 1 
            : profile.rare_fragments
        });
      }
      
      // Remove from active fragments locally
      setActiveFragments(prev => prev.filter(f => f.fragment_id !== fragmentId));
    } catch (error) {
      console.error('Failed to pickup fragment:', error);
      // Show error message in chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message: 'Fragment already claimed or expired.',
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setMessages(prev => [...prev, { ...errorMessage, timestamp: new Date(errorMessage.timestamp) }]);
    }
  };

  const handleFragmentExpire = (fragmentId: string) => {
    setActiveFragments(prev => prev.filter(f => f.fragment_id !== fragmentId));
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'busy': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'system': return 'text-purple-400';
      case 'join': return 'text-green-400';
      case 'leave': return 'text-red-400';
      default: return 'text-black';
    }
  };

  // Show auth form if user is not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border border-green-400 rounded-full animate-spin border-t-transparent mx-auto mb-4"></div>
          <div className="text-green-400 font-mono text-sm">INITIALIZING_NEURAL_LINK...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-lg p-6" 
               style={{ 
                 boxShadow: '0 0 20px rgba(0, 255, 65, 0.5), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
                 fontFamily: 'Courier New, monospace'
               }}>
            <div className="text-green-400 text-sm font-mono mb-4">
              &gt;&gt; AUTHENTICATED_ACCESS_REQUIRED
            </div>
            <p className="text-green-300 font-mono text-sm mb-6">
              Neural link authentication required to access the ScrollSpace Matrix chat system.
            </p>
            <button
              onClick={() => setShowAuthForm(true)}
              className="w-full bg-green-600 hover:bg-green-500 text-black font-mono font-bold py-2 text-sm transition-all"
            >
              ESTABLISH_NEURAL_LINK
            </button>
          </div>
        </div>
        
        <AuthForm 
          isOpen={showAuthForm} 
          onClose={() => setShowAuthForm(false)}
          initialMode="login"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-2 md:p-4 relative">
      {/* Background Scanlines */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.02) 2px, rgba(0, 255, 65, 0.02) 4px)',
          zIndex: 1
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto relative z-10 w-full">
        
        {/* Main Terminal Window */}
        <div className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-2xl relative z-20" style={{ 
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.4), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
          fontFamily: 'Courier New, monospace'
        }}>
          
          {/* Terminal Header */}
          <div className="bg-black border-b border-green-400 p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-mono text-green-400 tracking-wider">
                  [NEURAL_NET] {profile?.username}@scrollspace.matrix
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-green-400 hidden md:inline">
                  USERS_ONLINE: {users.length} | FRAGMENTS: {profile?.total_fragments || 0}
                </span>
                <span className="text-xs font-mono text-green-400 md:hidden">
                  USERS: {users.length} | FRAGS: {profile?.total_fragments || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row h-[600px] md:h-[600px]">
            
            {/* Main Chat Terminal */}
            <div className="flex-1 bg-black/50 border-r-0 md:border-r border-green-400 flex flex-col relative">
              {/* Matrix Rain Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="text-green-400 text-xs font-mono animate-pulse">
                  {Array.from({length: 20}).map((_, i) => (
                    <div key={i} className="absolute" style={{
                      left: `${i * 5}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`
                    }}>01</div>
                  ))}
                </div>
              </div>
              
              {/* Messages Terminal */}
              <div className="flex-1 overflow-y-auto p-3 text-sm font-mono relative z-10">
                <div className="mb-2 text-green-400 text-xs animate-pulse">
                  &gt;&gt;&gt; NEURAL_LINK_ESTABLISHED_TO: "SCROLLSPACE_MATRIX" &lt;&lt;&lt;
                </div>
                <div className="mb-2 text-green-400 text-xs">
                  [SYSTEM] Welcome {profile?.display_name || profile?.username}, choom. Neural signature verified.
                </div>
                <div className="mb-2 text-cyan-400 text-xs">
                  [ICE] Authentication: {profile ? 'VERIFIED' : 'BYPASS'} | Fragment collection: {profile?.total_fragments || 0} shards
                </div>
                
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-1"
                    >
                      {msg.type === 'message' && (
                        <div className="flex">
                          <span className="text-cyan-400 text-xs mr-1">[{formatTime(msg.timestamp)}]</span>
                          <span className={msg.username === profile?.username ? 'text-yellow-400 font-bold' : 'text-cyan-400 font-bold'}>
                            {msg.username}@net:
                          </span>
                          <span className="text-green-300 ml-1">{msg.message}</span>
                        </div>
                      )}
                      {msg.type === 'join' && (
                        <div className="text-green-400 text-xs italic animate-pulse">
                          &gt;&gt; NEURAL_LINK_ESTABLISHED: {msg.message.replace(' has entered the chat', '')} &lt;&lt;
                        </div>
                      )}
                      {msg.type === 'leave' && (
                        <div className="text-red-400 text-xs italic">
                          &gt;&gt; CONNECTION_TERMINATED: {msg.message.replace(' has left the chat', '').replace(' (connection lost)', ' [TRACE_LOST]')} &lt;&lt;
                        </div>
                      )}
                      {msg.type === 'system' && (
                        <div className="text-purple-400 text-xs border-l-2 border-purple-400 pl-2">
                          [SYS] {msg.message}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Active Signal Fragments */}
                {activeFragments.map((fragment) => (
                  <SignalFragment
                    key={fragment.fragment_id}
                    fragmentId={fragment.fragment_id}
                    rarity={fragment.rarity}
                    isAvailable={fragment.available}
                    onClick={() => handleFragmentPickup(fragment.fragment_id)}
                    onExpire={() => handleFragmentExpire(fragment.fragment_id)}
                  />
                ))}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Command Input */}
              <div className="border-t border-green-400 p-3 bg-black relative">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-mono text-sm">&gt;</span>
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-black border border-green-400 text-green-300 px-2 py-1 text-sm font-mono focus:border-cyan-400 focus:outline-none"
                    style={{ 
                      borderStyle: 'inset',
                      boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                    }}
                    placeholder="enter_command..."
                    maxLength={200}
                  />
                  <motion.button
                    onClick={sendMessage}
                    className="bg-black hover:bg-green-900/30 border border-green-400 text-green-400 px-3 py-1 text-xs font-mono transition-all"
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
                    SEND
                  </motion.button>
                </div>
                {error && (
                  <div className="text-red-400 text-xs font-mono mt-1 border border-red-400 p-1 bg-red-900/20 animate-pulse">
                    [ERROR] {error.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Users Matrix Panel */}
            <div className="w-full md:w-64 bg-black border-t md:border-t-0 border-l-0 md:border-l border-green-400 h-32 md:h-auto" style={{ borderStyle: 'inset' }}>
              <div className="bg-black border-b border-green-400 p-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent"></div>
                <h3 className="text-xs font-mono text-green-400 tracking-wider relative z-10">
                  [ACTIVE_NODES: {users.length}]
                </h3>
              </div>
              
              <div className="h-full overflow-y-auto p-2 flex md:block gap-2 overflow-x-auto md:overflow-x-visible">
                {users.map((user) => (
                  <motion.div 
                    key={user.username} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-0 md:mb-2 flex items-center space-x-2 p-1 border border-transparent hover:border-green-400/30 transition-all whitespace-nowrap md:whitespace-normal"
                  >
                    <div className={`w-1 h-1 rounded-full animate-pulse ${
                      user.status === 'online' ? 'bg-green-400' :
                      user.status === 'away' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <span className={`text-xs font-mono ${
                      user.username === profile?.username ? 'text-yellow-400 font-bold' : 'text-cyan-400'
                    }`}>
                      {user.username}
                      {user.username === profile?.username && '@local'}
                    </span>
                  </motion.div>
                ))}
                {users.length === 0 && (
                  <div className="text-gray-500 text-xs font-mono text-center py-4 opacity-60">
                    [NO_ACTIVE_NODES]
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Terminal */}
        <div className="mt-2 text-xs text-green-400 font-mono text-center opacity-80">
          [STATUS] NEURAL_LINK_VERIFIED | IDENTITY: {profile?.username} | FRAGMENTS: {profile?.total_fragments || 0}
        </div>
      </div>
      
      {/* Fragment Modal */}
      <FragmentModal
        isOpen={showFragmentModal}
        fragment={claimedFragment}
        onClose={() => setShowFragmentModal(false)}
      />
    </div>
  );
};

export default AuthenticatedChatRoom;