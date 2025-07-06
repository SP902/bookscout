import React from 'react';

interface SmartModeConsentModalProps {
  open: boolean;
  onClose: () => void;
  onEnable: () => Promise<void>;
  loading: boolean;
}

const SmartModeConsentModal: React.FC<SmartModeConsentModalProps> = ({ open, onClose, onEnable, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl p-10 shadow-glass flex flex-col items-center gap-7 animate-fade-in min-w-[340px] max-w-[90vw]">
        <h3 className="text-2xl font-extrabold mb-1 text-primary text-center">Enable Smart Mode</h3>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-2 text-center max-w-xs">
          Smart Mode personalizes your book recommendations using your reading history and preferences. This includes tracking which books you view and interact with to improve recommendations. By enabling Smart Mode, you consent to the collection and use of your data for personalized recommendations. You can disable Smart Mode at any time.
        </p>
        <div className="w-full flex flex-row items-center gap-4 mt-2 justify-center">
          <button
            className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl bg-gradient-to-tr from-primary to-accent text-white font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed border-2 border-white/80 dark:border-primary/40 backdrop-blur-sm min-w-[180px] max-w-[240px]"
            onClick={onEnable}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <span>Enable Smart Mode</span>
            )}
          </button>
          <button className="flex-none px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 font-semibold text-base shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-300 dark:border-gray-700" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SmartModeConsentModal; 