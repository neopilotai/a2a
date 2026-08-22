/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { fetchRepoFileTree } from '../services/githubService';
import { generateInfographic } from '../services/geminiService';
import { buildGraphFromFileTree } from '../services/graphService';
import { loadUserSession, saveRepoAnalyzerSettings } from '../services/storageService';
import { RepoFileTree, ViewMode, RepoHistoryItem, D3Node, DiagramLayoutAlgorithm, RepoTechStackOverview } from '../types';
import { 
  AlertCircle, 
  Loader2, 
  Layers, 
  Box, 
  Boxes,
  Download, 
  Sparkles, 
  Command, 
  Palette, 
  Globe, 
  Clock, 
  Maximize, 
  KeyRound, 
  GitBranch, 
  Compass,
  Info,
  RotateCcw,
  BookOpen,
  Camera,
  GitCompare,
  Zap,
  ArrowUpLeft,
  ArrowDownRight,
  Crosshair,
  Network,
  Cpu,
  Folder,
  FileText,
  Flame
} from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import D3BlueprintViewer, { D3BlueprintViewerRef } from './D3BlueprintViewer';
import D3FlowChart, { D3FlowChartRef } from './D3FlowChart';
import VisualLegend from './VisualLegend';
import { CodeEvolutionViewer } from './evolution/CodeEvolutionViewer';
import { analyzeRepoTechStack } from '../services/techStackDetector';
import { RepoTechStackExplorer } from './RepoTechStackExplorer';
import { ReadmeGenerator } from './ReadmeGenerator';
import { ExportBlueprintModal } from './ExportBlueprintModal';
import { generateBlueprintSvg, generateBlueprintPng, downloadBlob } from '../services/blueprintExportService';
import { calculateFileImpact, calculateMultipleFilesImpact } from '../services/fileImpactService';
import { FileImpactFactorCard } from './FileImpactFactorCard';

interface RepoAnalyzerProps {
  onNavigate: (mode: ViewMode, data?: any) => void;
  history: RepoHistoryItem[];
  onAddToHistory: (item: RepoHistoryItem) => void;
  onSelectRepoForContext?: (repoName: string, fileTree: RepoFileTree[]) => void;
}

const FLOW_STYLES = [
  "Modern Data Flow",
  "Hand-Drawn Blueprint",
  "Corporate Minimal",
  "Neon Cyberpunk",
  "Custom"
];

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Arabic (Egypt)", value: "Arabic" },
  { label: "German (Germany)", value: "German" },
  { label: "Spanish (Mexico)", value: "Spanish" },
  { label: "French (France)", value: "French" },
  { label: "Hindi (India)", value: "Hindi" },
  { label: "Indonesian (Indonesia)", value: "Indonesian" },
  { label: "Italian (Italy)", value: "Italian" },
  { label: "Japanese (Japan)", value: "Japanese" },
  { label: "Korean (South Korea)", value: "Korean" },
  { label: "Portuguese (Brazil)", value: "Portuguese" },
  { label: "Russian (Russia)", value: "Russian" },
  { label: "Ukrainian (Ukraine)", value: "Ukrainian" },
  { label: "Vietnamese (Vietnam)", value: "Vietnamese" },
  { label: "Chinese (China)", value: "Chinese" },
];

enum BlueprintTab {
  TECH_STACK = 'TECH_STACK',
  BLUEPRINT_2D = 'BLUEPRINT_2D',
  LIVE_GRAPH = 'LIVE_GRAPH',
  README_GEN = 'README_GEN',
  EVOLUTION = 'EVOLUTION',
  MODEL_3D = 'MODEL_3D'
}

const RepoAnalyzer: React.FC<RepoAnalyzerProps> = ({ 
  onNavigate, 
  history, 
  onAddToHistory,
  onSelectRepoForContext
}) => {
  const savedSettings = loadUserSession()?.repoAnalyzerSettings;

  const [repoInput, setRepoInput] = useState(savedSettings?.repoInput || '');
  const [selectedStyle, setSelectedStyle] = useState(savedSettings?.selectedStyle || FLOW_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(savedSettings?.selectedLanguage || LANGUAGES[0].value);
  const [customStyle, setCustomStyle] = useState(savedSettings?.customStyle || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  
  // Infographic & Graph State
  const [infographicData, setInfographicData] = useState<string | null>(null);
  const [infographic3DData, setInfographic3DData] = useState<string | null>(null);
  const [generating3D, setGenerating3D] = useState(false);
  const [currentFileTree, setCurrentFileTree] = useState<RepoFileTree[] | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<BlueprintTab>(BlueprintTab.BLUEPRINT_2D);
  const [graphLayoutAlgorithm, setGraphLayoutAlgorithm] = useState<DiagramLayoutAlgorithm>('modular-force');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [selectedGraphNode, setSelectedGraphNode] = useState<D3Node | null>(null);
  const [selectedGraphNodes, setSelectedGraphNodes] = useState<D3Node[]>([]);
  const [activeTraceNode, setActiveTraceNode] = useState<D3Node | null>(null);
  const [activeTraceInfo, setActiveTraceInfo] = useState<{ incoming: D3Node[]; outgoing: D3Node[] } | null>(null);
  const [focusFileSearchQuery, setFocusFileSearchQuery] = useState<string>('');
  const [isFocusSearchOpen, setIsFocusSearchOpen] = useState<boolean>(false);
  const [showImpactOverlay, setShowImpactOverlay] = useState<boolean>(true);
  
  // Fullscreen Viewer State
  const [fullScreenImage, setFullScreenImage] = useState<{ src: string; alt: string } | null>(null);

  // Architecture Blueprint Export Modal State
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    imageSrc?: string;
    svgElement?: SVGSVGElement | null;
    blueprintType: '2d_blueprint' | 'live_graph' | 'diff_blueprint' | '3d_hologram';
  }>({
    isOpen: false,
    blueprintType: '2d_blueprint',
  });

  // Compute Automated Tech Stack Detection overview
  const repoTechOverview = useMemo(() => {
    if (!currentFileTree || currentFileTree.length === 0) return null;
    return analyzeRepoTechStack(currentRepoName, currentFileTree);
  }, [currentRepoName, currentFileTree]);

  // Detected tech stack string list for exports
  const detectedTechList = useMemo(() => {
    if (!repoTechOverview) return [];
    const techNames = repoTechOverview.globalTechs.map((t) => t.name);
    if (repoTechOverview.dominantLanguage && !techNames.includes(repoTechOverview.dominantLanguage)) {
      techNames.push(repoTechOverview.dominantLanguage);
    }
    return techNames;
  }, [repoTechOverview]);

  // Open Blueprint Export Studio Modal
  const handleOpenExportModal = (type: '2d_blueprint' | 'live_graph' | 'diff_blueprint' | '3d_hologram' = '2d_blueprint') => {
    let img: string | undefined;
    let svgEl: SVGSVGElement | null = null;

    if (type === '2d_blueprint') {
      img = infographicData ? `data:image/png;base64,${infographicData}` : undefined;
      svgEl = blueprintViewerRef.current?.getSvgElement?.() || null;
    } else if (type === 'live_graph') {
      svgEl = flowChartRef.current?.getSvgElement() || null;
    } else if (type === '3d_hologram') {
      img = infographic3DData ? `data:image/png;base64,${infographic3DData}` : undefined;
    }

    setExportModalState({
      isOpen: true,
      imageSrc: img,
      svgElement: svgEl,
      blueprintType: type,
    });
  };

  // Quick 1-Click SVG Export
  const handleQuickExportSvg = async (type: '2d_blueprint' | 'live_graph' | '3d_hologram' = '2d_blueprint') => {
    try {
      let img: string | undefined;
      let svgEl: SVGSVGElement | null = null;

      if (type === '2d_blueprint') {
        img = infographicData ? `data:image/png;base64,${infographicData}` : undefined;
      } else if (type === 'live_graph') {
        svgEl = flowChartRef.current?.getSvgElement() || null;
      } else if (type === '3d_hologram') {
        img = infographic3DData ? `data:image/png;base64,${infographic3DData}` : undefined;
      }

      const res = await generateBlueprintSvg(img, svgEl, {
        repoName: currentRepoName || 'Repository',
        title: `${currentRepoName || 'Repository'} — Architecture Blueprint`,
        subtitle:
          type === 'live_graph'
            ? 'Interactive D3 Module Dependency Topology'
            : type === '3d_hologram'
            ? 'Isometric Holographic Architecture Tabletop Model'
            : 'Architectural Topology & Technical Component Flow',
        theme: 'dark',
        includeHeader: true,
        includeLegend: true,
        includeTechBadges: true,
        techStack: detectedTechList,
        totalFiles: currentFileTree?.length,
        totalNodes: liveGraphData?.nodes.length,
        totalLinks: liveGraphData?.links.length,
        sourceType: type,
      });
      downloadBlob(res.blob, res.filename);
    } catch (err) {
      console.error('Quick SVG Export Error:', err);
      handleOpenExportModal(type);
    }
  };

  // Quick 1-Click PNG Export
  const handleQuickExportPng = async (type: '2d_blueprint' | 'live_graph' | '3d_hologram' = '2d_blueprint') => {
    try {
      let img: string | undefined;
      let svgEl: SVGSVGElement | null = null;

      if (type === '2d_blueprint') {
        img = infographicData ? `data:image/png;base64,${infographicData}` : undefined;
      } else if (type === 'live_graph') {
        svgEl = flowChartRef.current?.getSvgElement() || null;
      } else if (type === '3d_hologram') {
        img = infographic3DData ? `data:image/png;base64,${infographic3DData}` : undefined;
      }

      const res = await generateBlueprintPng(img, svgEl, {
        repoName: currentRepoName || 'Repository',
        scale: 2,
        title: `${currentRepoName || 'Repository'} — Architecture Blueprint`,
        subtitle:
          type === 'live_graph'
            ? 'Interactive D3 Module Dependency Topology'
            : type === '3d_hologram'
            ? 'Isometric Holographic Architecture Tabletop Model'
            : 'Architectural Topology & Technical Component Flow',
        theme: 'dark',
        includeHeader: true,
        includeLegend: true,
        includeTechBadges: true,
        techStack: detectedTechList,
        totalFiles: currentFileTree?.length,
        totalNodes: liveGraphData?.nodes.length,
        totalLinks: liveGraphData?.links.length,
        sourceType: type,
      });
      downloadBlob(res.blob, res.filename);
    } catch (err) {
      console.error('Quick PNG Export Error:', err);
      handleOpenExportModal(type);
    }
  };

  // Auto-save RepoAnalyzer tool settings
  useEffect(() => {
    saveRepoAnalyzerSettings({
      repoInput,
      selectedStyle,
      selectedLanguage,
      customStyle
    });
  }, [repoInput, selectedStyle, selectedLanguage, customStyle]);

  // Viewport Refs for Direct Control
  const blueprintViewerRef = useRef<D3BlueprintViewerRef>(null);
  const flowChartRef = useRef<D3FlowChartRef>(null);

  // Compute D3 live graph from file tree
  const liveGraphData = useMemo(() => {
    if (!currentFileTree || currentFileTree.length === 0) return null;
    return buildGraphFromFileTree(currentRepoName, currentFileTree);
  }, [currentRepoName, currentFileTree]);

  // Compute real-time architectural impact analysis for selected / focal node in Focus Mode
  const activeFileImpact = useMemo(() => {
    if (!liveGraphData) return null;
    if (selectedGraphNodes.length > 1) {
      return calculateMultipleFilesImpact(selectedGraphNodes, liveGraphData);
    }
    const focal = selectedGraphNode || activeTraceNode;
    if (!focal) return null;
    return calculateFileImpact(focal, liveGraphData);
  }, [selectedGraphNodes, selectedGraphNode, activeTraceNode, liveGraphData]);

  const parseRepoInput = (input: string): { owner: string; repo: string } | null => {
    const cleanInput = input.trim().replace(/\/$/, '');
    try {
      const url = new URL(cleanInput);
      if (url.hostname === 'github.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
      }
    } catch (e) {}
    const parts = cleanInput.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) return { owner: parts[0], repo: parts[1] };
    return null;
  };

  const addToHistory = (repoName: string, imageData: string, is3D: boolean, style: string) => {
    const newItem: RepoHistoryItem = {
      id: Date.now().toString(),
      repoName,
      imageData,
      is3D,
      style,
      date: new Date()
    };
    onAddToHistory(newItem);
  };

  const handleApiError = (err: any) => {
    console.error("Gemini API Error:", err);
    setError(err?.message || 'An unexpected error occurred during analysis. Please check your Gemini API key and network connection.');
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfographicData(null);
    setInfographic3DData(null);
    setCurrentFileTree(null);
    setSelectedGraphNode(null);

    const repoDetails = parseRepoInput(repoInput);
    if (!repoDetails) {
      setError('Invalid format. Use "owner/repo" or a full GitHub URL.');
      return;
    }

    setLoading(true);
    setCurrentRepoName(repoDetails.repo);
    try {
      setLoadingStage('CONNECTING TO GITHUB');
      const fileTree = await fetchRepoFileTree(repoDetails.owner, repoDetails.repo);

      if (fileTree.length === 0) throw new Error('No relevant code files found in this repository.');
      setCurrentFileTree(fileTree);
      if (onSelectRepoForContext) {
        onSelectRepoForContext(repoDetails.repo, fileTree);
      }

      setLoadingStage('ANALYZING STRUCTURE & GENERATING');
      
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;

      const infographicBase64 = await generateInfographic(repoDetails.repo, fileTree, styleToUse, false, selectedLanguage);
      
      if (infographicBase64) {
        setInfographicData(infographicBase64);
        setActiveTab(BlueprintTab.BLUEPRINT_2D);
        addToHistory(repoDetails.repo, infographicBase64, false, styleToUse);
      } else {
        throw new Error("Failed to generate visual blueprint.");
      }

    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleGenerate3D = async () => {
    if (!currentFileTree || !currentRepoName) return;
    setGenerating3D(true);
    try {
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      const data = await generateInfographic(currentRepoName, currentFileTree, styleToUse, true, selectedLanguage);
      if (data) {
        setInfographic3DData(data);
        setActiveTab(BlueprintTab.MODEL_3D);
        addToHistory(currentRepoName, data, true, styleToUse);
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setGenerating3D(false);
    }
  };

  const loadFromHistory = (item: RepoHistoryItem) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentRepoName(item.repoName);
    if (item.is3D) {
      setInfographic3DData(item.imageData);
      setActiveTab(BlueprintTab.MODEL_3D);
    } else {
      setInfographicData(item.imageData);
      setInfographic3DData(null);
      setActiveTab(BlueprintTab.BLUEPRINT_2D);
    }
  };

  return (
    <div className="repo-analyzer-container max-w-6xl mx-auto space-y-8 pb-16" id="repo-analyzer-view-container">
      
      {/* Fullscreen D3 Inspector Modal */}
      {fullScreenImage && (
        <ImageViewer 
          src={fullScreenImage.src} 
          alt={fullScreenImage.alt} 
          onClose={() => setFullScreenImage(null)} 
        />
      )}

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 font-sans leading-tight">
          Codebase <span className="text-violet-400">Intelligence</span>.
        </h2>
        <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide">
          Turn any repository into an interactive architectural blueprint with D3-powered zooming and panning.
        </p>
      </div>

      {/* Input Section */}
      <div className="max-w-xl mx-auto relative z-10">
        <form onSubmit={handleAnalyze} className="glass-panel rounded-2xl p-2 transition-all focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50">
          <div className="flex items-center">
            <div className="pl-3 text-slate-500">
              <Command className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repository"
              className="w-full bg-transparent border-none text-white placeholder:text-slate-600 focus:ring-0 text-lg px-4 py-2 font-mono"
            />
            <div className="pr-2">
              <button
                type="submit"
                disabled={loading || !repoInput.trim()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white/10 font-mono text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "RUN_ANALYSIS"}
              </button>
            </div>
          </div>

          {/* Controls: Style and Language */}
          <div className="mt-2 pt-2 border-t border-white/5 px-3 pb-1 space-y-3">
            {/* Style Selector */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] uppercase tracking-wider shrink-0">
                <Palette className="w-3 h-3" /> Style:
              </div>
              <div className="flex gap-2">
                {FLOW_STYLES.map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-all whitespace-nowrap ${
                      selectedStyle === style 
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                        : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
             
            {/* Language Selector & Custom Style Input */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-lg px-2 py-1 shrink-0 min-w-0 max-w-full">
                <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-300 focus:ring-0 p-0 font-mono cursor-pointer min-w-0 flex-1 truncate"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-300">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStyle === 'Custom' && (
                <input 
                  type="text" 
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="Custom style..."
                  className="flex-1 min-w-[120px] bg-slate-950/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 font-mono transition-all"
                />
              )}
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto p-4 glass-panel border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 font-mono text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p className="flex-1">{error}</p>
          {error.includes("Required") && (
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" /> SWITCH KEY
            </button>
          )}
        </div>
      )}

      {loading && (
        <LoadingState message={loadingStage} type="repo" />
      )}

      {/* Blueprint Visualizer Dashboard with D3 Zoom & Pan */}
      {(infographicData || currentFileTree) && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
          
          {/* Blueprint Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 glass-panel rounded-2xl">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-white/5 flex-wrap">
              {repoTechOverview && (
                <button
                  onClick={() => setActiveTab(BlueprintTab.TECH_STACK)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                    activeTab === BlueprintTab.TECH_STACK
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  id="repo-analyzer-tech-stack-tab-btn"
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>Folder Tech Stack</span>
                  {repoTechOverview.primaryFramework && (
                    <span 
                      style={{ color: repoTechOverview.primaryFramework.color }}
                      className="px-1.5 py-0.2 rounded text-[9px] font-bold border border-white/10 bg-white/5 hidden sm:inline"
                    >
                      {repoTechOverview.primaryFramework.icon} {repoTechOverview.primaryFramework.badgeLabel}
                    </span>
                  )}
                </button>
              )}

              {infographicData && (
                <button
                  onClick={() => setActiveTab(BlueprintTab.BLUEPRINT_2D)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                    activeTab === BlueprintTab.BLUEPRINT_2D
                      ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-violet-400" />
                  <span>2D Blueprint</span>
                </button>
              )}

              {liveGraphData && (
                <button
                  onClick={() => setActiveTab(BlueprintTab.LIVE_GRAPH)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                    activeTab === BlueprintTab.LIVE_GRAPH
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                  <span>Interactive D3 Graph</span>
                </button>
              )}

              {currentFileTree && (
                <button
                  onClick={() => setActiveTab(BlueprintTab.README_GEN)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                    activeTab === BlueprintTab.README_GEN
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Generate README</span>
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold border border-amber-500/30">
                    MD
                  </span>
                </button>
              )}

              {currentFileTree && (
                <button
                  onClick={() => setActiveTab(BlueprintTab.EVOLUTION)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                    activeTab === BlueprintTab.EVOLUTION
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  id="tab-compare-blueprints-btn"
                >
                  <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compare Blueprints</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-bold border border-emerald-500/30">
                    DIFF
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab(BlueprintTab.MODEL_3D)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
                  activeTab === BlueprintTab.MODEL_3D
                    ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>3D Hologram</span>
              </button>
            </div>

            {/* Top Action Buttons: Export Architecture Blueprint & D3 Indicator */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  let targetType: '2d_blueprint' | 'live_graph' | '3d_hologram' = '2d_blueprint';
                  if (activeTab === BlueprintTab.LIVE_GRAPH) targetType = 'live_graph';
                  else if (activeTab === BlueprintTab.MODEL_3D) targetType = '3d_hologram';
                  handleOpenExportModal(targetType);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 border border-violet-500/40 text-violet-200 hover:text-white font-mono text-xs font-bold transition-all shadow-sm hover:shadow-neon-violet"
                title="Export Architecture Blueprint as SVG / PNG for Documentation & Readmes"
                id="repo-analyzer-export-blueprint-top-btn"
              >
                <Download className="w-3.5 h-3.5 text-violet-300" />
                <span>Export Blueprint</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  SVG / PNG
                </span>
              </button>

              {/* D3 Zooming & Panning Interactive Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[11px] font-mono text-slate-400">
                <Compass className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                <span>D3 Interactive Viewport</span>
              </div>
            </div>
          </div>

          {/* Active Blueprint Viewport */}
          <div className="glass-panel rounded-3xl p-2 md:p-3">

            {/* TAB 0: AUTOMATED REPOSITORY FOLDERS TECH STACK EXPLORER */}
            {activeTab === BlueprintTab.TECH_STACK && repoTechOverview && (
              <div className="space-y-4 p-2 md:p-4 animate-in fade-in duration-300">
                <RepoTechStackExplorer
                  techOverview={repoTechOverview}
                  repoName={currentRepoName}
                  onFocusNodeInGraph={(nodeOrFolder) => {
                    setActiveTab(BlueprintTab.LIVE_GRAPH);
                    setTimeout(() => {
                      const match = liveGraphData?.nodes.find(n => 
                        n.label.toLowerCase().includes(nodeOrFolder.toLowerCase()) ||
                        n.folder?.toLowerCase().includes(nodeOrFolder.toLowerCase())
                      );
                      if (match) {
                        setSelectedGraphNode(match);
                        flowChartRef.current?.focusNode(match.id);
                      }
                    }, 200);
                  }}
                />
              </div>
            )}
            
            {/* TAB 1: 2D ARCHITECTURAL BLUEPRINT WITH D3 ZOOM & PAN */}
            {activeTab === BlueprintTab.BLUEPRINT_2D && infographicData && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="px-4 py-2 flex flex-wrap items-center justify-between border-b border-white/5 gap-2">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      {currentRepoName}_Blueprint.svg
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      D3 Zoom & Pan
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => blueprintViewerRef.current?.resetView(true)}
                      className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors font-mono bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 border border-white/10"
                      title="Reset View: Default Center & Scale 1"
                      id="repo-analyzer-reset-view-blueprint-btn"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
                      <span>Reset View</span>
                    </button>
                    <button 
                      onClick={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: `${currentRepoName} 2D Blueprint` })}
                      className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-mono p-1.5 rounded-lg hover:bg-white/10"
                      title="Fullscreen D3 Inspector"
                    >
                      <Maximize className="w-4 h-4" />
                      <span className="hidden sm:inline">Fullscreen</span>
                    </button>
                    <button 
                      onClick={() => handleQuickExportSvg('2d_blueprint')}
                      className="text-xs flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors font-mono bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 font-semibold"
                      title="Quick Save as Standalone Vector SVG"
                      id="repo-analyzer-quick-svg-2d-btn"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SVG</span>
                    </button>
                    <button 
                      onClick={() => handleQuickExportPng('2d_blueprint')}
                      className="text-xs flex items-center gap-1.5 text-sky-300 hover:text-white transition-colors font-mono bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-500/30 font-semibold"
                      title="Quick Save as High-Res 2x PNG"
                      id="repo-analyzer-quick-png-2d-btn"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>PNG</span>
                    </button>
                    <button
                      onClick={() => handleOpenExportModal('2d_blueprint')}
                      className="text-xs flex items-center gap-1.5 text-violet-200 hover:text-white transition-all font-mono bg-violet-600/30 hover:bg-violet-600/50 px-3 py-1.5 rounded-lg border border-violet-500/40 font-bold shadow-sm hover:shadow-neon-violet"
                      title="Open Blueprint Export Studio with Themes, Resolutions & Markdown Snippets"
                      id="repo-analyzer-export-modal-2d-btn"
                    >
                      <Download className="w-3.5 h-3.5 text-violet-300" />
                      <span>Export Studio</span>
                    </button>
                  </div>
                </div>

                {/* D3 Zoom & Pan Canvas */}
                <div className="h-[560px] md:h-[620px] w-full relative rounded-2xl overflow-hidden">
                  <div className="absolute top-3 left-3 z-30">
                    <VisualLegend defaultExpanded={false} />
                  </div>
                  <D3BlueprintViewer
                    ref={blueprintViewerRef}
                    imageSrc={`data:image/png;base64,${infographicData}`}
                    alt={`${currentRepoName} Blueprint`}
                    minHeight="100%"
                    onExpandFullScreen={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: `${currentRepoName} 2D Blueprint` })}
                    onExport={() => handleOpenExportModal('2d_blueprint')}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: LIVE INTERACTIVE D3 ARCHITECTURE GRAPH */}
            {activeTab === BlueprintTab.LIVE_GRAPH && liveGraphData && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-white/5 gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <GitBranch className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Live_Architecture_Graph
                    </h3>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                      graphLayoutAlgorithm === 'modular-force'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-semibold'
                        : graphLayoutAlgorithm === 'hierarchical'
                        ? 'bg-violet-500/15 text-violet-300 border-violet-500/30 font-semibold'
                        : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                    }`}>
                      {graphLayoutAlgorithm === 'modular-force' && <Boxes className="w-3 h-3 text-cyan-400" />}
                      {graphLayoutAlgorithm === 'hierarchical' && <Layers className="w-3 h-3 text-violet-400" />}
                      {graphLayoutAlgorithm === 'force' && <Network className="w-3 h-3 text-sky-400" />}
                      <span>
                        {graphLayoutAlgorithm === 'modular-force' 
                          ? 'Modular Clusters (Auto-Grouped Force)' 
                          : graphLayoutAlgorithm === 'hierarchical' 
                          ? 'Hierarchical (7-Tier Architectural Map)' 
                          : 'D3 Force Physics'}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Layout Algorithm Segmented Switcher (3-Way: Modular Clusters / Force Physics / Hierarchical) */}
                    <div 
                      className="flex items-center p-0.5 bg-slate-900/90 rounded-xl border border-white/10 shadow-md font-mono text-xs"
                      role="group"
                      aria-label="Graph Layout Algorithm"
                    >
                      <button
                        onClick={() => {
                          setGraphLayoutAlgorithm('modular-force');
                          flowChartRef.current?.setLayoutAlgorithm?.('modular-force');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
                          graphLayoutAlgorithm === 'modular-force'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title="Switch to Auto-Detected Architectural Module Clusters with Convex Enclosures (Press L in diagram)"
                        id="repo-analyzer-modular-layout-btn"
                      >
                        <Boxes className={`w-3.5 h-3.5 ${graphLayoutAlgorithm === 'modular-force' ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>Modular Clusters</span>
                      </button>

                      <button
                        onClick={() => {
                          setGraphLayoutAlgorithm('force');
                          flowChartRef.current?.setLayoutAlgorithm?.('force');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
                          graphLayoutAlgorithm === 'force'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title="Switch to Force-Directed Physics Simulation (Press L in diagram)"
                        id="repo-analyzer-force-layout-btn"
                      >
                        <Network className={`w-3.5 h-3.5 ${graphLayoutAlgorithm === 'force' ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span>Force Physics</span>
                      </button>

                      <button
                        onClick={() => {
                          setGraphLayoutAlgorithm('hierarchical');
                          flowChartRef.current?.setLayoutAlgorithm?.('hierarchical');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
                          graphLayoutAlgorithm === 'hierarchical'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title="Switch to Hierarchical Architectural Tiers (Press L in diagram)"
                        id="repo-analyzer-hierarchical-layout-btn"
                      >
                        <Layers className={`w-3.5 h-3.5 ${graphLayoutAlgorithm === 'hierarchical' ? 'text-violet-400' : 'text-slate-400'}`} />
                        <span>Hierarchical</span>
                      </button>
                    </div>

                    {/* Focus Mode 1st-Degree Isolation Toggle */}
                    <button
                      onClick={() => {
                        const next = !isFocusMode;
                        setIsFocusMode(next);
                        flowChartRef.current?.setFocusMode?.(next);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all text-xs font-mono font-bold border shadow-sm ${
                        isFocusMode
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/5'
                      }`}
                      title="Toggle Focus Mode: Grays out all modules except selected & 1st-degree neighbors (Press F)"
                      id="repo-analyzer-focus-mode-btn"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isFocusMode ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                      <span>Focus Mode</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isFocusMode ? 'bg-emerald-500/30 text-emerald-200 font-extrabold' : 'bg-white/10 text-slate-500'
                      }`}>
                        {isFocusMode ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button 
                      onClick={() => flowChartRef.current?.resetView()}
                      className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors font-mono bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 border border-white/10"
                      title="Reset View: Default Center & Scale 1"
                      id="repo-analyzer-reset-view-graph-btn"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Reset View</span>
                    </button>

                    <button 
                      onClick={() => handleQuickExportSvg('live_graph')}
                      className="text-xs flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors font-mono bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 font-semibold"
                      title="Quick Save Graph as Standalone Vector SVG"
                      id="repo-analyzer-quick-svg-graph-btn"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SVG</span>
                    </button>

                    <button 
                      onClick={() => handleQuickExportPng('live_graph')}
                      className="text-xs flex items-center gap-1.5 text-sky-300 hover:text-white transition-colors font-mono bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-500/30 font-semibold"
                      title="Quick Save Graph as High-Res 2x PNG"
                      id="repo-analyzer-quick-png-graph-btn"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>PNG</span>
                    </button>

                    <button
                      onClick={() => handleOpenExportModal('live_graph')}
                      className="text-xs flex items-center gap-1.5 text-violet-200 hover:text-white transition-all font-mono bg-violet-600/30 hover:bg-violet-600/50 px-3 py-1.5 rounded-lg border border-violet-500/40 font-bold shadow-sm hover:shadow-neon-violet"
                      title="Export Blueprint / Snapshot with Themes, Custom Headers & Badges"
                      id="repo-analyzer-take-snapshot-graph-btn"
                    >
                      <Camera className="w-3.5 h-3.5 text-violet-300" />
                      <span>Export Blueprint</span>
                    </button>

                    <div className="text-xs font-mono text-slate-400 hidden lg:block">
                      {liveGraphData.nodes.length} Nodes • {liveGraphData.links.length} Links
                    </div>
                  </div>
                </div>

                {/* Auto-Detected Architectural Decomposition & Cluster Filter Bar */}
                {liveGraphData.decomposition && (
                  <div className="px-4 py-2 bg-slate-900/60 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-xl text-cyan-300 font-bold">
                        <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{liveGraphData.decomposition.patternName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {liveGraphData.decomposition.modules.length} Logical Modules Detected • Cohesion: {liveGraphData.decomposition.cohesionRating} • Coupling: {liveGraphData.decomposition.couplingRating}
                      </span>
                    </div>

                    {/* Quick Module Filter / Focus Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Clusters:</span>
                      {liveGraphData.decomposition.modules.map(mod => (
                        <button
                          key={mod.id}
                          onClick={() => {
                            // Focus on first node of module
                            const firstMember = liveGraphData.nodes.find(n => n.moduleId === mod.id);
                            if (firstMember) {
                              setSelectedGraphNode(firstMember);
                              flowChartRef.current?.focusNode(firstMember.id);
                            }
                          }}
                          style={{
                            borderColor: `${mod.color}50`,
                            backgroundColor: `${mod.color}15`,
                            color: mod.color
                          }}
                          className="px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold hover:brightness-125 transition-all flex items-center gap-1"
                          title={`Module: ${mod.name} (${mod.fileCount} components, ${mod.folderPaths.join(', ') || 'root'})`}
                        >
                          <span>{mod.icon}</span>
                          <span>{mod.name}</span>
                          <span className="opacity-70 text-[9px]">({mod.fileCount})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Architectural Focus Mode Controller Bar */}
                <div className={`p-3 rounded-2xl border transition-all font-mono text-xs ${
                  isFocusMode 
                    ? 'bg-slate-900/95 border-emerald-500/40 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/20' 
                    : 'bg-slate-900/50 border-white/5'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    {/* Left: Focus Mode Toggle & Quick File Search Selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const next = !isFocusMode;
                          setIsFocusMode(next);
                          flowChartRef.current?.setFocusMode?.(next);
                          if (next && (selectedGraphNode || activeTraceNode)) {
                            flowChartRef.current?.focusNeighborhood?.((selectedGraphNode || activeTraceNode)!.id);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border ${
                          isFocusMode
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/10'
                        }`}
                        title="Toggle Interactive Focus Mode (Press F) - Isolates selected file and its direct 1st-degree dependencies"
                        id="architectural-focus-mode-toggle"
                      >
                        <Crosshair className={`w-3.5 h-3.5 ${isFocusMode ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                        <span>Focus Mode</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                          isFocusMode ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-slate-500'
                        }`}>
                          {isFocusMode ? 'ACTIVE' : 'OFF'}
                        </span>
                      </button>

                      {/* File Selector Combobox */}
                      <div className="relative">
                        <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
                          <Compass className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                          <input
                            type="text"
                            placeholder="Isolate specific file in graph..."
                            value={focusFileSearchQuery}
                            onChange={(e) => {
                              setFocusFileSearchQuery(e.target.value);
                              setIsFocusSearchOpen(true);
                            }}
                            onFocus={() => setIsFocusSearchOpen(true)}
                            className="bg-transparent border-none p-0 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 w-48 sm:w-60"
                          />
                          {focusFileSearchQuery && (
                            <button
                              onClick={() => {
                                setFocusFileSearchQuery('');
                                setIsFocusSearchOpen(false);
                              }}
                              className="text-slate-400 hover:text-white p-0.5 ml-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Dropdown Suggestions */}
                        {isFocusSearchOpen && (
                          <div className="absolute top-full left-0 mt-1 w-72 max-h-56 overflow-y-auto bg-slate-950/95 border border-white/15 rounded-xl shadow-2xl z-40 p-1 divide-y divide-white/5 backdrop-blur-xl">
                            {liveGraphData.nodes
                              .filter(n => 
                                !focusFileSearchQuery || 
                                n.label.toLowerCase().includes(focusFileSearchQuery.toLowerCase()) ||
                                (n.folder && n.folder.toLowerCase().includes(focusFileSearchQuery.toLowerCase()))
                              )
                              .slice(0, 10)
                              .map(node => (
                                <button
                                  key={node.id}
                                  onClick={() => {
                                    setIsFocusMode(true);
                                    setSelectedGraphNode(node);
                                    flowChartRef.current?.setFocusMode?.(true);
                                    flowChartRef.current?.setFocalNode?.(node.id);
                                    flowChartRef.current?.focusNeighborhood?.(node.id);
                                    setIsFocusSearchOpen(false);
                                    setFocusFileSearchQuery('');
                                  }}
                                  className="w-full text-left p-2 hover:bg-emerald-500/10 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors group"
                                >
                                  <div className="min-w-0">
                                    <div className="text-slate-200 group-hover:text-emerald-300 font-bold truncate">
                                      {node.label}
                                    </div>
                                    {node.folder && (
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {node.folder}
                                      </div>
                                    )}
                                  </div>
                                  {node.techBadge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10 shrink-0 font-semibold">
                                      {node.techBadge}
                                    </span>
                                  )}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Entry Point Isolation Shortcuts */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
                        Quick Isolate:
                      </span>
                      {liveGraphData.nodes.slice(0, 4).map(n => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setIsFocusMode(true);
                            setSelectedGraphNode(n);
                            flowChartRef.current?.setFocusMode?.(true);
                            flowChartRef.current?.setFocalNode?.(n.id);
                            flowChartRef.current?.focusNeighborhood?.(n.id);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-200 text-slate-300 border border-white/10 text-[10px] font-semibold transition-colors"
                          title={`Isolate ${n.label} and direct dependencies`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Focus Mode Neighborhood Detail Status with Impact Factor */}
                  {isFocusMode && (selectedGraphNodes.length > 0 || selectedGraphNode || activeTraceNode) && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                          <Crosshair className="w-3 h-3 text-emerald-400 animate-pulse" />
                          {selectedGraphNodes.length > 1 ? 'GROUP SELECTION:' : 'ISOLATING:'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-bold">
                          {selectedGraphNodes.length > 1 
                            ? `${selectedGraphNodes.length} Files` 
                            : (selectedGraphNode || activeTraceNode)?.label}
                        </span>

                        {activeFileImpact && (
                          <span 
                            style={{ borderColor: `${activeFileImpact.impactColor}50`, backgroundColor: `${activeFileImpact.impactColor}15` }}
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1"
                          >
                            <Flame className="w-3 h-3" style={{ color: activeFileImpact.impactColor }} />
                            <span style={{ color: activeFileImpact.impactColor }}>
                              Impact: {activeFileImpact.impactScore}/100 ({activeFileImpact.impactLevel.toUpperCase()})
                            </span>
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400">
                          {activeFileImpact ? (
                            <span>
                              <span className="text-cyan-300 font-semibold">▲ {activeFileImpact.totalConsumingComponents} Callers ({activeFileImpact.directConsumingCount} direct)</span> • <span className="text-amber-300 font-semibold">▼ {activeFileImpact.totalDownstreamLoc.toLocaleString()} Downstream LOC</span> ({activeFileImpact.totalDownstreamNodes} deps)
                            </span>
                          ) : activeTraceInfo ? (
                            <span>
                              <span className="text-cyan-300 font-semibold">▲ {activeTraceInfo.incoming.length} Callers</span> • <span className="text-amber-300 font-semibold">▼ {activeTraceInfo.outgoing.length} Dependencies</span> • Rest of graph dimmed
                            </span>
                          ) : (
                            'Direct 1st-degree dependencies isolated • Rest of graph dimmed'
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {activeFileImpact && (
                          <button
                            onClick={() => setShowImpactOverlay(prev => !prev)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                              showImpactOverlay 
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                            }`}
                            title="Toggle Floating Impact Factor Overlay Card"
                            id="toggle-impact-factor-card-btn"
                          >
                            <Flame className="w-3 h-3 text-cyan-400" />
                            <span>{showImpactOverlay ? 'Impact Card (Active)' : 'Show Impact Card'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const focalId = (selectedGraphNode || activeTraceNode)?.id;
                            if (focalId) flowChartRef.current?.focusNeighborhood?.(focalId);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Center and fit isolated file and all direct neighbors into viewport"
                        >
                          <Crosshair className="w-3 h-3 text-emerald-400" />
                          <span>Center Neighborhood</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsFocusMode(false);
                            flowChartRef.current?.setFocusMode?.(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-[11px] transition-colors"
                          title="Exit Focus Mode and restore full graph visibility"
                        >
                          Exit Focus (F)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* D3 Flow Simulation Container with Zoom & Pan and Impact Overlay */}
                <div className="h-[560px] md:h-[620px] w-full relative rounded-2xl overflow-hidden">
                  <D3FlowChart 
                    ref={flowChartRef}
                    data={liveGraphData} 
                    repoName={currentRepoName}
                    onNodeClick={(node) => {
                      setSelectedGraphNode(node);
                      setShowImpactOverlay(true);
                    }}
                    onSelectionChange={(nodes) => {
                      setSelectedGraphNodes(nodes);
                      if (nodes.length > 0) {
                        setSelectedGraphNode(nodes[0]);
                        setShowImpactOverlay(true);
                      } else {
                        setSelectedGraphNode(null);
                      }
                    }}
                    selectedNodeId={selectedGraphNode?.id}
                    enableDependencyTrace={true}
                    isFocusMode={isFocusMode}
                    onFocusModeChange={setIsFocusMode}
                    layoutAlgorithm={graphLayoutAlgorithm}
                    onLayoutAlgorithmChange={setGraphLayoutAlgorithm}
                    onTraceNodeChange={(focal, info) => {
                      setActiveTraceNode(focal);
                      setActiveTraceInfo(info);
                    }}
                  />

                  {/* Architectural File Impact Factor Overlay Card */}
                  {activeFileImpact && showImpactOverlay && (
                    <div 
                      id="focus-mode-impact-overlay-container"
                      className="absolute top-3 right-3 z-30 pointer-events-auto max-w-[420px]"
                    >
                      <FileImpactFactorCard
                        analysis={activeFileImpact}
                        onExportSvg={() => handleQuickExportSvg('live_graph')}
                        onFocusNode={(nodeId) => {
                          const target = liveGraphData.nodes.find(n => n.id === nodeId);
                          if (target) {
                            setSelectedGraphNode(target);
                            if (isFocusMode) {
                              flowChartRef.current?.setFocalNode?.(nodeId);
                              flowChartRef.current?.focusNeighborhood?.(nodeId);
                            } else {
                              flowChartRef.current?.focusNode(nodeId);
                            }
                          }
                        }}
                        onClose={() => setShowImpactOverlay(false)}
                        isFocusModeActive={isFocusMode}
                        onToggleFocusMode={() => {
                          const next = !isFocusMode;
                          setIsFocusMode(next);
                          flowChartRef.current?.setFocusMode?.(next);
                          if (next && activeFileImpact) {
                            flowChartRef.current?.focusNeighborhood?.(activeFileImpact.nodeId);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Interactive Dependency Trace & Node Inspector Bar */}
                {(selectedGraphNode || activeTraceNode) && (
                  <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs animate-in fade-in backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                            Dependency Trace
                          </span>
                          <span className="text-white font-bold truncate max-w-[200px]">
                            {(activeTraceNode || selectedGraphNode)?.label}
                          </span>
                          {(activeTraceNode || selectedGraphNode)?.techBadge && (
                            <span 
                              style={{ color: (activeTraceNode || selectedGraphNode)?.techColor || '#38bdf8' }}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 border border-white/10 font-bold"
                            >
                              {(activeTraceNode || selectedGraphNode)?.techBadge}
                            </span>
                          )}
                          {(activeTraceNode || selectedGraphNode)?.folder && (
                            <span className="text-slate-400 text-[10px] flex items-center gap-1">
                              <Folder className="w-3 h-3 text-amber-400" />
                              {(activeTraceNode || selectedGraphNode)?.folder}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inbound Callers Pills */}
                      {activeTraceInfo && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-300">
                            <ArrowUpLeft className="w-3 h-3 text-cyan-400" />
                            <span className="font-bold">{activeTraceInfo.incoming.length} Callers:</span>
                            {activeTraceInfo.incoming.length > 0 ? (
                              <div className="flex items-center gap-1">
                                {activeTraceInfo.incoming.slice(0, 3).map(n => (
                                  <button
                                    key={n.id}
                                    onClick={() => {
                                      setSelectedGraphNode(n);
                                      if (isFocusMode) {
                                        flowChartRef.current?.setFocalNode?.(n.id);
                                        flowChartRef.current?.focusNeighborhood?.(n.id);
                                      } else {
                                        flowChartRef.current?.focusNode(n.id);
                                      }
                                    }}
                                    className="hover:underline text-cyan-200 font-semibold"
                                    title={`Smoothly focus ${n.label}`}
                                  >
                                    {n.label}
                                  </button>
                                ))}
                                {activeTraceInfo.incoming.length > 3 && (
                                  <span className="text-slate-400">+{activeTraceInfo.incoming.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">None</span>
                            )}
                          </div>

                          {/* Outbound Dependencies Pills */}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-[10px] text-amber-300">
                            <ArrowDownRight className="w-3 h-3 text-amber-400" />
                            <span className="font-bold">{activeTraceInfo.outgoing.length} Deps:</span>
                            {activeTraceInfo.outgoing.length > 0 ? (
                              <div className="flex items-center gap-1">
                                {activeTraceInfo.outgoing.slice(0, 3).map(n => (
                                  <button
                                    key={n.id}
                                    onClick={() => {
                                      setSelectedGraphNode(n);
                                      if (isFocusMode) {
                                        flowChartRef.current?.setFocalNode?.(n.id);
                                        flowChartRef.current?.focusNeighborhood?.(n.id);
                                      } else {
                                        flowChartRef.current?.focusNode(n.id);
                                      }
                                    }}
                                    className="hover:underline text-amber-200 font-semibold"
                                    title={`Smoothly focus ${n.label}`}
                                  >
                                    {n.label}
                                  </button>
                                ))}
                                {activeTraceInfo.outgoing.length > 3 && (
                                  <span className="text-slate-400">+{activeTraceInfo.outgoing.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">None</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {(activeTraceNode || selectedGraphNode) && (
                        <button
                          onClick={() => {
                            const target = activeTraceNode || selectedGraphNode;
                            if (target) flowChartRef.current?.focusNode(target.id);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 text-[11px] flex items-center gap-1 transition-colors"
                          title="Center viewport on this node"
                        >
                          <Crosshair className="w-3 h-3 text-cyan-400" />
                          <span>Focus</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedGraphNode(null);
                          setActiveTraceNode(null);
                          setActiveTraceInfo(null);
                        }}
                        className="px-2 py-1 text-slate-400 hover:text-white text-[11px] hover:bg-white/5 rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 3D HOLOGRAPHIC MODEL WITH D3 ZOOM & PAN */}
            {activeTab === BlueprintTab.MODEL_3D && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="px-4 py-2 flex flex-wrap items-center justify-between border-b border-white/5 gap-2">
                  <div className="flex items-center gap-2.5">
                    <Box className="w-4 h-4 text-fuchsia-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Holographic_Tabletop_Model
                    </h3>
                    {infographic3DData && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                        D3 Zoom & Pan
                      </span>
                    )}
                  </div>

                  {infographic3DData && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => setFullScreenImage({ src: `data:image/png;base64,${infographic3DData}`, alt: `${currentRepoName} 3D Hologram` })}
                        className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-mono p-1.5 rounded-lg hover:bg-white/10"
                        title="Fullscreen D3 Inspector"
                      >
                        <Maximize className="w-4 h-4" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </button>
                      <button 
                        onClick={() => handleQuickExportSvg('3d_hologram')}
                        className="text-xs flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors font-mono bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 font-semibold"
                        title="Save 3D Blueprint Vector SVG"
                        id="repo-analyzer-quick-svg-3d-btn"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SVG</span>
                      </button>
                      <button 
                        onClick={() => handleQuickExportPng('3d_hologram')}
                        className="text-xs flex items-center gap-1.5 text-sky-300 hover:text-white transition-colors font-mono bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-500/30 font-semibold"
                        title="Save 3D Blueprint PNG"
                        id="repo-analyzer-quick-png-3d-btn"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        <span>PNG</span>
                      </button>
                      <button
                        onClick={() => handleOpenExportModal('3d_hologram')}
                        className="text-xs flex items-center gap-1.5 text-fuchsia-200 hover:text-white transition-all font-mono bg-fuchsia-600/30 hover:bg-fuchsia-600/50 px-3 py-1.5 rounded-lg border border-fuchsia-500/40 font-bold shadow-sm hover:shadow-neon-pink"
                        title="Open Export Options Studio"
                        id="repo-analyzer-export-modal-3d-btn"
                      >
                        <Download className="w-3.5 h-3.5 text-fuchsia-300" />
                        <span>Export Studio</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-[560px] md:h-[620px] w-full relative rounded-2xl overflow-hidden bg-slate-950/60 flex items-center justify-center">
                  {infographic3DData ? (
                    <D3BlueprintViewer
                      imageSrc={`data:image/png;base64,${infographic3DData}`}
                      alt={`${currentRepoName} 3D Hologram`}
                      minHeight="100%"
                      onExpandFullScreen={() => setFullScreenImage({ src: `data:image/png;base64,${infographic3DData}`, alt: `${currentRepoName} 3D Hologram` })}
                    />
                  ) : generating3D ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in">
                      <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500/50" />
                      <p className="text-fuchsia-300/60 font-mono text-xs animate-pulse tracking-wider">
                        RENDERING HOLOGRAPHIC BLUEPRINT...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-md">
                      <div className="p-4 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/20">
                        <Box className="w-10 h-10 text-fuchsia-400" />
                      </div>
                      <p className="text-slate-300 font-sans font-medium text-sm">
                        Generate isometric 3D tabletop diorama of the repository architecture.
                      </p>
                      <button 
                        onClick={handleGenerate3D}
                        className="px-6 py-2.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 rounded-xl font-semibold transition-all flex items-center gap-2 font-mono text-xs hover:shadow-neon-violet"
                      >
                        <Sparkles className="w-4 h-4" />
                        GENERATE_3D_MODEL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: GENERATE README & ARCHITECTURAL SUMMARY */}
            {activeTab === BlueprintTab.README_GEN && currentFileTree && (
              <div className="space-y-3 p-2 md:p-4 animate-in fade-in duration-300">
                <ReadmeGenerator
                  repoName={currentRepoName}
                  fileTree={currentFileTree}
                  onNavigate={onNavigate}
                />
              </div>
            )}

            {/* TAB 4: CODE EVOLUTION & ARCHITECTURAL DIFF */}
            {activeTab === BlueprintTab.EVOLUTION && currentFileTree && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <CodeEvolutionViewer
                  repoName={currentRepoName}
                  currentFileTree={currentFileTree}
                />
              </div>
            )}

          </div>

          {/* Grid Overview comparing 2D & 3D side-by-side if both exist */}
          {infographicData && infographic3DData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              <div className="glass-panel rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
                  <span className="text-violet-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 2D Flow Blueprint
                  </span>
                  <button 
                    onClick={() => setActiveTab(BlueprintTab.BLUEPRINT_2D)}
                    className="hover:text-white text-[11px] underline"
                  >
                    Focus View
                  </button>
                </div>
                <div className="h-[320px] rounded-xl overflow-hidden">
                  <D3BlueprintViewer
                    imageSrc={`data:image/png;base64,${infographicData}`}
                    alt={`${currentRepoName} 2D Preview`}
                    minHeight="100%"
                    onExpandFullScreen={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: `${currentRepoName} 2D Blueprint` })}
                  />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
                  <span className="text-fuchsia-300 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" /> 3D Holographic Model
                  </span>
                  <button 
                    onClick={() => setActiveTab(BlueprintTab.MODEL_3D)}
                    className="hover:text-white text-[11px] underline"
                  >
                    Focus View
                  </button>
                </div>
                <div className="h-[320px] rounded-xl overflow-hidden">
                  <D3BlueprintViewer
                    imageSrc={`data:image/png;base64,${infographic3DData}`}
                    alt={`${currentRepoName} 3D Preview`}
                    minHeight="100%"
                    onExpandFullScreen={() => setFullScreenImage({ src: `data:image/png;base64,${infographic3DData}`, alt: `${currentRepoName} 3D Hologram` })}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="pt-12 border-t border-white/5 animate-in fade-in">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <Clock className="w-4 h-4" />
            <h3 className="text-sm font-mono uppercase tracking-wider">Recent Architectural Blueprints</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <button 
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="group bg-slate-900/50 border border-white/5 hover:border-violet-500/50 rounded-xl overflow-hidden text-left transition-all hover:shadow-neon-violet"
              >
                <div className="aspect-video relative overflow-hidden bg-slate-950">
                  <img 
                    src={`data:image/png;base64,${item.imageData}`} 
                    alt={item.repoName} 
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                  />
                  {item.is3D && (
                    <div className="absolute top-2 right-2 bg-fuchsia-500/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                      3D
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-white truncate font-mono">{item.repoName}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{item.style}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Export Architecture Blueprint Modal (SVG & PNG for Documentation) */}
      <ExportBlueprintModal
        isOpen={exportModalState.isOpen}
        onClose={() => setExportModalState((prev) => ({ ...prev, isOpen: false }))}
        repoName={currentRepoName || 'Repository'}
        imageSrc={exportModalState.imageSrc}
        svgElement={exportModalState.svgElement}
        techStack={detectedTechList}
        totalFiles={currentFileTree?.length}
        totalNodes={liveGraphData?.nodes.length}
        totalLinks={liveGraphData?.links.length}
        blueprintType={exportModalState.blueprintType}
      />
    </div>
  );
};

export default RepoAnalyzer;
