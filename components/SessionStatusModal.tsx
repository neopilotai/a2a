/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { 
  Save, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  FolderGit2, 
  Bot, 
  ClipboardList, 
  FileText,
  Clock,
  HardDrive,
  Share2,
  Code2,
  ChevronDown,
  ChevronUp,
  FileDown,
  Copy
} from 'lucide-react';
import { 
  loadUserSession, 
  clearAllSessionData, 
  exportSessionAsJson, 
  downloadSessionJsonFile,
  getSessionExportStats,
  importSessionFromJson,
  saveActiveRepoContext
} from '../services/storageService';
import { UserSessionData, StudioTheme } from '../types';
import { THEME_CONFIGS } from '../services/themeService';
import { ThemeSelector } from './ThemeSelector';

interface SessionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionReloaded: () => void;
  currentTheme?: StudioTheme;
  onThemeChange?: (theme: StudioTheme) => void;
}

export const SessionStatusModal: React.FC<SessionStatusModalProps> = ({
  isOpen,
  onClose,
  onSessionReloaded,
  currentTheme = 'architect',
  onThemeChange
}) => {
  const [sessionData, setSessionData] = useState<UserSessionData | null>(() => loadUserSession());
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleRefreshData = () => {
    setSessionData(loadUserSession());
  };

  const handleClearAll = () => {
    clearAllSessionData();
    setShowConfirmClear(false);
    onSessionReloaded();
    onClose();
  };

  const handleExportFile = () => {
    const res = downloadSessionJsonFile();
    if (res.success) {
      setDownloadSuccessNotice(`Downloaded ${res.filename} (${res.sizeKb} KB)`);
      setTimeout(() => setDownloadSuccessNotice(null), 4000);
    }
  };

  const handleCopyJson = async () => {
    const json = exportSessionAsJson();
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importSessionFromJson(content);
        if (result.success) {
          setImportStatus({ success: true, message: 'Session restored successfully!' });
          setTimeout(() => {
            onSessionReloaded();
            onClose();
          }, 1000);
        } else {
          setImportStatus({ success: false, message: result.error || 'Failed to import session.' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    if (!importText.trim()) return;
    const result = importSessionFromJson(importText);
    if (result.success) {
      setImportStatus({ success: true, message: 'Session restored successfully!' });
      setTimeout(() => {
        onSessionReloaded();
        onClose();
      }, 1000);
    } else {
      setImportStatus({ success: false, message: result.error || 'Invalid session JSON format.' });
    }
  };

  const handleClearRepoContext = () => {
    saveActiveRepoContext(null);
    handleRefreshData();
    onSessionReloaded();
  };

  const exportStats = getSessionExportStats();
  const rawExportJson = exportSessionAsJson();

  const lastSavedTime = sessionData?.lastSavedAt 
    ? new Date(sessionData.lastSavedAt).toLocaleTimeString() 
    : 'Never';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl p-5 md:p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                Workspace Session & Storage
              </h3>
              <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-emerald-400" />
                Auto-saved locally at <span className="text-slate-300 font-semibold">{lastSavedTime}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            id="session-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">

          {/* Studio Theme Configuration */}
          {onThemeChange && (
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/10 space-y-2.5">
              <div className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Studio Visual Theme
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Active: {THEME_CONFIGS[currentTheme]?.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose the visual language for repository blueprints, DAG flows, and code inspection dashboards.
              </p>
              <div className="pt-1 flex justify-center">
                <ThemeSelector
                  currentTheme={currentTheme}
                  onThemeChange={onThemeChange}
                  variant="button-group"
                />
              </div>
            </div>
          )}

          {/* Active Context Overview */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-2.5">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Current Persisted Workspace</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <FolderGit2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Repository Context</span>
                </div>
                <div className="text-slate-200 font-bold truncate">
                  {sessionData?.activeRepoContext?.repoName || (
                    <span className="text-slate-500 font-normal italic">None selected</span>
                  )}
                </div>
                {sessionData?.activeRepoContext?.fileTree && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {sessionData.activeRepoContext.fileTree.length} files indexed
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  <span>AI Chat History</span>
                </div>
                <div className="text-slate-200 font-bold">
                  {sessionData?.aiAssistantSettings?.messages?.length || 0} messages
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                  Role: {sessionData?.aiAssistantSettings?.selectedRoleId || 'Default'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <ClipboardList className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Active Roadmap Plan</span>
                </div>
                <div className="text-slate-200 font-bold truncate">
                  {sessionData?.planCreatorSettings?.currentPlan?.title || (
                    <span className="text-slate-500 font-normal italic">None</span>
                  )}
                </div>
                {sessionData?.planCreatorSettings?.currentPlan && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {sessionData.planCreatorSettings.currentPlan.milestones?.length || 0} milestones
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved Histories</span>
                </div>
                <div className="text-slate-200 font-bold">
                  {(sessionData?.repoHistory?.length || 0) + (sessionData?.articleHistory?.length || 0)} items
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {sessionData?.repoHistory?.length || 0} git blueprints, {sessionData?.articleHistory?.length || 0} sketches
                </div>
              </div>
            </div>

            {sessionData?.activeRepoContext && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleClearRepoContext}
                  className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Unload Repository Context
                </button>
              </div>
            )}
          </div>

          {/* Export JSON & Workspace Sharing Section */}
          <div className="p-3.5 bg-gradient-to-br from-violet-950/30 to-slate-950/70 rounded-xl border border-violet-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-violet-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-violet-400" />
                <span>Export & Share Workspace</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                Payload: <span className="text-violet-300 font-semibold">{exportStats.sizeKb} KB</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Export your full workspace context—including repository indexes, active prompts, chat messages, and implementation roadmaps—as a portable JSON file to download or share with collaborators.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportFile}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-400/30 text-xs font-mono text-white font-semibold transition-all shadow-md shadow-violet-950/50 group"
                id="download-session-json-btn"
                title="Download complete session state as a .json file"
              >
                <FileDown className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span>Download JSON File</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-200 hover:text-white transition-all"
                id="copy-session-json-btn"
                title="Copy formatted JSON data to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>Copy JSON Text</span>
                  </>
                )}
              </button>
            </div>

            {downloadSuccessNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{downloadSuccessNotice}</span>
              </div>
            )}

            {/* Expandable JSON Inspector */}
            <div className="border-t border-white/5 pt-2">
              <button
                onClick={() => setShowJsonPreview(prev => !prev)}
                className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-violet-300 transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-violet-400" />
                  {showJsonPreview ? 'Hide JSON Preview' : 'Inspect JSON Payload Schema'}
                </span>
                {showJsonPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showJsonPreview && (
                <div className="mt-2 relative animate-in fade-in">
                  <pre className="p-3 bg-slate-950 rounded-xl border border-white/10 text-[10px] font-mono text-slate-300 max-h-40 overflow-y-auto custom-scrollbar select-all">
                    {rawExportJson}
                  </pre>
                  <button
                    onClick={handleCopyJson}
                    className="absolute top-2 right-2 px-2 py-1 bg-slate-800/90 hover:bg-slate-700 text-[10px] font-mono text-slate-200 rounded border border-white/10 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Import Session Tools */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Import & Restore Session
            </label>

            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json,application/json" 
                className="hidden" 
                id="session-file-input"
              />
              
              <button
                onClick={() => setShowImportArea(prev => !prev)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-violet-500/40 text-xs font-mono text-slate-300 hover:text-white transition-all"
                id="import-session-toggle-btn"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Import Session Backup...</span>
              </button>

              {showImportArea && (
                <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-white/10 space-y-2 animate-in fade-in">
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono text-white font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Select JSON File
                    </button>
                    <span className="text-xs text-slate-500 my-auto font-mono">or paste raw JSON below:</span>
                  </div>

                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste session JSON here..."
                    className="w-full h-24 p-2 bg-slate-900 border border-white/10 rounded-lg text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                    id="session-import-textarea"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowImportArea(false)}
                      className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualImport}
                      disabled={!importText.trim()}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-mono text-white font-semibold"
                      id="confirm-import-session-btn"
                    >
                      Restore Session
                    </button>
                  </div>
                </div>
              )}

              {importStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 mt-2 ${
                  importStatus.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {importStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reset / Clear Warning Zone */}
          <div className="pt-2 border-t border-white/10">
            {!showConfirmClear ? (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all"
                id="clear-session-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Local Storage Data</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 font-mono">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Confirm Clear Session?</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  This will reset all saved repositories, AI chat messages, generated roadmaps, and local histories.
                </p>
                <div className="flex justify-end gap-2 pt-1 font-mono text-xs">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    id="confirm-clear-session-btn"
                  >
                    Yes, Clear Everything
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Safe offline client storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default SessionStatusModal;
