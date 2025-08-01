// /hooks/useAgentMode.ts
export default function useAgentMode(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.userAgent.includes('AI-Agent') || window.location.search.includes('agentMode=true');
}