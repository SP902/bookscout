import React from 'react';
import { FiLogOut, FiTrash2, FiBookOpen, FiUser, FiToggleLeft } from 'react-icons/fi';

interface ProfileDropdownProps {
  open: boolean;
  onClose: () => void;
  user: { email: string };
  onReadingList: () => void;
  onDeleteData: () => void;
  onLogout: () => void;
  onRevokeConsent: () => void;
  smartModeEnabled: boolean | null;
  mode: 'Fresh' | 'Smart';
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ open, onClose, user, onReadingList, onDeleteData, onLogout, onRevokeConsent, smartModeEnabled, mode }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 rounded-xl shadow-lg border border-white/10 dark:border-gray-800 z-50 animate-fade-in">
      <div className="px-4 py-3 border-b border-white/10 dark:border-gray-800 flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent text-white font-bold text-base">
          <FiUser className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-primary truncate leading-tight">{user.email}</div>
        </div>
      </div>
      <div className="flex flex-col py-1">
        <button onClick={() => { onReadingList(); onClose(); }} className="flex items-start gap-3 px-4 py-2 text-left text-white/90 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-sm font-medium">
          <span className="pt-0.5"><FiBookOpen className="w-4 h-4 text-primary" /></span>
          <span className="flex flex-col items-start">
            <span className="leading-tight">Reading List</span>
            <span className="text-xs text-primary/60 mt-0.5">Smart Mode only</span>
          </span>
        </button>
        {mode === 'Smart' && smartModeEnabled && (
          <button onClick={() => { onRevokeConsent(); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-left text-yellow-500 hover:bg-yellow-100/10 dark:hover:bg-yellow-900/20 transition-colors text-sm font-medium">
            <FiToggleLeft className="w-4 h-4 text-yellow-500" />
            <span className="leading-tight">Disable Smart Mode</span>
          </button>
        )}
        <button onClick={() => { onDeleteData(); onClose(); }} className="flex items-center gap-3 px-4 py-2 text-left text-orange-400 hover:bg-orange-100/10 dark:hover:bg-orange-900/20 transition-colors text-sm font-medium">
          <FiTrash2 className="w-4 h-4 text-orange-400" />
          <span className="leading-tight">Delete All Data</span>
        </button>
      </div>
      <div className="border-t border-white/10 dark:border-gray-800 px-4 py-2">
        <button onClick={onLogout} className="flex items-center gap-3 text-white/80 hover:text-primary transition-colors text-sm font-semibold">
          <FiLogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown; 