'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, ReactElement, isValidElement, cloneElement, createContext, useContext, useEffect } from "react";
import { supabase } from '../../lib/supabase';
import { FiLogIn } from 'react-icons/fi';
import AuthModal from './components/AuthModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Mode context
export const ModeContext = createContext<{
  mode: 'Fresh' | 'Smart';
  setMode: (m: 'Fresh' | 'Smart') => void;
}>({ mode: 'Fresh', setMode: () => {} });

export const AuthContext = createContext<{ user: any; loading: boolean; }>( { user: null, loading: true });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mode, setMode] = useState<'Fresh' | 'Smart'>('Fresh');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [authModalLoading, setAuthModalLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Listen for custom event to open login modal
  useEffect(() => {
    const handler = () => setShowLogin(true);
    window.addEventListener('open-login-modal', handler);
    return () => window.removeEventListener('open-login-modal', handler);
  }, []);

  async function onSendMagicLink() {
    setAuthError('');
    setAuthModalLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setAuthError(error.message);
    else setAuthError('Check your email for a magic link!');
    setAuthModalLoading(false);
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthContext.Provider value={{ user, loading: authLoading }}>
        <ModeContext.Provider value={{ mode, setMode }}>
          <header className="w-full flex items-center justify-between py-4 px-8 border-b border-white/10 bg-glass/80 dark:bg-darkglass/80 backdrop-blur-md shadow-glass sticky top-0 z-20 rounded-b-2xl animate-fade-in">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent shadow-md">
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="font-extrabold text-2xl text-white drop-shadow-lg tracking-tight select-none">BookScout</span>
              </div>
              <nav className="hidden md:flex gap-10 text-lg font-medium">
                <a href="/" className="relative hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full after:rounded-pill">Home</a>
                <a href="#contact" className="relative hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full after:rounded-pill">Contact</a>
                <a href="#pricing" className="relative hover:text-primary transition-colors after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-300 hover:after:w-full after:rounded-pill">Pricing</a>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center mr-2 select-none">
                <div className="relative w-48 h-10 flex items-center bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 overflow-hidden">
                  {/* Sliding thumb - always blue, fits exactly half the track */}
                  <div
                    className={`absolute top-0 left-0 h-10 w-1/2 rounded-full bg-blue-600 transition-transform duration-300 no-outline
                      ${mode === 'Smart' ? 'translate-x-full' : 'translate-x-0'}`}
                    style={{ zIndex: 1 }}
                  ></div>
                  {/* Labels */}
                  <button
                    type="button"
                    className={`relative z-10 flex-1 h-10 flex items-center justify-center font-bold text-lg rounded-full transition-colors duration-200 no-outline
                      ${mode === 'Fresh' ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}
                    onClick={() => setMode('Fresh')}
                    aria-pressed={mode === 'Fresh'}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    Fresh
                  </button>
                  <button
                    type="button"
                    className={`relative z-10 flex-1 h-10 flex items-center justify-center font-bold text-lg rounded-full transition-colors duration-200 no-outline
                      ${mode === 'Smart' ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}
                    onClick={() => setMode('Smart')}
                    aria-pressed={mode === 'Smart'}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    Smart
                  </button>
                </div>
              </div>
              {user ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-glass/70 dark:bg-darkglass/70 text-primary font-semibold shadow-sm">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 12A4 4 0 1 1 8 12a4 4 0 0 1 8 0Z"/><path d="M12 16c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4Z"/></svg>
                    {user.email}
                  </span>
                  <button className="px-3 py-1 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow hover:scale-105 active:scale-95 transition-all" onClick={async () => { await supabase.auth.signOut(); }}>Logout</button>
                </div>
              ) : (
                <button className="ml-2 px-6 py-2 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-lg" onClick={() => setShowLogin(true)}>
                  <FiLogIn className="w-6 h-6" />
                  Login
                </button>
              )}
            </div>
          </header>
          <div>{children}</div>
          <AuthModal
            open={showLogin}
            onClose={() => setShowLogin(false)}
            email={email}
            setEmail={setEmail}
            error={authError}
            loading={authModalLoading}
            onSendMagicLink={onSendMagicLink}
          />
        </ModeContext.Provider>
        </AuthContext.Provider>
      </body>
    </html>
  );
}
