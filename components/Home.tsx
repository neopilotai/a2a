/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ViewMode } from '../types';
import { 
  GitBranch, 
  FileText, 
  Network, 
  Bot, 
  ClipboardList, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Layers, 
  Cpu,
  Radio,
  Flame,
  Award,
  Play,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Search,
  Code2,
  GitPullRequest,
  Compass,
  BarChart3,
  Terminal
} from 'lucide-react';
import { A2aLivingSystemCanvas } from './a2a/A2aLivingSystemCanvas';
import { A2aScenarioSimulator } from './a2a/A2aScenarioSimulator';
import { A2aAdaptiveMasteryMatrix } from './a2a/A2aAdaptiveMasteryMatrix';
import { RepoFileDistributionDashboard } from './RepoFileDistributionDashboard';
import { ActiveRepoContext, RepoHistoryItem, RepoFileTree } from '../types';

interface HomeProps {
  onNavigate: (mode: ViewMode) => void;
  activeRepoContext?: ActiveRepoContext | null;
  repoHistory?: RepoHistoryItem[];
  onSelectRepoForContext?: (repoName: string, fileTree: RepoFileTree[]) => void;
}

export const Home: React.FC<HomeProps> = ({ 
  onNavigate,
  activeRepoContext = null,
  repoHistory = [],
  onSelectRepoForContext
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'scenarios' | 'mastery' | 'benchmarks'>('canvas');
  const [quickRepoInput, setQuickRepoInput] = useState('');

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickRepoInput.trim()) {
      onNavigate(ViewMode.REPO_ANALYZER);
    }
  };

  return (
    <div className="w-full space-y-8 pb-16 animate-in fade-in duration-500">
      {/* 1. STUDIO HERO CONTROL DECK (Highest ROI & Instant Conversion) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        {/* Subtle geometric background accents */}
        <div className="absolute top-0 right-1/4 -mt-12 -mr-12 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Column: Value Proposition & Instant Action */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-mono text-violet-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Engine v3.7 • Gemini a2a Live Architecture</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans leading-tight">
                Architectural Intelligence <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300">
                  from Codebase to Blueprint
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base font-normal max-w-xl leading-relaxed">
                Transform repositories into interactive topological codemaps, execute visual DAG dependency plans, and simulate runtime invariant stresses in real time.
              </p>
            </div>

            {/* Quick Action Launchbar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-mono font-bold transition-all shadow-lg shadow-violet-950/60 flex items-center gap-2 group hover:scale-[1.02]"
              >
                <Layers className="w-4 h-4 text-cyan-300" />
                <span>PR Change Stack Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate(ViewMode.CODEMAP)}
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-2"
              >
                <Network className="w-4 h-4 text-indigo-300" />
                <span>Codemap</span>
              </button>

              <button
                onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4 text-fuchsia-400" />
                <span>Build Execution Plan</span>
              </button>

              <button
                onClick={() => onNavigate(ViewMode.INTEGRATIONS)}
                className="px-4 py-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-2"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Integrations Console</span>
              </button>

              <button
                onClick={() => onNavigate(ViewMode.A2UI_STUDIO)}
                className="px-4 py-3 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>A2UI Protocol</span>
              </button>
            </div>

            {/* Micro Benchmark Telemetry */}
            <div className="pt-2 grid grid-cols-3 gap-3 max-w-lg border-t border-white/10">
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold font-mono text-white flex items-center gap-1">
                  <span>99.4%</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] font-mono text-slate-400">Topology Accuracy</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold font-mono text-cyan-300">0ms Code Exec</div>
                <div className="text-[11px] font-mono text-slate-400">Sandbox Safe (A2UI)</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-lg md:text-xl font-bold font-mono text-violet-300">DAG + D3</div>
                <div className="text-[11px] font-mono text-slate-400">Live Graph Visualizer</div>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Instant Studio Console Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Studio Quick Connect
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold border border-emerald-500/30">
                  Ready
                </span>
              </div>

              {/* Instant GitHub Repo Inspector Form */}
              <form onSubmit={handleQuickAnalyze} className="space-y-3">
                <label className="block text-xs font-mono text-slate-300">
                  Analyze Repository Architecture
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickRepoInput}
                    onChange={(e) => setQuickRepoInput(e.target.value)}
                    placeholder="e.g. facebook/react or owner/repo..."
                    className="w-full pl-9 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Analyze Repo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewMode.AI_ASSISTANT)}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Bot className="w-3.5 h-3.5 text-violet-400" />
                    <span>Ask Architect</span>
                  </button>
                </div>
              </form>

              {/* Quick Template Launchers */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Fast-Track Workspaces
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onNavigate(ViewMode.CODEMAP)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-violet-500/40 text-left transition-all group"
                  >
                    <div className="text-[11px] font-mono font-bold text-white group-hover:text-violet-300">Next.js 15</div>
                    <div className="text-[9px] font-mono text-slate-400">App Router DAG</div>
                  </button>
                  <button
                    onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-fuchsia-500/40 text-left transition-all group"
                  >
                    <div className="text-[11px] font-mono font-bold text-white group-hover:text-fuchsia-300">Microservice</div>
                    <div className="text-[9px] font-mono text-slate-400">Event Mesh</div>
                  </button>
                  <button
                    onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-emerald-500/40 text-left transition-all group"
                  >
                    <div className="text-[11px] font-mono font-bold text-white group-hover:text-emerald-300">Config UX</div>
                    <div className="text-[9px] font-mono text-slate-400">Design Material</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REPOSITORY FILE DISTRIBUTION DASHBOARD (Live Recharts Visualization) */}
      <RepoFileDistributionDashboard 
        activeRepoContext={activeRepoContext}
        repoHistory={repoHistory}
        onSelectRepoForContext={onSelectRepoForContext}
        onNavigate={onNavigate}
      />

      {/* 3. STUDIO SUITE MODULES GRID (High Functional Density) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Studio Power Modules
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">High-Throughput Architectural Workflows</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module: PR Change Stack Studio */}
          <div 
            onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
            className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900/60 to-slate-950/80 hover:border-violet-400/60 transition-all cursor-pointer group flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold border border-violet-500/30">
                  Change Stack & PR
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-violet-200 transition-colors font-sans">
                  PR Change Stack Studio
                </h3>
                <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                  Architectural walkthroughs, pre-merge gatekeeper matrix, docstrings synthesis, automated CI healing, unit test generation, and review comment resolution.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-violet-300 group-hover:text-white transition-colors">
              <span>Inspect Change Stack</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 1: Codemaps */}
          <div 
            onClick={() => onNavigate(ViewMode.CODEMAP)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Network className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                  D3 Topology
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors font-sans">
                  Structured Codemaps
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Interactive D3 graph topologies, dependency cluster radar, behavioral contract invariants, and anti-vibeslop code auditing.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-indigo-300 group-hover:text-white transition-colors">
              <span>Open Topology</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 2: Plan Creator */}
          <div 
            onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-fuchsia-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 flex items-center justify-center group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-mono font-bold border border-fuchsia-500/30">
                  DAG & Connectors
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-fuchsia-200 transition-colors font-sans">
                  Execution Plan Creator
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Drag-and-drop Kanban roadmap with real-time Bézier connector lines, topological cycle checking, and execution prompt exporter.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-fuchsia-300 group-hover:text-white transition-colors">
              <span>Synthesize Plan</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 3: a2a AI Architect */}
          <div 
            onClick={() => onNavigate(ViewMode.AI_ASSISTANT)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-violet-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold border border-violet-500/30">
                  Agent-to-Architecture
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-violet-200 transition-colors font-sans">
                  a2a Cognitive Assistant
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Interactive cognitive lenses: simplify mental models, stress-test invariant edge cases, and reason non-linearly across subsystems.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-violet-300 group-hover:text-white transition-colors">
              <span>Consult Architect</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 4: Integrations Console */}
          <div 
            onClick={() => onNavigate(ViewMode.INTEGRATIONS)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  CLI & IDE Bridge
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors font-sans">
                  Integrations Console
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Interactive CLI shell, Cursor & VS Code configs, v0 & Bolt vibe prompt packs, and Model Context Protocol (MCP) servers across all codebases.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-cyan-300 group-hover:text-white transition-colors">
              <span>Open Console</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 5: A2UI Protocol Studio */}
          <div 
            onClick={() => onNavigate(ViewMode.A2UI_STUDIO)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  Agent Protocol
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors font-sans">
                  A2UI Protocol Studio
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Standardized declarative UI generation for agentic apps across Web, iOS, Android, and Desktop without arbitrary code execution risk.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-amber-300 group-hover:text-white transition-colors">
              <span>Explore Protocol</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 5: GitFlow & Diff Evolution */}
          <div 
            onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-sky-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <GitBranch className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold border border-sky-500/30">
                  Side-by-Side Diff
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-200 transition-colors font-sans">
                  GitFlow Blueprint & Evolution
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Inspect repository file trees, trace architectural modifications, generate specs, and visualize side-by-side branch differences.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-sky-300 group-hover:text-white transition-colors">
              <span>Inspect Evolution</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Module 6: SiteSketch & Design Engineering Reflections */}
          <div 
            onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                  Visual Synthesis
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-200 transition-colors font-sans">
                  SiteSketch Infographics
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                  Turn articles, blog posts, and design engineering reflections into high-impact visual infographics with grounded citations.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-xs font-mono text-emerald-300 group-hover:text-white transition-colors">
              <span>Create Infographics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SIMULATION & MATRIX CONTROLS DECK */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Live Studio Simulator & Mastery Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Test adaptive architecture in real-time under multi-dimensional operational scenarios.
            </p>
          </div>

          {/* Interactive Mode Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'canvas'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Living System</span>
            </button>

            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Chaos Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('mastery')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'mastery'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-300" />
              <span>Mastery Matrix</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'canvas' && (
          <div className="animate-in fade-in duration-300">
            <A2aLivingSystemCanvas onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="animate-in fade-in duration-300">
            <A2aScenarioSimulator onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'mastery' && (
          <div className="animate-in fade-in duration-300">
            <A2aAdaptiveMasteryMatrix onNavigate={onNavigate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
