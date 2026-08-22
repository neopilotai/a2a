/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  GitMerge, 
  Cpu, 
  Play, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Flame, 
  RotateCcw,
  Compass,
  AlertTriangle,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { ViewMode } from '../../types';

interface Scenario {
  id: string;
  title: string;
  category: 'scalability' | 'security' | 'architecture' | 'concurrency';
  threatLevel: 'critical' | 'high' | 'medium';
  icon: any;
  color: string;
  borderColor: string;
  bgGradient: string;
  triggerEvent: string;
  traditionalFailure: string;
  a2aAdaptation: {
    lens: string;
    cognitiveStrategy: string;
    immediatePrescription: string;
    targetModule: string;
    targetView: ViewMode;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'scale-spike',
    title: '100x Real-time Traffic Surge',
    category: 'scalability',
    threatLevel: 'critical',
    icon: Flame,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    bgGradient: 'from-amber-950/40 to-slate-950/80',
    triggerEvent: 'Sudden viral burst causes 100x concurrent WebSocket connections and DB read contention.',
    traditionalFailure: 'Linear forms crash; engineers manually scramble across scattered logs with no architectural topology.',
    a2aAdaptation: {
      lens: 'Expand & Deconstruct',
      cognitiveStrategy: 'a2a shifts to Cache-First Topology & Redis PubSub actor sharding.',
      immediatePrescription: 'Apply Stale-While-Revalidate caching at edge proxy, decouple WebSocket state with Redis memory broker, and apply backpressure throttling.',
      targetModule: 'Plan Creator (DAG)',
      targetView: ViewMode.PLAN_CREATOR
    }
  },
  {
    id: 'auth-leak',
    title: 'Insecure Token & Invariant Breach',
    category: 'security',
    threatLevel: 'critical',
    icon: ShieldAlert,
    color: 'text-rose-300',
    borderColor: 'border-rose-500/40',
    bgGradient: 'from-rose-950/40 to-slate-950/80',
    triggerEvent: 'A developer inadvertently commits client-side API token access bypassing server proxy rules.',
    traditionalFailure: 'Silent breach unnoticed until credentials are harvested in production.',
    a2aAdaptation: {
      lens: 'Harden & Stress-Test',
      cognitiveStrategy: 'a2a activates Invariant Radar and flags client-to-cloud security rule violations.',
      immediatePrescription: 'Enforce server-side /api proxy routes, invalidate exposed session tokens, and deploy strict Firestore security rules.',
      targetModule: 'Codemaps Invariant Radar',
      targetView: ViewMode.CODEMAP
    }
  },
  {
    id: 'monolith-split',
    title: 'Circular Dependency & Monolith Hazard',
    category: 'architecture',
    threatLevel: 'high',
    icon: GitMerge,
    color: 'text-violet-300',
    borderColor: 'border-violet-500/40',
    bgGradient: 'from-violet-950/40 to-slate-950/80',
    triggerEvent: 'Rapid feature commits introduce a 3-way circular import cycle across auth, billing, and notification services.',
    traditionalFailure: 'Build errors pop up unpredictably with cryptic runtime module undefined exceptions.',
    a2aAdaptation: {
      lens: 'Deconstruct & Topological Sort',
      cognitiveStrategy: 'a2a runs DFS topological cycle solver and extracts a shared abstraction interface.',
      immediatePrescription: 'Break circular loop by extracting common domain interfaces into /types.ts and re-ordering task dependencies automatically.',
      targetModule: 'Plan Creator DAG Engine',
      targetView: ViewMode.PLAN_CREATOR
    }
  },
  {
    id: 'state-drift',
    title: 'Async Race Conditions & State Drift',
    category: 'concurrency',
    threatLevel: 'medium',
    icon: Zap,
    color: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    bgGradient: 'from-cyan-950/40 to-slate-950/80',
    triggerEvent: 'Multiple simultaneous asynchronous user mutations overwrite shared local state without optimistic rollback.',
    traditionalFailure: 'UI flickers and displays stale, corrupted data causing user frustration.',
    a2aAdaptation: {
      lens: 'Simplify & Demystify',
      cognitiveStrategy: 'a2a demystifies reactivity lifecycles and establishes unidirectional state flow.',
      immediatePrescription: 'Introduce abortable AbortController promise tokens, centralize mutations in a reactive store, and render optimistic rollback cues.',
      targetModule: 'AI Assistant (a2a Chat)',
      targetView: ViewMode.AI_ASSISTANT
    }
  }
];

interface A2aScenarioSimulatorProps {
  onNavigate?: (mode: ViewMode, data?: any) => void;
}

export const A2aScenarioSimulator: React.FC<A2aScenarioSimulatorProps> = ({ onNavigate }) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const handleRunSimulation = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsSimulating(true);
    setSimulationLog([]);

    const steps = [
      `[T+0ms] Sensing event: "${scenario.title}"...`,
      `[T+40ms] AST & Invariant anomaly detected in active topological graph`,
      `[T+120ms] a2a activating Cognitive Lens: "${scenario.a2aAdaptation.lens}"`,
      `[T+240ms] Synthesizing non-linear adaptive strategy...`,
      `[T+380ms] Prescription Ready: ${scenario.a2aAdaptation.immediatePrescription.slice(0, 70)}...`
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimulationLog(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsSimulating(false);
        }
      }, (idx + 1) * 250);
    });
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-6 bg-slate-950/80">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30 shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white font-mono flex items-center gap-2">
              <span>a2a Emergent Scenario Simulator</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 uppercase">
                Adaptive Stress Lab
              </span>
            </h3>
            <p className="text-xs font-sans text-slate-400">
              See how a2a sets aside linear rules to dynamically perceive and resolve unpredictable architectural chaos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">4 Scenarios Available</span>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((scenario) => {
          const isSelected = selectedScenario.id === scenario.id;
          const Icon = scenario.icon;

          return (
            <div
              key={scenario.id}
              onClick={() => handleRunSimulation(scenario)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                isSelected
                  ? `bg-gradient-to-b ${scenario.bgGradient} ${scenario.borderColor} ring-2 ring-violet-500/50 shadow-lg`
                  : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl bg-white/5 ${scenario.color} border border-white/10`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                    scenario.threatLevel === 'critical' ? 'bg-rose-500/20 text-rose-300' :
                    scenario.threatLevel === 'high' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {scenario.threatLevel}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white font-mono group-hover:text-violet-200 transition-colors">
                  {scenario.title}
                </h4>

                <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                  {scenario.triggerEvent}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Lens: {scenario.a2aAdaptation.lens.split(' ')[0]}</span>
                <span className="text-violet-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Simulate <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulation Output Console & Adaptation Prescription */}
      <div className="glass-panel p-5 rounded-2xl border border-violet-500/20 bg-slate-900/90 space-y-4">
        
        {/* Scenario Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <selectedScenario.icon className={`w-5 h-5 ${selectedScenario.color}`} />
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Simulating: {selectedScenario.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">{selectedScenario.triggerEvent}</p>
            </div>
          </div>

          <button
            onClick={() => handleRunSimulation(selectedScenario)}
            disabled={isSimulating}
            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/30 disabled:opacity-50 shrink-0"
          >
            {isSimulating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Adapting...' : 'Re-run Simulation'}</span>
          </button>
        </div>

        {/* Live Terminal Telemetry Log */}
        <div className="p-3 bg-slate-950 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase pb-1 border-b border-white/5">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-violet-400" />
              a2a Real-time Telemetry Stream
            </span>
            <span className="text-emerald-400">{isSimulating ? 'Processing...' : 'Converged'}</span>
          </div>

          {simulationLog.length === 0 ? (
            <p className="text-slate-500 italic py-1">Click "Simulate" on any scenario above to watch a2a's cognitive stream.</p>
          ) : (
            simulationLog.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-violet-300 animate-in fade-in">
                <span className="text-slate-600">❯</span>
                <span>{log}</span>
              </div>
            ))
          )}
        </div>

        {/* a2a Adaptive Resolution Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Strategy */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Cognitive Strategy</span>
            <p className="text-xs font-semibold text-white font-sans">{selectedScenario.a2aAdaptation.cognitiveStrategy}</p>
          </div>

          {/* Actionable Prescription */}
          <div className="md:col-span-2 p-3 bg-violet-950/30 rounded-xl border border-violet-500/30 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-violet-300 uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Prescribed Solution & Hardening
              </span>
              <p className="text-xs text-slate-200 font-sans mt-0.5 leading-relaxed">
                {selectedScenario.a2aAdaptation.immediatePrescription}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-violet-500/20">
              <span className="text-[10px] font-mono text-slate-400">
                Targeted Tool: <strong className="text-white">{selectedScenario.a2aAdaptation.targetModule}</strong>
              </span>
              <button
                onClick={() => onNavigate?.(selectedScenario.a2aAdaptation.targetView)}
                className="text-[11px] font-mono text-violet-300 hover:text-white font-bold flex items-center gap-1"
              >
                <span>Jump to {selectedScenario.a2aAdaptation.targetModule}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default A2aScenarioSimulator;
