import React, { useState, useEffect } from 'react';
import SimpleAuth from './SimpleAuth';
import SimpleChatRoom from './SimpleChatRoom';

const SimpleChatApp: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isInChat, setIsInChat] = useState(false);

  // Check for existing username on mount
  useEffect(() => {
    console.log('SimpleChatApp mounted, checking localStorage...');
    const savedUsername = localStorage.getItem('scrollspace_username');
    console.log('Saved username:', savedUsername);
    if (savedUsername) {
      setUsername(savedUsername);
      setIsInChat(true);
    }
  }, []);

  const handleJoin = (newUsername: string) => {
    console.log('Joining with username:', newUsername);
    setUsername(newUsername);
    setIsInChat(true);
  };

  const handleLeave = () => {
    console.log('Leaving chat...');
    localStorage.removeItem('scrollspace_username');
    setUsername('');
    setIsInChat(false);
  };

  console.log('SimpleChatApp render - isInChat:', isInChat, 'username:', username);

  if (!isInChat) {
    return <SimpleAuth onJoin={handleJoin} />;
  }

  return <SimpleChatRoom username={username} onLeave={handleLeave} />;
};

export default SimpleChatApp;