import React from 'react';

interface NavigationBarProps {
  showBack?: boolean;
  backUrl?: string;
  backLabel?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  showBack = true, 
  backUrl = '/park',
  backLabel = 'Back to Park'
}) => {
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use regular navigation without transition for back button
    window.location.href = backUrl;
  };

  return (
    <nav className="fixed top-4 left-4 z-40">
      {showBack && (
        <a
          href={backUrl}
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 bg-gray-900/80 backdrop-blur-sm border border-green-500/30 hover:border-green-400 text-green-400 hover:text-green-300 font-mono text-sm transition-all duration-300 group"
        >
          <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
          {backLabel}
        </a>
      )}
    </nav>
  );
};

export default NavigationBar;