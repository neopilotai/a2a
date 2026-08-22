/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Flame, 
  Zap, 
  RotateCcw, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Brain,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { VibeslopDefenseAudit, ViewMode } from '../../types';

interface CodemapVibeslopRadarProps {
  audit: VibeslopDefenseAudit | null;
  isAuditing: boolean;
  onRunAudit: () => void;
  repoName: string;
  onNavigate: (mode: ViewMode, data?: any) => void;
}

export const CodemapVibeslopRadar: React.FC<CodemapVibeslopRadarProps> = ({
  audit,
  isAuditing,
  onRunAudit,
  repoName,
  onNavigate
}) => {
  const [copiedRules, setCopiedRules] = React.useState(false);

  const handleCopyRules = () => {
    if (!audit) return;
    const rulesText = `Anti-Vibeslop Guidelines for ${repoName}:
${audit.antiSlopRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Philosophy:
${audit.philosophyVerdict}`;
    navigator.clipboard.writeText(rulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Manifesto & Philosophy Card */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
              <Flame className="w-3.5 h-3.5" />
              <span>Anti-Vibeslop Codebase Defense</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Surf the Vibes of Code You Genuinely Understand
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
              Productive AI-assisted coders maintain strict mental models of their system. Disasters happen when generated code outstrips a developer's ability to comprehend it. This radar audits architecture coherence, flags hallucination hotspots, and enforces grounding invariants.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={onRunAudit}
              disabled={isAuditing}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-mono font-bold transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing Architecture...' : (audit ? 'Re-Run Defense Audit' : 'Run Anti-Slop Audit')}</span>
            </button>
          </div>
        </div>
      </div>

      {audit ? (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Comprehension Index */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Comprehension Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {audit.comprehensionScore}%
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {audit.comprehensionScore > 80 ? 'High Navigability' : 'Needs Grounding'}
                  </span>
                </div>
              </div>
            </div>

            {/* Architecture Integrity */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Architecture Integrity
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {audit.architectureIntegrity}%
                  </span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    Cohesion Strong
                  </span>
                </div>
              </div>
            </div>

            {/* Cognitive Load */}
            <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Cognitive Load
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold font-mono text-white capitalize">
                    {audit.cognitiveLoadScore}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">
                    Manageable
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Philosophy Verdict & Anti-Slop Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Safe Surfing Rules */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Tactical Anti-Slop Prompting Rules
                  </h3>
                  <button
                    onClick={handleCopyRules}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRules ? 'Copied' : 'Copy for AI'}</span>
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {audit.antiSlopRules.map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-mono text-slate-200 leading-relaxed">
                        {rule}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Philosophy Quote */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-sans italic">
                "{audit.philosophyVerdict}"
              </div>
            </div>

            {/* Safe Surfing Zones vs Slop Hotspots */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Safe Surfing Zones vs Slop Hotspots
                </h3>
              </div>

              {/* Safe Zones */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                  ✅ High-Velocity Safe Surfing Zones (Low Risk AI Gen):
                </span>
                <div className="space-y-1.5">
                  {audit.safeSurfingZones.map((zone, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-300 flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{zone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slop Hotspots */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  ⚠️ Vulnerable Slop Regressions (Strict Human Invariant Verification Required):
                </span>
                <div className="space-y-2">
                  {audit.vulnerableModules.map((vm, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-200">{vm.path}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          {vm.risk} RISK
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-300">{vm.issue}</p>
                      <p className="text-[11px] font-mono text-emerald-300 font-semibold">Guardrail: {vm.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Layer Health Breakdown Table */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Architectural Layer Health Scorecard
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {audit.layerMetrics.map((layer, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">{layer.layer}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{layer.health}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full" 
                      style={{ width: `${layer.health}%` }} 
                    />
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 line-clamp-2">
                    {layer.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center glass-panel rounded-3xl border border-white/10 space-y-4">
          <Brain className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">
            Vibeslop Defense Radar Awaiting Execution
          </h3>
          <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
            Click "Run Anti-Slop Audit" to have Gemini compute the comprehension score, highlight vulnerable module boundaries, and generate actionable safe-surfing rules.
          </p>
          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Compute Anti-Slop Scorecard</span>
          </button>
        </div>
      )}
    </div>
  );
};
