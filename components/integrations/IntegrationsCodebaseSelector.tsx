/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CodebaseCatalogItem, 
  RepoFileTree, 
  ActiveRepoContext, 
  RepoHistoryItem 
} from '../../types';
import { 
  GitBranch, 
  FolderGit2, 
  Search, 
  Sparkles, 
  ExternalLink, 
  Layers, 
  Star, 
  Check, 
  Plus, 
  Globe, 
  History, 
  Cpu, 
  ChevronDown 
} from 'lucide-react';
import { fetchRepoFileTree } from '../../services/githubService';

interface IntegrationsCodebaseSelectorProps {
  catalog: CodebaseCatalogItem[];
  selectedCodebase: CodebaseCatalogItem;
  onSelectCodebase: (codebase: CodebaseCatalogItem) => void;
  onAddCustomCodebase: (repoName: string, fileTree: RepoFileTree[]) => void;
}

export const IntegrationsCodebaseSelector: React.FC<IntegrationsCodebaseSelectorProps> = ({
  catalog,
  selectedCodebase,
  onSelectCodebase,
  onAddCustomCodebase
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRepoInput, setCustomRepoInput] = useState('');
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredCatalog = catalog.filter(c => 
    c.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.repoName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.primaryLanguage.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.framework.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleFetchCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoInput.trim()) return;

    let clean = customRepoInput.trim()
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\/$/, '');

    if (!clean.includes('/')) {
      setCustomError('Please provide format: owner/repo (e.g. facebook/react)');
      return;
    }

    setIsLoadingCustom(true);
    setCustomError(null);

    try {
      const fileTree = await fetchRepoFileTree(clean);
      if (!fileTree || fileTree.length === 0) {
        throw new Error('No files found or repository is private/inaccessible.');
      }

      onAddCustomCodebase(clean, fileTree);
      setShowCustomModal(false);
      setCustomRepoInput('');
    } catch (err: any) {
      setCustomError(err.message || 'Failed to fetch GitHub repository.');
    } finally {
      setIsLoadingCustom(false);
    }
  };

  const getCategoryBadge = (category: CodebaseCatalogItem['category']) => {
    switch (category) {
      case 'workspace':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Workspace Active</span>;
      case 'history':
        return <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-semibold flex items-center gap-1"><History className="w-2.5 h-2.5" /> History</span>;
      case 'flagship':
        return <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold flex items-center gap-1"><Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> Flagship Preset</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-mono font-semibold">Custom</span>;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. TOP SELECTOR CARD */}
      <div className="relative rounded-2xl border border-white/10 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Active Codebase Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-violet-900/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <FolderGit2 className="w-5 h-5 text-cyan-300" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Target Codebase:</span>
                <h2 className="text-lg md:text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
                  <span>{selectedCodebase.displayName}</span>
                </h2>
                {getCategoryBadge(selectedCodebase.category)}
              </div>
              <p className="text-xs text-slate-300 max-w-2xl line-clamp-1">
                {selectedCodebase.description}
              </p>
            </div>
          </div>

          {/* Right: Codebase Switcher Dropdown & Custom Repo Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[140px] sm:max-w-[180px] truncate">{selectedCodebase.repoName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-2xl z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search codebases by stack or name..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                      {filteredCatalog.map((item) => {
                        const isSelected = item.id === selectedCodebase.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onSelectCodebase(item);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'bg-violet-600/30 border border-violet-500/50 text-white'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold flex items-center gap-1.5">
                                <span className="truncate">{item.displayName}</span>
                                {item.starsCount && (
                                  <span className="text-[10px] text-amber-300 flex items-center gap-0.5">
                                    ★{item.starsCount}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {item.primaryLanguage} • {item.framework}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[11px] font-mono text-slate-400">{catalog.length} Codebases available</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowCustomModal(true);
                        }}
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Repo</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Add Custom GitHub Repo Button */}
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="px-3 py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Add any GitHub repository for CLI & IDE integration"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Custom Repo</span>
            </button>
          </div>
        </div>

        {/* Quick Tech Badges Row */}
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Stack:</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px] font-mono font-semibold">
            {selectedCodebase.primaryLanguage}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono font-semibold">
            {selectedCodebase.framework}
          </span>
          {selectedCodebase.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 text-[11px] font-mono">
              {tag}
            </span>
          ))}
          <span className="ml-auto text-[11px] font-mono text-slate-400 hidden sm:inline">
            Sample AST: {selectedCodebase.sampleFileTree.length} files indexed
          </span>
        </div>
      </div>

      {/* 2. CUSTOM REPO MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold font-sans text-white">
                  Add GitHub Codebase to Integrations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter any public GitHub repository (e.g. <code className="text-cyan-300 font-mono">facebook/react</code> or <code className="text-cyan-300 font-mono">https://github.com/fastapi/fastapi</code>). Link2Ink will index its architectural tree to generate custom CLI commands, Cursor rules, VS Code tasks, and Vibe context packs.
            </p>

            <form onSubmit={handleFetchCustom} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-slate-400">
                  GitHub Repository Slug or URL:
                </label>
                <input
                  type="text"
                  placeholder="e.g. vercel/ai or astral-sh/uv"
                  value={customRepoInput}
                  onChange={(e) => setCustomRepoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              {customError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {customError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingCustom || !customRepoInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/50"
                >
                  {isLoadingCustom ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Indexing AST...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Index & Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
