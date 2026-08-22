/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  X, 
  ExternalLink,
  Save,
  RotateCw,
  FolderGit2
} from 'lucide-react';
import { 
  loadUserSession, 
  saveUserSession, 
  subscribeToSessionUpdates
} from '../services/storageService';
import { ActiveRepoContext } from '../types';

interface SessionIndicatorProps {
  activeRepoContext: ActiveRepoContext | null;
  onOpenSessionModal: () => void;
}

export const SessionIndicator: React.FC<SessionIndicatorProps> = ({
  activeRepoContext,
  onOpenSessionModal
}) => {
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(() => {
    const session = loadUserSession();
    return session?.lastSavedAt || Date.now();
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('Workspace auto-saved');
  const [timeAgoText, setTimeAgoText] = useState<string>('Just now');
  const [isHovered, setIsHovered] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [justSavedPulse, setJustSavedPulse] = useState(false);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format exact timestamp
  const formatExactTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Calculate relative time string
  const calculateRelativeTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  };

  // Update relative time periodically
  useEffect(() => {
    const updateRelTime = () => {
      setTimeAgoText(calculateRelativeTime(lastSavedTimestamp));
    };
    updateRelTime();
    const interval = setInterval(updateRelTime, 5000);
    return () => clearInterval(interval);
  }, [lastSavedTimestamp]);

  // Subscribe to storage update events across all components
  useEffect(() => {
    const unsubscribe = subscribeToSessionUpdates((event) => {
      if (event.type === 'session_saved' || event.type === 'session_imported') {
        const timestamp = event.data?.lastSavedAt || Date.now();
        setLastSavedTimestamp(timestamp);
        setJustSavedPulse(true);
        setTimeout(() => setJustSavedPulse(false), 2000);

        // Show elegant toast confirmation
        const timeStr = formatExactTime(timestamp);
        setToastMessage(`Saved at ${timeStr}`);
        setShowToast(true);

        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setShowToast(false);
        }, 3200);
      }
    });

    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleManualSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingManual(true);
    saveUserSession({ lastSavedAt: Date.now() });
    setTimeout(() => setIsSavingManual(false), 600);
  };

  return (
    <div className="relative">
      {/* Session Pill Button in Header */}
      <button
        onClick={onOpenSessionModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-violet-500/40 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm group"
        title="Local Session Storage • Click to view manager"
        id="session-storage-indicator-btn"
      >
        <div className="relative flex items-center justify-center">
          <HardDrive className={`w-3.5 h-3.5 transition-colors ${
            justSavedPulse ? 'text-emerald-400 scale-110' : 'text-slate-400 group-hover:text-violet-400'
          }`} />
          {justSavedPulse && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          )}
        </div>

        <span className="hidden md:inline font-medium">Session</span>

        {justSavedPulse ? (
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-in zoom-in-50" />
            <span className="hidden lg:inline">Saved</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="hidden xl:inline text-[10px] text-slate-500">{timeAgoText}</span>
          </span>
        )}
      </button>

      {/* Hover Status Card */}
      {isHovered && (
        <div 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Session Persisted</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              LocalStorage
            </span>
          </div>

          <div className="py-2.5 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Last Saved:
              </span>
              <span className="font-bold text-white">
                {formatExactTime(lastSavedTimestamp)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-semibold">{timeAgoText}</span>
            </div>

            {activeRepoContext?.repoName && (
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 flex items-center gap-2 truncate">
                <FolderGit2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="truncate">{activeRepoContext.repoName}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <button
              onClick={handleManualSave}
              disabled={isSavingManual}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-200 hover:text-white transition-colors border border-white/5"
            >
              {isSavingManual ? (
                <RotateCw className="w-3 h-3 text-violet-400 animate-spin" />
              ) : (
                <Save className="w-3 h-3 text-violet-400" />
              )}
              <span>{isSavingManual ? 'Saving...' : 'Save Now'}</span>
            </button>

            <button
              onClick={onOpenSessionModal}
              className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-[11px] font-mono text-white transition-colors font-medium"
            >
              <span>Manage</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Save Confirmation Toast */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/30 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold font-sans text-slate-100">
                Workspace Auto-Saved
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Offline Safe
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-semibold">{toastMessage}</span>
              {activeRepoContext?.repoName && (
                <span className="text-slate-400 truncate max-w-[120px] ml-1">
                  • {activeRepoContext.repoName}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => setShowToast(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionIndicator;
