// /components/KajiPanel.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KajiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: string;
  project?: string;
  question?: string;
}

const KajiPanel: React.FC<KajiPanelProps> = ({ isOpen, onClose, zone, project, question }) => {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchGuidance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (zone) params.append('zone', zone);
      if (project) params.append('project', project);
      if (question) params.append('question', question);

      const response = await fetch(`/api/guide?${params.toString()}`);
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('Connection to guide lost. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGuidance();
    }
  }, [isOpen, zone, project, question]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: '100%', x: '-50%', opacity: 0 }}
            animate={{ y: '-20px', x: '-50%', opacity: 1 }}
            exit={{ y: '100%', x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 150 }}
            className="fixed bottom-4 left-1/2 transform w-[420px] max-w-[90vw] z-50"
          >
            <div className="relative bg-gradient-to-b from-amber-50/95 to-yellow-100/95 backdrop-blur-md rounded-none shadow-2xl border-2 border-amber-700/60 overflow-hidden"
                 style={{
                   borderRadius: '8px 8px 24px 24px',
                   boxShadow: '0 0 40px rgba(217, 119, 6, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                 }}>
              
              {/* Ancient parchment texture */}
              <div className="absolute inset-0 opacity-20">
                <div 
                  className="w-full h-full" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D97706' fill-opacity='0.15'%3E%3Cpath d='M30 30c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm20 0c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z'/%3E%3Cpath d='M0 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S0 35.523 0 30zm50 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-4.477 10-10 10z'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}
                />
              </div>

              {/* Mystical glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-300/10 via-yellow-200/10 to-amber-300/10 animate-pulse" 
                   style={{ animationDuration: '4s' }} />
              
              {/* Scroll header with ancient styling */}
              <div className="relative p-6 border-b border-amber-600/30">
                <div className="text-center">
                  <div className="text-4xl mb-2 filter drop-shadow-lg" style={{ 
                    textShadow: '0 0 20px rgba(217, 119, 6, 0.5)' 
                  }}>
                    ⟨ ☾ ⟩
                  </div>
                  <h3 className="font-serif text-amber-900 text-lg tracking-wide" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    letterSpacing: '0.05em'
                  }}>
                    Ancient Guidance
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-200/50 hover:bg-amber-300/70 transition-all duration-300 flex items-center justify-center text-amber-800 text-lg font-light"
                  style={{ backdropFilter: 'blur(4px)' }}
                >
                  ×
                </button>
              </div>
              
              {/* Content with glowing serif */}
              <div className="relative p-8">
                {loading ? (
                  <div className="text-center">
                    <div className="inline-flex space-x-1 mb-4">
                      <div className="w-1 h-1 bg-amber-600 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '2s' }} />
                      <div className="w-1 h-1 bg-amber-600 rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '2s' }} />
                      <div className="w-1 h-1 bg-amber-600 rounded-full animate-pulse" style={{ animationDelay: '800ms', animationDuration: '2s' }} />
                    </div>
                    <p className="text-amber-700/70 font-serif italic text-sm tracking-wide">
                      The spirits whisper...
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="text-center"
                  >
                    <p className="font-serif text-amber-900 leading-relaxed text-base"
                       style={{
                         fontFamily: 'Georgia, "Times New Roman", serif',
                         textShadow: '0 0 10px rgba(217, 119, 6, 0.3)',
                         letterSpacing: '0.02em',
                         lineHeight: '1.8'
                       }}>
                      {message}
                    </p>
                  </motion.div>
                )}
              </div>
              
              {/* Decorative scroll flourishes */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
              
              {/* Corner ornaments */}
              <div className="absolute top-2 left-2 text-amber-600/30 text-xs">✦</div>
              <div className="absolute top-2 right-2 text-amber-600/30 text-xs">✦</div>
              <div className="absolute bottom-2 left-2 text-amber-600/30 text-xs">✧</div>
              <div className="absolute bottom-2 right-2 text-amber-600/30 text-xs">✧</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KajiPanel;