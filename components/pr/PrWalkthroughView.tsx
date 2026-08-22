/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChangeStackPr, PrFileDiff } from '../../types';
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  FileCode2, 
  ChevronDown, 
  ChevronRight, 
  Compass, 
  Zap,
  GitCommit,
  Clock,
  ArrowRight
} from 'lucide-react';
import { generatePrWalkthroughWithAi } from '../../services/geminiService';

interface PrWalkthroughViewProps {
  pr: ChangeStackPr;
  repoName?: string;
  onUpdateWalkthrough?: (updated: any) => void;
}

export const PrWalkthroughView: React.FC<PrWalkthroughViewProps> = ({
  pr,
  repoName = 'google/link2ink-core',
  onUpdateWalkthrough
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({
    [pr.fileDiffs[0]?.path || 'services/authService.ts']: true
  });

  const toggleFile = (path: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleRegenerateWalkthrough = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePrWalkthroughWithAi(pr, repoName);
      if (onUpdateWalkthrough) {
        onUpdateWalkthrough(result);
      }
    } catch (e) {
      console.error('Failed to regenerate walkthrough', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const riskBadgeColor = (risk: string) => {
    if (risk === 'Low') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (risk === 'Moderate') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Walkthrough Hero Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold">
                PR #{pr.number} Architectural Walkthrough
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${riskBadgeColor(pr.walkthrough.riskScore)}`}>
                {pr.walkthrough.riskScore} Risk Blast Radius
              </span>
            </div>
            <h2 className="text-lg font-bold text-white font-sans">
              {pr.title}
            </h2>
          </div>

          <button
            onClick={handleRegenerateWalkthrough}
            disabled={isGenerating}
            className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-mono font-bold transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-cyan-300 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing PR Diffs...' : 'Regenerate AI Walkthrough'}</span>
          </button>
        </div>

        {/* High-Level Architectural Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Executive Summary
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-white/5">
            {pr.walkthrough.highLevelSummary}
          </p>
        </div>

        {/* 3-Column Architectural Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Architectural Impact */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Architectural Impact</span>
            </div>
            <p className="text-xs text-slate-300">
              {pr.walkthrough.architecturalImpact}
            </p>
          </div>

          {/* Blast Radius Boundaries */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-violet-300 font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>Blast Radius Scope</span>
            </div>
            <p className="text-xs text-slate-300">
              {pr.walkthrough.blastRadius}
            </p>
          </div>

          {/* Key Modules Affected */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>Impacted Modules</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pr.walkthrough.keyModulesAffected.map((mod, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 text-[10px] font-mono border border-white/10">
                  {mod}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. File-by-File Diff Walkthrough */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Changed Files & Architectural Diff Intent ({pr.fileDiffs.length} files)
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">+{pr.additions}</span> / <span className="text-rose-400 font-bold">-{pr.deletions}</span> lines
          </div>
        </div>

        <div className="space-y-3">
          {pr.fileDiffs.map(file => {
            const isExpanded = expandedFiles[file.path] ?? false;
            return (
              <div 
                key={file.path} 
                className="rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden transition-all shadow-lg"
              >
                {/* File Header Bar */}
                <button
                  type="button"
                  onClick={() => toggleFile(file.path)}
                  className="w-full p-3.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between gap-3 text-left border-b border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">
                      {file.path}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/5 text-slate-400 text-[10px] font-mono">
                      {file.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-emerald-400">+{file.additions}</span>
                    <span className="text-[11px] font-mono text-rose-400">-{file.deletions}</span>
                  </div>
                </button>

                {/* Architectural Intent Sub-bar */}
                <div className="px-4 py-2 bg-violet-950/20 border-b border-violet-500/10 text-xs text-violet-300 font-sans flex items-center gap-2">
                  <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-violet-400">Intent:</span>
                  <span>{file.architecturalIntent}</span>
                </div>

                {/* Diff Viewer Code Box */}
                {isExpanded && (
                  <div className="p-3 font-mono text-xs overflow-x-auto bg-[#0d1117] text-slate-200 divide-y divide-white/5">
                    {file.diffHunks.map((hunk, hIdx) => (
                      <div key={hIdx} className="py-2 first:pt-0 last:pb-0">
                        <div className="text-[11px] text-cyan-400/80 bg-cyan-950/30 px-2 py-1 rounded mb-1.5 font-bold">
                          {hunk.header}
                        </div>
                        <div className="space-y-0.5">
                          {hunk.lines.map((line, lIdx) => {
                            const isAdd = line.type === 'add';
                            const isDel = line.type === 'delete';
                            return (
                              <div
                                key={lIdx}
                                className={`flex items-start px-2 py-0.5 rounded ${
                                  isAdd
                                    ? 'bg-emerald-950/40 text-emerald-300'
                                    : isDel
                                    ? 'bg-rose-950/40 text-rose-300'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span className="w-8 text-[10px] text-slate-600 select-none text-right pr-2">
                                  {line.newLineNumber || line.oldLineNumber || ''}
                                </span>
                                <span className="w-4 select-none text-center font-bold">
                                  {isAdd ? '+' : isDel ? '-' : ' '}
                                </span>
                                <pre className="font-mono text-xs whitespace-pre-wrap break-all flex-1">
                                  {line.content}
                                </pre>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Commit Stack Log */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-violet-400" />
          <span>Commit Log in this PR ({pr.commitHistory.length} commits)</span>
        </h4>
        <div className="space-y-2">
          {pr.commitHistory.map(c => (
            <div key={c.hash} className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-violet-400 font-bold">{c.hash}</span>
                <span className="text-slate-300 truncate">{c.message}</span>
              </div>
              <span className="text-slate-500 text-[10px] shrink-0">by {c.author}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
