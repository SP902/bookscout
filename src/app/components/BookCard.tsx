import React from 'react';
import type { Book } from '../../../lib/types';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  className?: string;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick, className = '' }) => (
  <div
    className={`h-48 bg-white/10 dark:bg-black/30 rounded-2xl shadow-glass flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer group animate-fade-in ${className}`}
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-label={`View details for ${book.title}`}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
  >
    <div className="w-20 h-28 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
      {book.cover_image_url || book.thumbnail_url ? (
        <img
          src={book.cover_image_url || book.thumbnail_url || ''}
          alt={book.title || 'Book cover'}
          className="w-full h-full object-cover rounded-xl"
          loading="lazy"
        />
      ) : (
        <svg className="w-10 h-10 text-primary/70 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 32 32"><path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z"/></svg>
      )}
    </div>
    <span className="text-lg font-semibold text-white/90 text-center line-clamp-2">{book.title}</span>
    {book.authors && <span className="text-xs text-white/60 text-center line-clamp-1">{book.authors.join(', ')}</span>}
  </div>
);

export default BookCard; 