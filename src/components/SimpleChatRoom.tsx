import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface SimpleChatRoomProps {
  username: string;
  onLeave: () => void;
  isAuthenticated?: boolean;
  userId?: string;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'join' | 'leave' | 'system';
}

const SimpleChatRoom: React.FC<SimpleChatRoomProps> = ({ username, onLeave, isAuthenticated = false, userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [users, setUsers] = useState<string[]>([username]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, []);

  // Set up real-time connection
  useEffect(() => {
    let mounted = true;

    const setupConnection = async () => {
      console.log('Setting up chat connection for:', username);
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Supabase key configured:', !!supabase.supabaseKey);
      
      try {
        // Always show welcome messages first
        const welcomeMessages: ChatMessage[] = [
          {
            id: 'welcome-1',
            username: 'System',
            message: `Welcome to ScrollSpace Matrix, ${username}. Connecting...`,
            timestamp: new Date(),
            type: 'system'
          },
          {
            id: 'welcome-2',
            username: 'System',
            message: 'Type /help for available commands.',
            timestamp: new Date(),
            type: 'system'
          }
        ];
        setMessages(welcomeMessages);

        // Load recent messages from database (last 24 hours to get better user tracking)
        console.log('Loading recent messages...');
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentMessages, error } = await supabase
          .from('simple_chat_messages')
          .select('*')
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: true })
          .limit(100);
        
        console.log('Query result:', { data: recentMessages, error });

        if (error) {
          console.error('Error loading messages:', error);
          setMessages(prev => [...prev, {
            id: 'error-1',
            username: 'System',
            message: `Connection failed: ${error.message}. Running in offline mode.`,
            timestamp: new Date(),
            type: 'system'
          }]);
          return;
        }

        if (mounted && recentMessages) {
          console.log('Loaded', recentMessages.length, 'recent messages');
          const formattedMessages = recentMessages.map(msg => ({
            id: msg.id,
            username: msg.username,
            message: msg.message,
            timestamp: new Date(msg.created_at),
            type: msg.type || 'message'
          }));
          
          // Build active users list - much more aggressive approach
          const activeUsers = new Set([username]); // Start with current user
          const recentUserActivity = new Map();
          const now = Date.now();
          const ACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
          
          // Track ALL users who have any activity recently
          formattedMessages.forEach(msg => {
            const msgTime = new Date(msg.timestamp).getTime();
            const isRecent = (now - msgTime) < ACTIVE_THRESHOLD;
            
            if (msg.username && msg.username !== 'System' && isRecent) {
              if (msg.type === 'join') {
                const joiningUser = msg.message.replace(' has entered the matrix', '');
                if (joiningUser && joiningUser.trim()) {
                  activeUsers.add(joiningUser);
                  recentUserActivity.set(joiningUser, msgTime);
                }
              } else if (msg.type === 'leave') {
                const leavingUser = msg.message.replace(' has left the matrix', '');
                // Only remove if the leave message is very recent (5 minutes)
                if (leavingUser && (now - msgTime) < 5 * 60 * 1000) {
                  activeUsers.delete(leavingUser);
                }
              } else if (msg.type === 'message') {
                // Add ANY user who sent a message recently
                activeUsers.add(msg.username);
                recentUserActivity.set(msg.username, msgTime);
              }
            }
          });
          
          console.log('Recent user activity:', Object.fromEntries(recentUserActivity));
          console.log('Active users found:', Array.from(activeUsers));
          
          setUsers(Array.from(activeUsers));
          
          // Combine welcome messages with recent messages
          setMessages(prev => [...welcomeMessages, ...formattedMessages]);
        }

        // Set up real-time subscription
        console.log('Setting up real-time subscription...');
        console.log('Checking Supabase realtime capabilities...');
        
        // Test if realtime is enabled
        const channel = supabase
          .channel('simple_chat_' + Date.now()) // Unique channel name
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'simple_chat_messages'
            },
            (payload) => {
              console.log('Received new message:', payload.new);
              if (mounted) {
                const newMessage = {
                  id: payload.new.id,
                  username: payload.new.username,
                  message: payload.new.message,
                  timestamp: new Date(payload.new.created_at),
                  type: payload.new.type || 'message'
                };
                setMessages(prev => [...prev, newMessage]);
                
                // Update users list based on all message activity
                if (newMessage.type === 'join') {
                  const joiningUser = newMessage.message.replace(' has entered the matrix', '');
                  setUsers(prev => {
                    if (!prev.includes(joiningUser)) {
                      console.log('Adding user to list:', joiningUser);
                      return [...prev, joiningUser];
                    }
                    return prev;
                  });
                } else if (newMessage.type === 'leave') {
                  const leavingUser = newMessage.message.replace(' has left the matrix', '');
                  console.log('Removing user from list:', leavingUser);
                  setUsers(prev => prev.filter(user => user !== leavingUser));
                } else if (newMessage.type === 'message' && newMessage.username !== 'System') {
                  // Add message senders to users list if not already there
                  setUsers(prev => {
                    if (!prev.includes(newMessage.username)) {
                      console.log('Adding message sender to users list:', newMessage.username);
                      return [...prev, newMessage.username];
                    }
                    return prev;
                  });
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
            if (mounted && status === 'SUBSCRIBED') {
              setIsConnected(true);
              // Send join message
              sendJoinMessage();
              // Update welcome message
              setMessages(prev => prev.map(msg => 
                msg.id === 'welcome-1' 
                  ? { ...msg, message: `Welcome to ScrollSpace Matrix, ${username}. Connected!` }
                  : msg
              ));
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              if (mounted) {
                setMessages(prev => [...prev, {
                  id: 'error-2',
                  username: 'System',
                  message: 'Real-time connection failed. Messages may not sync.',
                  timestamp: new Date(),
                  type: 'system'
                }]);
              }
            }
          });

        channelRef.current = channel;

      } catch (error) {
        console.error('Failed to setup connection:', error);
        if (mounted) {
          setMessages(prev => [...prev, {
            id: 'error-3',
            username: 'System',
            message: `Setup failed: ${error.message}`,
            timestamp: new Date(),
            type: 'system'
          }]);
        }
      }
    };

    setupConnection();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (channelRef.current) {
        console.log('Cleaning up chat connection');
        sendLeaveMessage();
        channelRef.current.unsubscribe();
      }
    };
  }, [username]);

  const sendJoinMessage = async () => {
    console.log('Sending join message for:', username);
    try {
      const { data, error } = await supabase
        .from('simple_chat_messages')
        .insert({
          username: 'System',
          message: `${username} has entered the matrix`,
          type: 'join'
        })
        .select();
      
      console.log('Join message result:', { data, error });
    } catch (error) {
      console.error('Failed to send join message:', error);
    }
  };

  const sendLeaveMessage = async () => {
    try {
      await supabase
        .from('simple_chat_messages')
        .insert({
          username: 'System',
          message: `${username} has left the matrix`,
          type: 'leave'
        });
    } catch (error) {
      console.error('Failed to send leave message:', error);
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
      await supabase
        .from('simple_chat_messages')
        .insert({
          username: username,
          message: messageText,
          type: 'message'
        });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-add the message to input if failed
      setCurrentMessage(messageText);
      // Add error message locally
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message: 'Failed to send message. Check your connection.',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase();
    
    const addSystemMessage = (message: string) => {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'System',
        message,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    };
    
    if (cmd === '/help') {
      addSystemMessage('[SYS] Available commands: /help, /users, /time, /clear, /matrix, /whoami, /leave, /refresh, /status');
    } else if (cmd === '/users') {
      addSystemMessage(`[NET] Active nodes: ${users.join(', ')}`);
    } else if (cmd === '/whoami') {
      addSystemMessage(`[PROFILE] Your neural ID: ${username}`);
    } else if (cmd === '/time') {
      addSystemMessage(`[CLOCK] Matrix time: ${new Date().toLocaleString()}`);
    } else if (cmd === '/clear') {
      setMessages([]);
      addSystemMessage('[SYS] Terminal buffer cleared');
    } else if (cmd === '/matrix') {
      addSystemMessage('[SYSTEM] Welcome to the ScrollSpace Matrix, choom. Reality is just another protocol to hack.');
    } else if (cmd === '/refresh') {
      addSystemMessage('[SYS] Refreshing connection...');
      window.location.reload();
    } else if (cmd === '/status') {
      addSystemMessage(`[STATUS] Connection: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'} | Channel: ${channelRef.current ? 'ACTIVE' : 'NONE'}`);
    } else if (cmd === '/leave') {
      onLeave();
    } else {
      addSystemMessage('[ERROR] Unknown command. Type /help for available commands.');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
                <button
                  onClick={async () => {
                    await sendLeaveMessage();
                    onLeave();
                  }}
                  className="text-green-400 hover:text-green-300 text-sm font-mono mr-2"
                  title="Leave matrix"
                >
                  ← EXIT_MATRIX
                </button>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-mono text-green-400 tracking-wider">
                  [NEURAL_NET] {username}@scrollspace.matrix {isAuthenticated && '🔐'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-green-400 hidden md:inline">
                  STATUS: {isConnected ? 'CONNECTED' : 'CONNECTING...'}
                </span>
                <span className="text-xs font-mono text-green-400 md:hidden">
                  {isConnected ? 'ONLINE' : 'SYNC...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row h-[600px] md:h-[600px]">
            
            {/* Main Chat Terminal */}
            <div className="flex-1 bg-black/50 border-r-0 md:border-r border-green-400 flex flex-col relative">
              
              {/* Messages Terminal */}
              <div className="flex-1 overflow-y-auto p-3 text-sm font-mono relative z-10">
                <div className="mb-2 text-green-400 text-xs animate-pulse">
                  &gt;&gt;&gt; NEURAL_LINK_ESTABLISHED_TO: "SCROLLSPACE_MATRIX" &lt;&lt;&lt;
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
                          &gt;&gt; NEURAL_LINK_ESTABLISHED: {msg.message.replace(' has entered the matrix', '')} &lt;&lt;
                        </div>
                      )}
                      {msg.type === 'leave' && (
                        <div className="text-red-400 text-xs italic">
                          &gt;&gt; CONNECTION_TERMINATED: {msg.message.replace(' has left the matrix', '')} &lt;&lt;
                        </div>
                      )}
                      {msg.type === 'system' && (
                        <div className="text-purple-400 text-xs border-l-2 border-purple-400 pl-2">
                          {msg.message}
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
                    key={user} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-0 md:mb-2 flex items-center space-x-2 p-1 border border-transparent hover:border-green-400/30 transition-all whitespace-nowrap md:whitespace-normal"
                  >
                    <div className="w-1 h-1 rounded-full animate-pulse bg-green-400"></div>
                    <span className={`text-xs font-mono ${
                      user === username ? 'text-yellow-400 font-bold' : 'text-cyan-400'
                    }`}>
                      {user}
                      {user === username && '@local'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Terminal */}
        <div className="mt-2 text-xs text-green-400 font-mono text-center opacity-80">
          [STATUS] NEURAL_LINK_ACTIVE | IDENTITY: {username} | MATRIX_TIME: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SimpleChatRoom;