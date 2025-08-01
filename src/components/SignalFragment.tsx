import React from 'react';
import { motion } from 'framer-motion';
import { getRarityColor, getRarityEffect } from '../lib/fragmentContent';

interface SignalFragmentProps {
  fragmentId: string;
  rarity: 'common' | 'rare' | 'encrypted' | 'corrupted';
  isAvailable: boolean;
  onClick: () => void;
  onExpire?: () => void;
}

const SignalFragment: React.FC<SignalFragmentProps> = ({ 
  fragmentId, 
  rarity, 
  isAvailable, 
  onClick,
  onExpire 
}) => {
  const rarityColor = getRarityColor(rarity);
  const rarityEffect = getRarityEffect(rarity);

  React.useEffect(() => {
    // Auto-expire after 30 seconds if not claimed
    if (isAvailable) {
      const timer = setTimeout(() => {
        onExpire?.();
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [isAvailable, onExpire]);

  if (!isAvailable) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="text-gray-600 text-xs font-mono italic"
      >
        [FRAGMENT_{fragmentId}_CLAIMED]
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateX: -90 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.6 
      }}
      className={`
        relative border border-green-400 p-2 my-2 
        bg-gradient-to-r from-black/80 to-green-900/20 
        hover:from-green-900/30 hover:to-black/80
        cursor-pointer transition-all duration-300
        ${rarityEffect}
      `}
      style={{
        boxShadow: `
          0 0 10px rgba(0, 255, 65, 0.3),
          inset 0 0 10px rgba(0, 255, 65, 0.1),
          0 0 30px rgba(0, 255, 65, ${rarity === 'rare' ? '0.6' : '0.2'})
        `,
        borderStyle: rarity === 'corrupted' ? 'dashed' : 'solid'
      }}
      onClick={onClick}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.8)' 
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glitch overlay for corrupted fragments */}
      {rarity === 'corrupted' && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              x: [0, 2, -2, 0],
              opacity: [0.5, 0.8, 0.3, 0.5]
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute inset-0 bg-red-500/10"
          />
        </div>
      )}
      
      {/* Encrypted pattern for encrypted fragments */}
      {rarity === 'encrypted' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 w-4 h-4 border border-purple-400"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(147, 51, 234, 0.3), transparent)'
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-mono ${rarityColor} tracking-wider`}>
            [SIGNAL_FRAGMENT_DETECTED]
          </span>
          <span className={`text-xs font-mono ${rarityColor}`}>
            {rarity.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${
              rarity === 'common' ? 'bg-green-400' :
              rarity === 'rare' ? 'bg-blue-400' :
              rarity === 'encrypted' ? 'bg-purple-400' :
              'bg-red-400'
            }`}
          />
          <span className={`text-sm font-mono ${rarityColor} tracking-wide`}>
            ID#{fragmentId}
          </span>
        </div>
        
        <div className="mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              text-xs font-mono px-2 py-1 border border-green-400 
              hover:bg-green-400/20 transition-colors
              ${rarityColor}
            `}
            style={{ borderStyle: 'outset' }}
          >
            /pickup
          </motion.button>
        </div>
      </div>

      {/* Expiration timer */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 30, ease: "linear" }}
        className="absolute bottom-0 left-0 h-0.5 bg-green-400/50"
      />
      
      {/* Scanlines effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 255, 65, 0.1) 1px, rgba(0, 255, 65, 0.1) 2px)'
        }}
      />
    </motion.div>
  );
};

export default SignalFragment;