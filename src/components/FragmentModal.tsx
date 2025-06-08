import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRarityColor } from '../lib/fragmentContent';
import type { SignalFragment } from '../lib/supabase';

interface FragmentModalProps {
  isOpen: boolean;
  fragment: SignalFragment | null;
  onClose: () => void;
}

const FragmentModal: React.FC<FragmentModalProps> = ({ isOpen, fragment, onClose }) => {
  if (!fragment) return null;

  const rarityColor = getRarityColor(fragment.rarity);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className={`
                bg-black/90 border border-green-400 max-w-md w-full p-6
                relative overflow-hidden
              `}
              style={{
                boxShadow: `
                  0 0 30px rgba(0, 255, 65, 0.6),
                  inset 1px 1px 0px rgba(0, 255, 65, 0.2),
                  inset -1px -1px 0px rgba(0, 0, 0, 0.8)
                `,
                fontFamily: 'Courier New, monospace'
              }}
            >
              {/* Glitch effect for corrupted fragments */}
              {fragment.rarity === 'corrupted' && (
                <motion.div
                  animate={{
                    x: [0, 3, -3, 0],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 0.15,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="absolute inset-0 bg-red-500/10 pointer-events-none"
                />
              )}

              {/* Header */}
              <div className="border-b border-green-400 pb-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs font-mono text-green-400 tracking-wider">
                    DATA_SHARD_TERMINAL
                  </span>
                </div>
              </div>

              {/* Fragment Info */}
              <div className="mb-4">
                <div className={`text-xs font-mono ${rarityColor} mb-2 tracking-wider`}>
                  [FRAGMENT_ID: {fragment.fragment_id}]
                </div>
                <div className="flex items-center space-x-4 text-xs font-mono text-gray-400">
                  <span>TYPE: {fragment.content_type.toUpperCase()}</span>
                  <span>RARITY: {fragment.rarity.toUpperCase()}</span>
                </div>
              </div>

              {/* Content */}
              <div className="bg-black/50 border border-green-400/50 p-4 mb-4 relative">
                <div className="text-xs font-mono text-green-400 mb-2 opacity-60">
                  --- DATA_SHARD_CONTENT ---
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-sm font-mono ${rarityColor} leading-relaxed`}
                >
                  {fragment.rarity === 'corrupted' ? (
                    <motion.span
                      animate={{ 
                        textShadow: [
                          '0 0 0px rgba(255,0,0,0)',
                          '2px 0 0px rgba(255,0,0,0.8)',
                          '0 0 0px rgba(255,0,0,0)'
                        ]
                      }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    >
                      {fragment.content}
                    </motion.span>
                  ) : (
                    fragment.content
                  )}
                </motion.div>
                
                <div className="text-xs font-mono text-green-400 mt-2 opacity-60">
                  -------------------------
                </div>

                {/* Scanlines */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.1) 2px, rgba(0, 255, 65, 0.1) 4px)'
                  }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>
                  CLAIMED: {new Date(fragment.claimed_at || '').toLocaleTimeString()}
                </span>
                <motion.button
                  onClick={onClose}
                  className="bg-black hover:bg-red-900/30 border border-red-400 text-red-400 px-3 py-1 transition-all"
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
                  CLOSE
                </motion.button>
              </div>

              {/* Matrix rain effect for encrypted fragments */}
              {fragment.rarity === 'encrypted' && (
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  {Array.from({length: 10}).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [-20, 300],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "linear"
                      }}
                      className="absolute text-purple-400 text-xs font-mono"
                      style={{ left: `${i * 10}%` }}
                    >
                      {Math.random().toString(36).substr(2, 1)}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FragmentModal;