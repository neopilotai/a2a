/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileImpactAnalysis, 
  D3Node 
} from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Crosshair, 
  Copy, 
  Check, 
  X, 
  Maximize2, 
  Minimize2, 
  ArrowUpLeft, 
  ArrowDownRight, 
  Layers, 
  Code2, 
  Boxes, 
  Compass,
  Zap,
  Info,
  Download
} from 'lucide-react';

interface FileImpactFactorCardProps {
  analysis: FileImpactAnalysis;
  onFocusNode?: (nodeId: string) => void;
  onClose?: () => void;
  isFocusModeActive?: boolean;
  onToggleFocusMode?: () => void;
  className?: string;
  onExportSvg?: () => void;
}

type ActiveImpactTab = 'consumers' | 'downstream' | 'tiers' | 'advice';

export const FileImpactFactorCard: React.FC<FileImpactFactorCardProps> = ({
  analysis,
  onFocusNode,
  onClose,
  isFocusModeActive = true,
  onToggleFocusMode,
  className = '',
  onExportSvg
}) => {
  const [activeTab, setActiveTab] = useState<ActiveImpactTab>('consumers');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Copy structured Markdown impact report
  const handleCopyReport = () => {
    const lines = [
      `# 📊 Architectural Impact Report: ${analysis.label}`,
      `- **File Path**: \`${analysis.path}\``,
      `- **Impact Factor**: **${analysis.impactScore}/100** (${analysis.impactLevel.toUpperCase()})`,
      `- **Blast Radius**: **${analysis.blastRadiusPercent}%** of repository`,
      `- **Consuming Components**: **${analysis.totalConsumingComponents}** (${analysis.directConsumingCount} direct, ${analysis.transitiveConsumingCount} transitive)`,
      `- **Total Downstream Code**: **${analysis.totalDownstreamLoc.toLocaleString()} LOC** across ${analysis.totalDownstreamNodes} dependencies`,
      `- **Self File Size**: **${analysis.selfLoc.toLocaleString()} LOC**`,
      '',
      `### Architectural Risk Summary`,
      `> ${analysis.riskSummary}`,
      '',
      `### Direct Consuming Components (${analysis.directConsumingCount})`,
      ...analysis.consumingComponents.slice(0, 10).map(c => `- **${c.label}** (\`${c.path || c.label}\`) - Depth: ${c.distance} - ${c.loc} LOC`),
      '',
      `### Downstream Dependencies (${analysis.directDownstreamCount} direct, ${analysis.totalDownstreamNodes} total)`,
      ...analysis.downstreamDependencies.slice(0, 10).map(d => `- **${d.label}** (\`${d.path || d.label}\`) - Depth: ${d.distance} - ${d.loc} LOC`),
      '',
      `### Recommended Refactoring Safety Steps`,
      ...analysis.refactoringAdvice.map((a, i) => `${i + 1}. ${a}`)
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Level Badge configuration
  const getLevelBadge = () => {
    switch (analysis.impactLevel) {
      case 'critical':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />,
          label: 'CRITICAL GRAVITY',
          bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/20'
        };
      case 'high':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          label: 'HIGH IMPACT',
          bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
        };
      case 'moderate':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
          label: 'MODERATE IMPACT',
          bg: 'bg-sky-950/80 text-sky-300 border-sky-500/40'
        };
      default:
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'LOW IMPACT (ISOLATED)',
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
        };
    }
  };

  const badge = getLevelBadge();

  // If minimized to a compact pill HUD
  if (isMinimized) {
    return (
      <div 
        id="file-impact-overlay-minimized"
        className={`glass-panel p-2.5 rounded-2xl border border-emerald-500/40 bg-slate-950/95 shadow-2xl backdrop-blur-xl flex items-center gap-3 font-mono text-xs text-white animate-in fade-in ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Crosshair className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Focus Impact</span>
            <span className="font-bold text-emerald-300 truncate max-w-[140px] block">{analysis.label}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <span 
            style={{ color: analysis.impactColor }}
            className="font-extrabold text-sm"
          >
            {analysis.impactScore}/100
          </span>
          <span className="text-[10px] text-slate-400">
            ({analysis.totalConsumingComponents} Callers • {analysis.totalDownstreamLoc.toLocaleString()} LOC)
          </span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Expand Full Impact Factor Card"
            id="expand-impact-card-btn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Close Impact Card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      id="file-impact-overlay-card"
      className={`glass-panel rounded-2xl border border-emerald-500/40 bg-slate-950/95 shadow-2xl backdrop-blur-2xl font-mono text-xs text-slate-200 overflow-hidden flex flex-col max-w-[420px] w-full transition-all animate-in fade-in zoom-in-95 duration-200 ${className}`}
      style={{
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px ${analysis.impactColor}25`
      }}
    >
      {/* Top Header */}
      <div className="p-3.5 border-b border-white/10 bg-slate-900/80 flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div 
            style={{ borderColor: `${analysis.impactColor}60`, backgroundColor: `${analysis.impactColor}15` }}
            className="p-2 rounded-xl border shrink-0 mt-0.5"
          >
            <Crosshair className="w-4 h-4" style={{ color: analysis.impactColor }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-400" />
                Focus Mode Impact Analysis
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold border flex items-center gap-1 ${badge.bg}`}>
                {badge.icon}
                <span>{badge.label}</span>
              </span>
            </div>

            <h3 className="text-white font-extrabold text-sm truncate mt-0.5" title={analysis.label}>
              {analysis.label}
            </h3>

            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={analysis.path}>
              📁 {analysis.path}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onExportSvg && (
            <button
              onClick={onExportSvg}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/20 hover:border-emerald-500/40"
              title="Export Currently Isolated Architecture as SVG"
              id="export-isolated-svg-btn"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopyReport}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Copy Structured Markdown Impact Report"
            id="copy-impact-report-btn"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Minimize to Compact HUD Pill"
            id="minimize-impact-card-btn"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Impact Metrics Bar */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          {/* Circular / Score Gauge */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeWidth="3.5"
                  strokeDasharray={`${analysis.impactScore}, 100`}
                  strokeLinecap="round"
                  stroke={analysis.impactColor}
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-black text-white leading-none">
                  {analysis.impactScore}
                </span>
                <span className="text-[7px] text-slate-400 font-bold uppercase">
                  SCORE
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Architectural Impact
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span style={{ color: analysis.impactColor }}>
                  {analysis.impactScore}/100
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  ({analysis.impactLevel.toUpperCase()})
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <span>Blast Radius:</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {analysis.blastRadiusPercent}% of repo
                </span>
              </div>
            </div>
          </div>

          {/* Direct Focus Neighborhood Action Button */}
          {onFocusNode && (
            <button
              onClick={() => onFocusNode(analysis.nodeId)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 shrink-0"
              title="Isolate this node & its direct 1st-degree neighborhood"
              id="isolate-neighborhood-btn"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Center Focal</span>
            </button>
          )}
        </div>

        {/* 4-Stat Core Metric Breakdown */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Metric 1: Consuming Components */}
          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="flex items-center justify-between text-cyan-300 text-[10px]">
              <span className="flex items-center gap-1 font-bold">
                <ArrowUpLeft className="w-3 h-3 text-cyan-400" />
                CONSUMING CALLERS
              </span>
              <span className="font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200">
                {analysis.totalConsumingComponents}
              </span>
            </div>
            <div className="text-xs font-black text-white mt-1">
              {analysis.directConsumingCount} Direct <span className="text-[10px] text-slate-400 font-normal">({analysis.transitiveConsumingCount} Transitive)</span>
            </div>
            <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
              Components depending on this file
            </div>
          </div>

          {/* Metric 2: Downstream Lines of Code */}
          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <div className="flex items-center justify-between text-amber-300 text-[10px]">
              <span className="flex items-center gap-1 font-bold">
                <ArrowDownRight className="w-3 h-3 text-amber-400" />
                DOWNSTREAM LOC
              </span>
              <span className="font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">
                {analysis.totalDownstreamLoc.toLocaleString()}
              </span>
            </div>
            <div className="text-xs font-black text-white mt-1">
              {analysis.totalDownstreamNodes} Modules <span className="text-[10px] text-slate-400 font-normal">(+{analysis.selfLoc} Self)</span>
            </div>
            <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
              Total lines of downstream code
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-white/10 bg-slate-900/60 px-2 pt-1 gap-1 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('consumers')}
          className={`px-2.5 py-1.5 border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'consumers'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="impact-tab-consumers"
        >
          <ArrowUpLeft className="w-3 h-3 text-cyan-400" />
          <span>Consumers ({analysis.totalConsumingComponents})</span>
        </button>

        <button
          onClick={() => setActiveTab('downstream')}
          className={`px-2.5 py-1.5 border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'downstream'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="impact-tab-downstream"
        >
          <ArrowDownRight className="w-3 h-3 text-amber-400" />
          <span>Downstream ({analysis.totalDownstreamNodes})</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`px-2.5 py-1.5 border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'tiers'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="impact-tab-tiers"
        >
          <Layers className="w-3 h-3 text-emerald-400" />
          <span>Tiers</span>
        </button>

        <button
          onClick={() => setActiveTab('advice')}
          className={`px-2.5 py-1.5 border-b-2 transition-all flex items-center gap-1 ${
            activeTab === 'advice'
              ? 'border-violet-400 text-violet-300 bg-violet-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="impact-tab-advice"
        >
          <ShieldAlert className="w-3 h-3 text-violet-400" />
          <span>Risk Guide</span>
        </button>
      </div>

      {/* Tab Body Content with Smooth Scroll */}
      <div className="p-3 max-h-64 overflow-y-auto space-y-2 text-xs">
        {/* TAB 1: CONSUMING COMPONENTS */}
        {activeTab === 'consumers' && (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Upstream components that import or consume this file:</span>
              <span className="font-bold text-cyan-300">{analysis.totalConsumingComponents} total</span>
            </div>

            {analysis.consumingComponents.length > 0 ? (
              <div className="space-y-1.5">
                {analysis.consumingComponents.map(item => (
                  <div 
                    key={item.id}
                    className="p-2 rounded-xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/30 flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold truncate group-hover:text-cyan-300 transition-colors">
                          {item.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          item.distance === 1 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                            : 'bg-white/5 text-slate-400'
                        }`}>
                          {item.distance === 1 ? '1st-Deg Direct' : `Depth +${item.distance}`}
                        </span>
                        {item.techBadge && (
                          <span className="text-[9px] text-slate-400 bg-white/5 px-1 rounded">
                            {item.techBadge}
                          </span>
                        )}
                      </div>
                      {item.path && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.path}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.loc} LOC
                      </span>
                      {onFocusNode && (
                        <button
                          onClick={() => onFocusNode(item.id)}
                          className="px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/25 text-[10px] font-bold transition-colors"
                          title={`Focus on ${item.label} in graph`}
                        >
                          Focus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">No Consuming Components</p>
                <p className="text-[10px] mt-0.5">This file acts as a top-level root entrypoint or isolated leaf.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOWNSTREAM REACH & LOC */}
        {activeTab === 'downstream' && (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Downstream dependencies and transitive lines of code:</span>
              <span className="font-bold text-amber-300">{analysis.totalDownstreamLoc.toLocaleString()} LOC total</span>
            </div>

            {analysis.downstreamDependencies.length > 0 ? (
              <div className="space-y-1.5">
                {analysis.downstreamDependencies.map(item => (
                  <div 
                    key={item.id}
                    className="p-2 rounded-xl bg-slate-900/80 border border-white/5 hover:border-amber-500/30 flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold truncate group-hover:text-amber-300 transition-colors">
                          {item.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          item.distance === 1 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-white/5 text-slate-400'
                        }`}>
                          {item.distance === 1 ? 'Direct Dep' : `Transitive +${item.distance}`}
                        </span>
                        {item.techBadge && (
                          <span className="text-[9px] text-slate-400 bg-white/5 px-1 rounded">
                            {item.techBadge}
                          </span>
                        )}
                      </div>
                      {item.path && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.path}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-amber-300 font-mono font-bold">
                        {item.loc} LOC
                      </span>
                      {onFocusNode && (
                        <button
                          onClick={() => onFocusNode(item.id)}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/25 text-[10px] font-bold transition-colors"
                          title={`Focus on ${item.label} in graph`}
                        >
                          Focus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center text-slate-400">
                <Code2 className="w-5 h-5 text-sky-400 mx-auto mb-1 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">Terminal Node</p>
                <p className="text-[10px] mt-0.5">This file has 0 downstream outgoing calls; execution finishes here.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ARCHITECTURAL TIER BLAST RADIUS */}
        {activeTab === 'tiers' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="text-[10px] text-slate-400">
              Downstream & Upstream blast radius across architectural layers:
            </div>

            <div className="space-y-2">
              {analysis.tierBreakdown.map(tier => (
                <div key={tier.tierName} className="p-2 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                      {tier.tierName}
                    </span>
                    <span className="font-mono text-slate-300">
                      {tier.affectedCount} / {tier.totalTierCount} ({tier.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(4, tier.percentage)}%`, 
                        backgroundColor: tier.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RISK ASSESSMENT & REFACTORING GUIDE */}
        {activeTab === 'advice' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3 h-3 text-sky-400" />
                Architectural Risk Evaluation
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {analysis.riskSummary}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Refactoring Safety Checklist
              </div>
              {analysis.refactoringAdvice.map((advice, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2 text-[11px] text-emerald-200">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{advice}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="p-2.5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 font-mono">
          <Boxes className="w-3 h-3 text-slate-500" />
          Combined Reach: <strong className="text-white">{(analysis.combinedImpactedLoc).toLocaleString()} LOC</strong>
        </span>
        <button
          onClick={handleCopyReport}
          className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
        >
          <span>{copied ? 'Copied to Clipboard!' : 'Export Impact Report'}</span>
        </button>
      </div>
    </div>
  );
};
