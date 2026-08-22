/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  AreaChart,
  Area
} from 'recharts';
import { 
  ActiveRepoContext, 
  ViewMode, 
  RepoFileTree, 
  RepoHistoryItem 
} from '../types';
import { FLAGSHIP_CODEBASES } from '../services/integrationService';
import { 
  GitBranch, 
  PieChart as PieIcon, 
  BarChart2, 
  Layers, 
  FolderTree, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Bot, 
  ClipboardList, 
  Terminal, 
  FileCode, 
  CheckCircle2, 
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  ChevronDown
} from 'lucide-react';

interface RepoFileDistributionDashboardProps {
  activeRepoContext: ActiveRepoContext | null;
  repoHistory?: RepoHistoryItem[];
  onSelectRepoForContext?: (repoName: string, fileTree: RepoFileTree[]) => void;
  onNavigate: (mode: ViewMode) => void;
}

// Color palette mapping for languages and file extensions
const EXTENSION_COLORS: Record<string, string> = {
  tsx: '#00D8FF',
  ts: '#3178C6',
  jsx: '#61DAFB',
  js: '#F7DF1E',
  py: '#3776AB',
  rs: '#DEA584',
  go: '#00ADD8',
  css: '#38BDF8',
  scss: '#CF649A',
  json: '#10B981',
  md: '#A855F7',
  html: '#F97316',
  yaml: '#EC4899',
  yml: '#EC4899',
  toml: '#8B5CF6',
  sql: '#EAB308',
  svg: '#F43F5E',
  png: '#6366F1',
  other: '#64748B'
};

// Color mapping for architectural tiers
const TIER_COLORS: Record<string, string> = {
  'Components & UI': '#06B6D4',
  'Services & Logic': '#8B5CF6',
  'API & Routing': '#10B981',
  'State & Stores': '#F59E0B',
  'Config & Infra': '#EC4899',
  'Testing & QA': '#3B82F6',
  'Docs & Specs': '#A855F7',
  'Other / Assets': '#64748B'
};

export const RepoFileDistributionDashboard: React.FC<RepoFileDistributionDashboardProps> = ({
  activeRepoContext,
  repoHistory = [],
  onSelectRepoForContext,
  onNavigate
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'extensions' | 'tiers' | 'radar' | 'depth'>('extensions');
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  // Compute file distribution statistics from active repository
  const stats = useMemo(() => {
    if (!activeRepoContext || !activeRepoContext.fileTree || activeRepoContext.fileTree.length === 0) {
      return null;
    }

    const files = activeRepoContext.fileTree;
    const totalFiles = files.length;

    // 1. Extension & Language breakdown
    const extCountMap: Record<string, number> = {};
    const tierCountMap: Record<string, number> = {
      'Components & UI': 0,
      'Services & Logic': 0,
      'API & Routing': 0,
      'State & Stores': 0,
      'Config & Infra': 0,
      'Testing & QA': 0,
      'Docs & Specs': 0,
      'Other / Assets': 0
    };

    const depthCountMap: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };

    let codeFilesCount = 0;
    let configFilesCount = 0;
    let docFilesCount = 0;
    let styleFilesCount = 0;

    files.forEach(f => {
      const lower = f.path.toLowerCase();
      const parts = f.path.split('.');
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'no-ext';
      
      // Extension counting
      extCountMap[ext] = (extCountMap[ext] || 0) + 1;

      // Tier categorization
      if (lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('e2e')) {
        tierCountMap['Testing & QA']++;
      } else if (lower.includes('component') || lower.includes('/ui/') || lower.includes('views') || lower.includes('layout') || ext === 'tsx' || ext === 'jsx') {
        tierCountMap['Components & UI']++;
      } else if (lower.includes('api') || lower.includes('route') || lower.includes('router') || lower.includes('endpoint') || lower.includes('controller') || lower.includes('middleware')) {
        tierCountMap['API & Routing']++;
      } else if (lower.includes('store') || lower.includes('state') || lower.includes('context') || lower.includes('hook') || lower.includes('db') || lower.includes('model') || lower.includes('schema')) {
        tierCountMap['State & Stores']++;
      } else if (lower.includes('service') || lower.includes('lib') || lower.includes('core') || lower.includes('engine') || lower.includes('agent') || lower.includes('utils')) {
        tierCountMap['Services & Logic']++;
      } else if (lower.includes('config') || ext === 'json' || ext === 'yaml' || ext === 'yml' || ext === 'toml' || lower.includes('vite') || lower.includes('tsconfig')) {
        tierCountMap['Config & Infra']++;
      } else if (ext === 'md' || lower.includes('doc') || lower.includes('readme') || lower.includes('license')) {
        tierCountMap['Docs & Specs']++;
      } else {
        tierCountMap['Other / Assets']++;
      }

      // Depth level
      const depth = Math.min(Math.max(0, f.path.split('/').length - 1), 4);
      depthCountMap[depth] = (depthCountMap[depth] || 0) + 1;

      // High-level category
      if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp'].includes(ext)) {
        codeFilesCount++;
      } else if (['json', 'yaml', 'yml', 'toml', 'env', 'config'].includes(ext) || lower.includes('config')) {
        configFilesCount++;
      } else if (['md', 'txt', 'pdf'].includes(ext)) {
        docFilesCount++;
      } else if (['css', 'scss', 'svg', 'png', 'ico'].includes(ext)) {
        styleFilesCount++;
      }
    });

    // Format extension data for Recharts Pie & Bar
    const extensionData = Object.entries(extCountMap)
      .map(([name, count]) => ({
        name: name.toUpperCase(),
        ext: name,
        count,
        percentage: Number(((count / totalFiles) * 100).toFixed(1)),
        color: EXTENSION_COLORS[name] || EXTENSION_COLORS.other
      }))
      .sort((a, b) => b.count - a.count);

    // Format tier data for Recharts
    const tierData = Object.entries(tierCountMap)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Number(((count / totalFiles) * 100).toFixed(1)),
        color: TIER_COLORS[name] || '#64748B'
      }))
      .sort((a, b) => b.count - a.count);

    // Format radar data
    const radarData = Object.entries(tierCountMap).map(([tier, count]) => ({
      tier: tier.replace(' & ', '\n'),
      count,
      fullMark: Math.max(...Object.values(tierCountMap)) + 2
    }));

    // Format depth data
    const depthData = [
      { depthLabel: 'Root (0)', count: depthCountMap[0] || 0, level: 'Root Level' },
      { depthLabel: 'L1 (Direct)', count: depthCountMap[1] || 0, level: 'Layer 1' },
      { depthLabel: 'L2 (Subdirs)', count: depthCountMap[2] || 0, level: 'Layer 2' },
      { depthLabel: 'L3 (Nested)', count: depthCountMap[3] || 0, level: 'Layer 3' },
      { depthLabel: 'L4+ (Deep)', count: depthCountMap[4] || 0, level: 'Deep Layer' }
    ];

    const dominantExtension = extensionData[0] ? extensionData[0].name : 'N/A';
    const primaryStackDetected = 
      extensionData.some(e => e.ext === 'tsx' || e.ext === 'jsx') ? 'React / UI' :
      extensionData.some(e => e.ext === 'ts') ? 'TypeScript Domain' :
      extensionData.some(e => e.ext === 'py') ? 'Python / FastAPI' :
      extensionData.some(e => e.ext === 'rs') ? 'Rust Native' : 'Polyglot Module';

    return {
      totalFiles,
      extensionData,
      tierData,
      radarData,
      depthData,
      dominantExtension,
      primaryStackDetected,
      codeRatio: Number(((codeFilesCount / totalFiles) * 100).toFixed(0)),
      configRatio: Number(((configFilesCount / totalFiles) * 100).toFixed(0)),
      docRatio: Number(((docFilesCount / totalFiles) * 100).toFixed(0)),
      styleRatio: Number(((styleFilesCount / totalFiles) * 100).toFixed(0)),
      topExtensions: extensionData.slice(0, 6),
      topTiers: tierData.slice(0, 5)
    };
  }, [activeRepoContext]);

  // Filtered files list if user clicks an extension or searches
  const filteredFiles = useMemo(() => {
    if (!activeRepoContext?.fileTree) return [];
    return activeRepoContext.fileTree.filter(f => {
      const matchesSearch = filterQuery ? f.path.toLowerCase().includes(filterQuery.toLowerCase()) : true;
      const matchesExt = selectedExtension ? f.path.toLowerCase().endsWith(`.${selectedExtension.toLowerCase()}`) : true;
      return matchesSearch && matchesExt;
    });
  }, [activeRepoContext, filterQuery, selectedExtension]);

  // Handle repository selection from catalog
  const handleSelectPreset = (repoName: string, fileTree: RepoFileTree[]) => {
    if (onSelectRepoForContext) {
      onSelectRepoForContext(repoName, fileTree);
    }
    setShowRepoDropdown(false);
  };

  // Custom Recharts Dark Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/20 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl font-mono text-xs space-y-1 z-50">
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: data.color || payload[0].color || '#8B5CF6' }} 
            />
            <span className="font-bold text-white">{data.name || data.tier || data.depthLabel}</span>
          </div>
          <div className="text-slate-300 flex justify-between gap-4">
            <span>Files:</span>
            <span className="font-bold text-cyan-300">{data.count} files</span>
          </div>
          {data.percentage !== undefined && (
            <div className="text-slate-400 flex justify-between gap-4">
              <span>Share:</span>
              <span className="font-bold text-emerald-400">{data.percentage}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // If no repository is active, render an engaging activation card
  if (!activeRepoContext || !stats) {
    return (
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950 p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-mono text-violet-300">
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Recharts Telemetry</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-sans">
                Repository File Distribution Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Connect or select a codebase to visualize real-time language distributions, architectural tier balances, depth profiles, and modularity telemetry.
              </p>
            </div>

            <button
              onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <GitBranch className="w-4 h-4" />
              <span>Import Any GitHub Repo</span>
            </button>
          </div>

          {/* Quick 1-Click Codebase Starters */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              Or Activate a Flagship Codebase to View Live Charts:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FLAGSHIP_CODEBASES.slice(0, 4).map(flagship => (
                <button
                  key={flagship.id}
                  onClick={() => handleSelectPreset(flagship.repoName, flagship.sampleFileTree)}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/10 hover:border-violet-500/50 text-left transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-violet-300 transition-colors">
                        {flagship.displayName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {flagship.sampleFileTree.length} files
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {flagship.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 group-hover:text-cyan-200">
                    <span>Activate Live Stats</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Repository Dashboard View
  return (
    <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6 animate-in fade-in duration-500">
      {/* Background accents */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Active Repo Status Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Workspace Live
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
              Recharts Engine v2.15
            </span>
          </div>

          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">
              {activeRepoContext.repoName}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Topological file distribution, language weights, and architectural tier breakdown for active workspace.
          </p>
        </div>

        {/* Action Controls & Codebase Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset / Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRepoDropdown(!showRepoDropdown)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Switch Codebase</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRepoDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/15 bg-slate-950 p-2 shadow-2xl z-50 space-y-1 font-mono text-xs backdrop-blur-2xl">
                <div className="px-3 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10">
                  Select Codebase
                </div>
                {FLAGSHIP_CODEBASES.map(flagship => (
                  <button
                    key={flagship.id}
                    onClick={() => handleSelectPreset(flagship.repoName, flagship.sampleFileTree)}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors flex items-center justify-between text-slate-200 hover:text-white group"
                  >
                    <span className="font-semibold truncate">{flagship.displayName}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-cyan-300">
                      {flagship.sampleFileTree.length} files
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate(ViewMode.CODEMAP)}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open in Codemap</span>
          </button>

          <button
            onClick={() => onNavigate(ViewMode.PLAN_CREATOR)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Telemetry Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Scanned Files</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{stats.totalFiles}</span>
            <FileCode className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">100% Tree Indexed</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Dominant Language</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 flex items-center gap-2">
            <span>.{stats.dominantExtension.toLowerCase()}</span>
            <span className="text-xs font-normal text-slate-400">
              ({stats.topExtensions[0]?.percentage || 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate">{stats.primaryStackDetected}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Architectural Layers</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-violet-300 flex items-center gap-2">
            <span>{stats.tierData.length}</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-[11px] text-violet-300/80 font-mono">Decoupled Hierarchy</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Code vs Config Ratio</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 flex items-center gap-2">
            <span>{stats.codeRatio}%</span>
            <span className="text-xs text-slate-400">/ {stats.configRatio}% cfg</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">High Signal Density</div>
        </div>
      </div>

      {/* Chart View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => { setActiveChartTab('extensions'); setSelectedTier(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeChartTab === 'extensions'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Extensions Donut & Bar</span>
          </button>

          <button
            onClick={() => { setActiveChartTab('tiers'); setSelectedExtension(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeChartTab === 'tiers'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Architectural Tiers</span>
          </button>

          <button
            onClick={() => { setActiveChartTab('radar'); setSelectedExtension(null); setSelectedTier(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeChartTab === 'radar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Radar Balance</span>
          </button>

          <button
            onClick={() => { setActiveChartTab('depth'); setSelectedExtension(null); setSelectedTier(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeChartTab === 'depth'
                ? 'bg-fuchsia-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Depth Hierarchy</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive hover & slice filtering</span>
        </div>
      </div>

      {/* Main Visualization Canvas Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Chart Area (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-slate-950/80 p-4 md:p-6 shadow-inner space-y-4">
          {/* Tab 1: Extension Distribution Donut & Top Bar */}
          {activeChartTab === 'extensions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">File Extension Breakdown</h3>
                  <p className="text-[11px] text-slate-400">Share of file extensions across active repository.</p>
                </div>
                {selectedExtension && (
                  <button
                    onClick={() => setSelectedExtension(null)}
                    className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 hover:text-white"
                  >
                    Reset Filter ({selectedExtension})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Recharts Pie Donut */}
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomChartTooltip />} />
                      <Pie
                        data={stats.extensionData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        onClick={(data: any) => {
                          const ext = data?.ext || data?.payload?.ext;
                          if (ext) {
                            setSelectedExtension(ext === selectedExtension ? null : ext);
                          }
                        }}
                        cursor="pointer"
                      >
                        {stats.extensionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke="#0f172a" 
                            strokeWidth={2}
                            opacity={selectedExtension && selectedExtension !== entry.ext ? 0.35 : 1}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Extension Horizontal Bar Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={stats.topExtensions}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#64748B" 
                        tick={{ fontSize: 10, fill: '#E2E8F0', fontFamily: 'monospace' }} 
                        width={45}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar 
                        dataKey="count" 
                        radius={[0, 6, 6, 0]}
                        onClick={(data: any) => {
                          const ext = data?.ext || data?.payload?.ext;
                          if (ext) {
                            setSelectedExtension(ext === selectedExtension ? null : ext);
                          }
                        }}
                        cursor="pointer"
                      >
                        {stats.topExtensions.map((entry, index) => (
                          <Cell 
                            key={`bar-${index}`} 
                            fill={entry.color} 
                            opacity={selectedExtension && selectedExtension !== entry.ext ? 0.35 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Architectural Tiers Bar Chart */}
          {activeChartTab === 'tiers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">Architectural Layer Distribution</h3>
                  <p className="text-[11px] text-slate-400">File distribution classified by design system and architectural tier.</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.tierData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748B" 
                      tick={{ fontSize: 9, fill: '#CBD5E1', fontFamily: 'monospace' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar 
                      dataKey="count" 
                      radius={[6, 6, 0, 0]}
                    >
                      {stats.tierData.map((entry, index) => (
                        <Cell key={`tier-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Radar Balance Matrix */}
          {activeChartTab === 'radar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">Architectural Radar Balance</h3>
                  <p className="text-[11px] text-slate-400">Balance spider map across frontend, backend, test, config, and domain stores.</p>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={stats.radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis 
                      dataKey="tier" 
                      stroke="#94A3B8" 
                      tick={{ fontSize: 9, fill: '#CBD5E1', fontFamily: 'monospace' }} 
                    />
                    <PolarRadiusAxis stroke="#475569" tick={{ fontSize: 8, fill: '#64748B' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Radar 
                      name="Files Count" 
                      dataKey="count" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.35} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 4: Directory Depth Hierarchy Area Chart */}
          {activeChartTab === 'depth' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">Directory Nesting Depth Curve</h3>
                  <p className="text-[11px] text-slate-400">Density profile of files by folder nesting level.</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.depthData}
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C084FC" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#C084FC" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="depthLabel" 
                      stroke="#64748B" 
                      tick={{ fontSize: 10, fill: '#CBD5E1', fontFamily: 'monospace' }}
                    />
                    <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#A855F7" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#depthGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Interactive Legend Pills */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5">
            {stats.topExtensions.map(ext => (
              <button
                key={ext.name}
                onClick={() => setSelectedExtension(selectedExtension === ext.ext ? null : ext.ext)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1.5 border ${
                  selectedExtension === ext.ext 
                    ? 'bg-white/20 border-white text-white font-bold' 
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ext.color }} />
                <span>{ext.name}</span>
                <span className="text-slate-400">({ext.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Drilldown & File Tree Inspector (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-slate-950/80 p-4 md:p-5 shadow-inner space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                File Tree Explorer
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300">
              {filteredFiles.length} of {stats.totalFiles} files
            </span>
          </div>

          {/* File Search Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter files (e.g. component, .ts)..."
              className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Scrollable File List */}
          <div className="h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                <Info className="w-6 h-6 text-slate-500" />
                <span className="text-xs font-mono">No files match current filter</span>
              </div>
            ) : (
              filteredFiles.map((file, idx) => {
                const parts = file.path.split('.');
                const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'txt';
                const color = EXTENSION_COLORS[ext] || EXTENSION_COLORS.other;

                return (
                  <div
                    key={`${file.path}-${idx}`}
                    className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between text-xs font-mono group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-slate-200 group-hover:text-white truncate font-medium">
                        {file.path}
                      </span>
                    </div>
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ml-2 flex-shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {ext}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Deep Exploration Launchers */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate(ViewMode.CODEMAP)}
              className="w-full py-2 px-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>D3 Topology</span>
            </button>
            <button
              onClick={() => onNavigate(ViewMode.AI_ASSISTANT)}
              className="w-full py-2 px-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-violet-300 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Architect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
