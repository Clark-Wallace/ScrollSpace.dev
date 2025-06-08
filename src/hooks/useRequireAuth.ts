import { useEffect } from 'react';
import { useAuth } from './useAuth';

interface UseRequireAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { user, profile, loading } = useAuth();
  const { redirectTo = '/auth/login', redirectIfFound = false } = options;

  useEffect(() => {
    if (loading) return;

    const shouldRedirect = redirectIfFound ? !!user : !user;
    
    if (shouldRedirect) {
      // In a client-side environment, you would use your router here
      // For Astro, this might involve setting window.location or using navigate
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [user, loading, redirectTo, redirectIfFound]);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
  };
};

export default useRequireAuth;