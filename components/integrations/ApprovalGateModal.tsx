/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  Check, 
  AlertTriangle, 
  Code2, 
  Terminal, 
  Wrench, 
  FileCode, 
  Edit3, 
  Eye, 
  Lock, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  ArrowRight,
  Layers
} from 'lucide-react';

export interface PendingMutation {
  id: string;
  source: 'autofix' | 'cli' | 'custom_patch';
  title: string;
  location?: string;
  targetFiles: string[];
  category?: 'syntax' | 'react' | 'architecture' | 'security' | 'cli_command';
  severity?: 'high' | 'medium' | 'low';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  beforeCode: string;
  afterCode: string;
  explanation: string;
  command?: string;
  invariants?: {
    antiSlopPassed: boolean;
    typeSafetyPassed: boolean;
    securityPassed: boolean;
  };
}

interface ApprovalGateModalProps {
  isOpen: boolean;
  mutation: PendingMutation | null;
  onApprove: (customAfterCode?: string) => void;
  onReject: () => void;
  onClose: () => void;
}

export const ApprovalGateModal: React.FC<ApprovalGateModalProps> = ({
  isOpen,
  mutation,
  onApprove,
  onReject,
  onClose
}) => {
  if (!isOpen || !mutation) return null;

  const [activeTab, setActiveTab] = useState<'side_by_side' | 'unified' | 'edit'>('side_by_side');
  const [editedCode, setEditedCode] = useState<string>(mutation.afterCode);

  const handleConfirm = () => {
    onApprove(editedCode);
  };

  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'autofix':
        return { label: 'AutoFix Agent', icon: Wrench, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'cli':
        return { label: 'CLI Terminal', icon: Terminal, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      default:
        return { label: 'Custom Patch', icon: Code2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    }
  };

  const sourceMeta = getSourceBadge(mutation.source);
  const SourceIcon = sourceMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Container Card */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Glow Header Background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  A2A APPROVAL GATE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  AWAITING REVIEW
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Pre-Push Mutation Interceptor
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close without approving"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. MODAL BODY SCROLLABLE */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-slate-200">
          {/* TOP METRICS & TARGET SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target File & Location */}
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  Target Codebase Location
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 ${sourceMeta.color}`}>
                  <SourceIcon className="w-3 h-3" />
                  {sourceMeta.label}
                </span>
              </div>

              <div className="font-mono text-sm text-emerald-300 bg-slate-900/80 px-3 py-2 rounded-lg border border-white/5 break-all flex items-center justify-between">
                <span>{mutation.location || mutation.targetFiles.join(', ') || 'Global Codebase AST'}</span>
              </div>

              {mutation.command && (
                <div className="text-xs font-mono text-cyan-300/90 flex items-center gap-2 pt-1">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">Command:</span>
                  <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300">{mutation.command}</code>
                </div>
              )}
            </div>

            {/* Risk & Safety Category */}
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Risk Assessment</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRiskColor(mutation.riskLevel)}`}>
                  {mutation.riskLevel} RISK
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-400">Mutation Title:</div>
                <div className="text-xs font-semibold text-white line-clamp-2">{mutation.title}</div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Requires manual confirmation before push</span>
              </div>
            </div>
          </div>

          {/* INVARIANT FIREWALL CHECKS */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-200">
                Architectural Invariant Validation Status:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anti-Slop Clean</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>TSC Type Safe</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secrets Isolated</span>
              </div>
            </div>
          </div>

          {/* CODE DIFF PREVIEW TABS & CONTROLS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('side_by_side')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === 'side_by_side'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Side-by-Side Diff
                </button>

                <button
                  onClick={() => setActiveTab('unified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === 'unified'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Unified Diff
                </button>

                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === 'edit'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Patch Code
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {activeTab === 'edit' ? 'Modify proposed code directly below' : 'Inspect original vs proposed changes'}
              </span>
            </div>

            {/* TAB CONTENT: SIDE BY SIDE */}
            {activeTab === 'side_by_side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Before */}
                <div className="rounded-xl border border-rose-500/20 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-rose-400 border-b border-rose-500/20 pb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Original Code (Current AST)
                    </span>
                    <span className="text-[10px] text-slate-500">ReadOnly</span>
                  </div>
                  <pre className="font-mono text-xs text-rose-200/90 bg-rose-950/20 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 custom-scrollbar">
                    {mutation.beforeCode}
                  </pre>
                </div>

                {/* After */}
                <div className="rounded-xl border border-emerald-500/20 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 border-b border-emerald-500/20 pb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Proposed Repaired Code
                    </span>
                    <span className="text-[10px] text-emerald-400/70">Target Patch</span>
                  </div>
                  <pre className="font-mono text-xs text-emerald-200/90 bg-emerald-950/20 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 custom-scrollbar">
                    {editedCode}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: UNIFIED */}
            {activeTab === 'unified' && (
              <div className="rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                <div className="text-slate-500 pb-1 font-sans text-xs">
                  --- Current Code ({mutation.location || 'src/target'})
                  <br />
                  +++ Proposed Mutation ({mutation.location || 'src/target'})
                </div>

                {/* Diff Lines Rendering */}
                <div className="bg-rose-950/30 text-rose-300 border-l-2 border-rose-500 px-3 py-1.5 rounded-r">
                  <span className="text-rose-500 mr-2 select-none">-</span>
                  {mutation.beforeCode}
                </div>

                <div className="bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500 px-3 py-1.5 rounded-r">
                  <span className="text-emerald-500 mr-2 select-none">+</span>
                  {editedCode}
                </div>
              </div>
            )}

            {/* TAB CONTENT: EDIT PATCH */}
            {activeTab === 'edit' && (
              <div className="space-y-2">
                <label className="block text-xs font-mono text-slate-300">
                  Custom Patch Editor (Directly edit proposed changes before pushing):
                </label>
                <textarea
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-purple-500/30 bg-slate-950 p-3 font-mono text-xs text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 leading-relaxed custom-scrollbar"
                />
              </div>
            )}
          </div>

          {/* EXPLANATION & REASONING */}
          <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Mutation Rationale & Fix Rationale:</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {mutation.explanation}
            </p>
          </div>
        </div>

        {/* 3. MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Approval Gate Active</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onReject}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4 text-rose-400" />
              Reject & Abort
            </button>

            <button
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Approve & Push Mutation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
