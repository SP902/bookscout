import React from 'react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  setEmail: (email: string) => void;
  error: string;
  loading: boolean;
  onSendMagicLink: () => Promise<void>;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, email, setEmail, error, loading, onSendMagicLink }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl p-10 shadow-glass flex flex-col items-center gap-7 animate-fade-in min-w-[340px] max-w-[90vw]">
        <h3 className="text-3xl font-extrabold mb-1 text-primary text-center">Welcome to BookScout</h3>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-2 text-center max-w-xs">Sign up or log in with your email to get personalized book recommendations. No password needed!</p>
        <input
          type="email"
          placeholder="you@email.com"
          className="w-96 max-w-full px-5 py-4 rounded-xl bg-white border border-gray-300 text-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary shadow"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
        <div className="w-full flex flex-row items-center gap-4 mt-2 justify-center">
          <button
            className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed border-2 border-white/80 dark:border-primary/40 backdrop-blur-sm min-w-[180px] max-w-[240px]"
            onClick={onSendMagicLink}
            disabled={loading || !email}
          >
            {loading ? (
              <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8"/><rect width="18" height="14" x="3" y="6" rx="2"/></svg>
                <span>Get Magic Link</span>
              </>
            )}
          </button>
          <button className="flex-none px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 font-semibold text-base shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-300 dark:border-gray-700" onClick={onClose} disabled={loading}>Close</button>
        </div>
        {error && (
          <span className={`${error.toLowerCase().includes('check your email') ? 'text-green-500' : 'text-red-500'} text-sm animate-fade-in text-center max-w-xs`}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
};

export default AuthModal; 