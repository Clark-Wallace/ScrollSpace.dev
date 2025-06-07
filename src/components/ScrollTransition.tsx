import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollTransitionProps {
  children: React.ReactNode;
}

type TransitionType = 'pulse' | 'curtain' | 'fold';

const ScrollTransition: React.FC<ScrollTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType] = useState<TransitionType>('fold'); // Default to scroll fold effect
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    // Hook into link clicks to trigger transitions
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && !link.href.startsWith('#') && !link.href.includes('mailto:') && !link.href.includes('tel:')) {
        // Check if it's an internal link
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          
          startTransition(link.href);
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleLinkClick, true);
    
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, []);

  const startTransition = (href: string) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setPendingNavigation(href);
    
    // Play transition sound if audio is enabled
    playTransitionSound();
    
    // Navigate after transition animation
    setTimeout(() => {
      window.location.href = href;
    }, 400);
  };

  const playTransitionSound = () => {
    try {
      // Create a subtle paper flutter sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a brief noise burst for paper flutter effect
      const duration = 0.3;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate paper flutter sound (filtered noise with envelope)
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 8) * Math.sin(t * 1000 * Math.PI);
        const noise = (Math.random() - 0.5) * 0.1;
        data[i] = envelope * noise;
      }
      
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = 0.05; // Very quiet
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start();
    } catch (error) {
      // Silently fail if audio context is not available
    }
  };

  const renderTransition = () => {
    switch (transitionType) {
      case 'pulse':
        return (
          <motion.div
            className="fixed inset-0 bg-black z-[9999] flex items-center justify-center pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(0, 0, 0, 0.9) 70%)'
            }}
          >
            <motion.div
              className="w-32 h-32 rounded-full border border-blue-400"
              animate={{ scale: [1, 2, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </motion.div>
        );
        
      case 'curtain':
        return (
          <motion.div
            className="fixed inset-0 bg-black z-[9999] pointer-events-none"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ transformOrigin: 'top' }}
          />
        );
        
      case 'fold':
      default:
        return (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* Large expanding circle */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border-2 border-green-400"
              style={{ 
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 8],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut"
              }}
            />
            
            {/* Central glyph that grows and fades */}
            <motion.div
              className="absolute top-1/2 left-1/2 text-6xl text-green-400 font-mono"
              style={{ 
                transform: 'translate(-50%, -50%)',
                textShadow: '0 0 30px rgba(34, 197, 94, 0.8)'
              }}
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                rotate: [0, 360],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 0.6,
                ease: "easeInOut"
              }}
            >
              ◈
            </motion.div>
            
            {/* Radiating lines */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 bg-gradient-to-t from-transparent via-green-400 to-transparent"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                  transformOrigin: 'center top',
                  height: '40vh'
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ 
                  scaleY: [0, 1, 0],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  delay: i * 0.03,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        );
    }
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {isTransitioning && renderTransition()}
      </AnimatePresence>
    </>
  );
};

export default ScrollTransition;