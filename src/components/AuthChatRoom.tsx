import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { authChatAPI, authFragmentAPI, type ChatMessage, type Profile, type SignalFragment } from '../lib/supabase-auth';
import type { RealtimeChannel } from '@supabase/supabase-js';
import SignalFragment from './SignalFragment';
import FragmentModal from './FragmentModal';
import { selectRandomFragment, generateFragmentId, personalizeFragment, shouldDropFragment } from '../lib/fragmentContent';

const AuthChatRoom: React.FC = () => {
  const { user, profile, updateUserStatus } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Focus input when connected
  useEffect(() => {
    if (isConnected && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isConnected]);

  // Initialize chat when user is authenticated
  useEffect(() => {
    if (user && profile) {
      initializeChat();
    }
    
    return () => {
      cleanupChat();
    };
  }, [user, profile]);

  // Set up intervals when connected
  useEffect(() => {
    if (isConnected && user) {
      // Send heartbeat every 30 seconds
      heartbeatInterval.current = setInterval(() => {
        authChatAPI.updateHeartbeat();
      }, 30000);

      // Clean up inactive users every 2 minutes
      cleanupInterval.current = setInterval(() => {
        authChatAPI.cleanupInactiveUsers();
      }, 120000);

      // Random fragment drops every 1-3 minutes
      fragmentDropInterval.current = setInterval(async () => {
        if (shouldDropFragment()) {
          await dropRandomFragment();
        }
      }, 60000);
    }

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (cleanupInterval.current) clearInterval(cleanupInterval.current);
      if (fragmentDropInterval.current) clearInterval(fragmentDropInterval.current);
    };
  }, [isConnected, user]);

  const initializeChat = async () => {
    try {
      setError(null);
      
      // Load recent messages
      const recentMessages = await authChatAPI.getMessages(50);
      setMessages(recentMessages);

      // Load online users
      const onlineUsers = await authChatAPI.getOnlineUsers();
      setUsers(onlineUsers);

      // Load active fragments
      const fragments = await authFragmentAPI.getActiveFragments();
      setActiveFragments(fragments);

      // Join chat
      await authChatAPI.joinChat();
      setIsConnected(true);

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
      
    } catch (error: any) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to connect to neural network. Please check your connection.');
    }
  };

  const cleanupChat = async () => {
    try {
      if (isConnected) {
        await authChatAPI.leaveChat();
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
    }

    // Clean up subscriptions
    if (messageSubscription.current) messageSubscription.current.unsubscribe();
    if (userSubscription.current) userSubscription.current.unsubscribe();
    if (fragmentSubscription.current) fragmentSubscription.current.unsubscribe();
    
    // Clear intervals
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    if (cleanupInterval.current) clearInterval(cleanupInterval.current);
    if (fragmentDropInterval.current) clearInterval(fragmentDropInterval.current);
    
    setIsConnected(false);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    messageSubscription.current = authChatAPI.subscribeToMessages((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Subscribe to user presence changes
    userSubscription.current = authChatAPI.subscribeToUsers((users) => {
      setUsers(users);
    });

    // Subscribe to fragment changes
    fragmentSubscription.current = authFragmentAPI.subscribeToFragments((fragments) => {
      setActiveFragments(fragments);
    });
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    // Handle commands locally
    if (currentMessage.startsWith('/')) {
      handleCommand(currentMessage);
      setCurrentMessage('');
      return;
    }

    const messageText = currentMessage;
    setCurrentMessage('');

    try {
      await authChatAPI.sendMessage(messageText);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setCurrentMessage(messageText);
      setError('Transmission failed. Retry protocol.');
    }
  };

  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    
    const addLocalMessage = (message: string) => {
      const localMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setMessages(prev => [...prev, localMessage]);
    };
    
    if (cmd === '/help') {
      addLocalMessage('[SYS] Available protocols: /help, /users, /time, /clear, /away, /back, /online, /busy, /matrix, /fragments, /pickup <id>, /stats');
    } else if (cmd === '/users') {
      const userList = users.map(u => `${u.display_name || u.username} (${u.status})`).join(', ');
      addLocalMessage(`[NET] Active nodes: ${userList}`);
    } else if (cmd === '/time') {
      addLocalMessage(`[CLOCK] Matrix time: ${new Date().toLocaleString()}`);
    } else if (cmd === '/clear') {
      setMessages([]);
      addLocalMessage('[SYS] Terminal buffer cleared');
    } else if (cmd === '/away') {
      try {
        await updateUserStatus('away');
        addLocalMessage('[STATUS] Stealth mode: ACTIVE');
      } catch (error) {
        addLocalMessage('[ERROR] Status update failed');
      }
    } else if (cmd === '/online') {
      try {
        await updateUserStatus('online');
        addLocalMessage('[STATUS] Neural link: RESTORED');
      } catch (error) {
        addLocalMessage('[ERROR] Status update failed');
      }
    } else if (cmd === '/busy') {
      try {
        await updateUserStatus('busy');
        addLocalMessage('[STATUS] Do not disturb: ACTIVE');
      } catch (error) {
        addLocalMessage('[ERROR] Status update failed');
      }
    } else if (cmd === '/matrix') {
      addLocalMessage('[SYSTEM] Welcome to the authenticated ScrollSpace Matrix, choom. Your neural signature is verified.');
    } else if (cmd === '/fragments') {
      try {
        const userFragments = await authFragmentAPI.getUserFragments();
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
    } else if (cmd === '/stats') {
      addLocalMessage(`[STATS] Messages sent: ${profile?.total_messages || 0} | Fragments collected: ${profile?.fragments_collected || 0}`);
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

  const dropRandomFragment = async () => {
    try {
      const template = selectRandomFragment();
      const fragmentId = generateFragmentId();
      const expiresAt = new Date(Date.now() + 30000).toISOString(); // 30 seconds
      
      let content = template.content;
      if (template.type === 'personalized') {
        // Pick a random online user for personalization
        const randomUser = users[Math.floor(Math.random() * users.length)];
        if (randomUser) {
          content = personalizeFragment(content, randomUser.username);
        }
      }

      await authFragmentAPI.dropFragment({
        fragment_id: fragmentId,
        content,
        content_type: template.type,
        rarity: template.rarity,
        available: true,
        expires_at: expiresAt
      });
      
    } catch (error) {
      console.error('Failed to drop fragment:', error);
    }
  };

  const handleFragmentPickup = async (fragmentId: string) => {
    try {
      const fragment = await authFragmentAPI.pickupFragment(fragmentId);
      setClaimedFragment(fragment);
      setShowFragmentModal(true);
      
      // Remove from active fragments locally
      setActiveFragments(prev => prev.filter(f => f.fragment_id !== fragmentId));
    } catch (error: any) {
      console.error('Failed to pickup fragment:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message: error.message || 'Fragment pickup failed.',
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
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

  // Group consecutive connection messages
  const groupMessages = (messages: ChatMessage[]) => {
    const grouped: ChatMessage[] = [];
    let currentGroup: ChatMessage[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      if (msg.type === 'join' || msg.type === 'leave') {
        currentGroup.push(msg);
      } else {
        // If we have a group of connection messages, collapse them
        if (currentGroup.length > 2) {
          const joinCount = currentGroup.filter(m => m.type === 'join').length;
          const leaveCount = currentGroup.filter(m => m.type === 'leave').length;
          
          if (joinCount > 0 || leaveCount > 0) {
            const groupMessage: ChatMessage = {
              id: `group-${currentGroup[0].id}`,
              username: 'System',
              message: `${joinCount} users connected, ${leaveCount} users disconnected`,
              timestamp: currentGroup[currentGroup.length - 1].timestamp,
              type: 'system'
            };
            grouped.push(groupMessage);
          }
        } else {
          // Add individual messages if group is small
          grouped.push(...currentGroup);
        }
        
        currentGroup = [];
        grouped.push(msg);
      }
    }
    
    // Handle remaining group at the end
    if (currentGroup.length > 2) {
      const joinCount = currentGroup.filter(m => m.type === 'join').length;
      const leaveCount = currentGroup.filter(m => m.type === 'leave').length;
      
      if (joinCount > 0 || leaveCount > 0) {
        const groupMessage: ChatMessage = {
          id: `group-${currentGroup[0].id}`,
          username: 'System',
          message: `${joinCount} users connected, ${leaveCount} users disconnected`,
          timestamp: currentGroup[currentGroup.length - 1].timestamp,
          type: 'system'
        };
        grouped.push(groupMessage);
      }
    } else {
      grouped.push(...currentGroup);
    }
    
    return grouped;
  };

  if (!isConnected && !error) {
    return (
      <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-lg p-8" 
          style={{ 
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
            fontFamily: 'Courier New, monospace'
          }}
        >
          <div className="text-center">
            <div className="text-green-400 text-sm font-mono mb-4 animate-pulse">
              &gt;&gt; ESTABLISHING_NEURAL_CONNECTION...
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-2 md:p-4 relative">
      <div className="max-w-7xl mx-auto relative z-10 w-full">
        
        {/* Main Terminal Window */}
        <div className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-2xl relative z-20" style={{ 
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.4)',
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
                  [NEURAL_NET] {profile?.username}@scrollspace.matrix [AUTHENTICATED]
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-green-400 hidden md:inline">
                  USERS_ONLINE: {users.length} | FRAGMENTS: {activeFragments.length}
                </span>
                <span className="text-xs font-mono text-green-400 md:hidden">
                  U:{users.length} F:{activeFragments.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row h-[600px]">
            
            {/* Main Chat Terminal */}
            <div className="flex-1 bg-black/50 border-r-0 md:border-r border-green-400 flex flex-col relative">
              
              {/* Messages Terminal */}
              <div className="flex-1 overflow-y-auto p-3 text-sm font-mono relative z-10">
                <div className="mb-2 text-green-400 text-xs animate-pulse">
                  &gt;&gt;&gt; AUTHENTICATED_NEURAL_LINK_ESTABLISHED &lt;&lt;&lt;
                </div>
                <div className="mb-2 text-green-400 text-xs">
                  [SYSTEM] Welcome back to the ScrollSpace underground network, {profile?.display_name || profile?.username}.
                </div>
                <div className="mb-2 text-cyan-400 text-xs">
                  [SECURITY] Identity verified • Neural signature authenticated • ICE protection active
                </div>
                
                <AnimatePresence>
                  {groupMessages(messages).map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-1"
                    >
                      {msg.type === 'message' && (
                        <div className="flex">
                          <span className="text-cyan-400 text-xs mr-1">[{formatTime(msg.timestamp)}]</span>
                          <span className={msg.user_id === user?.id ? 'text-yellow-400 font-bold' : 'text-cyan-400 font-bold'}>
                            {msg.user_profile?.display_name || msg.username}@net:
                          </span>
                          <span className="text-green-300 ml-1">{msg.message}</span>
                        </div>
                      )}
                      {msg.type === 'join' && (
                        <div className="text-green-400/60 text-xs italic opacity-70">
                          + {msg.message.replace(' has entered the chat', '')} connected
                        </div>
                      )}
                      {msg.type === 'leave' && (
                        <div className="text-red-400/60 text-xs italic opacity-70">
                          - {msg.message.replace(' has left the chat', '')} disconnected
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
            <div className="w-full md:w-64 bg-black border-t md:border-t-0 border-l-0 md:border-l border-green-400 h-32 md:h-auto">
              <div className="bg-black border-b border-green-400 p-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent"></div>
                <h3 className="text-xs font-mono text-green-400 tracking-wider relative z-10">
                  [AUTHENTICATED_NODES: {users.length}]
                </h3>
              </div>
              
              <div className="h-full overflow-y-auto p-2 flex md:block gap-2 overflow-x-auto md:overflow-x-visible">
                {users.map((user) => (
                  <motion.div 
                    key={user.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-0 md:mb-2 flex items-center space-x-2 p-1 border border-transparent hover:border-green-400/30 transition-all whitespace-nowrap md:whitespace-normal"
                  >
                    <div className={`w-1 h-1 rounded-full animate-pulse ${getStatusColor(user.status)}`}></div>
                    <span className={`text-xs font-mono ${
                      user.id === profile?.id ? 'text-yellow-400 font-bold' : 'text-cyan-400'
                    }`}>
                      {user.display_name || user.username}
                      {user.id === profile?.id && '@self'}
                    </span>
                  </motion.div>
                ))}
                {users.length === 0 && (
                  <div className="text-gray-500 text-xs font-mono text-center py-4 opacity-60">
                    [NO_AUTHENTICATED_NODES]
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Terminal */}
        <div className="mt-2 text-xs text-green-400 font-mono text-center opacity-80">
          [STATUS] AUTHENTICATED_CONNECTION_ACTIVE | ENCRYPTION_LEVEL_5 | USER_VERIFIED
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

export default AuthChatRoom;