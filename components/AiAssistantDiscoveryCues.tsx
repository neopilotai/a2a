/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Minimize2,
  Maximize2,
  ListOrdered,
  ShieldAlert,
  Sliders,
  Compass,
  Lightbulb,
  Search,
  CheckCircle2,
  Cpu,
  Info,
  Layers,
  ArrowRight,
  ClipboardList,
  Flame,
  HelpCircle,
  X,
  Shuffle,
  ShieldCheck,
  Award,
  Terminal,
  Activity,
  Check
} from 'lucide-react';
import { AssistantRole, GeminiModelId } from '../types';

export interface CognitiveLensOption {
  id: 'simplify' | 'expand' | 'deconstruct' | 'harden' | 'plan';
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgGradient: string;
  tooltip: string;
  promptGenerator: (previousContextSummary?: string) => string;
}

export const COGNITIVE_LENSES: CognitiveLensOption[] = [
  {
    id: 'simplify',
    label: 'Simplify & Demystify',
    shortLabel: 'Simplify',
    icon: <Minimize2 className="w-3.5 h-3.5" />,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    bgGradient: 'hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-200',
    tooltip: 'Simplify: Distill into an approachable, intuitive mental model with zero jargon (ELI5 / Executive TL;DR)',
    promptGenerator: () => 
      'Simplify your previous explanation: summarize the core insight in 3 intuitive bullet points using clear real-world analogies, demystify any complex concepts, and highlight what matters most.'
  },
  {
    id: 'expand',
    label: 'Expand & Ideate',
    shortLabel: 'Expand Ideas',
    icon: <Maximize2 className="w-3.5 h-3.5" />,
    color: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    bgGradient: 'hover:bg-cyan-500/10 hover:border-cyan-500/50 text-cyan-200',
    tooltip: 'Expand: Broaden into 3 architectural variations, creative possibilities, and forward-looking concepts',
    promptGenerator: () => 
      'Expand on your previous response: brainstorm 3 divergent architectural patterns or variations, explore future-proof innovations, and discuss creative trade-offs.'
  },
  {
    id: 'deconstruct',
    label: 'Deconstruct Steps',
    shortLabel: 'Step-by-Step',
    icon: <ListOrdered className="w-3.5 h-3.5" />,
    color: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    bgGradient: 'hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-200',
    tooltip: 'Deconstruct: Break this down into an actionable, phased engineering checklist with validation criteria',
    promptGenerator: () => 
      'Deconstruct the previous solution into a step-by-step engineering roadmap. Provide actionable phases: Phase 1 (Foundation/Audit), Phase 2 (Implementation), Phase 3 (Verification & Hardening).'
  },
  {
    id: 'harden',
    label: 'Stress-Test & Harden',
    shortLabel: 'Stress-Test',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    color: 'text-rose-300',
    borderColor: 'border-rose-500/40',
    bgGradient: 'hover:bg-rose-500/10 hover:border-rose-500/50 text-rose-200',
    tooltip: 'Harden: Audit against edge cases, concurrency hazards, security vulnerabilities, and failure recovery',
    promptGenerator: () => 
      'Stress-test and harden your previous recommendations: identify potential security vulnerabilities, concurrency race conditions, scale bottlenecks, and specify defensive safeguards.'
  }
];

export interface ExploratoryPromptCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  prompts: {
    title: string;
    description: string;
    prompt: string;
    lens: 'simplify' | 'expand' | 'deconstruct' | 'harden' | 'creative';
    badge: string;
  }[];
}

export const EXPLORATORY_PROMPTS: ExploratoryPromptCategory[] = [
  {
    id: 'conceptual',
    name: 'Mental Models & Simplification',
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    color: 'amber',
    prompts: [
      {
        title: 'Explain Architecture Like I’m 5',
        description: 'Breaks down core application layers using physical world analogies',
        prompt: 'Explain the high-level architecture of this application using a physical-world analogy (e.g. an airport, restaurant, or city grid). Highlight the flow of data without technical jargon.',
        lens: 'simplify',
        badge: 'Intuitive'
      },
      {
        title: 'Key Invariants & Single Sources of Truth',
        description: 'Identifies the foundational rules that keep the system consistent',
        prompt: 'What are the 3 most crucial architectural invariants and single sources of truth in this system that must never be broken?',
        lens: 'simplify',
        badge: 'Core Rules'
      },
      {
        title: 'Component Responsibility Matrix',
        description: 'Demystifies module boundaries and who does what',
        prompt: 'Provide a clean table summarizing the primary responsibilities and boundaries of the major folders/modules in this repository.',
        lens: 'simplify',
        badge: 'Clarity'
      }
    ]
  },
  {
    id: 'expansion',
    name: 'Ideation & Divergent Possibilities',
    icon: <Maximize2 className="w-4 h-4 text-cyan-400" />,
    color: 'cyan',
    prompts: [
      {
        title: '3 Alternative Architectural Paradigms',
        description: 'Compares event-driven, micro-frontend, and local-first alternatives',
        prompt: 'If we were to redesign this application today, propose 3 alternative architectural paradigms (e.g. Local-First with CRDTs, Event-Driven Actor Model, or Micro-Frontends) with pros and cons.',
        lens: 'expand',
        badge: 'Divergent'
      },
      {
        title: 'AI Co-Pilot & Automation Integrations',
        description: 'Brainstorm how AI features can augment this codebase safely',
        prompt: 'Brainstorm 4 creative ways to integrate smart AI workflows into this application while preserving user trust, zero-slop invariants, and low latency.',
        lens: 'expand',
        badge: 'Aspirational'
      },
      {
        title: 'Extreme Scalability Scenario',
        description: 'Simulates 100x user growth and architectural adaptations',
        prompt: 'Imagine this system experiences a 100x traffic spike overnight. Where will the architecture fail first, and what caching, pooling, and sharding strategies should we adopt?',
        lens: 'expand',
        badge: '100x Scale'
      }
    ]
  },
  {
    id: 'hardening',
    name: 'Zero-Vibeslop & Security Defense',
    icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
    color: 'rose',
    prompts: [
      {
        title: 'OWASP Vulnerability Surface Audit',
        description: 'Comprehensive inspection against top web security threats',
        prompt: 'Perform a threat model and security audit on this architecture. Check for XSS, CSRF, insecure token storage, unvalidated inputs, and rate-limiting gaps.',
        lens: 'harden',
        badge: 'Security'
      },
      {
        title: 'Async Race Condition & Deadlock Audit',
        description: 'Probes state mutations and concurrent promise lifecycles',
        prompt: 'Identify any subtle concurrency race conditions, unhandled async promise rejections, or memory leaks in long-lived state listeners and subscriptions.',
        lens: 'harden',
        badge: 'Defensive'
      },
      {
        title: 'Anti-Vibeslop Contract Assertions',
        description: 'Verifies strict typing and boundary safety',
        prompt: 'Audit the type contracts and boundaries in this codebase. Where might AI-generated code produce subtle contract breakages, and how do we enforce compile-time safety nets?',
        lens: 'harden',
        badge: 'Contracts'
      }
    ]
  },
  {
    id: 'modernization',
    name: 'Refactoring & Phased Roadmaps',
    icon: <ListOrdered className="w-4 h-4 text-emerald-400" />,
    color: 'emerald',
    prompts: [
      {
        title: 'Strangler Fig Migration Blueprint',
        description: 'Gradual, zero-downtime decomposition of legacy modules',
        prompt: 'Create a phased Strangler Fig migration strategy to incrementally refactor legacy components into modern, decoupled TypeScript services with continuous deployment.',
        lens: 'deconstruct',
        badge: 'Refactor'
      },
      {
        title: 'State Management Modernization',
        description: 'Streamlining global vs local reactivity patterns',
        prompt: 'Evaluate our state management and props-drilling architecture. Recommend a clean, performant reactivity model with minimal boilerplate.',
        lens: 'deconstruct',
        badge: 'State'
      },
      {
        title: 'End-to-End Testing Safety Net',
        description: 'Constructing an impenetrable test pyramid',
        prompt: 'Design a comprehensive test strategy covering unit invariant assertions, integration mocks, and visual regression smoke tests for our critical user journeys.',
        lens: 'deconstruct',
        badge: 'QA Plan'
      }
    ]
  }
];

// -------------------------------------------------------------
// Component 1: Cognitive Lens Actions on Model Response
// -------------------------------------------------------------
interface AiCognitiveActionsProps {
  onApplyLens: (prompt: string, lensId: string) => void;
  onOpenPlanCreator?: () => void;
  isLoading: boolean;
  messageId: string;
}

export const AiCognitiveActions: React.FC<AiCognitiveActionsProps> = ({
  onApplyLens,
  onOpenPlanCreator,
  isLoading,
  messageId
}) => {
  const [activeLens, setActiveLens] = useState<string | null>(null);

  const handleLensClick = (lens: CognitiveLensOption) => {
    setActiveLens(lens.id);
    onApplyLens(lens.promptGenerator(), lens.id);
    setTimeout(() => setActiveLens(null), 1500);
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wider mr-1">
          <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
          Cognitive Lenses:
        </span>
        
        {COGNITIVE_LENSES.map(lens => (
          <button
            key={lens.id}
            onClick={() => handleLensClick(lens)}
            disabled={isLoading}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              activeLens === lens.id
                ? 'bg-violet-600 text-white border-violet-400 ring-2 ring-violet-400/50'
                : `bg-slate-950/70 border-white/10 ${lens.bgGradient}`
            }`}
            title={lens.tooltip}
          >
            <span className={lens.color}>{lens.icon}</span>
            <span>{lens.shortLabel}</span>
          </button>
        ))}
      </div>

      {onOpenPlanCreator && (
        <button
          onClick={onOpenPlanCreator}
          disabled={isLoading}
          className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-fuchsia-950/40 hover:bg-fuchsia-900/60 text-fuchsia-300 border border-fuchsia-500/30 hover:border-fuchsia-500/50 transition-all flex items-center gap-1 shadow-sm shrink-0"
          title="Convert this discussion into a structured Implementation Plan"
        >
          <ClipboardList className="w-3 h-3 text-fuchsia-400" />
          <span>Convert to Plan</span>
        </button>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Component 2: Dynamic Evolving Mastery Banner
// -------------------------------------------------------------
interface AiMasteryBannerProps {
  onOpenPromptLab: () => void;
  onOpenGlossary: () => void;
  selectedRole: AssistantRole;
  selectedModel: GeminiModelId;
}

export const AiMasteryBanner: React.FC<AiMasteryBannerProps> = ({
  onOpenPromptLab,
  onOpenGlossary,
  selectedRole,
  selectedModel
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="px-4 py-1.5 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Gemini Dynamic Cues Active</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">• Simplify & Expand Mental Models</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPromptLab}
            className="text-violet-300 hover:text-violet-200 flex items-center gap-1 hover:underline text-[10px]"
          >
            <Compass className="w-3 h-3" />
            <span>Prompt Lab</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setIsDismissed(false)}
            className="text-slate-400 hover:text-white text-[10px]"
          >
            Show Tips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 bg-gradient-to-r from-violet-950/60 via-indigo-950/40 to-slate-950/80 border-b border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 animate-in fade-in duration-300 relative overflow-hidden">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 shadow-sm shrink-0">
          <Compass className="w-4 h-4 text-violet-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
              <span>Dynamic AI Cues & Exploration</span>
              <span className="px-1.5 py-0.2 rounded bg-violet-500/30 text-violet-200 font-mono text-[9px] uppercase font-bold border border-violet-500/40">
                Active Learning
              </span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              Simplifying complexity & expanding architectural horizons
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-snug">
            Use <span className="text-amber-300 font-semibold font-mono">Simplify</span> to distill mental models or <span className="text-cyan-300 font-semibold font-mono">Expand</span> to explore divergent design patterns with confidence.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={onOpenPromptLab}
          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-semibold transition-all shadow-md shadow-violet-600/20 flex items-center gap-1.5"
          title="Open Exploratory Prompt Laboratory"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Prompt Lab</span>
        </button>

        <button
          onClick={onOpenGlossary}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-mono text-xs transition-colors flex items-center gap-1"
          title="How Gemini simplifies, expands, and builds trust"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
          <span className="hidden lg:inline">Design Philosophy</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component 3: Prompt Laboratory & Exploratory Sandbox Modal
// -------------------------------------------------------------
interface AiPromptLaboratoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
  selectedRole: AssistantRole;
}

export const AiPromptLaboratoryModal: React.FC<AiPromptLaboratoryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  selectedRole
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cognitiveDepth, setCognitiveDepth] = useState<number>(3); // 1 = ELI5, 5 = Deep Staff Spec
  const [promptRemixSuffix, setPromptRemixSuffix] = useState<string>('');
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = EXPLORATORY_PROMPTS.filter(cat => 
    selectedCategory === 'all' || cat.id === selectedCategory
  );

  const allPrompts = filteredCategories.flatMap(cat => 
    cat.prompts.map((p, idx) => ({ ...p, categoryName: cat.name, catId: cat.id, uniqueId: `${cat.id}-${idx}` }))
  ).filter(p => 
    !searchQuery || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLaunchPrompt = (basePrompt: string) => {
    let finalPrompt = basePrompt;
    if (cognitiveDepth === 1) {
      finalPrompt = `[ELI5 Intuitive Mode] ${finalPrompt} Explain with utmost simplicity, intuitive analogies, and clean summaries.`;
    } else if (cognitiveDepth === 5) {
      finalPrompt = `[Deep Technical Staff Mode] ${finalPrompt} Provide strict architectural invariants, boundary contracts, edge cases, and formal code specifications.`;
    }
    if (promptRemixSuffix.trim()) {
      finalPrompt += `\n\nSpecific Focus Constraint: ${promptRemixSuffix.trim()}`;
    }
    onSelectPrompt(finalPrompt);
    onClose();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIdx(id);
    setTimeout(() => setCopiedPromptIdx(null), 2000);
  };

  const getRandomPrompt = () => {
    const list = EXPLORATORY_PROMPTS.flatMap(c => c.prompts);
    const random = list[Math.floor(Math.random() * list.length)];
    handleLaunchPrompt(random.prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-600/30 border border-violet-500/40 text-violet-300 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-sans">
                  Gemini Prompt Laboratory & Discovery Sandbox
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono text-[10px]">
                  {selectedRole.name} Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Explore, play, and search prompts designed to simplify complexity, expand ideas, and stress-test architecture.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Search, Category Filters, and Depth Tuner */}
        <div className="p-4 bg-slate-950/50 border-b border-white/10 space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas, security, scaling, state..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Cognitive Depth Slider */}
            <div className="flex items-center gap-2 w-full md:w-auto bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] text-slate-400">Depth:</span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={cognitiveDepth}
                onChange={(e) => setCognitiveDepth(parseInt(e.target.value))}
                className="w-24 accent-violet-500 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-violet-300 w-28 text-right truncate">
                {cognitiveDepth === 1 ? '🌟 ELI5 Intuitive' : cognitiveDepth === 5 ? '📐 Staff Deep Spec' : '⚖️ Balanced Clarity'}
              </span>
            </div>

            {/* Random Prompt Button */}
            <button
              onClick={getRandomPrompt}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5 shrink-0"
              title="Surprise me with a deep thought prompt"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Surprise Me</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all shrink-0 border ${
                selectedCategory === 'all'
                  ? 'bg-violet-600 text-white border-violet-400 shadow-sm'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              All Topics ({EXPLORATORY_PROMPTS.reduce((acc, c) => acc + c.prompts.length, 0)})
            </button>

            {EXPLORATORY_PROMPTS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 border ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white border-violet-400 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {allPrompts.map((p) => (
              <div
                key={p.uniqueId}
                className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-violet-500/50 hover:bg-slate-800/40 transition-all flex flex-col justify-between group text-left relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-semibold">
                      {p.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {p.categoryName}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white group-hover:text-violet-200 transition-colors font-sans">
                    {p.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {p.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 italic line-clamp-3">
                    "{p.prompt}"
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(p.uniqueId, p.prompt)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono flex items-center gap-1"
                    title="Copy prompt text"
                  >
                    {copiedPromptIdx === p.uniqueId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <span className="text-[10px]">Copy</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleLaunchPrompt(p.prompt)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600/80 group-hover:bg-violet-600 text-white text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Execute in Chat</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {allPrompts.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-mono text-xs space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p>No prompts found matching "{searchQuery}".</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-violet-400 hover:underline"
              >
                Clear search filter
              </button>
            </div>
          )}
        </div>

        {/* Footer Constraint Input */}
        <div className="p-3.5 bg-slate-950/80 border-t border-white/10 flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Optional Custom Focus:</span>
          </span>
          <input
            type="text"
            value={promptRemixSuffix}
            onChange={(e) => setPromptRemixSuffix(e.target.value)}
            placeholder="e.g. Focus on TypeScript strict mode, Redux Toolkit, or AWS Lambda serverless..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component 4: Conceptual Philosophy & Trust Glossary Modal
// -------------------------------------------------------------
interface AiConceptualGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiConceptualGlossaryModal: React.FC<AiConceptualGlossaryModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                The New Digital Landscape: How Gemini Simplifies & Expands
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Bridging conceptual gaps to make AI intuitive, immersive, approachable, and trustworthy.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 font-sans leading-relaxed">
          {/* Pillar 1 */}
          <div className="space-y-2.5 glass-panel p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-xs uppercase tracking-wider">
              <Minimize2 className="w-4 h-4 text-amber-400" />
              <span>1. How Gemini Simplifies Information (Mental Models)</span>
            </div>
            <p className="text-xs text-slate-300">
              Traditional development tools presented rigid, linear dashboards. Gemini moves beyond control panels by actively distilling chaotic multi-file codebases into crisp, intuitive mental models. When you click <strong className="text-amber-200">Simplify</strong>, Gemini eliminates cognitive clutter and exposes the underlying architectural invariants.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="space-y-2.5 glass-panel p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/10">
            <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono text-xs uppercase tracking-wider">
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span>2. How Gemini Expands Ideas (Divergent Co-Creation)</span>
            </div>
            <p className="text-xs text-slate-300">
              Engineering isn’t just finding one answer; it’s exploring trade-offs. The <strong className="text-cyan-200">Expand & Ideate</strong> lens invites developers to play with multiple paradigms (e.g. event-driven vs. local-first, micro-frontends vs. modular monoliths) and simulate edge cases before writing a single line of production code.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="space-y-2.5 glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="flex items-center gap-2 text-emerald-300 font-bold font-mono text-xs uppercase tracking-wider">
              <ListOrdered className="w-4 h-4 text-emerald-400" />
              <span>3. Deconstruction into Actionable Roadmaps</span>
            </div>
            <p className="text-xs text-slate-300">
              High-level advice without concrete execution causes friction. The <strong className="text-emerald-200">Deconstruct Steps</strong> lens automatically transforms discussions into phased milestones, task checklists, and verification criteria, establishing a direct bridge to our structured Plan Creator.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="space-y-2.5 glass-panel p-4 rounded-2xl border border-rose-500/20 bg-rose-950/10">
            <div className="flex items-center gap-2 text-rose-300 font-bold font-mono text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>4. Trust & Grounding Against Vibeslop</span>
            </div>
            <p className="text-xs text-slate-300">
              Trust is the prerequisite for AI adoption. Gemini grounds its responses in your actual repository topology, verifies boundary contracts, and provides telemetry on token context, model reasoning, and safety checks so you always understand why a recommendation was made.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-semibold shadow-md transition-all"
          >
            Got it, Let’s Explore
          </button>
        </div>
      </div>
    </div>
  );
};
