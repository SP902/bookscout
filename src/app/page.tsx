'use client';
import { FC, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ModeContext, AuthContext } from './layout';
import { supabase } from '../../lib/supabase';
import { FiSearch } from 'react-icons/fi';

const Home: FC = () => {
  const { mode } = useContext(ModeContext);
  const { user } = useContext(AuthContext);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
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
    if (mode === 'Fresh') {
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
        return;
      }
      router.push(`/results?q=${encodeURIComponent(prompt)}`);
      setPrompt('');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <section className="w-full max-w-2xl flex flex-col items-center gap-10 mt-24">
        <div className="text-center flex flex-col gap-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg mb-2 animate-pop">
            AI Book Recommendations
          </h1>
          <p className="text-xl sm:text-2xl text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
            Discover your next favorite book with AI-powered suggestions tailored for you.
          </p>
        </div>
        <form className="w-full flex flex-col gap-2" onSubmit={handleSubmit} autoComplete="off">
          <div className="flex items-center gap-2 bg-glass/80 dark:bg-darkglass/80 rounded-pill shadow-glass px-4 py-2 border border-white/20 focus-within:ring-2 focus-within:ring-primary transition-all">
            <FiSearch className="w-6 h-6 text-primary/80" />
            <input
              type="text"
              placeholder="What book are you looking for?"
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-white/40 focus:ring-0 focus:border-none focus:outline-none ring-0 border-none outline-none no-outline"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-pill bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>Send</span>
            </button>
          </div>
          {error && <span className="text-red-400 text-sm mt-1 animate-fade-in">{error}</span>}
        </form>
        {/* Inline results for Fresh mode */}
        {results && mode === 'Fresh' && (
          <div className="w-full flex flex-col gap-6 mt-8 animate-fade-in">
            <div className="bg-glass/80 dark:bg-darkglass/80 rounded-2xl p-6 text-center text-white/80 font-medium shadow-glass mb-4">
              {results.llmResponse || '[LLM response placeholder]'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {results.books?.map((book: any, i: number) => (
                <div key={i} className="h-44 bg-white/10 dark:bg-black/30 rounded-2xl shadow-glass flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer group">
                  <div className="w-16 h-24 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-xl mb-2 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary/70 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 32 32"><path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z"/></svg>
                  </div>
                  <span className="text-base font-semibold text-white/90 text-center">{book.title || `Book Card ${i+1}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

Home.displayName = 'Home';
export default Home;
