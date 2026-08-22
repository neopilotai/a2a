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
  Terminal,
  MessageSquare,
  Clock,
  Milestone,
  ChevronRight,
  AlertCircle,
  CheckSquare,
  FolderGit2,
  ExternalLink
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
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-6 sm:p-8 md:p-8 shadow-2xl backdrop-blur-xl">
        {/* Subtle geometric background accents */}
        <div className="absolute top-0 right-1/4 -mt-16 -mr-16 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Column: Value Proposition & Instant Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-mono text-violet-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Engine v3.7 • Gemini a2a Live Architecture</span>
            </div>

            <div className="space-y-3">
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

            {/* Consolidated Primary & Secondary Launch CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-mono font-bold transition-all shadow-lg shadow-violet-950/60 flex items-center gap-2 group hover:scale-[1.02]"
              >
                <Layers className="w-4 h-4 text-cyan-300" />
                <span>Launch Change Stack Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate(ViewMode.CODEMAP)}
                className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-2"
              >
                <Network className="w-4 h-4 text-indigo-300" />
                <span>Explore Codemap</span>
              </button>

              <button
                onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
                className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 text-xs sm:text-sm font-mono font-semibold transition-all flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4 text-fuchsia-400" />
                <span>Build Plan</span>
              </button>
            </div>


          </div>

          {/* Right Hero Column: Instant Studio Console Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Studio Quick Connect
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold border border-emerald-500/30">
                  Ready
                </span>
              </div>

              {/* Instant GitHub Repo Inspector Form */}
              <form onSubmit={handleQuickAnalyze} className="space-y-4">
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
                    className="w-full pl-9 pr-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Analyze Repo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewMode.AI_ASSISTANT)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Bot className="w-3.5 h-3.5 text-violet-400" />
                    <span>Ask Architect</span>
                  </button>
                </div>
              </form>

              {/* Quick Template Launchers */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Fast-Track Workspaces
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onNavigate(ViewMode.CODEMAP)}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-violet-500/40 text-left transition-all group"
                  >
                    <div className="text-[11px] font-mono font-bold text-white group-hover:text-violet-300">Next.js 15</div>
                    <div className="text-[9px] font-mono text-slate-400">App Router DAG</div>
                  </button>
                  <button
                    onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-fuchsia-500/40 text-left transition-all group"
                  >
                    <div className="text-[11px] font-mono font-bold text-white group-hover:text-fuchsia-300">Microservice</div>
                    <div className="text-[9px] font-mono text-slate-400">Event Mesh</div>
                  </button>
                  <button
                    onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-emerald-500/40 text-left transition-all group"
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

      {/* AT-A-GLANCE SUMMARY DASHBOARD WIDGETS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              At-A-Glance Workspace Telemetry
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Live Repo Status • Plan Milestones • PR Reviews</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WIDGET 1: Last 3 Active Repositories */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-violet-500/30 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Active Repositories</h3>
                    <p className="text-[10px] font-sans text-slate-400">Last 3 synced workspaces</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
                  className="text-[11px] font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1 group"
                >
                  <span>All Repos</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Repositories List */}
              <div className="space-y-2.5">
                {(() => {
                  const defaultRepos = [
                    { repoName: 'facebook/react', fileCount: 18, lang: 'TypeScript', timeAgo: '2m ago', active: true },
                    { repoName: 'vercel/next.js', fileCount: 24, lang: 'TypeScript', timeAgo: '1h ago', active: false },
                    { repoName: 'tailwindlabs/tailwindcss', fileCount: 12, lang: 'JavaScript', timeAgo: '3h ago', active: false }
                  ];

                  const itemsToDisplay = repoHistory.length > 0 
                    ? repoHistory.slice(0, 3).map((item, idx) => ({
                        repoName: item.repoName,
                        fileCount: 16 + idx * 4,
                        lang: item.repoName.includes('react') ? 'TypeScript' : item.repoName.includes('tail') ? 'JavaScript' : 'TypeScript',
                        timeAgo: idx === 0 ? 'Just now' : `${idx * 2}h ago`,
                        active: activeRepoContext?.repoName === item.repoName
                      }))
                    : defaultRepos;

                  return itemsToDisplay.map((repo, idx) => {
                    const isSelected = activeRepoContext?.repoName === repo.repoName || (idx === 0 && !activeRepoContext);
                    return (
                      <div
                        key={repo.repoName + idx}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-violet-950/40 border-violet-500/40 shadow-sm'
                            : 'bg-black/30 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <GitBranch className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                            <span className="text-xs font-mono font-bold text-white truncate">{repo.repoName}</span>
                          </div>
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30 shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Context
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">{repo.timeAgo}</span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-300">{repo.fileCount} files</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">{repo.lang}</span>
                          </div>
                          {onSelectRepoForContext && (
                            <button
                              onClick={() => onSelectRepoForContext(repo.repoName, [])}
                              className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                            >
                              <span>Load Context</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <button
              onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
              className="w-full py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Explore Repo Architecture</span>
            </button>
          </div>

          {/* WIDGET 2: Recent Plan Milestones */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-fuchsia-500/30 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Plan Milestones</h3>
                    <p className="text-[10px] font-sans text-slate-400">Recent execution roadmap progress</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
                  className="text-[11px] font-mono text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 group"
                >
                  <span>Open Creator</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Milestones List */}
              <div className="space-y-3">
                {[
                  { title: 'OAuth Refresh Token Approval Gate', progress: 100, status: 'Completed', tasks: '8/8', color: 'emerald' },
                  { title: 'D3 Topology Force Graph Optimization', progress: 80, status: 'In Progress', tasks: '4/5', color: 'violet' },
                  { title: 'Real-Time Anti-Slop Mutation Interceptor', progress: 30, status: 'Queued', tasks: '1/3', color: 'amber' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-200 truncate pr-2">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border shrink-0 ${
                        item.color === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : item.color === 'violet'
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Tasks Completed: {item.tasks}</span>
                        <span className="font-bold text-white">{item.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.color === 'emerald'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : item.color === 'violet'
                              ? 'bg-gradient-to-r from-violet-500 to-indigo-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
              className="w-full py-2 px-3 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Create New Execution Plan</span>
            </button>
          </div>

          {/* WIDGET 3: Pending PR Comments */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-cyan-500/30 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Pending PR Comments</h3>
                    <p className="text-[10px] font-sans text-slate-400">3 review items requiring resolution</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
                >
                  <span>Stack Studio</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* PR Comments List */}
              <div className="space-y-2.5">
                {[
                  {
                    prNum: '#142',
                    prTitle: 'Fix memory leak in D3 node simulation cleanup',
                    author: 'Alex Rivera',
                    excerpt: 'Ensure force simulation event listeners are unbound before force restart.',
                    risk: 'High Risk',
                    riskClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  },
                  {
                    prNum: '#141',
                    prTitle: 'Add Strict Pre-Push ApprovalGate validation',
                    author: 'DevOps Team',
                    excerpt: 'Validate type contract and invariant checks before pushing patch.',
                    risk: 'Med Risk',
                    riskClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  },
                  {
                    prNum: '#139',
                    prTitle: 'Upgrade Gemini 3.7 live streaming response parser',
                    author: 'AI Architect',
                    excerpt: 'Verify stream chunks are debounced during rendering.',
                    risk: 'Low Risk',
                    riskClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 transition-all space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <GitPullRequest className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono font-bold text-white">{item.prNum}</span>
                        <span className="text-[11px] text-slate-300 truncate">{item.prTitle}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${item.riskClass}`}>
                        {item.risk}
                      </span>
                    </div>

                    <p className="text-[11px] font-sans text-slate-400 leading-tight italic pl-5">
                      "{item.excerpt}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                      <span>By {item.author}</span>
                      <button
                        onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Resolve →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
              className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Review in Change Stack Studio</span>
            </button>
          </div>
        </div>
      </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Module: PR Change Stack Studio */}
          <div 
            onClick={() => onNavigate(ViewMode.CHANGE_STACK)}
            className="p-6 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900/60 to-slate-950/80 hover:border-violet-400/60 transition-all cursor-pointer group flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-0.5 relative overflow-hidden"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-fuchsia-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-violet-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-sky-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
            className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5"
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
