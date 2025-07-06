import React from 'react';
import { useViewportTracking } from '../hooks/useViewportTracking';
import { useAuth } from '../hooks/useAuth';

const ViewportTrackingDebug: React.FC = () => {
  const { isTracking, visibleBooksCount, batchQueueSize } = useViewportTracking();
  const { currentMode } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Mode: {currentMode}</div>
      <div>Tracking: {isTracking ? 'ON' : 'OFF'}</div>
      <div>Visible: {visibleBooksCount}</div>
      <div>Queue: {batchQueueSize}</div>
    </div>
  );
};

export default ViewportTrackingDebug; 