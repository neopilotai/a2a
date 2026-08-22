/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ReactNode } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  Check, 
  FileCode, 
  Terminal, 
  Code2, 
  Wrench, 
  Lock, 
  CheckCircle2, 
  Eye, 
  Edit3, 
  Sparkles,
  AlertOctagon
} from 'lucide-react';

export interface GateMutationPayload {
  id: string;
  source: 'autofix' | 'cli' | 'custom_patch' | 'system_mutation';
  title: string;
  location?: string;
  targetFiles: string[];
  category?: string;
  severity?: string;
  command?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  beforeCode: string;
  afterCode: string;
  explanation: string;
  invariants?: {
    antiSlopPassed: boolean;
    typeSafetyPassed: boolean;
    securityPassed: boolean;
  };
}

interface ApprovalGateProps {
  /** Title displayed on the approval banner/modal */
  gateTitle?: string;
  /** Whether the gate is enabled (if false, mutations pass through immediately) */
  enabled?: boolean;
  /** Children node (e.g. trigger buttons, terminal controls, or action panel) */
  children?: ReactNode;
  /** Active pending mutation payload if managed externally */
  pendingMutation?: GateMutationPayload | null;
  /** Callback fired when user confirms the mutation */
  onConfirm?: (modifiedCode?: string) => void;
  /** Callback fired when user cancels/rejects the mutation */
  onCancel?: () => void;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({
  gateTitle = "Strict Pre-Push Mutation Interceptor",
  enabled = true,
  children,
  pendingMutation,
  onConfirm,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'side_by_side' | 'unified' | 'editor'>('side_by_side');
  const [editedCode, setEditedCode] = useState<string>(pendingMutation?.afterCode || '');

  // Keep editedCode synced with pendingMutation when it changes
  React.useEffect(() => {
    if (pendingMutation?.afterCode) {
      setEditedCode(pendingMutation.afterCode);
    }
  }, [pendingMutation]);

  if (!pendingMutation) {
    return <>{children}</>;
  }

  const handleConfirmAction = () => {
    if (onConfirm) {
      onConfirm(editedCode);
    }
  };

  const handleCancelAction = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const getRiskBadge = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="relative">
      {children}

      {/* APPROVAL GATE OVERLAY DIALOG */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-white/15 bg-slate-900 shadow-2xl overflow-hidden">
          {/* Top Decorative Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    APPROVAL GATE ACTIVE
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    REQUIRES CONFIRMATION
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {gateTitle}
                </h3>
              </div>
            </div>

            <button
              onClick={handleCancelAction}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Cancel execution"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-slate-200">
            {/* Meta Details Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 rounded-xl border border-white/10 bg-slate-950 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    Target Location
                  </span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Source: {pendingMutation.source.toUpperCase()}
                  </span>
                </div>
                <div className="font-mono text-xs text-emerald-300 bg-slate-900 px-3 py-1.5 rounded border border-white/5 break-all">
                  {pendingMutation.location || pendingMutation.targetFiles.join(', ')}
                </div>
                {pendingMutation.command && (
                  <div className="text-xs font-mono text-cyan-300 flex items-center gap-2 pt-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400">Command:</span>
                    <code className="bg-slate-900 px-2 py-0.5 rounded">{pendingMutation.command}</code>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Risk Assessment</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${getRiskBadge(pendingMutation.riskLevel)}`}>
                    {pendingMutation.riskLevel} RISK
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate pt-2">
                  {pendingMutation.title}
                </div>
              </div>
            </div>

            {/* Invariant Health Checklist */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-emerald-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Pre-Execution Verification Checks:
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Anti-Slop Clean
                </span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Type Contracts Passed
                </span>
              </div>
            </div>

            {/* Diff Preview Navigation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('side_by_side')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'side_by_side'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Side-by-Side Diff
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'editor'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Patch
                  </button>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Inspect exact line mutations before applying to codebase
                </span>
              </div>

              {/* Side-by-Side Diff */}
              {activeTab === 'side_by_side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-rose-500/20 bg-slate-950 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-rose-400 border-b border-rose-500/20 pb-1">
                      <span>Current Code (Pre-Mutation)</span>
                      <span className="text-[10px] text-slate-500">Original</span>
                    </div>
                    <pre className="font-mono text-xs text-rose-200/90 bg-rose-950/20 p-2.5 rounded overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 custom-scrollbar">
                      {pendingMutation.beforeCode}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-slate-950 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-400 border-b border-emerald-500/20 pb-1">
                      <span>Proposed Repair Code</span>
                      <span className="text-[10px] text-emerald-400/80">Proposed Patch</span>
                    </div>
                    <pre className="font-mono text-xs text-emerald-200/90 bg-emerald-950/20 p-2.5 rounded overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 custom-scrollbar">
                      {editedCode}
                    </pre>
                  </div>
                </div>
              )}

              {/* Patch Editor */}
              {activeTab === 'editor' && (
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-slate-300">
                    Direct Code Editor (Modify proposed patch prior to pushing):
                  </label>
                  <textarea
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-purple-500/30 bg-slate-950 p-3 font-mono text-xs text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed custom-scrollbar"
                  />
                </div>
              )}
            </div>

            {/* Rationale */}
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 space-y-1">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Fix Explanation & Reasoning:
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {pendingMutation.explanation}
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-white/10 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-emerald-400" />
              <span>Confirmation prevents accidental destructive changes</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-rose-400" />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Confirm & Push Mutation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
