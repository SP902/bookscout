import { useContext } from 'react';
import { AuthContext, ModeContext } from '../layout';

export const useAuth = () => {
  const { user, loading } = useContext(AuthContext);
  const { mode } = useContext(ModeContext);
  
  // Check if user is in Smart Mode (authenticated and current mode is Smart)
  const isSmartMode = user && mode === 'Smart';
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    isSmartMode,
    currentMode: mode,
  };
}; 