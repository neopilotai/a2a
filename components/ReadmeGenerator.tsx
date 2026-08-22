/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Layers, 
  Sliders, 
  BookOpen, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Eye, 
  Code2, 
  Columns, 
  Bot, 
  ArrowRight, 
  Boxes, 
  Wand2, 
  ListCheck, 
  Flame, 
  ExternalLink,
  ChevronRight,
  FolderTree,
  FileCode,
  Globe,
  Compass
} from 'lucide-react';
import { 
  RepoFileTree, 
  ReadmeGeneratorOptions, 
  ReadmeResult, 
  ReadmeStyle, 
  RepoTechStackOverview, 
  ViewMode 
} from '../types';
import { generateRepoReadme, refineRepoReadme } from '../services/geminiService';
import { analyzeRepoTechStack } from '../services/techStackDetector';

interface ReadmeGeneratorProps {
  repoName: string;
  fileTree: RepoFileTree[];
  onNavigate?: (mode: ViewMode, data?: any) => void;
  standalone?: boolean;
}

const STYLE_OPTIONS: { id: ReadmeStyle; label: string; icon: string; description: string; color: string }[] = [
  {
    id: 'comprehensive',
    label: 'Architecture & Engineering',
    icon: '🏗️',
    description: 'Deep technical breakdown, system invariants, full directory topology & data flow specs',
    color: 'from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-200'
  },
  {
    id: 'showcase',
    label: 'Product & Startup Showcase',
    icon: '🚀',
    description: 'Engaging hero badges, live demo pointers, punchy feature grids & value propositions',
    color: 'from-amber-600/30 to-orange-600/30 border-amber-500/40 text-amber-200'
  },
  {
    id: 'minimalist',
    label: 'Minimalist Developer TL;DR',
    icon: '⚡',
    description: 'Command-first, zero fluff, concise ASCII map & rapid copy-paste install guide',
    color: 'from-cyan-600/30 to-blue-600/30 border-cyan-500/40 text-cyan-200'
  },
  {
    id: 'opensource',
    label: 'Open Source Community',
    icon: '🌐',
    description: 'Welcoming badges, PR lifecycles, contributor guidelines, code of conduct & roadmap',
    color: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/40 text-emerald-200'
  }
];

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Spanish (Español)", value: "Spanish" },
  { label: "German (Deutsch)", value: "German" },
  { label: "French (Français)", value: "French" },
  { label: "Japanese (日本語)", value: "Japanese" },
  { label: "Korean (한국어)", value: "Korean" },
  { label: "Chinese (中文)", value: "Chinese" },
  { label: "Portuguese (Português)", value: "Portuguese" },
  { label: "Hindi (हिन्दी)", value: "Hindi" },
  { label: "Arabic (العربية)", value: "Arabic" },
];

const QUICK_REFINEMENTS = [
  "Make the feature list punchier with structured bullet points",
  "Add Docker Compose & Containerization deployment quickstart",
  "Expand Core Architectural Invariants & Data Flow section",
  "Add an API Endpoints & Request/Response Contract Matrix",
  "Include Security Hardening & Rate-Limiting Guidelines"
];

export const ReadmeGenerator: React.FC<ReadmeGeneratorProps> = ({
  repoName,
  fileTree,
  onNavigate,
  standalone = false
}) => {
  // Config state
  const [selectedStyle, setSelectedStyle] = useState<ReadmeStyle>('comprehensive');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [includeBadges, setIncludeBadges] = useState<boolean>(true);
  const [includeArchitectureMap, setIncludeArchitectureMap] = useState<boolean>(true);
  const [includeQuickstart, setIncludeQuickstart] = useState<boolean>(true);
  const [includeEnvTable, setIncludeEnvTable] = useState<boolean>(true);
  const [includeSecurityAudit, setIncludeSecurityAudit] = useState<boolean>(true);
  const [customFocusPrompt, setCustomFocusPrompt] = useState<string>('');

  // Generation & Output state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [readmeResult, setReadmeResult] = useState<ReadmeResult | null>(null);
  const [editableMarkdown, setEditableMarkdown] = useState<string>('');
  const [viewTab, setViewTab] = useState<'preview' | 'raw' | 'split'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  // AI Refinement State
  const [refinementInput, setRefinementInput] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Tech stack analysis
  const techOverview = React.useMemo(() => {
    if (!fileTree || fileTree.length === 0) return null;
    return analyzeRepoTechStack(repoName, fileTree);
  }, [repoName, fileTree]);

  // Initial Auto-Generation trigger if no README is loaded yet
  const handleGenerate = async () => {
    if (!repoName || fileTree.length === 0) return;
    setLoading(true);
    setLoadingStage('Scanning repository topology and detected tech stack...');

    try {
      setTimeout(() => setLoadingStage('Synthesizing architectural summary & invariants...'), 800);
      setTimeout(() => setLoadingStage('Drafting features matrix and Markdown documentation...'), 1800);

      const options: ReadmeGeneratorOptions = {
        repoName,
        style: selectedStyle,
        language: selectedLanguage,
        includeBadges,
        includeArchitectureMap,
        includeQuickstart,
        includeEnvTable,
        includeSecurityAudit,
        customFocusPrompt: customFocusPrompt.trim() || undefined
      };

      const result = await generateRepoReadme(options, fileTree, techOverview);
      setReadmeResult(result);
      setEditableMarkdown(result.markdown);
    } catch (err) {
      console.error("Failed to generate README:", err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editableMarkdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = "README.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRefine = async (instruction: string) => {
    if (!instruction.trim() || !editableMarkdown) return;
    setIsRefining(true);
    try {
      const updated = await refineRepoReadme(editableMarkdown, instruction, repoName);
      setEditableMarkdown(updated);
      if (readmeResult) {
        const wordCount = updated.split(/\s+/).filter(Boolean).length;
        setReadmeResult({
          ...readmeResult,
          markdown: updated,
          wordCount,
          readingTimeMinutes: Math.max(1, Math.round(wordCount / 200))
        });
      }
      setRefinementInput('');
    } catch (err) {
      console.error("Refine error:", err);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${standalone ? 'max-w-7xl mx-auto' : ''}`}>
      {/* Top Header Card */}
      <div className="glass-panel p-5 rounded-3xl border border-white/15 bg-gradient-to-r from-slate-900/90 via-violet-950/40 to-slate-900/90 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/40 text-violet-200 shadow-lg shadow-violet-500/10 shrink-0">
              <FileText className="w-6 h-6 text-violet-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-white font-sans">
                  Intelligent README.md Generator
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Grounded in Codebase
                </span>
                {repoName && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 text-[10px] font-mono">
                    📁 {repoName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Drafts a comprehensive, production-grade architectural summary, system invariant breakdown, and feature list in GitHub-flavored Markdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading || !repoName}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Drafting README...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{readmeResult ? 'Regenerate README' : 'Generate README'}</span>
                </>
              )}
            </button>

            {readmeResult && (
              <>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-mono text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  title="Copy Raw Markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 font-mono text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  title="Download README.md file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Download .md</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Detected Tech Stack Quick Badges */}
        {techOverview && techOverview.globalTechs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-slate-400 scrollbar-none">
            <span className="text-slate-500 shrink-0 uppercase tracking-wider text-[10px] font-bold">Detected Stack:</span>
            {techOverview.globalTechs.slice(0, 7).map(tech => (
              <span 
                key={tech.id} 
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300 shrink-0 flex items-center gap-1"
              >
                <span>{tech.icon}</span>
                <span>{tech.name}</span>
              </span>
            ))}
            <span className="text-slate-500 shrink-0">• {fileTree.length} total files</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls (1/3) & Right Preview/Editor (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Style, Options & Preferences */}
        <div className="lg:col-span-4 space-y-4">
          {/* Style Presets */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-violet-400" />
                Documentation Style
              </span>
            </div>

            <div className="space-y-2">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedStyle(opt.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    selectedStyle === opt.id
                      ? `bg-gradient-to-r ${opt.color} shadow-md`
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base mt-0.5">{opt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold font-sans text-white">{opt.label}</h4>
                    <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section Inclusions & Toggles */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-slate-950/70 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Section Inclusions
            </span>

            <div className="space-y-2 text-xs font-mono">
              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <span className="text-slate-300 flex items-center gap-2">
                  <span>🏷️</span> Badges & Status Shields
                </span>
                <input
                  type="checkbox"
                  checked={includeBadges}
                  onChange={(e) => setIncludeBadges(e.target.checked)}
                  className="accent-violet-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <span className="text-slate-300 flex items-center gap-2">
                  <span>🗺️</span> ASCII Directory Tree Map
                </span>
                <input
                  type="checkbox"
                  checked={includeArchitectureMap}
                  onChange={(e) => setIncludeArchitectureMap(e.target.checked)}
                  className="accent-violet-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <span className="text-slate-300 flex items-center gap-2">
                  <span>⚡</span> Quickstart & Install Steps
                </span>
                <input
                  type="checkbox"
                  checked={includeQuickstart}
                  onChange={(e) => setIncludeQuickstart(e.target.checked)}
                  className="accent-violet-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <span className="text-slate-300 flex items-center gap-2">
                  <span>⚙️</span> Env Vars & Config Table
                </span>
                <input
                  type="checkbox"
                  checked={includeEnvTable}
                  onChange={(e) => setIncludeEnvTable(e.target.checked)}
                  className="accent-violet-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <span className="text-slate-300 flex items-center gap-2">
                  <span>🛡️</span> Security & Anti-Slop Audit
                </span>
                <input
                  type="checkbox"
                  checked={includeSecurityAudit}
                  onChange={(e) => setIncludeSecurityAudit(e.target.checked)}
                  className="accent-violet-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Language & Custom Focus */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-slate-950/70 space-y-3">
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Target Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Custom Architectural Constraint
              </label>
              <input
                type="text"
                value={customFocusPrompt}
                onChange={(e) => setCustomFocusPrompt(e.target.value)}
                placeholder="e.g. Emphasize WebSocket synchronization and D3 canvas rendering..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Markdown Preview / Editor & AI Refiner */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Bar for View Tabs & Document Stats */}
          <div className="glass-panel p-3 rounded-2xl border border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Switch */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewTab('preview')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewTab === 'preview'
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rendered</span>
              </button>

              <button
                onClick={() => setViewTab('raw')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewTab === 'raw'
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw Markdown</span>
              </button>

              <button
                onClick={() => setViewTab('split')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hidden md:flex ${
                  viewTab === 'split'
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            {/* Document Metrics */}
            {readmeResult && (
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>📝 {readmeResult.wordCount} words</span>
                <span className="hidden sm:inline">• ⏱️ ~{readmeResult.readingTimeMinutes} min read</span>
                <span className="hidden md:inline">• ✨ {readmeResult.featureCount}+ features cataloged</span>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 bg-slate-950/60 text-center space-y-4 min-h-[450px] flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
                <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans">
                  Gemini is Drafting Architectural Documentation
                </h3>
                <p className="text-xs font-mono text-violet-300 mt-1">
                  {loadingStage || 'Synthesizing repo topology into Markdown...'}
                </p>
              </div>
            </div>
          ) : !editableMarkdown ? (
            <div className="glass-panel p-12 rounded-3xl border border-white/10 bg-slate-950/60 text-center space-y-4 min-h-[450px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-white font-sans">
                  Ready to Generate README.md
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Click the button below to analyze your {fileTree.length} files and draft an architectural summary and feature list.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!repoName || fileTree.length === 0}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate README for {repoName || 'Codebase'}</span>
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl overflow-hidden min-h-[550px] flex flex-col">
              {/* Rendered Preview */}
              {viewTab === 'preview' && (
                <div className="p-6 md:p-8 overflow-y-auto max-h-[700px] prose prose-invert prose-violet max-w-none text-slate-200">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-extrabold text-white pb-3 border-b border-white/10 mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-violet-200 mt-6 mb-3 pb-1 border-b border-white/5" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-slate-100 mt-4 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="text-sm text-slate-300 leading-relaxed my-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2 text-sm text-slate-300" {...props} />,
                      li: ({ node, ...props }) => <li className="text-slate-300 leading-relaxed" {...props} />,
                      code: ({ node, inline, ...props }: any) => 
                        inline ? (
                          <code className="px-1.5 py-0.5 bg-black/40 text-violet-300 rounded font-mono text-xs border border-white/10" {...props} />
                        ) : (
                          <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-white/10 font-mono text-xs overflow-x-auto text-emerald-300">
                            <code {...props} />
                          </div>
                        ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="w-full text-xs font-mono border-collapse border border-white/10 rounded-xl overflow-hidden" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => <th className="bg-slate-800/80 p-2.5 text-left text-violet-300 border border-white/10 font-bold" {...props} />,
                      td: ({ node, ...props }) => <td className="p-2.5 border border-white/10 text-slate-300 bg-slate-950/40" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-violet-500 pl-4 py-1 my-3 text-slate-400 italic bg-violet-950/10 rounded-r-xl" {...props} />
                    }}
                  >
                    {editableMarkdown}
                  </ReactMarkdown>
                </div>
              )}

              {/* Raw Editor */}
              {viewTab === 'raw' && (
                <div className="flex-1 flex flex-col p-4 bg-slate-950">
                  <textarea
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    className="w-full flex-1 min-h-[500px] bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-violet-600/40"
                    placeholder="Enter or edit Markdown..."
                  />
                </div>
              )}

              {/* Split View */}
              {viewTab === 'split' && (
                <div className="grid grid-cols-2 divide-x divide-white/10 min-h-[550px] max-h-[700px]">
                  {/* Left: Raw */}
                  <div className="p-4 bg-slate-950 overflow-y-auto">
                    <textarea
                      value={editableMarkdown}
                      onChange={(e) => setEditableMarkdown(e.target.value)}
                      className="w-full h-full min-h-[500px] bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-violet-600/40"
                    />
                  </div>

                  {/* Right: Rendered */}
                  <div className="p-5 overflow-y-auto prose prose-invert prose-violet max-w-none text-slate-200 text-xs">
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white pb-2 border-b border-white/10 mb-3" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-violet-200 mt-4 mb-2" {...props} />,
                        p: ({ node, ...props }) => <p className="text-xs text-slate-300 leading-relaxed my-1.5" {...props} />,
                        code: ({ node, inline, ...props }: any) => 
                          inline ? (
                            <code className="px-1 py-0.5 bg-black/40 text-violet-300 rounded font-mono text-[10px]" {...props} />
                          ) : (
                            <div className="my-2 p-3 bg-slate-950 rounded-xl border border-white/10 font-mono text-[11px] overflow-x-auto text-emerald-300">
                              <code {...props} />
                            </div>
                          ),
                      }}
                    >
                      {editableMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Refinement Deck */}
          {editableMarkdown && (
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-slate-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                  Iterate & Polish with Gemini
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Custom AI section rewriter
                </span>
              </div>

              {/* Quick refinement suggestions */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_REFINEMENTS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRefine(q)}
                    disabled={isRefining}
                    className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-violet-500/40 transition-all shrink-0 disabled:opacity-50"
                  >
                    ✨ {q}
                  </button>
                ))}
              </div>

              {/* Custom instruction input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && refinementInput.trim()) {
                      handleRefine(refinementInput);
                    }
                  }}
                  placeholder="Ask Gemini to polish, restructure, or add specific sections..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => handleRefine(refinementInput)}
                  disabled={isRefining || !refinementInput.trim()}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isRefining ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>Refine</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
