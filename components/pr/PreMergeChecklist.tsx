/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChangeStackPr } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  FileText, 
  TestTube2, 
  MessageSquareCode,
  Lock,
  GitMerge
} from 'lucide-react';

interface PreMergeChecklistProps {
  pr: ChangeStackPr;
  onNavigateToFinishing: (subTab: 'docstrings' | 'ci_fix' | 'unit_tests') => void;
  onNavigateToComments: () => void;
  onAutoFixAll?: () => void;
}

export const PreMergeChecklist: React.FC<PreMergeChecklistProps> = ({
  pr,
  onNavigateToFinishing,
  onNavigateToComments,
  onAutoFixAll
}) => {
  const failingCiChecks = pr.ciChecks.filter(c => c.status === 'failed');
  const missingDocstringsCount = pr.missingDocstrings.filter(d => !d.applied).length;
  const unresolvedComments = pr.reviewComments.filter(c => c.status === 'unresolved');
  const isCiFailing = failingCiChecks.length > 0;
  const isDocstringsMissing = missingDocstringsCount > 0;
  const hasUnresolvedComments = unresolvedComments.length > 0;

  const totalIssuesCount = (isCiFailing ? failingCiChecks.length : 0) + (isDocstringsMissing ? 1 : 0) + unresolvedComments.length;
  const isReadyToMerge = totalIssuesCount === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Merge Gatekeeper Status Banner */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
        isReadyToMerge
          ? 'bg-emerald-950/40 border-emerald-500/40 shadow-emerald-900/10'
          : 'bg-rose-950/30 border-rose-500/40 shadow-rose-900/10'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-xl border ${
              isReadyToMerge
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
            }`}>
              {isReadyToMerge ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  {isReadyToMerge ? 'Pre-Merge Gatekeeper: All Checks Passed' : `Pre-Merge Gatekeeper: Blocked (${totalIssuesCount} Issues)`}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  isReadyToMerge
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {isReadyToMerge ? 'READY TO MERGE' : 'MERGE BLOCKED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                {isReadyToMerge
                  ? 'All automated CI checks, test suites, docstrings, and review comments are fully satisfied.'
                  : 'Automated policy requires fixing failing CI steps, unresolved review comments, and missing contract docstrings prior to merge.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadyToMerge && onAutoFixAll && (
              <button
                onClick={onAutoFixAll}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>One-Click Auto Heal All</span>
              </button>
            )}

            {isReadyToMerge && (
              <button
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <GitMerge className="w-4 h-4" />
                <span>Squash & Merge PR #{pr.number}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Gatekeeper Diagnostic Checklist Matrix */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Pre-Merge Verification Pipeline
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Check 1: CI Build & Typecheck */}
          <div className={`p-4 rounded-xl border transition-all ${
            isCiFailing 
              ? 'bg-slate-950/90 border-rose-500/40 ring-1 ring-rose-500/20' 
              : 'bg-slate-950/60 border-white/5'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  {isCiFailing ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      CI Pipeline Checks
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isCiFailing ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isCiFailing ? `${failingCiChecks.length} Failed` : 'Passing'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isCiFailing 
                      ? `${failingCiChecks.map(c => c.name).join(', ')} failed compilation.` 
                      : 'TypeScript compiler, ESLint, and test runners passed with 0 errors.'}
                  </p>
                </div>
              </div>

              {isCiFailing && (
                <button
                  onClick={() => onNavigateToFinishing('ci_fix')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-[11px] font-mono font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-rose-300" />
                  <span>Fix with AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Check 2: Actionable Review Comments */}
          <div className={`p-4 rounded-xl border transition-all ${
            hasUnresolvedComments 
              ? 'bg-slate-950/90 border-amber-500/40 ring-1 ring-amber-500/20' 
              : 'bg-slate-950/60 border-white/5'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  {hasUnresolvedComments ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      Actionable Review Comments
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      hasUnresolvedComments ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {hasUnresolvedComments ? `${unresolvedComments.length} Unresolved` : 'Resolved'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {hasUnresolvedComments 
                      ? `${unresolvedComments.length} review comments posted across files require patch resolution.` 
                      : 'All peer review feedback and security comments resolved.'}
                  </p>
                </div>
              </div>

              {hasUnresolvedComments && (
                <button
                  onClick={onNavigateToComments}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[11px] font-mono font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <MessageSquareCode className="w-3 h-3" />
                  <span>Review Comments</span>
                </button>
              )}
            </div>
          </div>

          {/* Check 3: Docstrings & Architectural Documentation */}
          <div className={`p-4 rounded-xl border transition-all ${
            isDocstringsMissing 
              ? 'bg-slate-950/90 border-cyan-500/40 ring-1 ring-cyan-500/20' 
              : 'bg-slate-950/60 border-white/5'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  {isDocstringsMissing ? (
                    <FileText className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      Exported Symbol Docstrings
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isDocstringsMissing ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isDocstringsMissing ? `${missingDocstringsCount} Missing` : 'Documented'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isDocstringsMissing
                      ? `${missingDocstringsCount} exported functions/types lack TSDoc / JSDoc documentation.`
                      : 'All public symbols and interfaces have typed docstrings.'}
                  </p>
                </div>
              </div>

              {isDocstringsMissing && (
                <button
                  onClick={() => onNavigateToFinishing('docstrings')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 text-[11px] font-mono font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span>Generate</span>
                </button>
              )}
            </div>
          </div>

          {/* Check 4: Test Coverage & Regression Synthesis */}
          <div className="p-4 rounded-xl border bg-slate-950/60 border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  <TestTube2 className="w-4 h-4 text-violet-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      Unit Test Suite Coverage
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-violet-500/20 text-violet-300">
                      {pr.generatedUnitTests?.status === 'committed_to_branch' ? '88% Coverage' : '64% Coverage'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {pr.generatedUnitTests?.status === 'committed_to_branch'
                      ? 'Automated unit test suite committed to branch (+24% coverage gain).'
                      : 'AI unit test synthesizer available to generate regression test suites.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToFinishing('unit_tests')}
                className="px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/30 text-[11px] font-mono font-bold shrink-0 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Unit Tests</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
