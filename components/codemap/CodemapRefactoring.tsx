/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Code2, 
  Layers, 
  Cpu, 
  Terminal, 
  RotateCcw, 
  Search, 
  Filter, 
  Gauge, 
  FileCode2, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Download,
  FolderOpen
} from 'lucide-react';
import { 
  RefactoringCatalog, 
  RefactoringSuggestion, 
  RefactoringType, 
  RepoFileTree, 
  ViewMode 
} from '../../types';

interface CodemapRefactoringProps {
  catalog: RefactoringCatalog | null;
  isGenerating: boolean;
  onGenerateCatalog: (focusType?: string) => void;
  onTargetedRefactor: (filePath: string, recipe: RefactoringType | 'comprehensive', customInstructions?: string) => Promise<void>;
  repoName: string;
  fileTree: RepoFileTree[];
  onNavigate: (mode: ViewMode, data?: any) => void;
}

const REFACTORING_TYPE_INFO: Record<RefactoringType, { label: string; color: string; bg: string; border: string; desc: string }> = {
  class_to_functional: {
    label: 'Class to Functional Hooks',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    desc: 'Converts legacy class components & lifecycle methods to declarative functional components with React Hooks.'
  },
  custom_hook_extraction: {
    label: 'Custom Hook Extraction',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    desc: 'Extracts entangled stateful lifecycles and event listeners into reusable, testable custom hooks.'
  },
  state_modernization: {
    label: 'State Modernization',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    desc: 'Eliminates prop drilling and streamlines complex state using modern context, reducers, or atomic stores.'
  },
  typescript_hardening: {
    label: 'TypeScript Hardening',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    desc: 'Replaces loose any types with strict discriminated unions and compile-time invariant guardrails.'
  },
  architecture_decoupling: {
    label: 'Architecture Decoupling',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    desc: 'Decouples heavy presentation components from direct backend/API calls into modular service layers.'
  },
  async_pipeline: {
    label: 'Async & Concurrency Pipeline',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    desc: 'Modernizes async operations with AbortController signal handling and race-condition elimination.'
  },
  performance_memoization: {
    label: 'Performance & Memoization',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    desc: 'Eliminates re-render cascades and stabilizes dependency arrays for heavy computations.'
  }
};

export const CodemapRefactoring: React.FC<CodemapRefactoringProps> = ({
  catalog,
  isGenerating,
  onGenerateCatalog,
  onTargetedRefactor,
  repoName,
  fileTree,
  onNavigate
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [quickWinsOnly, setQuickWinsOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [diffViewModes, setDiffViewModes] = useState<Record<string, 'after' | 'before' | 'split'>>({});
  const [appliedSuggestions, setAppliedSuggestions] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedPlaybook, setCopiedPlaybook] = useState<boolean>(false);

  // Targeted file refactoring modal/drawer state
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [targetFilePath, setTargetFilePath] = useState<string>('');
  const [targetRecipe, setTargetRecipe] = useState<RefactoringType | 'comprehensive'>('class_to_functional');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isSubmittingTarget, setIsSubmittingTarget] = useState<boolean>(false);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle applied state
  const toggleApplied = (id: string) => {
    setAppliedSuggestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Copy complete playbook as Markdown
  const handleCopyPlaybook = () => {
    if (!catalog) return;
    const md = `# Intelligent Code Modernization & Refactoring Playbook
Repository: ${repoName}
Generated: ${new Date(catalog.generatedAt).toLocaleString()}
Modernization Score: ${catalog.modernizationScore}/100
Debt Reduction: ${catalog.architecturalDebtReduction}

## Summary
${catalog.summary}

## Refactoring Opportunities (${catalog.suggestions.length} Total)

${catalog.suggestions.map((s, idx) => `
### ${idx + 1}. ${s.title}
- **Target File:** \`${s.filePath}\`
- **Recipe Category:** ${s.refactoringType}
- **Severity:** ${s.severity} | **Effort:** ${s.effort} | **Est. Time:** ${s.estimatedMinutes} min
- **Boilerplate Reduction:** ${s.modernizationGains.boilerplateReductionPercent || 0}%
- **Testability:** ${s.modernizationGains.testability} | **Bundle Impact:** ${s.modernizationGains.bundleImpact}

#### Motivation
${s.motivation}

#### Step-by-Step Diff Explanation
${s.diffExplanation.map(d => `- ${d}`).join('\n')}

#### Invariant Guardrails
${s.invariantGuardrails.map(g => `- ⚠️ ${g}`).join('\n')}

#### Modernized Implementation
\`\`\`typescript
${s.codeAfter}
\`\`\`
`).join('\n---\n')}
`;
    navigator.clipboard.writeText(md);
    setCopiedPlaybook(true);
    setTimeout(() => setCopiedPlaybook(false), 2500);
  };

  // Handle Targeted Refactor submission
  const handleRunTargeted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFilePath.trim()) return;
    setIsSubmittingTarget(true);
    try {
      await onTargetedRefactor(targetFilePath.trim(), targetRecipe, customInstructions.trim());
      setShowTargetModal(false);
      setTargetFilePath('');
      setCustomInstructions('');
    } catch (err) {
      console.error('Targeted refactor error:', err);
    } finally {
      setIsSubmittingTarget(false);
    }
  };

  // Filtered suggestions
  const suggestions = catalog?.suggestions || [];
  const filteredSuggestions = suggestions.filter(s => {
    if (selectedTypeFilter !== 'all' && s.refactoringType !== selectedTypeFilter) return false;
    if (quickWinsOnly && s.severity !== 'quick_win') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.filePath.toLowerCase().includes(q) ||
        s.motivation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate dynamic applied score
  const baseScore = catalog?.modernizationScore || 70;
  const appliedCount = Object.values(appliedSuggestions).filter(Boolean).length;
  const dynamicScore = Math.min(100, Math.round(baseScore + (appliedCount * ((100 - baseScore) / Math.max(1, suggestions.length)))));

  return (
    <div id="codemap-refactoring-module" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Header & Modernization Command Deck */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span>Intelligent Refactoring Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Architecture-Grounded Code Modernization
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
              Analyze legacy architectural debt, convert React class components to modern functional hooks, extract clean reusable state abstractions, and enforce strict compile-time TypeScript contracts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-trigger-target-refactor"
              onClick={() => setShowTargetModal(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-2xl text-xs font-mono font-bold border border-white/10 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              <span>Target Specific File</span>
            </button>

            <button
              id="btn-run-refactor-scan"
              onClick={() => onGenerateCatalog(selectedTypeFilter)}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-mono font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing Architecture...' : (catalog ? 'Re-Analyze Refactoring' : 'Run Modernization Scan')}</span>
            </button>
          </div>
        </div>
      </div>

      {catalog && (
        <>
          {/* Key Metrics Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Modernization Score Card */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="relative p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Modernization Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {dynamicScore}%
                  </span>
                  {appliedCount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      +{dynamicScore - baseScore}% applied
                    </span>
                  )}
                </div>
                <div className="w-28 bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${dynamicScore}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Total Opportunities */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Refactor Targets
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {catalog.totalSuggestions}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    modules
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Across {catalog.categoriesBreakdown.length} modernization categories
                </span>
              </div>
            </div>

            {/* Quick Wins */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Quick Wins
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-amber-400 font-mono">
                    {catalog.quickWinsCount}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    immediate payoff
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Low effort, high clarity boost
                </span>
              </div>
            </div>

            {/* Debt Reduction */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Boilerplate Relief
                </span>
                <div className="text-sm font-bold text-white font-mono mt-0.5 line-clamp-1">
                  {catalog.architecturalDebtReduction}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Improved hook composability
                </span>
              </div>
            </div>

          </div>

          {/* Summary Banner & Playbook Export */}
          <div className="p-4 md:p-5 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold block">
                Architectural Diagnosis
              </span>
              <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
                {catalog.summary}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-copy-refactoring-playbook"
                onClick={handleCopyPlaybook}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                title="Copy entire refactoring playbook as Markdown"
              >
                {copiedPlaybook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPlaybook ? 'Playbook Copied!' : 'Export Playbook'}</span>
              </button>
            </div>
          </div>

          {/* Modernization Category Chips & Filter Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                    selectedTypeFilter === 'all'
                      ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-black/40 text-slate-300">
                    {suggestions.length}
                  </span>
                </button>

                {Object.entries(REFACTORING_TYPE_INFO).map(([typeKey, info]) => {
                  const count = suggestions.filter(s => s.refactoringType === typeKey).length;
                  if (count === 0) return null;
                  const isActive = selectedTypeFilter === typeKey;

                  return (
                    <button
                      key={typeKey}
                      onClick={() => setSelectedTypeFilter(typeKey)}
                      className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? `${info.bg} ${info.border} ${info.color} font-bold`
                          : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{info.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Win Filter Toggle & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setQuickWinsOnly(!quickWinsOnly)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    quickWinsOnly
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Quick Wins Only</span>
                </button>

                <div className="relative min-w-[160px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter suggestions..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-3xl border border-white/10">
                <Wrench className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-mono text-slate-400">
                  No refactoring suggestions match the selected criteria.
                </p>
                <button
                  onClick={() => { setSelectedTypeFilter('all'); setQuickWinsOnly(false); setSearchQuery(''); }}
                  className="mt-3 text-xs font-mono text-indigo-400 hover:text-indigo-300 underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => {
                const isExpanded = expandedCards[suggestion.id] ?? true;
                const viewMode = diffViewModes[suggestion.id] || 'split';
                const isApplied = !!appliedSuggestions[suggestion.id];
                const typeInfo = REFACTORING_TYPE_INFO[suggestion.refactoringType] || REFACTORING_TYPE_INFO.class_to_functional;

                return (
                  <div
                    key={suggestion.id}
                    id={`suggestion-card-${suggestion.id}`}
                    className={`glass-panel rounded-3xl border transition-all overflow-hidden ${
                      isApplied 
                        ? 'border-emerald-500/40 bg-emerald-950/10' 
                        : 'border-white/10 hover:border-indigo-500/40'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="p-5 md:p-6 bg-slate-950/70 border-b border-white/10">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Type Pill */}
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.border} ${typeInfo.color} border`}>
                              {typeInfo.label}
                            </span>

                            {/* Severity Pill */}
                            {suggestion.severity === 'quick_win' && (
                              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" />
                                <span>Quick Win</span>
                              </span>
                            )}
                            {suggestion.severity === 'high_impact' && (
                              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                High Impact
                              </span>
                            )}

                            {/* Time & Effort */}
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                              <Clock className="w-2.5 h-2.5" />
                              <span>~{suggestion.estimatedMinutes}m ({suggestion.effort} effort)</span>
                            </span>

                            {/* File Path Pill */}
                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <FileCode2 className="w-3 h-3 text-indigo-400" />
                              <span className="truncate max-w-[220px]">{suggestion.filePath}</span>
                            </span>
                          </div>

                          <h3 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            {suggestion.title}
                          </h3>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {suggestion.motivation}
                          </p>
                        </div>

                        {/* Right Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Apply / Stage Checkbox Button */}
                          <button
                            onClick={() => toggleApplied(suggestion.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                              isApplied
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                            }`}
                            title="Mark as staged or simulated in codebase"
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isApplied ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span>{isApplied ? 'Staged / Modernized' : 'Stage Refactor'}</span>
                          </button>

                          {/* Open with AI Assistant */}
                          <button
                            onClick={() => onNavigate(ViewMode.AI_ASSISTANT, { 
                              initialPrompt: `I want to execute this modernization refactor on file "${suggestion.filePath}":\n\nTitle: ${suggestion.title}\nCategory: ${suggestion.refactoringType}\n\nMotivation:\n${suggestion.motivation}\n\nKey Steps:\n${suggestion.diffExplanation.map(d => `- ${d}`).join('\n')}\n\nGuardrails:\n${suggestion.invariantGuardrails.map(g => `- ${g}`).join('\n')}\n\nPlease help me inspect and refactor this file safely.`
                            })}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                            title="Open in AI Assistant to execute changes"
                          >
                            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Execute with AI</span>
                          </button>

                          {/* Expand/Collapse */}
                          <button
                            onClick={() => toggleExpand(suggestion.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Gains Metrics Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5">
                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                            Boilerplate Cut
                          </span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            -{suggestion.modernizationGains.boilerplateReductionPercent || 35}% lines
                          </span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                            Testability Impact
                          </span>
                          <span className="text-xs font-bold text-sky-400 font-mono capitalize">
                            {suggestion.modernizationGains.testability} testability
                          </span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                            Bundle Footprint
                          </span>
                          <span className="text-xs font-bold text-purple-400 font-mono capitalize">
                            {suggestion.modernizationGains.bundleImpact} impact
                          </span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                            Readability Score
                          </span>
                          <span className="text-xs font-bold text-indigo-400 font-mono">
                            {suggestion.modernizationGains.readabilityScore || 90}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Expanded Body */}
                    {isExpanded && (
                      <div className="p-5 md:p-6 space-y-6">
                        
                        {/* Step-by-Step Modernization Breakdown */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Transformation Roadmap & Key Steps</span>
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {suggestion.diffExplanation.map((step, sIdx) => (
                              <div 
                                key={sIdx}
                                className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300 font-sans flex items-start gap-2"
                              >
                                <span className="text-indigo-400 font-mono text-[10px] font-bold mt-0.5">
                                  0{sIdx + 1}.
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Invariant Guardrails */}
                        {suggestion.invariantGuardrails && suggestion.invariantGuardrails.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                            <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Preservation Invariants & Safety Guardrails</span>
                            </span>
                            <div className="space-y-1">
                              {suggestion.invariantGuardrails.map((guard, gIdx) => (
                                <div key={gIdx} className="text-xs text-amber-200/90 font-mono flex items-start gap-2">
                                  <span className="text-amber-400 mt-0.5">•</span>
                                  <span>{guard}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Code Transformation Viewer */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-sky-400" />
                              <span>Code Transformation Diff</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {/* View Mode Toggle */}
                              <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10">
                                <button
                                  onClick={() => setDiffViewModes(prev => ({ ...prev, [suggestion.id]: 'split' }))}
                                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                                    viewMode === 'split' ? 'bg-indigo-600/40 text-white font-bold' : 'text-slate-400'
                                  }`}
                                >
                                  Side-by-Side
                                </button>
                                <button
                                  onClick={() => setDiffViewModes(prev => ({ ...prev, [suggestion.id]: 'after' }))}
                                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                                    viewMode === 'after' ? 'bg-indigo-600/40 text-white font-bold' : 'text-slate-400'
                                  }`}
                                >
                                  Modernized Only
                                </button>
                                <button
                                  onClick={() => setDiffViewModes(prev => ({ ...prev, [suggestion.id]: 'before' }))}
                                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                                    viewMode === 'before' ? 'bg-indigo-600/40 text-white font-bold' : 'text-slate-400'
                                  }`}
                                >
                                  Legacy Only
                                </button>
                              </div>

                              {/* Copy Modernized Code */}
                              <button
                                onClick={() => handleCopyCode(suggestion.codeAfter, suggestion.id)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono border border-white/10 transition-colors flex items-center gap-1"
                              >
                                {copiedCodeId === suggestion.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-300 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Modern Code</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Split or Single Code Views */}
                          {viewMode === 'split' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Before / Legacy */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono px-2 text-rose-300">
                                  <span>🔴 Legacy Pattern (Before)</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-500/20 font-mono text-xs text-rose-200/90 overflow-x-auto max-h-80 scrollbar-thin">
                                  <pre className="whitespace-pre">{suggestion.codeBefore}</pre>
                                </div>
                              </div>

                              {/* After / Modernized */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono px-2 text-emerald-300">
                                  <span>🟢 Modernized with Hooks (After)</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/20 font-mono text-xs text-emerald-200/90 overflow-x-auto max-h-80 scrollbar-thin">
                                  <pre className="whitespace-pre">{suggestion.codeAfter}</pre>
                                </div>
                              </div>
                            </div>
                          ) : viewMode === 'after' ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-mono px-2 text-emerald-300">
                                <span>🟢 Modernized Implementation with Hooks</span>
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 font-mono text-xs text-emerald-200/90 overflow-x-auto max-h-96 scrollbar-thin">
                                <pre className="whitespace-pre">{suggestion.codeAfter}</pre>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-mono px-2 text-rose-300">
                                <span>🔴 Legacy Code (Before)</span>
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 font-mono text-xs text-rose-200/90 overflow-x-auto max-h-96 scrollbar-thin">
                                <pre className="whitespace-pre">{suggestion.codeBefore}</pre>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Target Specific File Refactoring Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-xl p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-5 bg-slate-950">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Targeted File Modernizer</h3>
                  <p className="text-xs text-slate-400">Generate a custom modernization recipe for any repository file</p>
                </div>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRunTargeted} className="space-y-4">
              {/* File Path Picker / Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  Select or Enter File Path
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={targetFilePath}
                    onChange={(e) => setTargetFilePath(e.target.value)}
                    placeholder="e.g. src/components/UserProfile.tsx"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Quick File Select Chips from Loaded Tree */}
                {fileTree.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Quick Pick from Codebase:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin p-1 bg-black/30 rounded-xl border border-white/5">
                      {fileTree
                        .filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx') || f.path.endsWith('.ts') || f.path.endsWith('.js'))
                        .slice(0, 16)
                        .map(f => (
                          <button
                            key={f.path}
                            type="button"
                            onClick={() => setTargetFilePath(f.path)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                              targetFilePath === f.path
                                ? 'bg-indigo-600/40 border-indigo-500/60 text-white font-bold'
                                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {f.path.split('/').pop()}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recipe Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  Modernization Recipe
                </label>
                <select
                  value={targetRecipe}
                  onChange={(e) => setTargetRecipe(e.target.value as RefactoringType | 'comprehensive')}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="class_to_functional">Class Component → Functional Hooks</option>
                  <option value="custom_hook_extraction">Custom Hook Extraction</option>
                  <option value="state_modernization">State Modernization (Context / Reducers)</option>
                  <option value="typescript_hardening">TypeScript Strict Contract Hardening</option>
                  <option value="architecture_decoupling">Architecture Presentation / Service Decoupling</option>
                  <option value="async_pipeline">Async Pipeline & AbortController Handling</option>
                  <option value="performance_memoization">Performance & Re-render Optimization</option>
                  <option value="comprehensive">Comprehensive Modernization</option>
                </select>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold block">
                  Custom Refactoring Directives (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Extract window resize listeners into useWindowDimensions and ensure AbortController handles network fetch cancellation..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTarget || !targetFilePath.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isSubmittingTarget ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingTarget ? 'Generating Modernization...' : 'Generate Modernization'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
