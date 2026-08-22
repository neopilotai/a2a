/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  Lightbulb, 
  Maximize2, 
  ShieldCheck, 
  GitMerge, 
  ArrowRight, 
  Award,
  Zap,
  Lock,
  Layers,
  FileCode2,
  Network,
  ClipboardList
} from 'lucide-react';
import { ViewMode } from '../../types';

interface MasteryTrailItem {
  id: string;
  stage: 'discover' | 'learn' | 'master';
  title: string;
  category: string;
  description: string;
  dynamicCue: string;
  targetView: ViewMode;
  isUnlocked: boolean;
  isCompleted: boolean;
  badge: string;
  actionText: string;
}

const INITIAL_TRAIL_ITEMS: MasteryTrailItem[] = [
  // 1. Discover Stage
  {
    id: 'cue-repo-graph',
    stage: 'discover',
    title: 'Visual Codebase Topology',
    category: 'Topology & AST',
    description: 'Transform an entire repository into a dynamic force-directed D3 network graph with automated tech stack detection.',
    dynamicCue: 'Hover over graph nodes to trigger file coupling radii and tech stack badges.',
    targetView: ViewMode.REPO_ANALYZER,
    isUnlocked: true,
    isCompleted: true,
    badge: 'Discovery',
    actionText: 'Explore Topology'
  },
  {
    id: 'cue-cognitive-lens',
    stage: 'discover',
    title: 'First Cognitive Lens Invocation',
    category: 'a2a Reasoning',
    description: 'Apply the "Simplify (ELI5)" or "Expand" cognitive lens to morph any architectural explanation on demand.',
    dynamicCue: 'Look for the glowing Cognitive Lens toolbar beneath every a2a response.',
    targetView: ViewMode.AI_ASSISTANT,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Discovery',
    actionText: 'Try Lenses in a2a'
  },
  {
    id: 'cue-anti-slop',
    stage: 'discover',
    title: 'Anti-Vibeslop Radar & Contracts',
    category: 'Codemaps',
    description: 'Inspect architectural invariants and behavioral contracts to ensure AI code doesn’t compromise strict typing.',
    dynamicCue: 'Filter Codemaps by "Anti-Vibeslop" to view contract invariants and node metrics.',
    targetView: ViewMode.CODEMAP,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Discovery',
    actionText: 'Inspect Codemaps'
  },

  // 2. Learn Stage
  {
    id: 'cue-dual-model',
    stage: 'learn',
    title: 'Multi-Model Cognitive Shift',
    category: 'Adaptive Intelligence',
    description: 'Switch seamlessly between Gemini 3.7 Flash for rapid interaction and Gemini 3.1 Pro for deep invariant reasoning.',
    dynamicCue: 'Select different Gemini models in a2a to test latency vs deep reasoning trade-offs.',
    targetView: ViewMode.AI_ASSISTANT,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Learning',
    actionText: 'Switch Models'
  },
  {
    id: 'cue-drag-dag',
    stage: 'learn',
    title: 'Visual DAG Dependency Reordering',
    category: 'Plan Creator',
    description: 'Drag and drop task cards to reorder architectural milestones, with real-time circular dependency cycle detection.',
    dynamicCue: 'Drag any task card in the Kanban or Visual Graph mode to update its priority.',
    targetView: ViewMode.PLAN_CREATOR,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Learning',
    actionText: 'Open Plan DAG'
  },
  {
    id: 'cue-design-physics',
    stage: 'learn',
    title: 'Code as a Design Material Physics',
    category: 'Visual Synthesis',
    description: 'Explore the live interactive spring physics canvas and reflection on why code is a malleable design medium.',
    dynamicCue: 'Adjust tension and mass sliders in the Config Reflection lab to see real-time UI physics.',
    targetView: ViewMode.ARTICLE_INFOGRAPHIC,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Learning',
    actionText: 'Play in Lab'
  },

  // 3. Master Stage
  {
    id: 'cue-plan-synthesis',
    stage: 'master',
    title: 'Conversation-to-DAG Synthesis',
    category: 'a2a Orchestration',
    description: 'Convert a multi-turn deep architectural chat in a2a into a structured, dependency-validated implementation roadmap.',
    dynamicCue: 'Click "Convert to Plan" at the bottom of any a2a architectural response.',
    targetView: ViewMode.AI_ASSISTANT,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Mastery',
    actionText: 'Test Orchestration'
  },
  {
    id: 'cue-scenario-stress',
    stage: 'master',
    title: 'Emergent Chaos Stress-Testing',
    category: 'Adaptive Resilience',
    description: 'Simulate high-concurrency traffic spikes, token leaks, and circular monolith hazards to stress-test your system.',
    dynamicCue: 'Use the Scenario Simulator to verify hardening prescriptions before deploying.',
    targetView: ViewMode.HOME,
    isUnlocked: true,
    isCompleted: false,
    badge: 'Mastery',
    actionText: 'Run Chaos Lab'
  }
];

interface A2aAdaptiveMasteryMatrixProps {
  onNavigate?: (mode: ViewMode, data?: any) => void;
}

export const A2aAdaptiveMasteryMatrix: React.FC<A2aAdaptiveMasteryMatrixProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<MasteryTrailItem[]>(INITIAL_TRAIL_ITEMS);
  const [selectedStage, setSelectedStage] = useState<'all' | 'discover' | 'learn' | 'master'>('all');

  const handleToggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const completedCount = items.filter(i => i.isCompleted).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const filteredItems = items.filter(item => 
    selectedStage === 'all' || item.stage === selectedStage
  );

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6 bg-slate-950/70">
      
      {/* Header with Progress Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-bold text-white font-sans">
                a2a Adaptive Discovery & Mastery Trails
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 uppercase">
                {progressPercent}% Mastered
              </span>
            </div>
            <p className="text-xs font-sans text-slate-400">
              Interactive cues guiding your journey through discovering, learning, and mastering non-linear AI architecture
            </p>
          </div>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 self-start md:self-auto">
          {(['all', 'discover', 'learn', 'master'] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                selectedStage === stage
                  ? 'bg-violet-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {stage === 'all' ? 'All Trails' : stage}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-700 shadow-sm shadow-emerald-500/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Mastery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isCompleted = item.isCompleted;

          return (
            <div
              key={item.id}
              onClick={() => onNavigate?.(item.targetView)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                isCompleted 
                  ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                  : item.stage === 'discover' 
                    ? 'bg-slate-900/80 border-sky-500/30 hover:border-sky-500/60'
                    : item.stage === 'learn'
                      ? 'bg-slate-900/80 border-violet-500/30 hover:border-violet-500/60'
                      : 'bg-slate-900/80 border-fuchsia-500/30 hover:border-fuchsia-500/60'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header line */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                    item.stage === 'discover' ? 'bg-sky-500/20 text-sky-300' :
                    item.stage === 'learn' ? 'bg-violet-500/20 text-violet-300' : 'bg-fuchsia-500/20 text-fuchsia-300'
                  }`}>
                    {item.stage}
                  </span>

                  <button
                    onClick={(e) => handleToggleComplete(item.id, e)}
                    className={`p-1 rounded-md transition-colors ${
                      isCompleted 
                        ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'fill-emerald-500/20' : ''}`} />
                  </button>
                </div>

                <h4 className="text-xs font-bold text-white font-mono group-hover:text-violet-200 transition-colors">
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {item.description}
                </p>

                {/* Dynamic Cue Callout Box */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono text-amber-300 uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    Dynamic Cue Hint
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 leading-tight">
                    {item.dynamicCue}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-500">{item.category}</span>
                <span className="text-violet-300 group-hover:text-white font-bold flex items-center gap-1">
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default A2aAdaptiveMasteryMatrix;
