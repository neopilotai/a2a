/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  FileCode2, 
  Command, 
  X, 
  ArrowRight, 
  Bot, 
  Network, 
  ClipboardList, 
  Copy, 
  Check, 
  GitBranch, 
  Sparkles, 
  Layers, 
  Database, 
  ShieldCheck, 
  Sliders, 
  FileText, 
  Cpu,
  Folder,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { RepoFileTree, ViewMode, ActiveRepoContext, ModuleCategory } from '../types';
import { fetchRepoFileTree } from '../services/githubService';

interface GlobalRepoSearchBarProps {
  activeRepoContext: ActiveRepoContext | null;
  onNavigate: (mode: ViewMode, data?: any) => void;
  onSelectRepoForContext: (repoName: string, fileTree: RepoFileTree[]) => void;
}

const POPULAR_REPOS = [
  { name: 'expressjs/express', label: 'Express.js', category: 'Backend' },
  { name: 'facebook/react', label: 'React Core', category: 'Frontend' },
  { name: 'vercel/next.js', label: 'Next.js', category: 'Fullstack' },
  { name: 'tailwindlabs/tailwindcss', label: 'Tailwind CSS', category: 'Styling' },
  { name: 'vitejs/vite', label: 'Vite', category: 'Build' },
];

function classifyFile(path: string): { category: ModuleCategory; label: string; color: string; badgeBg: string } {
  const p = path.toLowerCase();
  if (p.includes('test') || p.includes('spec') || p.includes('__tests__') || p.includes('jest') || p.includes('cypress')) {
    return { category: 'test', label: 'Test / QA', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
  }
  if (p.includes('auth') || p.includes('security') || p.includes('jwt') || p.includes('oauth') || p.includes('session') || p.includes('permission')) {
    return { category: 'auth', label: 'Auth & Sec', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
  }
  if (p.includes('db') || p.includes('model') || p.includes('schema') || p.includes('migration') || p.includes('prisma') || p.includes('drizzle') || p.includes('sql') || p.includes('store') || p.includes('repository')) {
    return { category: 'database', label: 'Data & Schema', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
  }
  if (p.includes('component') || p.includes('view') || p.includes('page') || p.includes('ui') || p.includes('screen') || p.includes('layout') || p.endsWith('.tsx') || p.endsWith('.jsx') || p.endsWith('.vue') || p.endsWith('.svelte') || p.includes('.css') || p.includes('.scss')) {
    return { category: 'frontend', label: 'UI / Component', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20' };
  }
  if (p.includes('api') || p.includes('server') || p.includes('route') || p.includes('controller') || p.includes('service') || p.includes('endpoint') || p.includes('handler') || p.includes('middleware') || p.endsWith('.go') || p.endsWith('.py') || p.endsWith('.rs')) {
    return { category: 'backend', label: 'Backend / API', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
  }
  if (p.includes('.md') || p.includes('docs') || p.includes('license') || p.includes('readme')) {
    return { category: 'docs', label: 'Docs', color: 'text-teal-400', badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/20' };
  }
  if (p.includes('config') || p.includes('json') || p.includes('yaml') || p.includes('yml') || p.includes('.env') || p.includes('docker') || p.includes('vite') || p.includes('webpack') || p.includes('build')) {
    return { category: 'config', label: 'Config / Build', color: 'text-slate-400', badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
  }
  return { category: 'utils', label: 'Utility / Lib', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20' };
}

export const GlobalRepoSearchBar: React.FC<GlobalRepoSearchBarProps> = ({
  activeRepoContext,
  onNavigate,
  onSelectRepoForContext
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [customRepoInput, setCustomRepoInput] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  // Global hotkey listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          if (!prev) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return !prev;
        });
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filtered code files list
  const filteredFiles = useMemo(() => {
    if (!activeRepoContext?.fileTree) return [];

    const validFiles = activeRepoContext.fileTree.filter(
      f => f.type === 'blob' && !f.path.includes('.git/')
    );

    const q = searchQuery.toLowerCase().trim();

    return validFiles
      .map(file => {
        const parts = file.path.split('/');
        const fileName = parts[parts.length - 1];
        const dirPath = parts.slice(0, -1).join('/');
        const meta = classifyFile(file.path);
        const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : '';

        return {
          ...file,
          fileName,
          dirPath,
          meta,
          ext,
          depth: parts.length
        };
      })
      .filter(item => {
        // Filter by category tab
        if (selectedFilter !== 'all' && item.meta.category !== selectedFilter) {
          return false;
        }

        // Filter by search query
        if (!q) return true;

        const matchesName = item.fileName.toLowerCase().includes(q);
        const matchesPath = item.path.toLowerCase().includes(q);
        const matchesExt = item.ext.toLowerCase().includes(q);
        const matchesCategory = item.meta.label.toLowerCase().includes(q);

        return matchesName || matchesPath || matchesExt || matchesCategory;
      })
      .slice(0, 40); // Maximum 40 displayable for fast rendering
  }, [activeRepoContext, searchQuery, selectedFilter]);

  // Reset selected index when query or filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedFilter]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsListRef.current) {
      const activeElement = resultsListRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within search results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredFiles.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredFiles.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        handleOpenFileInCodemap(filteredFiles[selectedIndex].path);
      }
    }
  };

  const handleCopyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleOpenFileInCodemap = (path: string) => {
    setIsOpen(false);
    onNavigate(ViewMode.CODEMAP, {
      repoName: activeRepoContext?.repoName,
      fileTree: activeRepoContext?.fileTree,
      selectedFilePath: path
    });
  };

  const handleGroundAIAssistant = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onNavigate(ViewMode.AI_ASSISTANT, {
      initialPrompt: `I am inspecting the component/file "${path}" in repository "${activeRepoContext?.repoName}". 
Please analyze its architectural role, explain its likely dependencies, and recommend best practices or refactoring advice.`
    });
  };

  const handleCreatePlanForFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onNavigate(ViewMode.PLAN_CREATOR, {
      targetFile: path,
      repoName: activeRepoContext?.repoName
    });
  };

  const handleLoadQuickRepo = async (repoName: string) => {
    setIsLoadingRepo(true);
    try {
      const tree = await fetchRepoFileTree(repoName);
      onSelectRepoForContext(repoName, tree);
    } catch (err) {
      console.error("Failed to load repo:", err);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const categoryCounts = useMemo(() => {
    if (!activeRepoContext?.fileTree) return { all: 0 };
    const counts: Record<string, number> = { all: 0 };
    activeRepoContext.fileTree.forEach(f => {
      if (f.type === 'blob' && !f.path.includes('.git/')) {
        counts.all = (counts.all || 0) + 1;
        const cat = classifyFile(f.path).category;
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [activeRepoContext]);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-2 md:mx-4">
      {/* Header Compact Search Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full group flex items-center justify-between gap-2.5 px-3 py-1.5 md:py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-violet-500/40 text-xs font-mono text-slate-400 hover:text-slate-200 transition-all shadow-inner hover:shadow-neon-violet"
        title="Quick search codebase files (⌘K / Ctrl+K)"
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <Search className="w-3.5 h-3.5 text-violet-400 shrink-0 group-hover:scale-110 transition-transform" />
          {activeRepoContext?.repoName ? (
            <span className="truncate text-slate-300">
              <span className="text-slate-500 hidden xl:inline">Search in </span>
              <span className="text-violet-300 font-semibold">{activeRepoContext.repoName}</span>
              <span className="text-slate-500 text-[11px] ml-1.5">({categoryCounts.all || 0} files)</span>
            </span>
          ) : (
            <span className="text-slate-400 truncate">Quick file search...</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/10 text-slate-400 group-hover:text-slate-200 group-hover:border-violet-500/30 transition-colors">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </kbd>
        </div>
      </button>

      {/* Dropdown / Modal Spotlight Palette */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[95vw] sm:w-[580px] md:w-[680px] max-w-[95vw] z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="glass-panel rounded-2xl border border-white/15 shadow-2xl bg-slate-950/95 backdrop-blur-xl overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Search Input Bar */}
            <div className="p-3.5 border-b border-white/10 flex items-center gap-3 bg-slate-900/50">
              <Search className="w-4 h-4 text-violet-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  activeRepoContext?.repoName 
                    ? `Search components, APIs, files in ${activeRepoContext.repoName}...` 
                    : "Search active codebase or load a repository..."
                }
                className="w-full bg-transparent border-none text-xs md:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">ESC</kbd>
              </button>
            </div>

            {/* Context Status & Category Filter Tabs */}
            {activeRepoContext?.repoName ? (
              <div className="px-3 py-2 border-b border-white/5 bg-black/30 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
                    Filter:
                  </span>
                  {[
                    { id: 'all', label: 'All', count: categoryCounts.all || 0 },
                    { id: 'frontend', label: 'UI', count: categoryCounts.frontend || 0 },
                    { id: 'backend', label: 'API', count: categoryCounts.backend || 0 },
                    { id: 'database', label: 'Data', count: categoryCounts.database || 0 },
                    { id: 'auth', label: 'Auth', count: categoryCounts.auth || 0 },
                    { id: 'utils', label: 'Utils', count: categoryCounts.utils || 0 },
                    { id: 'config', label: 'Config', count: categoryCounts.config || 0 },
                    { id: 'test', label: 'Tests', count: categoryCounts.test || 0 },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedFilter(tab.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                        selectedFilter === tab.id
                          ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-400">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-slate-500 shrink-0 hidden md:block">
                  {filteredFiles.length} matches
                </div>
              </div>
            ) : null}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto max-h-[460px] p-2 space-y-1">
              {activeRepoContext?.repoName ? (
                filteredFiles.length > 0 ? (
                  <div ref={resultsListRef} className="space-y-1">
                    {filteredFiles.map((item, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.path}
                          onClick={() => handleOpenFileInCodemap(item.path)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group border ${
                            isSelected
                              ? 'bg-violet-600/20 border-violet-500/40 text-white shadow-md'
                              : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`p-1.5 rounded-lg bg-black/40 border border-white/5 ${item.meta.color} shrink-0`}>
                              <FileCode2 className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-white truncate">
                                  {item.fileName}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.meta.badgeBg}`}>
                                  {item.meta.label}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Folder className="w-2.5 h-2.5 text-slate-600" />
                                <span>{item.dirPath || '.'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons on Item */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => handleCopyPath(item.path, e)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              title="Copy file path"
                            >
                              {copiedPath === item.path ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            <button
                              onClick={(e) => handleGroundAIAssistant(item.path, e)}
                              className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-colors flex items-center gap-1 text-[10px] font-mono"
                              title="Ask AI Assistant about this file"
                            >
                              <Bot className="w-3 h-3" />
                              <span className="hidden sm:inline">Ask AI</span>
                            </button>

                            <button
                              onClick={(e) => handleCreatePlanForFile(item.path, e)}
                              className="p-1.5 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 transition-colors flex items-center gap-1 text-[10px] font-mono hidden md:flex"
                              title="Create refactor plan for this file"
                            >
                              <ClipboardList className="w-3 h-3" />
                              <span>Plan</span>
                            </button>

                            <button
                              onClick={() => handleOpenFileInCodemap(item.path)}
                              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 text-[10px] font-mono font-semibold"
                              title="Inspect in Codemap topology"
                            >
                              <Network className="w-3 h-3" />
                              <span className="hidden sm:inline">Map</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <Search className="w-6 h-6 text-slate-600 mx-auto" />
                    <p className="text-xs font-mono text-slate-400">
                      No files matching "{searchQuery}" in {activeRepoContext.repoName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Try adjusting your search terms or filter category.
                    </p>
                  </div>
                )
              ) : (
                /* Empty state when no repository context is currently loaded */
                <div className="p-6 space-y-5">
                  <div className="text-center space-y-1.5">
                    <GitBranch className="w-8 h-8 text-violet-400 mx-auto animate-pulse" />
                    <h3 className="text-sm font-mono font-bold text-white">
                      No Active Repository Context
                    </h3>
                    <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                      Load a repository to instantly enable global file search, semantic invariants, and architectural codemapping.
                    </p>
                  </div>

                  {/* Quick Preset Starters */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Quick Load Popular Repositories:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {POPULAR_REPOS.map(repo => (
                        <button
                          key={repo.name}
                          onClick={() => handleLoadQuickRepo(repo.name)}
                          disabled={isLoadingRepo}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-left transition-all flex items-center justify-between group disabled:opacity-50"
                        >
                          <div>
                            <span className="text-xs font-mono font-bold text-white group-hover:text-violet-200 block">
                              {repo.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {repo.label} &bull; {repo.category}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customRepoInput.trim()) {
                        handleLoadQuickRepo(customRepoInput.trim());
                      }
                    }}
                    className="flex items-center gap-2 pt-2 border-t border-white/5"
                  >
                    <input
                      type="text"
                      value={customRepoInput}
                      onChange={(e) => setCustomRepoInput(e.target.value)}
                      placeholder="e.g. facebook/react or owner/repo"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingRepo || !customRepoInput.trim()}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50 shrink-0"
                    >
                      {isLoadingRepo ? 'Loading...' : 'Load Repo'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="p-2.5 border-t border-white/5 bg-slate-950/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10">↑</kbd>
                  <kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10">↓</kbd>
                  <span>to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10">↵</kbd>
                  <span>to inspect</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10">ESC</kbd>
                  <span>to close</span>
                </span>
              </div>

              {activeRepoContext?.repoName && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate(ViewMode.REPO_ANALYZER);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-colors text-[10px] font-bold"
                    title="Generate README for this repository"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Draft README</span>
                  </button>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>Context:</span>
                    <span className="text-violet-300 font-bold">{activeRepoContext.repoName}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
