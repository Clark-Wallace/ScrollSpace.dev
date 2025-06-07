// /components/ScrollBridge.tsx
import useAgentMode from '../hooks/useAgentMode';
import type { FC } from 'react';

interface ScrollBridgeProps {
  scrollHtml: JSX.Element;
  signalJson: any;
}

const ScrollBridge: FC<ScrollBridgeProps> = ({ scrollHtml, signalJson }) => {
  const isAgent = useAgentMode();

  if (isAgent) {
    return (
      <pre style={{ background: 'black', color: 'green', padding: '1rem' }}>
        {JSON.stringify(signalJson, null, 2)}
      </pre>
    );
  }

  return scrollHtml;
};

export default ScrollBridge;