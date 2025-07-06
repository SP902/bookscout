import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useTracking } from '../contexts/TrackingContext';
import { AuthContext } from '../layout';
import type { Book } from '../../../lib/types';

interface ViewportEvent {
  bookId: string;
  bookData: Book;
  duration_ms?: number;
  scroll_depth_percent?: number;
  position_in_results?: number;
  timestamp: number;
}

interface ViewportBatch {
  userId: string;
  sessionId: string;
  currentMode: 'Fresh' | 'Smart';
  events: ViewportEvent[];
}

export const useViewportTracking = () => {
  const { shouldEnableTracking, isAuthenticated, currentMode } = useTracking();
  const { user } = useContext(AuthContext);
  const [visibleBooks, setVisibleBooks] = useState<Set<string>>(new Set());
  const [batchQueue, setBatchQueue] = useState<ViewportEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const bookTimersRef = useRef<Map<string, { startTime: number; timer: NodeJS.Timeout }>>(new Map());

  // Only track if tracking is enabled (authenticated Smart Mode users)
  const shouldTrack = shouldEnableTracking;

  // Send batch to backend
  const sendBatch = useCallback(async (events: ViewportEvent[]) => {
    if (!shouldTrack || events.length === 0) return;

    try {
      const batch: ViewportBatch = {
        userId: user!.id,
        sessionId: sessionIdRef.current,
        currentMode: currentMode,
        events: events.map(event => ({
          bookId: event.bookId,
          bookData: event.bookData,
          duration_ms: event.duration_ms,
          scroll_depth_percent: event.scroll_depth_percent,
          position_in_results: event.position_in_results,
          timestamp: event.timestamp,
        }))
      };

      const response = await fetch('/api/track-viewport-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error('Failed to send viewport batch:', await response.text());
      } else {
        console.log(`Successfully sent ${events.length} viewport events`);
      }
    } catch (error) {
      console.error('Error sending viewport batch:', error);
    }
  }, [shouldTrack, currentMode, user]);

  // Schedule batch sending
  const scheduleBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      setBatchQueue(currentQueue => {
        if (currentQueue.length > 0) {
          sendBatch([...currentQueue]);
          return [];
        }
        return currentQueue;
      });
    }, 30000); // 30 seconds
  }, [sendBatch]);

  // Track when a book becomes visible
  const trackBookVisible = useCallback((bookId: string, bookData: Book, position?: number) => {
    if (!shouldTrack || visibleBooks.has(bookId)) return;

    setVisibleBooks(prev => new Set(prev).add(bookId));
    
    // Start timer for this book
    const startTime = Date.now();
    const timer = setTimeout(() => {
      // Calculate duration and add to batch
      const duration_ms = Date.now() - startTime;
      const scroll_depth_percent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      
      const event: ViewportEvent = {
        bookId,
        bookData,
        duration_ms,
        scroll_depth_percent,
        position_in_results: position,
        timestamp: Date.now(),
      };

      setBatchQueue(prev => [...prev, event]);
      scheduleBatch();
      
      // Clean up timer reference
      bookTimersRef.current.delete(bookId);
    }, 2000); // Track after 2 seconds of visibility

    bookTimersRef.current.set(bookId, { startTime, timer });
  }, [shouldTrack, visibleBooks, scheduleBatch]);

  // Track when a book becomes invisible
  const trackBookInvisible = useCallback((bookId: string) => {
    if (!shouldTrack) return;

    setVisibleBooks(prev => {
      const newSet = new Set(prev);
      newSet.delete(bookId);
      return newSet;
    });

    // Clear timer for this book
    const timerData = bookTimersRef.current.get(bookId);
    if (timerData) {
      clearTimeout(timerData.timer);
      bookTimersRef.current.delete(bookId);
    }
  }, [shouldTrack]);

  // Create intersection observer for a book element
  const createBookObserver = useCallback((bookId: string, bookData: Book, position?: number) => {
    if (!shouldTrack) return null;

    return new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            trackBookVisible(bookId, bookData, position);
          } else {
            trackBookInvisible(bookId);
          }
        });
      },
      {
        threshold: 0.1, // 10% of element must be visible
        rootMargin: '50px', // 50px margin for early detection
      }
    );
  }, [shouldTrack, trackBookVisible, trackBookInvisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      bookTimersRef.current.forEach(({ timer }) => clearTimeout(timer));
      bookTimersRef.current.clear();
    };
  }, []);

  // Send any remaining events when component unmounts
  useEffect(() => {
    return () => {
      if (batchQueue.length > 0) {
        sendBatch([...batchQueue]);
      }
    };
  }, [sendBatch]);

  return {
    createBookObserver,
    isTracking: shouldTrack,
    visibleBooksCount: visibleBooks.size,
    batchQueueSize: batchQueue.length,
  };
}; 