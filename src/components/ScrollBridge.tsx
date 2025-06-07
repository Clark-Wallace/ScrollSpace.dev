// /src/components/ScrollBridge.tsx
import { useState, useEffect } from 'react';

interface ScrollBridgeProps {
  scrollHtml: string;
  signalJson: any;
}

function useAgentMode(): boolean {
  const [isAgent, setIsAgent] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const agentMode = navigator.userAgent.includes('AI-Agent') || window.location.search.includes('agentMode=true');
    setIsAgent(agentMode);
  }, []);
  
  return isAgent;
}

const ScrollBridge: React.FC<ScrollBridgeProps> = ({ scrollHtml, signalJson }) => {
  const isAgent = useAgentMode();

  if (isAgent) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black border border-green-500 rounded-lg p-6 font-mono">
          <div className="text-green-400 text-sm mb-2">// AI_SIGNAL_OUTPUT</div>
          <pre className="text-green-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(signalJson, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <article className="prose prose-lg max-w-4xl mx-auto prose-invert">
      <div 
        className="font-mono text-gray-200 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: scrollHtml }} 
      />
    </article>
  );
};

export default ScrollBridge;