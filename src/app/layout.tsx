'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, ReactElement, isValidElement, cloneElement, createContext, useContext, useEffect } from "react";
import { supabase, updateUserProfile, upsertUserProfile, getUserProfile, deleteUserInteractions, deleteSmartPromptEmbeddings, deleteSmartDiscoverySessions, deleteSmartDiscoveryProfile, deletePrivacyConsents, deleteUserProfile } from '../../lib/supabase';
import { FiLogIn, FiUser } from 'react-icons/fi';
import AuthModal from './components/AuthModal';
import SmartModeConsentModal from './components/SmartModeConsentModal';
import ProfileDropdown from './components/ProfileDropdown';
import DeleteDataModal from './components/DeleteDataModal';
import ViewportTrackingDebug from './components/ViewportTrackingDebug';
import ErrorBoundary from './components/ErrorBoundary';
import { TrackingProvider, useTracking } from './contexts/TrackingContext';

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
  const [showSmartConsent, setShowSmartConsent] = useState(false);
  const [smartConsentLoading, setSmartConsentLoading] = useState(false);
  const [pendingSmartMode, setPendingSmartMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [smartModeEnabled, setSmartModeEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        await updateUserProfile(session.user.id, {
          email: session.user.email,
          last_login_at: new Date().toISOString(),
        });
      }
    });
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
      if (data.user) {
        await updateUserProfile(data.user.id, {
          email: data.user.email,
          last_login_at: new Date().toISOString(),
        });
      }
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Listen for custom event to open login modal
  useEffect(() => {
    const handler = () => setShowLogin(true);
    window.addEventListener('open-login-modal', handler);
    return () => window.removeEventListener('open-login-modal', handler);
  }, []);

  // Fetch user profile and consent state on login
  useEffect(() => {
    if (!user) {
      setSmartModeEnabled(null);
      setMode('Fresh');
      return;
    }
    getUserProfile(user.id).then(({ data }) => {
      const smartModeEnabled = data?.smart_mode_enabled ?? false;
      setSmartModeEnabled(smartModeEnabled);
      // Sync frontend mode with database state
      setMode(smartModeEnabled ? 'Smart' : 'Fresh');
    });
  }, [user]);

  // After login, if Smart Mode was pending, show consent modal
  useEffect(() => {
    if (user && pendingSmartMode) {
      setShowSmartConsent(true);
      setPendingSmartMode(false);
    }
  }, [user, pendingSmartMode]);

  async function onSendMagicLink() {
    setAuthError('');
    setAuthModalLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setAuthError(error.message);
    else setAuthError('Check your email for a magic link!');
    setAuthModalLoading(false);
  }

  // Handler for Smart Mode toggle
  async function handleModeChange(newMode: 'Fresh' | 'Smart') {
    if (!user) {
      setPendingSmartMode(true);
      setShowLogin(true);
      return;
    }
    if (newMode === 'Smart') {
      // Only show consent modal if user has never enabled Smart Mode before
      if (!smartModeEnabled) {
        setShowSmartConsent(true);
        return;
      }
      setMode('Smart');
      await upsertUserProfile({ id: user.id, smart_mode_enabled: true });
      setSmartModeEnabled(true);
    } else {
      setMode('Fresh');
      await upsertUserProfile({ id: user.id, smart_mode_enabled: false });
      setSmartModeEnabled(false);
    }
  }

  // Handler for enabling Smart Mode after consent
  async function handleEnableSmartMode() {
    if (!user) return;
    setSmartConsentLoading(true);
    try {
      const now = new Date().toISOString();
      const consentToken = Math.random().toString(36).substring(2, 15);
      await upsertUserProfile({
        id: user.id,
        smart_mode_enabled: true,
        smart_mode_consent_token: consentToken,
        smart_mode_enabled_at: now,
      });
      await supabase.from('privacy_consents').upsert({
        user_id: user.id,
        consent_type: 'smart_mode',
        consent_given: true,
        consent_token: consentToken,
        consent_method: 'modal',
        legal_basis: 'explicit_consent',
        granted_at: now,
        created_at: now,
        updated_at: now,
      }, { onConflict: 'user_id,consent_type' });
      setSmartModeEnabled(true);
      setMode('Smart');
    } catch (err) {
      // Optionally show error to user
    } finally {
      setSmartConsentLoading(false);
      setShowSmartConsent(false);
    }
  }

  // Add revoke consent to ProfileDropdown
  const handleRevokeConsent = async () => {
    if (!user) return;
    await upsertUserProfile({ id: user.id, smart_mode_enabled: false });
    setSmartModeEnabled(false);
    setMode('Fresh');
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthContext.Provider value={{ user, loading: authLoading }}>
        <ModeContext.Provider value={{ mode, setMode }}>
          <TrackingProvider user={user} mode={mode}>
            <ErrorBoundary>
            <header className="w-full flex items-center justify-between py-3 px-6 border-b border-white/10 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg sticky top-0 z-30 rounded-b-xl animate-fade-in">
              <div className="flex items-center gap-5">
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent shadow-md">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8C16 8 13 4 6 4v20c7 0 10 4 10 4s3-4 10-4V4c-7 0-10 4-10 4z" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="font-extrabold text-xl text-primary tracking-tight select-none">BookScout</span>
                <nav className="hidden md:flex gap-6 text-base font-medium">
                  <a href="/" className="px-3 py-1 rounded-lg text-white/90 hover:bg-primary/10 hover:text-primary transition-colors">Home</a>
                  <a href="#contact" className="px-3 py-1 rounded-lg text-white/90 hover:bg-primary/10 hover:text-primary transition-colors">Contact</a>
                  <a href="#pricing" className="px-3 py-1 rounded-lg text-white/90 hover:bg-primary/10 hover:text-primary transition-colors">Pricing</a>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center select-none">
                  <div className="relative w-40 h-9 flex items-center bg-gray-200 dark:bg-gray-800 rounded-full border border-white/10 dark:border-gray-800 transition-colors duration-300 overflow-hidden">
                    {/* Sliding thumb - always blue, fits exactly half the track */}
                    <div
                      className={`absolute top-0 left-0 h-9 w-1/2 rounded-full bg-blue-600 transition-transform duration-300 no-outline
                        ${mode === 'Smart' ? 'translate-x-full' : 'translate-x-0'}`}
                      style={{ zIndex: 1 }}
                    ></div>
                    {/* Labels */}
                    <button
                      type="button"
                      className={`relative z-10 flex-1 h-9 flex items-center justify-center font-semibold text-base rounded-full transition-colors duration-200 no-outline
                        ${mode === 'Fresh' ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}
                      onClick={() => handleModeChange('Fresh')}
                      aria-pressed={mode === 'Fresh'}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      Fresh
                    </button>
                    <button
                      type="button"
                      className={`relative z-10 flex-1 h-9 flex items-center justify-center font-semibold text-base rounded-full transition-colors duration-200 no-outline
                        ${mode === 'Smart' ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}
                      onClick={() => handleModeChange('Smart')}
                      aria-pressed={mode === 'Smart'}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      Smart
                    </button>
                  </div>
                </div>
                {user ? (
                  <div className="relative">
                    <button
                      className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white font-bold text-base shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 border border-white/10 dark:border-gray-800"
                      onClick={() => setDropdownOpen(o => !o)}
                      aria-label="Open profile menu"
                    >
                      <FiUser className="w-5 h-5" />
                    </button>
                    <ProfileDropdown
                      open={dropdownOpen}
                      onClose={() => setDropdownOpen(false)}
                      user={user}
                      onReadingList={() => { setDropdownOpen(false); window.location.href = '/reading-list'; }}
                      onDeleteData={() => { setDropdownOpen(false); setShowDeleteModal(true); }}
                      onLogout={async () => { setDropdownOpen(false); await supabase.auth.signOut(); window.location.href = '/'; }}
                      onRevokeConsent={handleRevokeConsent}
                      smartModeEnabled={smartModeEnabled}
                      mode={mode}
                    />
                  </div>
                ) : (
                  <button className="ml-2 px-5 py-2 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-base" onClick={() => setShowLogin(true)}>
                    <FiLogIn className="w-5 h-5" />
                    Login
                  </button>
                )}
              </div>
            </header>
            <ErrorBoundary>
              <div>{children}</div>
            </ErrorBoundary>
            <ErrorBoundary>
              <AuthModal
                open={showLogin}
                onClose={() => setShowLogin(false)}
                email={email}
                setEmail={setEmail}
                error={authError}
                loading={authModalLoading}
                onSendMagicLink={onSendMagicLink}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <SmartModeConsentModal
                open={showSmartConsent}
                onClose={() => setShowSmartConsent(false)}
                onEnable={handleEnableSmartMode}
                loading={smartConsentLoading}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <DeleteDataModal
                open={showDeleteModal}
                loading={deleteLoading}
                error={deleteError}
                onClose={() => { if (!deleteLoading) setShowDeleteModal(false); setDeleteError(''); }}
                onDelete={async () => {
                  setDeleteLoading(true);
                  setDeleteError('');
                  try {
                    const userId = user?.id;
                    if (!userId) throw new Error('No user');
                    await deleteUserInteractions(userId);
                    await deleteSmartPromptEmbeddings(userId);
                    await deleteSmartDiscoverySessions(userId);
                    await deleteSmartDiscoveryProfile(userId);
                    await deletePrivacyConsents(userId);
                    await deleteUserProfile(userId);
                    setShowDeleteModal(false);
                    setDeleteLoading(false);
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  } catch (err: any) {
                    setDeleteError('Failed to delete all data. Please try again.');
                    setDeleteLoading(false);
                  }
                }}
              />
            </ErrorBoundary>
            </ErrorBoundary>
            </TrackingProvider>
          </ModeContext.Provider>
        </AuthContext.Provider>
      </body>
    </html>
  );
}
