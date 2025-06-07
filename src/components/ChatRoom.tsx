import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI, type ChatMessage, type ChatUser } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const messageSubscription = useRef<RealtimeChannel | null>(null);
  const userSubscription = useRef<RealtimeChannel | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when joined
  useEffect(() => {
    if (isJoined && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isJoined]);

  // Load initial chat data and set up subscriptions
  useEffect(() => {
    loadInitialData();
    
    return () => {
      // Clean up subscriptions
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
      if (userSubscription.current) {
        userSubscription.current.unsubscribe();
      }
    };
  }, []);

  // Handle leaving chat when component unmounts or user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isJoined && username) {
        chatAPI.leaveChat(username);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isJoined && username) {
        // Page is hidden, user might be leaving
        chatAPI.updateUserStatus(username, 'away');
      } else if (!document.hidden && isJoined && username) {
        // Page is visible again
        chatAPI.updateUserStatus(username, 'online');
        chatAPI.updateHeartbeat(username);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (isJoined && username) {
        chatAPI.leaveChat(username);
      }
    };
  }, [isJoined, username]);

  // Set up heartbeat and cleanup intervals when user joins
  useEffect(() => {
    if (isJoined && username) {
      // Send heartbeat every 30 seconds
      heartbeatInterval.current = setInterval(() => {
        chatAPI.updateHeartbeat(username);
      }, 30000);

      // Clean up inactive users every 2 minutes
      cleanupInterval.current = setInterval(() => {
        chatAPI.cleanupInactiveUsers();
      }, 120000);
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [isJoined, username]);

  const loadInitialData = async () => {
    try {
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

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to connect to chat server. Please check your connection and Supabase configuration.');
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
  };

  const joinChat = async () => {
    if (!username.trim()) {
      alert('Please enter a callsign!');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await chatAPI.joinChat(username);
      setIsJoined(true);
    } catch (error: any) {
      console.error('Failed to join chat:', error);
      if (error.message === 'Username already taken') {
        alert('Callsign already in use! Choose another identity.');
      } else {
        setError('Neural link failed. Check matrix connection.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveChat = async () => {
    try {
      await chatAPI.leaveChat(username);
    } catch (error) {
      console.error('Error leaving chat:', error);
    } finally {
      setIsJoined(false);
      setUsername('');
    }
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
      await chatAPI.sendMessage(username, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the message to the input if it failed
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
      setMessages(prev => [...prev, { ...localMessage, timestamp: new Date(localMessage.timestamp) }]);
    };
    
    if (cmd === '/help') {
      addLocalMessage('[SYS] Available protocols: /help, /users, /time, /clear, /away, /back, /cleanup, /matrix');
    } else if (cmd === '/users') {
      const userList = users.map(u => `${u.username} (${u.status})`).join(', ');
      addLocalMessage(`[NET] Active nodes: ${userList}`);
    } else if (cmd === '/time') {
      addLocalMessage(`[CLOCK] Matrix time: ${new Date().toLocaleString()}`);
    } else if (cmd === '/clear') {
      setMessages([]);
      addLocalMessage('[SYS] Terminal buffer cleared');
    } else if (cmd === '/away') {
      try {
        await chatAPI.updateUserStatus(username, 'away');
        addLocalMessage('[STATUS] Stealth mode: ACTIVE');
      } catch (error) {
        addLocalMessage('[ERROR] Status update failed');
      }
    } else if (cmd === '/back') {
      try {
        await chatAPI.updateUserStatus(username, 'online');
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
    } else {
      addLocalMessage('[ERROR] Unknown protocol. Type /help for available commands.');
    }
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

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-transparent text-white p-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-lg" 
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
                  [SECURE_NET] SCROLLSPACE_TERMINAL v2.1.98
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-black/50 relative">
              {/* Scanlines Effect */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.03) 2px, rgba(0, 255, 65, 0.03) 4px)'
              }}></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  <div className="text-green-400 text-xs font-mono mb-2 animate-pulse">
                    &gt;&gt; NEURAL_LINK_ESTABLISHED
                  </div>
                  <h2 className="text-sm font-mono text-green-400 mb-1 tracking-wider">
                    === ENTER THE NET ===
                  </h2>
                  <div className="text-xs text-green-300 font-mono opacity-80">
                    Matrix protocol active | ICE firewall bypassed
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-mono text-green-400 mb-1 tracking-wider">
                      &gt; CALLSIGN_INPUT:
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isConnecting && joinChat()}
                      className="w-full px-2 py-1 bg-black border border-green-400 text-green-400 text-sm font-mono focus:border-green-300 focus:outline-none focus:shadow-lg" 
                      style={{ 
                        borderStyle: 'inset',
                        boxShadow: 'inset 0 0 10px rgba(0, 255, 65, 0.2)'
                      }}
                      placeholder="enter_callsign..."
                      maxLength={20}
                      disabled={isConnecting}
                    />
                  </div>
                  
                  <motion.button
                    onClick={joinChat}
                    disabled={isConnecting}
                    className="w-full bg-black hover:bg-green-900/30 border border-green-400 text-green-400 font-mono py-2 text-sm transition-all duration-200"
                    style={{ 
                      borderStyle: 'outset',
                      boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
                    }}
                    whileHover={{ 
                      scale: isConnecting ? 1 : 1.02,
                      boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isConnecting ? '&gt;&gt; ESTABLISHING_LINK...' : '&gt;&gt; JACK_IN'}
                  </motion.button>
                  
                  {error && (
                    <div className="text-red-400 text-xs font-mono text-center border border-red-400 p-2 bg-red-900/20 animate-pulse">
                      ERROR: {error.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center text-xs text-green-400 font-mono opacity-60">
                  <div className="border-t border-green-400/30 pt-2">
                    <p>[ NETIQUETTE_PROTOCOLS_ACTIVE ]</p>
                    <p className="mt-1">Signal spirits monitoring • ICE protection enabled</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 relative">
      {/* Background Scanlines */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.02) 2px, rgba(0, 255, 65, 0.02) 4px)',
          zIndex: 1
        }}
      ></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Main Terminal Window */}
        <div className="bg-black/80 backdrop-blur-sm border border-green-400 shadow-2xl relative z-20" style={{ 
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.4), inset 1px 1px 0px rgba(0, 255, 65, 0.2), inset -1px -1px 0px rgba(0, 0, 0, 0.8)',
          fontFamily: 'Courier New, monospace'
        }}>
          
          {/* Terminal Header */}
          <div className="bg-black border-b border-green-400 p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-mono text-green-400 tracking-wider">
                  [NEURAL_NET] {username}@scrollspace.matrix
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-green-400">
                  USERS_ONLINE: {users.length} | SIGNAL_STRENGTH: 98%
                </span>
                <motion.button
                  onClick={leaveChat}
                  className="bg-black hover:bg-red-900/50 border border-red-400 text-red-400 px-2 py-1 text-xs font-mono transition-all"
                  style={{ 
                    borderStyle: 'outset',
                    boxShadow: '0 0 5px rgba(255, 0, 0, 0.3)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  DISCONNECT
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex h-[600px]">
            
            {/* Main Chat Terminal */}
            <div className="flex-1 bg-black/50 border-r border-green-400 flex flex-col relative">
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
                  [SYSTEM] Welcome to the ScrollSpace underground network, choom.
                </div>
                <div className="mb-2 text-cyan-400 text-xs">
                  [ICE] Firewall status: BYPASSED | Trace protection: ACTIVE
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
                          <span className={msg.username === username ? 'text-yellow-400 font-bold' : 'text-cyan-400 font-bold'}>
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
            <div className="w-64 bg-black border border-green-400" style={{ borderStyle: 'inset' }}>
              <div className="bg-black border-b border-green-400 p-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent"></div>
                <h3 className="text-xs font-mono text-green-400 tracking-wider relative z-10">
                  [ACTIVE_NODES: {users.length}]
                </h3>
              </div>
              
              <div className="h-full overflow-y-auto p-2">
                {users.map((user) => (
                  <motion.div 
                    key={user.username} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-2 flex items-center space-x-2 p-1 border border-transparent hover:border-green-400/30 transition-all"
                  >
                    <div className={`w-1 h-1 rounded-full animate-pulse ${
                      user.status === 'online' ? 'bg-green-400' :
                      user.status === 'away' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <span className={`text-xs font-mono ${
                      user.username === username ? 'text-yellow-400 font-bold' : 'text-cyan-400'
                    }`}>
                      {user.username}
                      {user.username === username && '@local'}
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
          [STATUS] MATRIX_CONNECTION_STABLE | ENCRYPTION_LEVEL_5 | SIGNAL_SPIRITS_MONITORING
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;