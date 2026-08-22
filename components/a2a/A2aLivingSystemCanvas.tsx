/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  GitBranch, 
  Network, 
  ShieldCheck, 
  ClipboardList, 
  FileCode2, 
  ArrowRight, 
  Activity, 
  Layers, 
  Cpu, 
  Compass, 
  Play, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  Flame,
  Radio,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { ViewMode } from '../../types';

interface A2aLivingSystemCanvasProps {
  onNavigate?: (mode: ViewMode, data?: any) => void;
}

interface EngineNode {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  targetView: ViewMode;
  traditionalMethod: string;
  a2aAdaptiveMethod: string;
  capabilities: string[];
  metrics: { label: string; value: string }[];
}

const SYSTEM_NODES: EngineNode[] = [
  {
    id: 'node-ingestion',
    name: 'Context & Repo Ingestion',
    role: 'AST & Topology Sensing',
    icon: GitBranch,
    color: 'text-sky-300',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    x: 12,
    y: 50,
    targetView: ViewMode.REPO_ANALYZER,
    traditionalMethod: 'Rigid static directory lists and one-off text dumps',
    a2aAdaptiveMethod: 'Dynamic AST parsing, automated tech-stack clustering, and deep relationship heuristics',
    capabilities: ['Recursive Tree Synthesis', 'Multi-Language Stack Profiling', 'Hierarchical Scope Indexing'],
    metrics: [{ label: 'Ingestion Latency', value: '<120ms' }, { label: 'Tech Stack Radar', value: 'Auto-detect' }]
  },
  {
    id: 'node-codemaps',
    name: 'Codemaps & Invariant Radar',
    role: 'Topological Architecture & Contracts',
    icon: Network,
    color: 'text-indigo-300',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    x: 36,
    y: 20,
    targetView: ViewMode.CODEMAP,
    traditionalMethod: 'Unstructured code generation leading to "vibeslop" and broken invariants',
    a2aAdaptiveMethod: 'Force-directed D3 clustering, architectural invariants, and behavioral contracts',
    capabilities: ['Zero-Vibeslop Radar', 'Component Coupling Index', 'Dynamic Refactoring Suggestions'],
    metrics: [{ label: 'Topology Engine', value: 'D3 Force & Tree' }, { label: 'Contract Safety', value: '100% Invariant' }]
  },
  {
    id: 'node-a2a-core',
    name: 'a2a Cognitive Core',
    role: 'Adaptive Non-Linear Reasoning',
    icon: Bot,
    color: 'text-violet-300',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/50',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    x: 50,
    y: 50,
    targetView: ViewMode.AI_ASSISTANT,
    traditionalMethod: 'Linear chat prompts with rigid, static personas and zero visual feedback',
    a2aAdaptiveMethod: 'Multi-modal cognitive lenses (Simplify, Expand, Harden, Mutate) that learn user intent on the fly',
    capabilities: ['Cognitive Lens Morphing', 'Multi-Model Switch (Flash to Pro)', 'Proactive Contextual Memory'],
    metrics: [{ label: 'Intelligence Core', value: 'Gemini 3.7 Flash' }, { label: 'Adaptability', value: 'Real-time' }]
  },
  {
    id: 'node-plan-dag',
    name: 'Plan Creator & Visual DAG',
    role: 'Topological Roadmap & Dependency Graph',
    icon: ClipboardList,
    color: 'text-fuchsia-300',
    bgColor: 'bg-fuchsia-500/10',
    borderColor: 'border-fuchsia-500/30',
    glowColor: 'rgba(217, 70, 239, 0.4)',
    x: 64,
    y: 80,
    targetView: ViewMode.PLAN_CREATOR,
    traditionalMethod: 'Static Markdown bullet lists without dependency validation or drag-reordering',
    a2aAdaptiveMethod: 'Interactive DAG dependency map, visual drag-and-drop Kanbans, and auto-topological sorting',
    capabilities: ['Visual Drag-and-Drop Tasks', 'DAG Cycle Detection', 'AI Prerequisite Inference'],
    metrics: [{ label: 'Dependency Map', value: 'Real-time DAG' }, { label: 'Reordering', value: 'Fluid Multi-phase' }]
  },
  {
    id: 'node-infographic',
    name: 'Infographic & Material Lab',
    role: 'Visual Synthesis & Design Physics',
    icon: FileCode2,
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    x: 88,
    y: 50,
    targetView: ViewMode.ARTICLE_INFOGRAPHIC,
    traditionalMethod: 'Dense walls of static documentation that users skim and forget',
    a2aAdaptiveMethod: 'Distills complex concepts into interactive visual essays, live canvas labs, and mental models',
    capabilities: ['Interactive Design Physics Lab', 'Key Takeaway Synthesizer', 'Visual Architectural Cards'],
    metrics: [{ label: 'Visual Synthesis', value: 'SVG & Spring' }, { label: 'Comprehension Boost', value: '3.4x' }]
  }
];

const SIGNALS = [
  { from: 'node-ingestion', to: 'node-a2a-core', label: 'AST Structure & Symbols', color: '#38bdf8' },
  { from: 'node-ingestion', to: 'node-codemaps', label: 'File Coupling Vectors', color: '#818cf8' },
  { from: 'node-codemaps', to: 'node-a2a-core', label: 'Architectural Invariants', color: '#c084fc' },
  { from: 'node-a2a-core', to: 'node-plan-dag', label: 'Actionable Refactor Steps', color: '#f472b6' },
  { from: 'node-plan-dag', to: 'node-infographic', label: 'Visual Milestone Synthesis', color: '#34d399' },
  { from: 'node-a2a-core', to: 'node-infographic', label: 'Cognitive Mental Models', color: '#a78bfa' }
];

export const A2aLivingSystemCanvas: React.FC<A2aLivingSystemCanvasProps> = ({ onNavigate }) => {
  const [selectedNode, setSelectedNode] = useState<EngineNode>(SYSTEM_NODES[2]); // Default a2a core
  const [pulseActive, setPulseActive] = useState<boolean>(true);
  const [activeSignalIndex, setActiveSignalIndex] = useState<number>(0);
  const [learningScore, setLearningScore] = useState<number>(87);
  const [adaptationState, setAdaptationState] = useState<'sensing' | 'synthesizing' | 'evolving'>('evolving');

  // Cycle animated active signals to illustrate continuous data flow
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignalIndex(prev => (prev + 1) % SIGNALS.length);
      setLearningScore(prev => Math.min(100, Math.max(75, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const triggerSignalBurst = () => {
    setAdaptationState('synthesizing');
    setTimeout(() => setAdaptationState('evolving'), 1200);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden space-y-6 bg-slate-950/70">
      
      {/* Background Ambient Aura Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700"
        style={{ backgroundColor: selectedNode.glowColor }}
      />

      {/* Header with a2a Adaptive Identity Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-violet-500/30 flex items-center justify-center">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-bold text-white font-sans tracking-tight">
                a2a Living System Architecture
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono text-[10px] font-bold border border-violet-500/40 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                Continuous Learning & Adaptation
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Interactive visual map of how Link 2 Ink's adaptive components perceive, reason, and evolve without rigid linear constraints
            </p>
          </div>
        </div>

        {/* Real-time Learning Telemetry Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Cognitive State:</span>
            <span className="text-emerald-400 font-bold capitalize flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {adaptationState}
            </span>
          </div>

          <button
            onClick={triggerSignalBurst}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-violet-600/30 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Trigger an emergent architectural pulse across all modules"
          >
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span>Simulate Pulse</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Illustrated Canvas */}
      <div className="relative min-h-[340px] md:min-h-[380px] rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden select-none p-4 flex flex-col justify-between">
        
        {/* Subtle Canvas Dot Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* SVG Dynamic Data Flow Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Signal Vectors */}
          {SIGNALS.map((sig, idx) => {
            const fromNode = SYSTEM_NODES.find(n => n.id === sig.from)!;
            const toNode = SYSTEM_NODES.find(n => n.id === sig.to)!;
            const isActive = activeSignalIndex === idx;

            return (
              <g key={idx}>
                {/* Background Connecting Line */}
                <line
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke={isActive ? sig.color : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth={isActive ? 2.5 : 1.2}
                  strokeDasharray={isActive ? '4 3' : undefined}
                  className="transition-all duration-300"
                />

                {/* Animated Pulse Particle */}
                {isActive && (
                  <circle
                    r="5"
                    fill="#ffffff"
                    filter="url(#glow)"
                    className="transition-all duration-300"
                  >
                    <animate
                      attributeName="cx"
                      values={`${fromNode.x}%; ${toNode.x}%`}
                      dur="2.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={`${fromNode.y}%; ${toNode.y}%`}
                      dur="2.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Engine Nodes in Spatial Layout */}
        <div className="relative z-10 w-full h-[280px] md:h-[300px]">
          {SYSTEM_NODES.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNode.id === node.id;
            const isA2aCore = node.id === 'node-a2a-core';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group ${
                  isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <div className={`p-3 md:p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 shadow-xl ${
                  isSelected
                    ? `${node.bgColor} ${node.borderColor} ring-2 ring-violet-400 shadow-2xl`
                    : 'bg-slate-900/90 border-white/10 hover:border-white/30'
                }`}>
                  <div className={`p-2 rounded-xl ${node.bgColor} ${node.color} border ${node.borderColor} relative`}>
                    <Icon className="w-5 h-5" />
                    {isA2aCore && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-400 rounded-full animate-ping" />
                    )}
                  </div>

                  <span className={`text-[11px] font-mono font-bold whitespace-nowrap ${
                    isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {node.name}
                  </span>

                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider hidden md:block">
                    {node.role.slice(0, 18)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Signal Vector Live Status Bar */}
        <div className="relative z-10 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span>
              Active Data Pulse: <strong className="text-white">{SIGNALS[activeSignalIndex].label}</strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Click any engine node above to inspect its dynamic behavior
          </span>
        </div>

      </div>

      {/* Selected Engine Node Deep-Dive: Traditional vs. a2a Adaptive Paradigm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        
        {/* Col 1 & 2: Paradigm Contrast */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/10 space-y-3.5 bg-slate-900/50">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <selectedNode.icon className={`w-4 h-4 ${selectedNode.color}`} />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {selectedNode.name} — Architectural Paradigm Shift
              </h3>
            </div>

            <button
              onClick={() => onNavigate?.(selectedNode.targetView)}
              className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-md shadow-violet-600/30"
            >
              <span>Launch Module</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
            {/* Traditional Rigid Method */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-300 font-mono font-bold text-[11px] uppercase">
                <span>✕ Traditional Linear Paradigm</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedNode.traditionalMethod}
              </p>
            </div>

            {/* a2a Adaptive Paradigm */}
            <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-violet-300 font-mono font-bold text-[11px] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>✓ a2a Adaptive Intelligence</span>
              </div>
              <p className="text-white leading-relaxed text-[11px]">
                {selectedNode.a2aAdaptiveMethod}
              </p>
            </div>
          </div>

          {/* Capabilities List */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Key Unlocked Capabilities:</span>
            {selectedNode.capabilities.map((cap, i) => (
              <span 
                key={i} 
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{cap}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Col 3: Engine Telemetry & Quick Metrics */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between gap-3 bg-slate-900/50">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Live Engine Telemetry
            </span>
            <h4 className="text-sm font-bold text-white font-mono">
              {selectedNode.role}
            </h4>
          </div>

          <div className="space-y-2">
            {selectedNode.metrics.map((metric, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs font-mono">
                <span className="text-slate-400">{metric.label}</span>
                <span className="text-violet-300 font-bold">{metric.value}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] font-mono text-slate-400 leading-tight">
              a2a auto-tunes parameters based on repository volume and user interaction velocity.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default A2aLivingSystemCanvas;
