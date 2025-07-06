import React, { useRef, useEffect } from 'react';
import type { Book } from '../../../lib/types';
import { useViewportTracking } from '../hooks/useViewportTracking';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  className?: string;
  position?: number; // Position in results for tracking
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick, className = '', position }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { createBookObserver, isTracking } = useViewportTracking();

  // Set up intersection observer for viewport tracking
  useEffect(() => {
    if (!isTracking || !cardRef.current) return;

    const observer = createBookObserver(book.isbn_13, book, position);
    if (observer) {
      observer.observe(cardRef.current);
      return () => observer.disconnect();
    }
  }, [isTracking, createBookObserver, book, position]);

  return (
    <div
      ref={cardRef}
      className={`group relative cursor-pointer ${className}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${book.title}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
      
      {/* Card content */}
      <div className="relative h-64 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:shadow-primary/20 transition-all duration-300 group-hover:scale-105">
        
        {/* Book cover */}
        <div className="relative w-24 h-32 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300">
          {book.cover_image_url || book.thumbnail_url ? (
            <img
              src={book.cover_image_url || book.thumbnail_url || ''}
              alt={book.title || 'Book cover'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 32 32">
                <path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z"/>
              </svg>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Book info */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-white/90 line-clamp-2 group-hover:text-white transition-colors duration-300">
            {book.title}
          </h3>
          {book.authors && (
            <p className="text-sm text-white/70 line-clamp-1 group-hover:text-white/80 transition-colors duration-300">
              {book.authors.join(', ')}
            </p>
          )}
          {book.genre && (
            <div className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-xs text-white/80">{book.genre}</span>
            </div>
          )}
        </div>
        
        {/* Rating if available */}
        {book.average_rating && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(book.average_rating!) ? 'text-yellow-400' : 'text-white/20'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-white/60">({book.average_rating})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard; 