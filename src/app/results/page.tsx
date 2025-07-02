'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';
import { FiSearch } from 'react-icons/fi';
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
    <main className="flex flex-col items-center min-h-[80vh] px-4 py-10 gap-8 animate-fade-in">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-tr from-primary to-accent bg-clip-text text-transparent tracking-tight animate-pop">Results for:</h2>
          <div className="text-xl text-primary font-bold break-words animate-fade-in">{prompt}</div>
        </div>
        <div className="bg-glass/80 dark:bg-darkglass/80 rounded-2xl p-8 text-center text-white/80 font-medium shadow-glass mb-4 animate-fade-in">
          <div className="text-lg font-semibold mb-2 text-primary">{results?.llmResponse || '[LLM response placeholder]'}</div>
          <div className="text-base text-white/70">This is where the AI's book recommendations and summary will appear.</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 min-h-[180px]">
          {loading ? (
            <div className="col-span-3 text-center text-white/70 py-8 text-lg animate-fade-in">Curating books based on your ask...</div>
          ) : results?.books?.length ? (
            results.books.map((book: any, i: number) => (
              <BookCard key={i} book={book} onClick={() => openModal(book)} />
            ))
          ) : (
            <div className="col-span-3 text-center text-white/60 py-8">No books found. Try a different prompt!</div>
          )}
          <BookModal open={!!selectedBook} book={selectedBook} onClose={closeModal} positionInResults={results?.books?.findIndex((b: any) => b === selectedBook)} sessionId={results?.session_id} discoveryContext={results?.discovery_context} />
        </div>
      </div>
      <form className="w-full max-w-2xl mt-8 flex flex-col gap-2 animate-fade-in" onSubmit={handleSubmit} autoComplete="off">
        <div className="flex items-center gap-2 bg-glass/80 dark:bg-darkglass/80 rounded-pill shadow-glass px-4 py-2 focus-within:ring-2 focus-within:ring-primary transition-all">
          <FiSearch className="w-6 h-6 text-primary/80" />
          <input
            type="text"
            placeholder="Ask another question..."
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-white/40 focus:ring-0"
            value={newPrompt}
            onChange={e => setNewPrompt(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-pill bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-2"
          >
            Ask
          </button>
        </div>
        {error && <span className="text-red-400 text-sm mt-1 animate-fade-in">{error}</span>}
      </form>
    </main>
  );
} 