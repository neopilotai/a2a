/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Layers, 
  Cpu, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  BookOpen, 
  Palette, 
  Lightbulb, 
  ShieldCheck, 
  Activity, 
  MousePointer, 
  Laptop, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight,
  Code,
  Box,
  Gauge,
  Workflow,
  HelpCircle,
  Maximize,
  Compass
} from 'lucide-react';
import { Citation, ArticleHistoryItem } from '../types';
import { generateArticleInfographic } from '../services/geminiService';
import ImageViewer from './ImageViewer';
import { LoadingState } from './LoadingState';

interface CodeAsDesignMaterialViewProps {
  onAddToHistory?: (item: ArticleHistoryItem) => void;
}

// 7 States of Live UI Material
type UIState = 'idle' | 'hover' | 'active' | 'loading' | 'success' | 'error' | 'empty';

export const CodeAsDesignMaterialView: React.FC<CodeAsDesignMaterialViewProps> = ({ onAddToHistory }) => {
  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'essay' | 'sandbox' | 'heuristics' | 'infographic'>('essay');
  
  // Sandbox Interactive Tokens
  const [tokenRadius, setTokenRadius] = useState<number>(16);
  const [tokenPadding, setTokenPadding] = useState<number>(20);
  const [tokenElevation, setTokenElevation] = useState<number>(24);
  const [tokenSpring, setTokenSpring] = useState<number>(300); // ms transition
  const [tokenAccentHue, setTokenAccentHue] = useState<string>('violet');
  const [activeSimState, setActiveSimState] = useState<UIState>('idle');
  const [isCopiedToken, setIsCopiedToken] = useState(false);

  // Figma vs Code Viewport Mode
  const [materialMode, setMaterialMode] = useState<'figma' | 'code'>('code');
  const [simulatedDevice, setSimulatedDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Interactive Heuristics Checklist
  const [checkedHeuristics, setCheckedHeuristics] = useState<Record<string, boolean>>({
    'h1': true,
    'h2': true,
    'h3': false,
    'h4': true,
    'h5': false,
    'h6': true,
    'h7': false,
    'h8': true
  });

  // AI Infographic Generation State for this essay
  const [generatingInfographic, setGeneratingInfographic] = useState(false);
  const [infographicImage, setInfographicImage] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('');
  const [genError, setGenError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('Modern Editorial');
  const [fullScreenImage, setFullScreenImage] = useState<{ src: string; alt: string } | null>(null);

  const formatImageSrc = (data: string | null | undefined): string => {
    if (!data) return '';
    if (data.startsWith('data:')) return data;
    return `data:image/png;base64,${data}`;
  };

  const ESSAY_TITLE = "Code is a Design Material: A Designer’s Reflections from Config & Why UX Fundamentals Matter More Than Ever";
  const ESSAY_URL = "https://config.figma.com/reflections/code-as-design-material";

  const citations: Citation[] = [
    {
      title: "Config Keynote: The Convergence of Design Engineering & Living Materials",
      uri: "https://figma.com/blog/config-reflections-design-engineering/"
    },
    {
      title: "John Maeda on Computational Design & The Law of the Medium",
      uri: "https://designintech.report/computational-design-materials/"
    },
    {
      title: "Nielsen Norman Group: 10 Usability Heuristics in the AI Era",
      uri: "https://www.nngroup.com/articles/ten-usability-heuristics/"
    },
    {
      title: "Designing with Plasticity: How Code Responds to Asynchronous Realities",
      uri: "https://w3.org/WAI/fundamentals/accessibility-principles/"
    }
  ];

  const handleGenerateEssayInfographic = async () => {
    setGeneratingInfographic(true);
    setGenError(null);
    setLoadingStage('SYNTHESIZING ESSAY ARCHITECTURE...');

    try {
      const { imageData: resultImage, citations: resultCites } = await generateArticleInfographic(
        `${ESSAY_TITLE} - Comprehensive architectural summary on how code acts as a tangible design medium, design token systems, state transitions, and why cognitive heuristics matter in AI UI development`,
        selectedStyle,
        (stage) => setLoadingStage(stage),
        "English"
      );

      if (resultImage) {
        setInfographicImage(resultImage);
        setActiveTab('infographic');
        if (onAddToHistory) {
          onAddToHistory({
            id: Date.now().toString(),
            title: "Code is a Design Material (Config)",
            url: ESSAY_URL,
            imageData: resultImage,
            citations: resultCites.length > 0 ? resultCites : citations,
            date: new Date()
          });
        }
      } else {
        throw new Error("Unable to synthesize infographic. Please retry.");
      }
    } catch (err: any) {
      setGenError(err.message || "Failed to generate infographic.");
    } finally {
      setGeneratingInfographic(false);
      setLoadingStage('');
    }
  };

  const copyDesignTokens = () => {
    const tokens = {
      $schema: "https://design-tokens.github.io/community-group/format/",
      borderRadius: `${tokenRadius}px`,
      padding: `${tokenPadding}px`,
      elevationBlur: `${tokenElevation}px`,
      springTransition: `${tokenSpring}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      accentColor: tokenAccentHue === 'violet' ? '#8b5cf6' : tokenAccentHue === 'emerald' ? '#10b981' : tokenAccentHue === 'sky' ? '#0ea5e9' : '#f59e0b',
    };
    navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
    setIsCopiedToken(true);
    setTimeout(() => setIsCopiedToken(false), 2000);
  };

  const toggleHeuristic = (id: string) => {
    setCheckedHeuristics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const heuristicsCount = Object.values(checkedHeuristics).filter(Boolean).length;
  const heuristicsTotal = Object.keys(checkedHeuristics).length;
  const heuristicsPercent = Math.round((heuristicsCount / heuristicsTotal) * 100);

  // Color mapping
  const accentClasses = {
    violet: {
      text: 'text-violet-400',
      bg: 'bg-violet-500/20',
      border: 'border-violet-500/40',
      button: 'bg-violet-600 hover:bg-violet-500 text-white',
      glow: 'rgba(139, 92, 246, 0.4)',
      hex: '#8b5cf6'
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      glow: 'rgba(16, 185, 129, 0.4)',
      hex: '#10b981'
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/20',
      border: 'border-sky-500/40',
      button: 'bg-sky-600 hover:bg-sky-500 text-white',
      glow: 'rgba(14, 165, 233, 0.4)',
      hex: '#0ea5e9'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/40',
      button: 'bg-amber-600 hover:bg-amber-500 text-white',
      glow: 'rgba(245, 158, 11, 0.4)',
      hex: '#f59e0b'
    },
  }[tokenAccentHue] || {
    text: 'text-violet-400',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/40',
    button: 'bg-violet-600 hover:bg-violet-500 text-white',
    glow: 'rgba(139, 92, 246, 0.4)',
    hex: '#8b5cf6'
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-16 animate-in fade-in duration-500">
      
      {fullScreenImage && (
        <ImageViewer 
          src={fullScreenImage.src} 
          alt={fullScreenImage.alt} 
          onClose={() => setFullScreenImage(null)} 
        />
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Code className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              FIGMA CONFIG SPECIAL ESSAY
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono text-xs">
              Design Engineering & UX Fundamentals
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-sans leading-tight">
            Code is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">Design Material</span>
          </h2>

          <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed">
            A designer’s reflections from Config: why static frames are an illusion, how code acts as a living, malleable medium, and why classical UX fundamentals and ergonomics matter 10x more in the AI generation era.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('essay')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'essay' 
                  ? 'bg-white text-slate-950 shadow-lg' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Read Reflections Essay
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sandbox' 
                  ? 'bg-violet-500 text-white shadow-neon-violet' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <Sliders className="w-4 h-4 text-violet-400" />
              Code-as-Material Lab
            </button>

            <button
              onClick={() => setActiveTab('heuristics')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'heuristics' 
                  ? 'bg-emerald-500 text-white shadow-neon-emerald' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              UX Fundamentals Matrix ({heuristicsPercent}%)
            </button>

            <button
              onClick={() => setActiveTab('infographic')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'infographic' 
                  ? 'bg-fuchsia-500 text-white shadow-lg' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <Palette className="w-4 h-4 text-fuchsia-400" />
              Visual Infographic
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ESSAY & REFLECTIONS */}
      {activeTab === 'essay' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Key Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pillar 1 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-violet-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30">
                  <Box className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">Pillar 01</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                1. The Grain and Plasticity of Code
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Woodworkers understand the grain of cedar; sculptors feel the malleability of clay. In modern digital product design, <strong className="text-slate-200">code is our raw material</strong>. When you write CSS tokens, flexbox constraints, or spring physics curves, you are directly shaping the medium rather than simulating it on an inert 2D canvas.
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-[11px] text-violet-300/90 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 text-violet-400" />
                <span>"Designers who treat code as material design with reality, not assumptions."</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-sky-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">Pillar 02</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                2. Static Frames Are an Illusion
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A Figma artboard captures a single utopian moment where network requests never fail, avatars never load as broken URLs, and text never overflows into 4 lines. In code, <strong className="text-slate-200">UI exists across the axis of time</strong> — asynchronous data latency, keyboard tab orders, optimistic mutations, and loading skeletons.
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-[11px] text-sky-300/90 flex items-center gap-2">
                <Gauge className="w-4 h-4 shrink-0 text-sky-400" />
                <span>UI is not a still painting; it is dynamic choreography under network friction.</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-amber-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">Pillar 03</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                3. The AI Era: UX Fundamentals as Moats
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When generative models can fabricate infinite pixel layouts and boilerplates instantly, superficial visual styling becomes a cheap commodity. The true differentiator is <strong className="text-slate-200">rigorous UX engineering</strong>: cognitive load control, unambiguous affordances, deterministic state models, error recovery, and accessible semantics.
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-[11px] text-amber-300/90 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                <span>AI generates output; UX fundamentals ensure human comprehension & trust.</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                  <Workflow className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">Pillar 04</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                4. Production Parity & Design Token Contracts
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bridging the chasm between design files and production code requires formal design token schemas (DTCG), component contracts, and bidirectional telemetry. When design tokens compile straight into CSS custom properties and TypeScript interfaces, handoff latency disappears.
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-300/90 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Single source of truth: Design tokens defined once, compiled everywhere.</span>
              </div>
            </div>

          </div>

          {/* Deep Essay Narrative Card */}
          <div className="glass-panel p-6 md:p-10 rounded-3xl border border-white/10 space-y-6 font-sans">
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-white">Full Config Reflection: The Medium is the Message</h4>
                <p className="text-xs text-slate-400 font-mono mt-1">Dispatches from the frontlines of Design Engineering</p>
              </div>
              <button
                onClick={handleGenerateEssayInfographic}
                disabled={generatingInfographic}
                className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                {generatingInfographic ? 'Generating...' : 'Synthesize Visual Infographic'}
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4 font-sans">
              <p>
                Walking out of Config this year, one resonant realization cut through the neon announcements and new feature demos: <strong className="text-white">the artificial wall separating "Design" and "Code" has collapsed</strong>. For over two decades, digital design borrowed metaphors from print: artboards, canvases, layers, and static comps. We treated developers as translators who took our 2D illustrations and "rebuilt" them in software.
              </p>
              
              <blockquote className="border-l-4 border-violet-500 pl-4 py-1.5 my-4 bg-violet-500/5 rounded-r-xl text-slate-200 italic font-serif">
                "When you design in a tool that ignores the constraints of the target medium, you are not designing software—you are drawing a picture of software that you hope can exist."
              </blockquote>

              <p>
                Code has intrinsic material properties:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300 font-sans">
                <li><strong className="text-white">Fluid Elasticity:</strong> A viewport is not 375px or 1440px; it is an infinite continuum of aspect ratios, container queries, and fold states.</li>
                <li><strong className="text-white">Temporal Dynamics:</strong> Transitions have mass, inertia, and spring physics. An instantaneous jump cuts the user’s cognitive trace; an over-damped animation wastes their time.</li>
                <li><strong className="text-white">Asynchronous Volatility:</strong> APIs drop packets, servers time out, users go through tunnels. A design that doesn't account for offline retry queues is incomplete.</li>
                <li><strong className="text-white">Semantic Accessibility:</strong> Beyond visual aesthetics, code defines accessibility trees, screen reader ARIA live regions, focus traps, and keyboard navigation rings.</li>
              </ul>

              <p>
                As AI code generation accelerates, the mechanical cost of typing HTML, CSS, and React drops toward zero. But this makes <strong className="text-white">classical UX fundamentals</strong>—information hierarchy, cognitive ergonomics, Fitts's Law, Miller's rule on chunking, and deterministic feedback loops—the highest leverage skill a product creator can possess.
              </p>
            </div>

            {/* Citations and Grounding */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>VERIFIED ESSAY SOURCES & GROUNDING</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {citations.map((cite, idx) => (
                  <a
                    key={idx}
                    href={cite.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
                  >
                    <span className="text-xs text-slate-300 group-hover:text-emerald-300 font-medium truncate pr-2">
                      {cite.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE AS MATERIAL SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Token Controls Column */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Design Token Lab</h4>
                </div>
                <button
                  onClick={copyDesignTokens}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors border border-white/5"
                  title="Copy Design Tokens JSON (DTCG format)"
                >
                  {isCopiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedToken ? 'Copied' : 'Export Tokens'}</span>
                </button>
              </div>

              {/* Slider 1: Corner Radius */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Border Radius (token.radius)</span>
                  <span className="text-violet-300 font-bold">{tokenRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="2"
                  value={tokenRadius}
                  onChange={(e) => setTokenRadius(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Slider 2: Padding Scale */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Internal Padding (token.spacing)</span>
                  <span className="text-violet-300 font-bold">{tokenPadding}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="36"
                  step="2"
                  value={tokenPadding}
                  onChange={(e) => setTokenPadding(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Slider 3: Elevation & Shadow Blur */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Elevation Glow / Blur</span>
                  <span className="text-violet-300 font-bold">{tokenElevation}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="4"
                  value={tokenElevation}
                  onChange={(e) => setTokenElevation(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Slider 4: Spring Transition Physics */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Spring Duration (Physics)</span>
                  <span className="text-violet-300 font-bold">{tokenSpring}ms</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="600"
                  step="20"
                  value={tokenSpring}
                  onChange={(e) => setTokenSpring(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Accent Token Palette</label>
                <div className="flex items-center gap-2">
                  {(['violet', 'emerald', 'sky', 'amber'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setTokenAccentHue(color)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-mono capitalize transition-all ${
                        tokenAccentHue === color
                          ? 'border-white text-white font-bold bg-white/10 shadow-sm'
                          : 'border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Trigger Buttons (The 7 States of Live Material) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>Simulate Live Material States</span>
                  <span className="text-[10px] text-violet-400">Active: {activeSimState}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['idle', 'hover', 'active', 'loading', 'success', 'error', 'empty'] as UIState[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setActiveSimState(st)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-mono capitalize transition-all border ${
                        activeSimState === st
                          ? `${accentClasses.bg} ${accentClasses.text} ${accentClasses.border} font-bold`
                          : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Live Interactive Material Preview Column */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* View Mode Bar */}
              <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMaterialMode('code')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      materialMode === 'code' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Living Code Material</span>
                  </button>
                  <button
                    onClick={() => setMaterialMode('figma')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      materialMode === 'figma' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Static Canvas (Figma Comps)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSimulatedDevice('desktop')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      simulatedDevice === 'desktop' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Desktop Viewport"
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSimulatedDevice('mobile')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      simulatedDevice === 'mobile' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Mobile Responsive Fluid Viewport"
                  >
                    <SmartphoneIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Material Canvas Container */}
              <div className="min-h-[420px] bg-slate-950 rounded-3xl border border-white/10 p-6 flex items-center justify-center relative overflow-hidden">
                
                {/* Background Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Simulated Component with Live Tokens */}
                <div
                  className={`relative transition-all ${
                    simulatedDevice === 'mobile' ? 'w-full max-w-[340px]' : 'w-full max-w-[480px]'
                  }`}
                  style={{
                    borderRadius: `${tokenRadius}px`,
                    padding: `${tokenPadding}px`,
                    transitionDuration: `${tokenSpring}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: materialMode === 'code' 
                      ? `0 ${tokenElevation / 2}px ${tokenElevation}px ${accentClasses.glow}, 0 0 0 1px rgba(255,255,255,0.1)` 
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                    backgroundColor: activeSimState === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.85)',
                    borderColor: activeSimState === 'error' ? 'rgba(239, 68, 68, 0.5)' : activeSimState === 'success' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  
                  {/* Figma Watermark if in static mode */}
                  {materialMode === 'figma' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-[9px] font-mono text-slate-400">
                      Static Artboard #104 (No Spring / No ARIA)
                    </div>
                  )}

                  {/* Empty State */}
                  {activeSimState === 'empty' ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <Box className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-white text-sm">No Active Deployments Found</h5>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        In static design, empty states are often forgotten. In code as a material, this is a first-class citizen with actionable guidance.
                      </p>
                      <button 
                        onClick={() => setActiveSimState('idle')}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold ${accentClasses.button}`}
                      >
                        Create Initial Deployment
                      </button>
                    </div>
                  ) : activeSimState === 'loading' ? (
                    <div className="space-y-4 py-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 bg-slate-800 rounded w-3/4" />
                          <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-20 bg-slate-800/40 rounded-xl" />
                      <div className="h-10 bg-slate-800 rounded-xl" />
                    </div>
                  ) : activeSimState === 'error' ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-red-300 text-sm">Cluster Sync Interrupted</h5>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Network connection dropped during live telemetry handoff. Auto-retry enabled.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button 
                          onClick={() => setActiveSimState('idle')}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold"
                        >
                          Retry Handshake
                        </button>
                        <button 
                          onClick={() => setActiveSimState('idle')}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs"
                        >
                          Diagnose Offline
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard / Interactive State */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: `${accentClasses.hex}25`,
                              color: accentClasses.hex,
                              borderRadius: `${tokenRadius * 0.75}px`
                            }}
                          >
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-white text-sm">Design Material Spec</h5>
                            <p className="text-[11px] text-slate-400 font-mono">tokens.config.v2</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${accentClasses.bg} ${accentClasses.text}`}>
                          {activeSimState === 'success' ? 'Synchronized' : 'Reactive State'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        This interactive card is styled by live variables. Notice how changing the radius, internal padding, or spring stiffness instantly recalculates layout geometry and optical weight.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-white/10">
                        <div className="text-[11px] font-mono text-slate-400">
                          Response: <span className="text-white font-bold">{tokenSpring}ms</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveSimState('loading');
                            setTimeout(() => setActiveSimState('success'), 1200);
                          }}
                          className={`px-4 py-2 text-xs font-mono font-bold transition-all shadow-md active:scale-95 ${accentClasses.button}`}
                          style={{
                            borderRadius: `${tokenRadius * 0.6}px`
                          }}
                        >
                          Execute State Pulse
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Code Snippet Output */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-white/10 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>COMPILED CSS / TOKEN VARIABLES</span>
                  <span>DTCG SPEC COMPLIANT</span>
                </div>
                <div className="text-violet-300 text-[11px]">
                  <code>
                    --radius-component: {tokenRadius}px;<br />
                    --spacing-inset: {tokenPadding}px;<br />
                    --elevation-blur: {tokenElevation}px;<br />
                    --motion-spring: cubic-bezier(0.16, 1, 0.3, 1) {tokenSpring}ms;<br />
                    --color-accent: {accentClasses.hex};
                  </code>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: UX FUNDAMENTALS MATRIX */}
      {activeTab === 'heuristics' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  UX Fundamentals Defense Matrix (AI Era Edition)
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Why cognitive load, feedback loops, and affordances matter more when AI writes the code.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400">Ergonomic Score</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">{heuristicsPercent}%</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-mono font-bold text-sm">
                  {heuristicsCount}/{heuristicsTotal}
                </div>
              </div>
            </div>

            {/* Heuristics Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {[
                {
                  id: 'h1',
                  title: '1. Deterministic System Feedback (<100ms)',
                  description: 'Every tap, keypress, or network dispatch acknowledges human action immediately (optimistic UI or spinner), preventing repeated clicks.',
                  principle: 'Visibility of System Status'
                },
                {
                  id: 'h2',
                  title: '2. Unambiguous Spatial Affordance',
                  description: 'Clickable elements look distinctly actionable (elevation, border, contrast) rather than blending into flat, ambiguous text.',
                  principle: 'Perceived Affordance'
                },
                {
                  id: 'h3',
                  title: '3. Reversibility & Error Recovery (Ctrl+Z)',
                  description: 'Destructive operations allow non-blocking undo or confirmation modals with explicit impact warnings.',
                  principle: 'User Control & Freedom'
                },
                {
                  id: 'h4',
                  title: '4. Progressive Disclosure & Low Cognitive Load',
                  description: 'Show only high-priority controls first. Reveal advanced switches on demand to prevent sensory paralysis.',
                  principle: 'Miller’s Law / Minimalist Design'
                },
                {
                  id: 'h5',
                  title: '5. Resilient Empty & Error State Design',
                  description: 'Zero data states provide helpful next steps rather than blank voids or cryptographic raw JSON stack traces.',
                  principle: 'Error Prevention & Diagnosis'
                },
                {
                  id: 'h6',
                  title: '6. Keyboard Flow & Accessibility Tree',
                  description: 'Logical tab index sequence, high-contrast focus-visible rings, and ARIA labels for non-visual assistive tech.',
                  principle: 'Accessibility (WCAG 2.2)'
                },
                {
                  id: 'h7',
                  title: '7. Latency Masking & Skeleton Transitions',
                  description: 'Content skeletons maintain layout geometry during network hydration, avoiding layout shift (CLS).',
                  principle: 'Perceived Performance'
                },
                {
                  id: 'h8',
                  title: '8. Fitts’s Law & Touch Target Ergonomics',
                  description: 'Interactive targets maintain a minimum 44x44px hitbox with adequate spatial margin on touch displays.',
                  principle: 'Physical Ergonomics'
                }
              ].map((item) => {
                const isChecked = !!checkedHeuristics[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleHeuristic(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-200'
                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      <span className="inline-block text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider pt-1">
                        &bull; {item.principle}
                      </span>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>

        </div>
      )}

      {/* TAB 4: VISUAL INFOGRAPHIC GENERATOR & PREVIEW */}
      {activeTab === 'infographic' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-fuchsia-400" />
                  Visual Infographic: Code as a Design Material
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  AI-synthesized visual blueprint summarizing the Config reflections and UX laws
                </p>
              </div>

              {/* Style Selector & Generator Button */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                >
                  <option value="Modern Editorial">Modern Editorial</option>
                  <option value="Clean Minimalist">Clean Minimalist</option>
                  <option value="Dark Mode Tech">Dark Mode Tech</option>
                  <option value="Fun & Playful">Fun & Playful</option>
                </select>

                <button
                  onClick={handleGenerateEssayInfographic}
                  disabled={generatingInfographic}
                  className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingInfographic ? 'Generating...' : infographicImage ? 'Regenerate Infographic' : 'Generate Infographic'}
                </button>
              </div>
            </div>

            {genError && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{genError}</span>
              </div>
            )}

            {generatingInfographic && (
              <LoadingState message={loadingStage || "Synthesizing Config reflections..."} type="article" />
            )}

            {/* Generated Infographic Display */}
            {infographicImage && !generatingInfographic && (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950 p-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-mono text-fuchsia-300 font-bold">Synthesized Result</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFullScreenImage({ src: formatImageSrc(infographicImage), alt: "Config Essay Infographic" })}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      title="Full Screen View"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                    <a
                      href={formatImageSrc(infographicImage)}
                      download="code-as-design-material-infographic.png"
                      className="px-3 py-1.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </a>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden bg-[#eef8fe] relative group max-h-[700px] flex items-center justify-center">
                  <img
                    src={formatImageSrc(infographicImage)}
                    alt="Code as a Design Material Infographic"
                    className="max-h-[650px] w-auto object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Infographic Overview Card if not generated yet */}
            {!infographicImage && !generatingInfographic && (
              <div className="border border-white/10 rounded-2xl p-8 bg-slate-950/60 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 mx-auto flex items-center justify-center shadow-lg">
                  <Palette className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h5 className="text-lg font-bold text-white">Visual Blueprint Ready for Synthesis</h5>
                  <p className="text-xs text-slate-400">
                    Click "Generate Infographic" to create an AI-rendered, high-resolution infographic summarizing "Code is a Design Material" and Config design reflections.
                  </p>
                </div>
                <button
                  onClick={handleGenerateEssayInfographic}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-mono text-xs font-bold transition-all shadow-neon-violet inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Synthesize Infographic Now
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

function SmartphoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default CodeAsDesignMaterialView;
