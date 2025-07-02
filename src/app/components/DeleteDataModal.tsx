import React from 'react';

interface DeleteDataModalProps {
  open: boolean;
  loading: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteDataModal: React.FC<DeleteDataModalProps> = ({ open, loading, error, onClose, onDelete }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-glass p-8 max-w-md w-full mx-4 flex flex-col gap-6 animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-2xl font-extrabold text-red-600 dark:text-red-400 mb-2 text-center">Delete All Data</h3>
        <p className="text-base text-white/80 text-center">This will permanently delete all your profile data, reading list, and personalization history. This action cannot be undone. Are you sure?</p>
        {error && <div className="text-center text-red-400 text-sm">{error}</div>}
        <div className="flex flex-row gap-4 mt-4 justify-center">
          <button
            className="px-6 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 font-semibold text-base shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-300 dark:border-gray-700"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-gradient-to-tr from-red-600 to-red-400 text-white font-bold text-base shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-white/80 dark:border-red-400/40 backdrop-blur-sm"
            onClick={onDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete All Data'}
          </button>
        </div>
      </div>
      <style jsx global>{`
        .animate-modal-in { animation: modalIn 0.25s cubic-bezier(0.4,0,0.2,1); }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DeleteDataModal; 