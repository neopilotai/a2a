/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChangeStackPr, PrStatus } from '../../types';
import { 
  GitBranch, 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  Plus,
  ArrowUpRight
} from 'lucide-react';

interface ChangeStackVisualizerProps {
  stack: ChangeStackPr[];
  activePrId: string;
  onSelectPr: (prId: string) => void;
  onNewStackedPr?: () => void;
}

export const ChangeStackVisualizer: React.FC<ChangeStackVisualizerProps> = ({
  stack,
  activePrId,
  onSelectPr,
  onNewStackedPr
}) => {
  const getStatusBadge = (status: PrStatus, ciStatus: string) => {
    if (status === 'merged') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-purple-400" />
          MERGED
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          APPROVED
        </span>
      );
    }
    if (status === 'failing_ci' || ciStatus === 'failed') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
          <XCircle className="w-3 h-3 text-rose-400" />
          FAILING CI
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30 text-[10px] font-mono font-bold flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          DRAFT
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-cyan-400" />
        NEEDS REVIEW
      </span>
    );
  };

  return (
    <div className="w-full bg-slate-900/70 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
      {/* Top Header of Stack */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-md">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white font-mono tracking-tight">
                Git Change Stack Pipeline
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-semibold">
                {stack.length} Stacked PRs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Linear dependent branches stacked sequentially from foundation layer to head
            </p>
          </div>
        </div>

        {onNewStackedPr && (
          <button
            onClick={onNewStackedPr}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-violet-200 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Stack New PR</span>
          </button>
        )}
      </div>

      {/* Visual Stack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {stack.map((pr, index) => {
          const isActive = pr.id === activePrId;
          const unresolvedCount = pr.reviewComments.filter(c => c.status === 'unresolved').length;
          
          return (
            <div
              key={pr.id}
              onClick={() => onSelectPr(pr.id)}
              className={`relative cursor-pointer rounded-xl p-3.5 transition-all border text-left flex flex-col justify-between group ${
                isActive
                  ? 'bg-slate-950/90 border-violet-500 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/50'
                  : 'bg-slate-950/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
              }`}
            >
              {/* Stack Connection Line / Number Indicator */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                    {pr.stackOrder}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-white">
                    PR #{pr.number}
                  </span>
                </div>
                {getStatusBadge(pr.status, pr.ciStatus)}
              </div>

              {/* Title & Branch */}
              <div className="space-y-1.5 my-1">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                  {pr.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate">
                  <GitBranch className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{pr.branch}</span>
                </div>
              </div>

              {/* Metrics Bottom Row */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">+{pr.additions}</span>
                  <span className="text-rose-400">-{pr.deletions}</span>
                  <span>• {pr.filesChanged} files</span>
                </div>
                {unresolvedCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {unresolvedCount} comments
                  </span>
                ) : (
                  <span className="text-slate-500">0 comments</span>
                )}
              </div>

              {/* Active Indicator Pulse */}
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
