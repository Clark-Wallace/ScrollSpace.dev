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
      <pre style={{ background: 'black', color: 'green', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
        {JSON.stringify(signalJson, null, 2)}
      </pre>
    );
  }

  return (
    <article className="prose prose-lg max-w-4xl mx-auto">
      <div dangerouslySetInnerHTML={{ __html: scrollHtml }} />
    </article>
  );
};

export default ScrollBridge;