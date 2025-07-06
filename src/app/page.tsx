'use client';
import { FC, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from './layout';
import { useTracking } from './contexts/TrackingContext';
import { supabase } from '../../lib/supabase';
import { FiSearch, FiStar, FiBookOpen } from 'react-icons/fi';
import BookCard from './components/BookCard';
import BookModal from './components/BookModal';

const Home: FC = () => {
  const { currentMode } = useTracking();
  const { user } = useContext(AuthContext);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const triggerLoginModal = () => {
    const event = new CustomEvent('open-login-modal');
    window.dispatchEvent(event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a book prompt.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    if (currentMode === 'Fresh') {
      setResults(null);
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode: 'Fresh' }),
        });
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError('Something went wrong.');
      }
      setPrompt('');
    } else {
      // Smart mode
      if (!user) {
        triggerLoginModal();
        setIsLoading(false);
        return;
      }
      router.push(`/results?q=${encodeURIComponent(prompt)}`);
      setPrompt('');
    }
    setIsLoading(false);
  };

  const openModal = (book: any) => setSelectedBook(book);
  const closeModal = () => setSelectedBook(null);

  return (
    <main className="relative flex flex-col min-h-screen px-4 animate-fade-in overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <section className="flex flex-1 flex-col items-center justify-center w-full max-w-3xl mx-auto gap-6 z-10 min-h-[70vh]">
        {/* Hero Section */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white/90 tracking-tight animate-fade-in">Discover your next favorite book</h1>
          <p className="text-base sm:text-lg text-white/70 font-normal max-w-2xl mx-auto leading-relaxed animate-fade-in delay-100">
            AI-powered suggestions that understand your taste.
          </p>
          <div className="flex items-center justify-center gap-3 mt-2 animate-fade-in delay-200">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 012-2h8a2 2 0 012 2v14M9 7h6" /></svg>
              <span className="text-xs text-white/80 font-medium">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              <span className="text-xs text-white/80 font-medium">Personalized</span>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="w-full max-w-2xl animate-fade-in delay-300">
          <form className="flex flex-col gap-2" onSubmit={handleSubmit} autoComplete="off">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl px-5 py-3 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all duration-300">
                <FiSearch className="w-5 h-5 text-primary/80 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What kind of book are you looking for?"
                  className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-white/50 focus:ring-0 focus:border-none focus:outline-none ring-0 border-none outline-none no-outline"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-base flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FiStar className="w-4 h-4" />
                      <span>Discover</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-500/30 animate-fade-in">
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Results Section */}
        {currentMode === 'Fresh' && results && (
          <div className="w-full flex flex-col gap-8 mt-8 animate-fade-in">
            {/* Book Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.books?.map((book: any, i: number) => (
                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <BookCard book={book} onClick={() => openModal(book)} />
                </div>
              ))}
            </div>
            {/* AI Explanation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <FiStar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white">AI Recommendation</h3>
                </div>
                <p className="text-white/90 leading-relaxed text-base">
                  {results.llmResponse || '[LLM response placeholder]'}
                </p>
              </div>
            </div>
            <BookModal open={!!selectedBook} book={selectedBook} onClose={closeModal} />
          </div>
        )}
      </section>
    </main>
  );
};

Home.displayName = 'Home';
export default Home;
