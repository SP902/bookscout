import React, { useContext, useEffect, useState } from 'react';
import type { Book } from '../../../lib/types';
import { AuthContext } from '../layout';
import { FiBookmark } from 'react-icons/fi';
import { LuSparkles, LuEyeOff } from 'react-icons/lu';

interface BookModalProps {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  positionInResults?: number;
  sessionId?: string;
  discoveryContext?: any;
}

const BookModal: React.FC<BookModalProps> = ({ open, book, onClose, positionInResults, sessionId, discoveryContext }) => {
  const { user } = useContext(AuthContext);
  const [buttonState, setButtonState] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});
  const [showToast, setShowToast] = useState<string | null>(null);

  // Track modal open as 'clicked' interaction
  useEffect(() => {
    if (open && user && book) {
      trackInteraction('clicked', book);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, book]);

  async function trackInteraction(interactionType: string, book: Book) {
    if (!user) return;
    setButtonState(s => ({ ...s, [interactionType]: 'loading' }));
    try {
      const res = await fetch('/api/track-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bookId: book.isbn_13,
          interactionType,
          bookData: book,
          position_in_results: typeof positionInResults === 'number' ? positionInResults : undefined,
          session_id: sessionId,
          discovery_context: discoveryContext,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setButtonState(s => ({ ...s, [interactionType]: 'success' }));
        setShowToast(
          interactionType === 'add_to_list' ? 'Added to Reading List!' :
          interactionType === 'show_more_like' ? "We'll show you more like this!" :
          interactionType === 'hide_similar' ? "We'll hide similar books." :
          'Interaction tracked!'
        );
        setTimeout(() => setShowToast(null), 1800);
        setTimeout(() => setButtonState(s => ({ ...s, [interactionType]: 'idle' })), 2000);
      } else {
        throw new Error(data.error || 'Failed to track interaction');
      }
    } catch (err) {
      setButtonState(s => ({ ...s, [interactionType]: 'error' }));
      setShowToast('Could not track interaction. Please try again.');
      setTimeout(() => setShowToast(null), 2000);
      setTimeout(() => setButtonState(s => ({ ...s, [interactionType]: 'idle' })), 2000);
    }
  }

  // Button config
  const buttons = [
    {
      key: 'add_to_list',
      label: 'Add to Reading List',
      icon: <FiBookmark className="w-4 h-4" />,
    },
    {
      key: 'show_more_like',
      label: 'Show More Like This',
      icon: <LuSparkles className="w-4 h-4" />,
    },
    {
      key: 'hide_similar',
      label: 'Hide Similar',
      icon: <LuEyeOff className="w-4 h-4" />,
    },
  ];

  if (!open || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-glass p-6 sm:p-10 max-w-lg w-full mx-4 flex flex-col gap-6 animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-primary text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-shrink-0 w-32 h-44 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
            {book.cover_image_url || book.thumbnail_url ? (
              <img
                src={book.cover_image_url || book.thumbnail_url || ''}
                alt={book.title || 'Book cover'}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
              />
            ) : (
              <svg className="w-12 h-12 text-primary/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 32 32"><path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z"/></svg>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <h2 className="text-2xl font-extrabold text-primary mb-1 truncate">{book.title}</h2>
            {book.authors && <div className="text-base text-white/80 font-medium truncate">by {book.authors.join(', ')}</div>}
            {book.published_date && <div className="text-xs text-white/50">Published: {book.published_date}</div>}
            {book.genre && <div className="text-xs text-white/50">Genre: {book.genre}</div>}
            {book.average_rating && <div className="text-xs text-yellow-400">★ {book.average_rating.toFixed(1)}</div>}
            {book.publisher && <div className="text-xs text-white/50">Publisher: {book.publisher}</div>}
          </div>
        </div>
        {book.description && (
          <div className="text-base text-white/90 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
            {book.description}
          </div>
        )}
        <div className="flex flex-wrap gap-3 mt-2">
          {book.categories?.map(cat => (
            <span key={cat} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{cat}</span>
          ))}
        </div>
        {/* Subtle inline interaction buttons for Smart mode only */}
        {user && (
          <div className="flex flex-row gap-2 mt-2 justify-end items-center">
            {buttons.map(btn => (
              <button
                key={btn.key}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border border-primary/30 dark:border-white/10 bg-transparent text-primary dark:text-white/80 hover:bg-primary/10 dark:hover:bg-white/5 transition-colors text-sm font-medium shadow-none focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed
                  ${buttonState[btn.key] === 'success' ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300' : ''}
                  ${buttonState[btn.key] === 'error' ? 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300' : ''}
                `}
                onClick={() => trackInteraction(btn.key, book)}
                aria-label={btn.label}
                disabled={buttonState[btn.key] === 'loading' || buttonState[btn.key] === 'success'}
              >
                {buttonState[btn.key] === 'success' ? (
                  <span className="inline-block w-4 h-4 text-green-600 dark:text-green-300">✓</span>
                ) : buttonState[btn.key] === 'loading' ? (
                  <span className="inline-block w-4 h-4 animate-spin border-2 border-primary border-t-transparent rounded-full"></span>
                ) : (
                  btn.icon
                )}
                {btn.label}
              </button>
            ))}
          </div>
        )}
        {showToast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary/90 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold animate-fade-in z-50">
            {showToast}
          </div>
        )}
      </div>
      <style jsx global>{`
        .animate-modal-in { animation: modalIn 0.25s cubic-bezier(0.4,0,0.2,1); }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default BookModal; 