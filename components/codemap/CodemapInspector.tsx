/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileCode2, 
  Sparkles, 
  Layers, 
  Info, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  Cpu, 
  Boxes, 
  Zap, 
  Flame,
  Settings2,
  FlaskConical
} from 'lucide-react';
import { CodeMapNodeItem, ModuleCategory, ArchitectureTier, ViewMode, CodeEntityType } from '../../types';
import { ENTITY_TYPE_CONFIGS } from './CodemapNodeAttributeLegend';

interface CodemapInspectorProps {
  selectedNode: CodeMapNodeItem | null;
  onClose?: () => void;
  onNavigate: (mode: ViewMode, data?: any) => void;
  categoryColors: Record<ModuleCategory, { bg: string; text: string; hex: string; border: string }>;
  tierColors: Record<ArchitectureTier, { hex: string; label: string }>;
  repoName: string;
}

export const CodemapInspector: React.FC<CodemapInspectorProps> = ({
  selectedNode,
  onNavigate,
  categoryColors,
  tierColors,
  repoName
}) => {
  const [copied, setCopied] = useState(false);

  if (!selectedNode) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl text-center space-y-3">
        <Info className="w-8 h-8 text-slate-600 mx-auto" />
        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Module Inspector
        </h4>
        <p className="text-xs font-mono text-slate-500 leading-relaxed">
          Select any node in the topology or schematic to inspect its architectural role, invariants, contracts, and slop risk.
        </p>
      </div>
    );
  }

  const ann = selectedNode.annotation;
  const slopRisk = ann?.slopRisk || (selectedNode.importance === 'critical' ? 'medium' : 'low');

  const handleCopyGroundingPrompt = () => {
    const text = `Repository: ${repoName}
File: ${selectedNode.path}
Role: ${ann?.role || selectedNode.category}
Tier: ${tierColors[selectedNode.tier]?.label || selectedNode.tier}
Intent: ${ann?.intent || 'Domain module'}
Invariants: ${ann?.contracts?.join('; ') || 'Standard interface'}
Side Effects: ${ann?.sideEffects?.join('; ') || 'Standard'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-mono font-bold text-white truncate" title={selectedNode.label}>
              {selectedNode.label}
            </h3>
          </div>
          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={selectedNode.path}>
            {selectedNode.path}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
            categoryColors[selectedNode.category]?.bg || 'bg-white/10'
          } ${categoryColors[selectedNode.category]?.text || 'text-white'}`}>
            {selectedNode.category}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5">
            {tierColors[selectedNode.tier]?.label || selectedNode.tier}
          </span>
        </div>
      </div>

      {/* Badges / Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-500 block">Hierarchy Depth</span>
          <span className="text-slate-200 font-bold">Level {selectedNode.depth}</span>
        </div>
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-500 block">Connections</span>
          <span className="text-slate-200 font-bold">
            {(selectedNode.healthStatus?.fanIn || 0) + (selectedNode.healthStatus?.fanOut || 0)} links
          </span>
        </div>
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
          <span className="text-[10px] text-slate-500 block">Slop Risk</span>
          <span className={`font-bold capitalize flex items-center gap-1 ${
            slopRisk === 'high' ? 'text-amber-400' : slopRisk === 'medium' ? 'text-sky-300' : 'text-emerald-300'
          }`}>
            {slopRisk === 'high' && <Flame className="w-3 h-3" />}
            {slopRisk}
          </span>
        </div>
      </div>

      {/* Proactive Architectural Health Check & Anti-Pattern Alerts */}
      {selectedNode.healthStatus && (
        <div className={`p-3.5 rounded-2xl border space-y-3 ${
          selectedNode.healthStatus.severity === 'critical'
            ? 'bg-rose-500/10 border-rose-500/30'
            : selectedNode.healthStatus.severity === 'warning'
            ? 'bg-amber-500/10 border-amber-500/30'
            : selectedNode.healthStatus.severity === 'notice'
            ? 'bg-sky-500/10 border-sky-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              selectedNode.healthStatus.severity === 'critical' ? 'text-rose-400' :
              selectedNode.healthStatus.severity === 'warning' ? 'text-amber-400' :
              selectedNode.healthStatus.severity === 'notice' ? 'text-sky-400' : 'text-emerald-400'
            }`}>
              {selectedNode.healthStatus.severity === 'critical' ? <ShieldAlert className="w-3.5 h-3.5" /> :
               selectedNode.healthStatus.severity === 'warning' ? <ShieldAlert className="w-3.5 h-3.5" /> :
               <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{selectedNode.healthStatus.badgeLabel}</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-300 font-bold">
              Health: {selectedNode.healthStatus.healthScore}%
            </span>
          </div>

          {/* Node Health Metrics Details */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
            <div className="p-2 bg-black/30 rounded-xl border border-white/5">
              <span className="text-slate-500 block">Fan-In (Dependents):</span>
              <strong className="text-white text-xs">{selectedNode.healthStatus.fanIn}</strong> modules
            </div>
            <div className="p-2 bg-black/30 rounded-xl border border-white/5">
              <span className="text-slate-500 block">Fan-Out (Dependencies):</span>
              <strong className="text-white text-xs">{selectedNode.healthStatus.fanOut}</strong> modules
            </div>
          </div>

          {/* Active Alerts */}
          {selectedNode.healthStatus.alerts.length > 0 ? (
            <div className="space-y-2">
              {selectedNode.healthStatus.alerts.map((al) => (
                <div key={al.id} className="p-2.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <span>⚠️</span>
                    <span>{al.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {al.description}
                  </p>
                  {al.affectedCycle && (
                    <div className="p-1.5 bg-rose-950/40 border border-rose-500/20 rounded-lg text-[10px] text-rose-200">
                      <span className="font-bold text-rose-400 block mb-0.5">Cycle Pathway:</span>
                      <span>{al.affectedCycle.map(p => p.split('/').pop()).join(' ➔ ')}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-emerald-300 bg-emerald-950/20 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="font-bold text-emerald-400 block">Remedy:</span>
                    <span>{al.mitigation}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-mono text-emerald-300">
              ✓ Module conforms to single-direction clean architecture hierarchy.
            </p>
          )}
        </div>
      )}

      {/* AI Semantic Invariants (Anti-Vibeslop Grounding) */}
      {ann ? (
        <div className="space-y-3 bg-black/40 p-3.5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Semantic Contract
            </span>
            <button
              onClick={handleCopyGroundingPrompt}
              className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
              title="Copy Grounding Spec"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 block">Role:</span>
            <p className="text-xs font-mono font-bold text-white">{ann.role}</p>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 block">Intent:</span>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">{ann.intent}</p>
          </div>

          {ann.contracts && ann.contracts.length > 0 && (
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">
                Contracts & Invariants:
              </span>
              <ul className="space-y-1 text-[11px] font-mono text-slate-300">
                {ann.contracts.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ann.slopRiskReason && (
            <div className="text-[11px] font-mono text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              ⚠️ Slop Caution: {ann.slopRiskReason}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-[11px] font-mono text-slate-400 space-y-1">
          <p className="text-slate-300 font-bold">Unannotated Module</p>
          <p>Click "Annotate Visible Codebase" in the top bar to run Gemini semantic extraction for exact contracts.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <button
          onClick={() => {
            onNavigate(ViewMode.AI_ASSISTANT, {
              initialPrompt: `Given the exact module contracts for "${selectedNode.path}" in repository "${repoName}":
Role: ${ann?.role || 'Module component'}
Intent: ${ann?.intent || 'Domain execution'}
Invariants: ${ann?.contracts?.join('; ') || 'Standard boundaries'}

Explain how to safely extend this without introducing vibeslop or breaking upstream dependencies.`
            });
          }}
          className="w-full py-2.5 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ground AI Assistant</span>
        </button>

        <button
          onClick={() => {
            onNavigate(ViewMode.PLAN_CREATOR, {
              targetFile: selectedNode.path,
              repoName
            });
          }}
          className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 border border-white/10"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Plan Invariant Refactor</span>
        </button>
      </div>
    </div>
  );
};
