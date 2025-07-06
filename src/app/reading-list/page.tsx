'use client';
import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../../../lib/supabase';
import { AuthContext, ModeContext } from '../layout';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiBookOpen, FiLoader } from 'react-icons/fi';

const MIN_SPINNER_MS = 400;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const ReadingListPage: React.FC = () => {
  const { user, loading } = useContext(AuthContext);
  const { mode } = useContext(ModeContext);
  const [books, setBooks] = useState<any[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [spinner, setSpinner] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const router = useRouter();

  // Helper to fetch books
  const fetchBooks = async () => {
    setSpinner(true);
    setLoadingBooks(true);
    setError('');
    const start = Date.now();
    const { data, error } = await supabase
      .from('user_interactions')
      .select('book_isbn, id, book_index:book_isbn(*)')
      .eq('user_id', user.id)
      .eq('interaction_type', 'saved')
      .order('created_at', { ascending: false });
    const elapsed = Date.now() - start;
    const showFor = Math.max(0, MIN_SPINNER_MS - elapsed);
    setTimeout(() => {
      setBooks(data || []);
      setLastFetched(Date.now());
      const isRealError = error && Object.keys(error).length > 0;
      setError(isRealError ? 'Failed to load reading list.' : '');
      setLoadingBooks(false);
      setSpinner(false);
      console.log('[ReadingList] Books fetched. Books loaded:', data ? data.length : 0, 'Error:', error);
    }, showFor);
  };

  // Manual refresh handler
  const handleRefresh = () => {
    fetchBooks();
  };

  useEffect(() => {
    console.log('[ReadingList] useEffect triggered. user:', user, 'loading:', loading, 'lastFetched:', lastFetched);
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
    // Only fetch if no data or data is stale
    if (!lastFetched || Date.now() - lastFetched > CACHE_TTL_MS) {
      fetchBooks();
    } else {
      setSpinner(false);
      setLoadingBooks(false);
      console.log('[ReadingList] Using cached books.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const handleRemove = async (interactionId: string) => {
    // Allow removal in both modes (Fresh and Smart)
    setRemoving(interactionId);
    const { error } = await supabase.from('user_interactions').delete().eq('id', interactionId);
    if (!error) {
      setBooks(books.filter(b => b.id !== interactionId));
    } else {
      setError('Failed to remove book.');
    }
    setRemoving(null);
  };

  const openModal = (book: any) => setSelectedBook(book);
  const closeModal = () => setSelectedBook(null);

  const showEmptyState = !spinner && books.length === 0;
  const showError = error && !showEmptyState;

  return (
    <main className="flex flex-col items-center min-h-[80vh] px-4 py-10 gap-8 animate-fade-in">
      {/* Navigation Header */}
      <div className="w-full max-w-3xl flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-full bg-glass/70 dark:bg-darkglass/70 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={() => router.push('/')}
            aria-label="Back to Home"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-2xl font-extrabold text-white/90 ml-1 tracking-tight">My Reading List</span>
          <div className="ml-auto flex items-center gap-3">
            {mode === 'Fresh' && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30">
                Fresh Mode
              </span>
            )}
            <button
              className="px-4 py-2 rounded-lg bg-primary/80 text-white font-semibold text-sm shadow hover:bg-primary/90 transition-all"
              onClick={handleRefresh}
              disabled={spinner}
              aria-label="Refresh Reading List"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      <div className="w-full max-w-3xl flex flex-col gap-8">
        {spinner ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 w-full">
            <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 shadow-lg mb-2 animate-spin-slow">
              <FiLoader className="w-10 h-10 text-primary animate-spin" />
            </span>
            <div className="text-lg font-semibold text-white/80">Loading your reading list...</div>
          </div>
        ) : showEmptyState ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 w-full">
            <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 shadow-lg mb-2">
              <FiBookOpen className="w-12 h-12 text-primary" />
            </span>
            <div className="text-2xl font-bold text-white/90">Start your reading list!</div>
            <div className="text-base text-white/60 max-w-xs text-center">
              {mode === 'Smart' 
                ? "Save books in Smart Mode to see them here. Ready to discover your next favorite?"
                : "Switch to Smart Mode to save books and build your reading list."
              }
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow hover:scale-105 active:scale-95 transition-all text-lg mt-2"
              onClick={() => router.push('/')}
            >
              <FiBookOpen className="w-5 h-5" /> 
              {mode === 'Smart' ? 'Discover Books' : 'Switch to Smart Mode'}
            </button>
          </div>
        ) : showError ? (
          <div className="text-center text-red-400 py-8">{error}</div>
        ) : (
          <>
            {mode === 'Fresh' && books.length > 0 && (
              <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="text-sm text-primary font-medium mb-1">Viewing previously saved books</div>
                <div className="text-xs text-white/60">Switch to Smart Mode to add new books and get personalized recommendations</div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {books.map((b) => (
                <div key={b.id} className="relative group">
                  <BookCard book={b.book_index} onClick={() => openModal(b.book_index)} />
                  <button
                    className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-red-600/90 text-white text-xs font-semibold shadow hover:bg-red-700 transition-all focus:outline-none"
                    onClick={() => handleRemove(b.id)}
                    disabled={removing === b.id}
                  >
                    {removing === b.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
            <BookModal open={!!selectedBook} book={selectedBook} onClose={closeModal} />
            <div className="flex justify-center mt-8">
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow hover:scale-105 active:scale-95 transition-all text-lg"
                onClick={() => router.push('/results')}
              >
                <FiBookOpen className="w-5 h-5" /> Continue Reading
              </button>
            </div>
          </>
        )}
      </div>
      <style jsx global>{`
        .animate-spin-slow { animation: spin 2.5s linear infinite; }
      `}</style>
    </main>
  );
};

export default ReadingListPage; 