/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Compass, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Layers, 
  Network, 
  ClipboardList, 
  Flame, 
  ArrowRight, 
  Zap, 
  Radio, 
  Eye, 
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { ViewMode, ActiveRepoContext } from '../../types';

interface A2aCompanionHUDProps {
  currentView: ViewMode;
  activeRepoContext: ActiveRepoContext | null;
  onNavigate: (mode: ViewMode, data?: any) => void;
  onOpenPromptLab?: () => void;
}

export const A2aCompanionHUD: React.FC<A2aCompanionHUDProps> = ({
  currentView,
  activeRepoContext,
  onNavigate,
  onOpenPromptLab
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeCognitiveMode, setActiveCognitiveMode] = useState<string>('Non-Linear Adaptive');
  const [cueFeedback, setCueFeedback] = useState<string | null>(null);

  // Context-specific dynamic cues and quick actions based on current view
  const getViewContextCues = () => {
    switch (currentView) {
      case ViewMode.REPO_ANALYZER:
        return {
          title: 'Topology & Ingestion Context',
          insight: `${activeRepoContext?.repoName || 'Codebase'} topology mapped. D3 force simulation ready for cluster grouping.`,
          quickActions: [
            { label: 'Deconstruct Boundaries', target: ViewMode.AI_ASSISTANT, prompt: 'Deconstruct the major boundaries in this repository' },
            { label: 'View Codemaps', target: ViewMode.CODEMAP }
          ]
        };
      case ViewMode.CODEMAP:
        return {
          title: 'Contract Invariants & Codemap',
          insight: 'Anti-Vibeslop Radar active. Verifying type boundaries and structural invariants.',
          quickActions: [
            { label: 'Audit Vulnerability Vectors', target: ViewMode.AI_ASSISTANT, prompt: 'Perform an invariant and vulnerability audit on these modules' },
            { label: 'Convert to Plan DAG', target: ViewMode.PLAN_CREATOR }
          ]
        };
      case ViewMode.PLAN_CREATOR:
        return {
          title: 'Visual DAG & Roadmap Engine',
          insight: 'Real-time topological cycle detector active. Drag tasks to reorganize milestones.',
          quickActions: [
            { label: 'AI Infer Prerequisites', target: ViewMode.PLAN_CREATOR },
            { label: 'Discuss Plan with a2a', target: ViewMode.AI_ASSISTANT, prompt: 'Review my implementation DAG milestones and suggest missing dependencies' }
          ]
        };
      case ViewMode.ARTICLE_INFOGRAPHIC:
        return {
          title: 'Config Reflection & Physics Lab',
          insight: 'Exploring code as malleable design material with spring dynamics.',
          quickActions: [
            { label: 'Explain Design Physics', target: ViewMode.AI_ASSISTANT, prompt: 'Explain how UI spring physics and malleable code contrast with static frames' },
            { label: 'Back to Topology', target: ViewMode.REPO_ANALYZER }
          ]
        };
      case ViewMode.AI_ASSISTANT:
        return {
          title: 'a2a Multi-turn Cognitive Core',
          insight: 'Adaptive memory and cognitive lenses ready. Non-linear reasoning active.',
          quickActions: [
            { label: 'Launch Prompt Lab', onClick: onOpenPromptLab },
            { label: 'Inspect System Canvas', target: ViewMode.HOME }
          ]
        };
      default:
        return {
          title: 'a2a System Active',
          insight: 'Link 2 Ink intelligent visual assistant standing by to perceive and adapt.',
          quickActions: [
            { label: 'Explore Codebase', target: ViewMode.REPO_ANALYZER },
            { label: 'Ask a2a Anything', target: ViewMode.AI_ASSISTANT }
          ]
        };
    }
  };

  const currentCues = getViewContextCues();

  const handleActionClick = (action: { label: string; target?: ViewMode; prompt?: string; onClick?: () => void }) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.target) {
      onNavigate(action.target);
    }
    setCueFeedback(`Triggered: ${action.label}`);
    setTimeout(() => setCueFeedback(null), 2500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end select-none font-mono">
      
      {/* Floating HUD Container */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 glass-panel p-4 rounded-3xl border border-violet-500/40 bg-slate-950/95 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">a2a Dynamic Companion</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[10px] text-slate-400">Adaptive Assistant</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                title="Minimize HUD"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Card */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-violet-300 font-bold uppercase">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                {currentCues.title}
              </span>
              <span className="text-slate-500">{currentView}</span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              {currentCues.insight}
            </p>
          </div>

          {/* Dynamic Action Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Suggested Non-Linear Pathways:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentCues.quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleActionClick(action)}
                  className="px-2.5 py-1 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/30 hover:border-violet-500/60 text-violet-200 text-xs font-mono transition-all flex items-center gap-1 shadow-sm group"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Cue Action Feedback Toast */}
          {cueFeedback && (
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5 animate-in fade-in">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{cueFeedback}</span>
            </div>
          )}

          {/* Footer Navigation Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => onNavigate(ViewMode.AI_ASSISTANT)}
              className="text-violet-300 hover:text-white font-bold flex items-center gap-1 transition-colors"
            >
              <span>Full a2a Studio</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => onNavigate(ViewMode.HOME)}
              className="hover:text-white transition-colors"
            >
              System Canvas
            </button>
          </div>

        </div>
      )}

      {/* Floating Trigger Button with Dynamic Pulse Aura */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2.5 rounded-full border transition-all flex items-center gap-2.5 shadow-2xl backdrop-blur-md group ${
          isOpen
            ? 'bg-violet-600 text-white border-violet-400 shadow-violet-500/40'
            : 'bg-slate-900/90 text-slate-200 border-violet-500/40 hover:border-violet-400 hover:text-white hover:bg-violet-950/60 shadow-lg'
        }`}
        title="Toggle a2a Dynamic Companion"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-violet-300 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-bold font-mono tracking-tight">
          a2a
        </span>
        <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] font-mono text-violet-200 hidden sm:inline">
          Adaptive Cues
        </span>
      </button>

    </div>
  );
};

export default A2aCompanionHUD;
