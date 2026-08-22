/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Repeat, 
  Layers, 
  Activity, 
  Flame, 
  Cpu, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Filter, 
  Eye, 
  Wrench, 
  Zap, 
  Info, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Network
} from 'lucide-react';
import { 
  ArchitecturalHealthReport, 
  CodeMapNodeItem, 
  AntiPatternType, 
  HealthSeverity, 
  ViewMode, 
  AntiPatternAlert 
} from '../../types';
import { HEALTH_SEVERITY_COLORS } from '../../utils/healthCheckEngine';

interface CodemapHealthCheckProps {
  healthReport: ArchitecturalHealthReport | null;
  nodes: CodeMapNodeItem[];
  selectedNode: CodeMapNodeItem | null;
  onSelectNode: (node: CodeMapNodeItem) => void;
  onSwitchToTopology: (focusNodeId?: string) => void;
  onNavigate: (mode: ViewMode, data?: any) => void;
  onRunDeepHealthScan?: () => void;
  isScanning?: boolean;
}

export const CodemapHealthCheck: React.FC<CodemapHealthCheckProps> = ({
  healthReport,
  nodes,
  selectedNode,
  onSelectNode,
  onSwitchToTopology,
  onNavigate,
  onRunDeepHealthScan,
  isScanning = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<AntiPatternType | 'all' | 'critical'>('all');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  if (!healthReport) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-4">
        <Activity className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
        <h3 className="text-base font-mono font-bold text-white">
          Architectural Health Check
        </h3>
        <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
          Scanning codebase topology for circular dependencies, excessive complexity hotspots, and structural anti-patterns.
        </p>
      </div>
    );
  }

  // Gather all alerts
  const allAlerts: { node: CodeMapNodeItem; alert: AntiPatternAlert }[] = [];
  nodes.forEach(node => {
    if (node.healthStatus?.alerts) {
      node.healthStatus.alerts.forEach(alert => {
        allAlerts.push({ node, alert });
      });
    }
  });

  const filteredAlerts = allAlerts.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'critical') return item.alert.severity === 'critical';
    return item.alert.type === selectedFilter;
  });

  const gradeColor = 
    healthReport.healthGrade.startsWith('A') ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' :
    healthReport.healthGrade === 'B' ? 'text-sky-400 border-sky-500/40 bg-sky-500/10' :
    healthReport.healthGrade === 'C' ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
    'text-rose-400 border-rose-500/40 bg-rose-500/10';

  const totalAntiPatterns = allAlerts.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Health Score & Executive Summary Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            {/* Grade Badge */}
            <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-mono shrink-0 shadow-lg ${gradeColor}`}>
              <span className="text-2xl font-black">{healthReport.healthGrade}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Grade</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white font-sans">
                  Architectural Health Assessment
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  Proactive Guardrails
                </span>
              </div>
              <p className="text-xs font-mono text-slate-300 max-w-2xl leading-relaxed">
                {healthReport.summary}
              </p>
              <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-slate-400">
                <span>Scanned: <strong className="text-white">{healthReport.totalModulesScanned}</strong> modules</span>
                <span>•</span>
                <span>Health Score: <strong className="text-emerald-400">{healthReport.overallHealthScore}/100</strong></span>
                <span>•</span>
                <span>Anti-Patterns: <strong className={totalAntiPatterns > 0 ? 'text-rose-400' : 'text-emerald-400'}>{totalAntiPatterns}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Graph Action */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => onSwitchToTopology()}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-neon-violet flex items-center justify-center gap-2"
            >
              <Network className="w-4 h-4 text-indigo-200" />
              <span>View Health Graph in Topology</span>
            </button>

            {onRunDeepHealthScan && (
              <button
                onClick={onRunDeepHealthScan}
                disabled={isScanning}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-sky-400 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'AI Deep Scan'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Healthy Nodes</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-mono font-bold text-white mt-1">
              {healthReport.healthyModulesCount}
            </p>
            <span className="text-[10px] font-mono text-slate-400">Zero anti-patterns</span>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">Critical Anti-Patterns</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-xl font-mono font-bold text-white mt-1">
              {healthReport.criticalModulesCount}
            </p>
            <span className="text-[10px] font-mono text-slate-400">Cycles & God modules</span>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Excessive Complexity</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-mono font-bold text-white mt-1">
              {healthReport.warningModulesCount}
            </p>
            <span className="text-[10px] font-mono text-slate-400">High coupling / fan-out</span>
          </div>

          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">Advisories & Orphans</span>
              <Info className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-xl font-mono font-bold text-white mt-1">
              {healthReport.noticeModulesCount}
            </p>
            <span className="text-[10px] font-mono text-slate-400">Isolated code checks</span>
          </div>
        </div>
      </div>

      {/* Detected Circular Dependencies Highlight Box (if any) */}
      {healthReport.detectedCycles.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl border border-rose-500/30 bg-rose-500/5 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
              <h3 className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                Circular Dependencies Detected ({healthReport.detectedCycles.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              High Decoupling Priority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {healthReport.detectedCycles.map((cycle, idx) => (
              <div 
                key={cycle.id}
                className="p-3.5 bg-black/40 border border-rose-500/20 rounded-2xl space-y-2 hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-rose-300">
                    Cycle Loop #{idx + 1} ({cycle.nodes.length - 1} Modules)
                  </span>
                  <button
                    onClick={() => {
                      const firstNode = nodes.find(n => n.id === cycle.nodes[0]);
                      if (firstNode) {
                        onSelectNode(firstNode);
                        onSwitchToTopology(firstNode.id);
                      }
                    }}
                    className="text-[10px] font-mono text-rose-400 hover:text-white flex items-center gap-1 hover:underline"
                  >
                    <span>Highlight on Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Chain Visualization */}
                <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] text-slate-300 bg-rose-950/30 p-2 rounded-xl border border-rose-500/10">
                  {cycle.nodes.map((nodePath, nIdx) => (
                    <React.Fragment key={nIdx}>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-rose-200 border border-rose-500/20">
                        {nodePath.split('/').pop() || nodePath}
                      </span>
                      {nIdx < cycle.nodes.length - 1 && (
                        <span className="text-rose-400 font-bold">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Filterable Anti-Pattern Alerts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Anti-Pattern Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              All Alerts ({allAlerts.length})
            </button>
            <button
              onClick={() => setSelectedFilter('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedFilter === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Critical ({allAlerts.filter(a => a.alert.severity === 'critical').length})
            </button>
            <button
              onClick={() => setSelectedFilter('circular_dependency')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedFilter === 'circular_dependency'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Circular Dep ({allAlerts.filter(a => a.alert.type === 'circular_dependency').length})
            </button>
            <button
              onClick={() => setSelectedFilter('god_module')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedFilter === 'god_module'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              God Modules ({allAlerts.filter(a => a.alert.type === 'god_module').length})
            </button>
            <button
              onClick={() => setSelectedFilter('layer_inversion')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedFilter === 'layer_inversion'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Layer Inversions ({allAlerts.filter(a => a.alert.type === 'layer_inversion').length})
            </button>
            <button
              onClick={() => setSelectedFilter('shotgun_surgery_risk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedFilter === 'shotgun_surgery_risk'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              High Fan-Out ({allAlerts.filter(a => a.alert.type === 'shotgun_surgery_risk').length})
            </button>
          </div>

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-mono font-bold text-white">No Anti-Patterns in this category</h4>
              <p className="text-xs font-mono text-slate-400">
                The analyzed codebase passes all validation checks for this specific rule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(({ node, alert }) => {
                const colorConfig = HEALTH_SEVERITY_COLORS[alert.severity];
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={alert.id}
                    className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                        : `${colorConfig.border} bg-black/40 hover:bg-white/5`
                    }`}
                    onClick={() => onSelectNode(node)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${colorConfig.bg} ${colorConfig.text} border ${colorConfig.border}`}>
                            {alert.severity}
                          </span>
                          <h4 className="text-xs font-mono font-bold text-white truncate">
                            {alert.title}
                          </h4>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate" title={node.path}>
                          📁 {node.path}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNode(node);
                            onSwitchToTopology(node.id);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono border border-white/10 flex items-center gap-1 transition-colors"
                          title="View on Topology Canvas"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          <span className="hidden sm:inline">Inspect Map</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(ViewMode.PLAN_CREATOR, {
                              goal: `Refactor and decouple anti-pattern in ${node.path}: ${alert.title}`,
                              constraints: alert.mitigation,
                            });
                          }}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
                          title="Generate Fix Plan in Plan Creator"
                        >
                          <Wrench className="w-3 h-3" />
                          <span className="hidden sm:inline">Fix Plan</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-slate-300 mt-2.5 leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Impact & Mitigation */}
                    <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 bg-rose-950/20 rounded-xl border border-rose-500/10">
                        <span className="text-rose-400 font-bold block mb-0.5">Impact:</span>
                        <span className="text-slate-300">{alert.impact}</span>
                      </div>
                      <div className="p-2 bg-emerald-950/20 rounded-xl border border-emerald-500/10">
                        <span className="text-emerald-400 font-bold block mb-0.5">Recommended Remedy:</span>
                        <span className="text-slate-300">{alert.mitigation}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Complexity Hotspot Leaderboard & Health Recommendations */}
        <div className="space-y-4">
          {/* Complexity Hotspots Leaderboard */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Complexity Hotspots
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                Top Bottlenecks
              </span>
            </div>

            <div className="space-y-2.5">
              {healthReport.highComplexityHotspots.slice(0, 5).map((hotspot, idx) => (
                <div
                  key={hotspot.nodeId}
                  className="p-3 bg-black/40 border border-white/5 rounded-xl hover:border-amber-500/30 transition-colors cursor-pointer"
                  onClick={() => {
                    const matchedNode = nodes.find(n => n.id === hotspot.nodeId);
                    if (matchedNode) onSelectNode(matchedNode);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white truncate max-w-[170px]" title={hotspot.filePath}>
                      #{idx + 1} {hotspot.filePath.split('/').pop()}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Score: {hotspot.complexityScore}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-1">
                    <span>Fan-in: <strong className="text-slate-200">{hotspot.fanIn}</strong></span>
                    <span>Fan-out: <strong className="text-slate-200">{hotspot.fanOut}</strong></span>
                    <span>Conns: <strong className="text-slate-200">{hotspot.connections}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Recommendations Card */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Strategic Remedies
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {healthReport.recommendations.map((rec, rIdx) => (
                <div key={rIdx} className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">0{rIdx + 1}.</span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
