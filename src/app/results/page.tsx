'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';
import { FiSearch, FiStar, FiArrowLeft } from 'react-icons/fi';
import { AuthContext } from '../layout';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';

export default function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const prompt = searchParams.get('q') || '';
  const [newPrompt, setNewPrompt] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    if (!prompt) return;
    setLoading(true);
    setResults(null);
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode: 'Smart', userId: user?.id }),
    })
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => {
        setResults(null);
        setLoading(false);
      });
  }, [prompt, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) {
      setError('Please enter a book prompt.');
      return;
    }
    router.push(`/results?q=${encodeURIComponent(newPrompt)}`);
    setNewPrompt('');
    setError('');
  };

  const openModal = (book: any) => setSelectedBook(book);
  const closeModal = () => setSelectedBook(null);

  return (
    <main className="relative min-h-screen px-4 py-6 animate-fade-in overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-5xl mx-auto z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 mt-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-base font-semibold"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white/90">Smart Recommendations</h2>
            <p className="text-base text-white/70">Personalized for you</p>
          </div>
        </div>

        {/* Search Query Display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
            <FiSearch className="w-5 h-5 text-primary" />
            <span className="text-base text-white/90 font-medium">{prompt}</span>
          </div>
        </div>

        {/* Results Content */}
        <div className="space-y-8">
          {/* Book Cards */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl blur-2xl"></div>
            <div className="relative">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                  <p className="text-white/70 text-base">Curating personalized recommendations...</p>
                </div>
              ) : results?.books?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.books.map((book: any, i: number) => (
                    <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 120}ms` }}>
                      <BookCard book={book} onClick={() => openModal(book)} position={i} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiStar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">No books found</h3>
                  <p className="text-white/60 text-base">Try a different prompt or refine your search</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Explanation */}
          {results?.llmResponse && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <FiStar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">AI Analysis</h3>
                    <p className="text-xs text-white/60">Personalized insights for you</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/90 leading-relaxed text-base">
                    {results.llmResponse}
                  </p>
                </div>
              </div>
            </div>
          )}

          <BookModal 
            open={!!selectedBook} 
            book={selectedBook} 
            onClose={closeModal} 
            positionInResults={results?.books?.findIndex((b: any) => b === selectedBook)} 
            sessionId={results?.session_id} 
            discoveryContext={results?.discovery_context} 
          />
        </div>

        {/* New Search Form */}
        <div className="mt-10">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-center text-lg font-semibold text-white mb-4">Ask Another Question</h3>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit} autoComplete="off">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl px-5 py-3 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all duration-300">
                  <FiSearch className="w-5 h-5 text-primary/80 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="What else would you like to discover?"
                    className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-white/50 focus:ring-0 focus:border-none focus:outline-none ring-0 border-none outline-none no-outline"
                    value={newPrompt}
                    onChange={e => setNewPrompt(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-base flex items-center gap-2"
                  >
                    <FiStar className="w-4 h-4" />
                    <span>Ask</span>
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
        </div>
      </div>
    </main>
  );
} 