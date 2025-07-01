'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

export default function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prompt = searchParams.get('q') || '';
  const [newPrompt, setNewPrompt] = useState('');
  const [error, setError] = useState('');

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

  return (
    <main className="flex flex-col items-center min-h-[80vh] px-4 py-10 gap-8 animate-fade-in">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-tr from-primary to-accent bg-clip-text text-transparent tracking-tight animate-pop">Results for:</h2>
          <div className="text-xl text-primary font-bold break-words animate-fade-in">{prompt}</div>
        </div>
        <div className="bg-glass/80 dark:bg-darkglass/80 rounded-2xl p-8 text-center text-white/80 font-medium shadow-glass mb-4 animate-fade-in">
          <div className="text-lg font-semibold mb-2 text-primary">[LLM response placeholder]</div>
          <div className="text-base text-white/70">This is where the AI's book recommendations and summary will appear.</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-white/10 dark:bg-black/30 rounded-2xl shadow-glass flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer group animate-fade-in">
              <div className="w-20 h-28 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-xl mb-2 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary/70 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 32 32"><path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z"/></svg>
              </div>
              <span className="text-lg font-semibold text-white/90 text-center">Book Card {i}</span>
            </div>
          ))}
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