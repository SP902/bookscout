import React, { createContext, useContext, ReactNode } from 'react';

interface TrackingContextType {
  shouldEnableTracking: boolean;
  isAuthenticated: boolean;
  currentMode: 'Fresh' | 'Smart';
  isTrackingEnabled: boolean;
}

const TrackingContext = createContext<TrackingContextType>({
  shouldEnableTracking: false,
  isAuthenticated: false,
  currentMode: 'Fresh',
  isTrackingEnabled: false,
});

interface TrackingProviderProps {
  children: ReactNode;
  user: any;
  mode: 'Fresh' | 'Smart';
}

export const TrackingProvider: React.FC<TrackingProviderProps> = ({ children, user, mode }) => {
  const isAuthenticated = !!user;
  const shouldEnableTracking = isAuthenticated && mode === 'Smart';
  const isTrackingEnabled = shouldEnableTracking;

  return (
    <TrackingContext.Provider value={{
      shouldEnableTracking,
      isAuthenticated,
      currentMode: mode,
      isTrackingEnabled,
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}; 