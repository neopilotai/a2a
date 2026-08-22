/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  RepoFileTree, 
  GitCommitItem, 
  EvolutionGraph, 
  EvolutionNodeDiff, 
  DiffStatus, 
  EvolutionDiffSummary, 
  EvolutionAiInsight,
  ComparePreset
} from '../../types';
import { 
  fetchRepoCommits, 
  fetchRepoTags,
  fetchRepoRevisions,
  fetchRepoFileTreeAtRef, 
  fetchCommitDiff 
} from '../../services/githubService';
import { 
  computeEvolutionGraphs, 
  deriveHistoricalFileTree, 
  DIFF_COLORS 
} from '../../services/evolutionService';
import { generateEvolutionAiInsight } from '../../services/geminiService';
import { D3EvolutionGraph, D3EvolutionGraphRef } from './D3EvolutionGraph';
import { ExportBlueprintModal } from '../ExportBlueprintModal';
import { generateBlueprintSvg, generateBlueprintPng, downloadBlob } from '../../services/blueprintExportService';
import { 
  GitCompare, 
  GitCommit, 
  GitBranch, 
  Tag,
  ArrowRight, 
  ArrowLeftRight, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  Edit3, 
  SlidersHorizontal, 
  Eye, 
  Clock, 
  Download, 
  Loader2, 
  Maximize2, 
  RotateCcw, 
  Info, 
  Share2, 
  ShieldAlert, 
  Zap, 
  ListFilter,
  Check,
  ChevronDown,
  Search,
  Copy,
  FileText,
  Filter,
  RefreshCw,
  Hash,
  Calendar,
  User,
  ExternalLink,
  X,
  Code2,
  Cpu
} from 'lucide-react';

interface CodeEvolutionViewerProps {
  repoName: string;
  currentFileTree: RepoFileTree[];
  onSelectNodeForInspection?: (node: EvolutionNodeDiff) => void;
}

export enum EvolutionViewLayout {
  SIDE_BY_SIDE = 'SIDE_BY_SIDE',
  UNIFIED_OVERLAY = 'UNIFIED_OVERLAY',
  CHANGELOG_MATRIX = 'CHANGELOG_MATRIX'
}

type RevisionFilterTab = 'all' | 'tags' | 'commits' | 'custom';

export const CodeEvolutionViewer: React.FC<CodeEvolutionViewerProps> = ({
  repoName,
  currentFileTree,
  onSelectNodeForInspection
}) => {
  // Revisions & Tags List
  const [revisions, setRevisions] = useState<GitCommitItem[]>([]);
  const [tags, setTags] = useState<GitCommitItem[]>([]);
  const [commits, setCommits] = useState<GitCommitItem[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState<boolean>(true);

  // Revision Selection Indices / Custom items
  const [baseRevIndex, setBaseRevIndex] = useState<number>(3); // Earlier revision
  const [targetRevIndex, setTargetRevIndex] = useState<number>(0); // Latest revision
  const [customBaseRef, setCustomBaseRef] = useState<string>('');
  const [customTargetRef, setCustomTargetRef] = useState<string>('');
  const [isUsingCustomBase, setIsUsingCustomBase] = useState<boolean>(false);
  const [isUsingCustomTarget, setIsUsingCustomTarget] = useState<boolean>(false);

  // Filter tabs for selector dropdowns
  const [revisionFilterTab, setRevisionFilterTab] = useState<RevisionFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Trees State for Base & Target
  const [baseTree, setBaseTree] = useState<RepoFileTree[]>([]);
  const [targetTree, setTargetTree] = useState<RepoFileTree[]>([]);
  const [loadingTrees, setLoadingTrees] = useState<boolean>(false);

  // Layout & Filter State
  const [layoutMode, setLayoutMode] = useState<EvolutionViewLayout>(EvolutionViewLayout.SIDE_BY_SIDE);
  const [filterStatus, setFilterStatus] = useState<DiffStatus | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<EvolutionNodeDiff | null>(null);
  const [syncZoom, setSyncZoom] = useState<boolean>(true);
  const [sharedTransform, setSharedTransform] = useState<{ x: number; y: number; k: number } | null>(null);
  const [activeTierFilter, setActiveTierFilter] = useState<string | null>(null);

  // AI Evolution Insight & Modal
  const [aiInsight, setAiInsight] = useState<EvolutionAiInsight | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Export Blueprint State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportSvgElement, setExportSvgElement] = useState<SVGSVGElement | null>(null);

  // Graph Refs
  const leftGraphRef = useRef<D3EvolutionGraphRef>(null);
  const rightGraphRef = useRef<D3EvolutionGraphRef>(null);
  const unifiedGraphRef = useRef<D3EvolutionGraphRef>(null);

  // Open Export Modal for Diff Blueprint
  const handleOpenExportDiff = () => {
    let svgEl: SVGSVGElement | null = null;
    if (layoutMode === EvolutionViewLayout.UNIFIED_OVERLAY) {
      svgEl = unifiedGraphRef.current?.getSvgElement() || null;
    } else {
      svgEl = rightGraphRef.current?.getSvgElement() || leftGraphRef.current?.getSvgElement() || null;
    }
    setExportSvgElement(svgEl);
    setShowExportModal(true);
  };

  // Quick 1-Click SVG Export for Diff
  const handleQuickExportDiffSvg = async () => {
    try {
      let svgEl: SVGSVGElement | null = null;
      if (layoutMode === EvolutionViewLayout.UNIFIED_OVERLAY) {
        svgEl = unifiedGraphRef.current?.getSvgElement() || null;
      } else {
        svgEl = rightGraphRef.current?.getSvgElement() || leftGraphRef.current?.getSvgElement() || null;
      }

      const res = await generateBlueprintSvg(undefined, svgEl, {
        repoName,
        title: `${repoName} — Architecture Evolution Diff`,
        subtitle: `Comparing ${baseCommit.tag || baseCommit.shortSha} → ${targetCommit.tag || targetCommit.shortSha} (+${summary?.addedCount || 0} Added, ~${summary?.modifiedCount || 0} Modified, -${summary?.deletedCount || 0} Deleted)`,
        theme: 'dark',
        includeHeader: true,
        includeLegend: true,
        includeTechBadges: true,
        totalFiles: summary?.totalFiles,
        totalNodes: evolutionData?.unifiedGraph.nodes.length,
        totalLinks: evolutionData?.unifiedGraph.links.length,
        sourceType: 'diff_blueprint',
      });
      downloadBlob(res.blob, res.filename);
    } catch (err) {
      console.error('Quick Diff SVG Export Error:', err);
      handleOpenExportDiff();
    }
  };

  // Quick 1-Click PNG Export for Diff
  const handleQuickExportDiffPng = async () => {
    try {
      let svgEl: SVGSVGElement | null = null;
      if (layoutMode === EvolutionViewLayout.UNIFIED_OVERLAY) {
        svgEl = unifiedGraphRef.current?.getSvgElement() || null;
      } else {
        svgEl = rightGraphRef.current?.getSvgElement() || leftGraphRef.current?.getSvgElement() || null;
      }

      const res = await generateBlueprintPng(undefined, svgEl, {
        repoName,
        scale: 2,
        title: `${repoName} — Architecture Evolution Diff`,
        subtitle: `Comparing ${baseCommit.tag || baseCommit.shortSha} → ${targetCommit.tag || targetCommit.shortSha} (+${summary?.addedCount || 0} Added, ~${summary?.modifiedCount || 0} Modified, -${summary?.deletedCount || 0} Deleted)`,
        theme: 'dark',
        includeHeader: true,
        includeLegend: true,
        includeTechBadges: true,
        totalFiles: summary?.totalFiles,
        totalNodes: evolutionData?.unifiedGraph.nodes.length,
        totalLinks: evolutionData?.unifiedGraph.links.length,
        sourceType: 'diff_blueprint',
      });
      downloadBlob(res.blob, res.filename);
    } catch (err) {
      console.error('Quick Diff PNG Export Error:', err);
      handleOpenExportDiff();
    }
  };

  // Fetch commits and tags on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRevisions() {
      setLoadingRevisions(true);
      try {
        const result = await fetchRepoRevisions(repoName);
        if (isMounted) {
          setRevisions(result.all);
          setTags(result.tags);
          setCommits(result.commits);

          if (result.tags.length >= 2) {
            // Default to latest tag vs previous tag
            const latestTagIdx = result.all.findIndex(r => r.tag === result.tags[0].tag);
            const prevTagIdx = result.all.findIndex(r => r.tag === result.tags[1].tag);
            setTargetRevIndex(latestTagIdx >= 0 ? latestTagIdx : 0);
            setBaseRevIndex(prevTagIdx >= 0 ? prevTagIdx : Math.min(3, result.all.length - 1));
          } else if (result.all.length > 1) {
            setTargetRevIndex(0);
            setBaseRevIndex(Math.min(3, result.all.length - 1));
          }
        }
      } catch (err) {
        console.error('Error fetching revisions:', err);
      } finally {
        if (isMounted) setLoadingRevisions(false);
      }
    }
    loadRevisions();
    return () => { isMounted = false; };
  }, [repoName]);

  // Current Base and Target objects
  const baseCommit: GitCommitItem = useMemo(() => {
    if (isUsingCustomBase && customBaseRef.trim()) {
      return {
        sha: customBaseRef.trim(),
        shortSha: customBaseRef.trim().substring(0, 7),
        message: `Custom ref: ${customBaseRef.trim()}`,
        author: 'custom-ref',
        date: new Date().toISOString(),
        timestamp: Date.now() - 86400000 * 30,
        tag: customBaseRef.startsWith('v') ? customBaseRef : undefined,
        kind: 'custom'
      };
    }
    return revisions[baseRevIndex] || {
      sha: "initial-001",
      shortSha: "v1.0.0",
      message: "Initial base architecture",
      author: "system",
      date: new Date(Date.now() - 86400000 * 60).toISOString(),
      timestamp: Date.now() - 86400000 * 60,
      tag: "v1.0.0",
      kind: 'tag'
    };
  }, [isUsingCustomBase, customBaseRef, revisions, baseRevIndex]);

  const targetCommit: GitCommitItem = useMemo(() => {
    if (isUsingCustomTarget && customTargetRef.trim()) {
      return {
        sha: customTargetRef.trim(),
        shortSha: customTargetRef.trim().substring(0, 7),
        message: `Custom ref: ${customTargetRef.trim()}`,
        author: 'custom-ref',
        date: new Date().toISOString(),
        timestamp: Date.now(),
        tag: customTargetRef.startsWith('v') ? customTargetRef : undefined,
        kind: 'custom'
      };
    }
    return revisions[targetRevIndex] || {
      sha: "latest-999",
      shortSha: "v2.1.0",
      message: "Current state with latest refactors",
      author: "system",
      date: new Date().toISOString(),
      timestamp: Date.now(),
      tag: "v2.1.0",
      kind: 'tag'
    };
  }, [isUsingCustomTarget, customTargetRef, revisions, targetRevIndex]);

  // Build file trees when commits change
  useEffect(() => {
    let isMounted = true;
    async function resolveTrees() {
      if (!currentFileTree || currentFileTree.length === 0) return;
      setLoadingTrees(true);

      try {
        // Derive or fetch target tree
        let tTree = currentFileTree;
        if (targetRevIndex !== 0 || isUsingCustomTarget) {
          const targetRef = targetCommit.sha || targetCommit.tag;
          if (targetRef) {
            const fetchedTarget = await fetchRepoFileTreeAtRef(repoName, targetRef);
            if (fetchedTarget.length > 0) tTree = fetchedTarget;
            else tTree = deriveHistoricalFileTree(currentFileTree, targetRevIndex, revisions.length || 5);
          }
        }

        // Derive or fetch base tree
        let bTree: RepoFileTree[] = [];
        const baseRef = baseCommit.sha || baseCommit.tag;
        if (baseRef) {
          const fetchedBase = await fetchRepoFileTreeAtRef(repoName, baseRef);
          if (fetchedBase.length > 0) bTree = fetchedBase;
          else bTree = deriveHistoricalFileTree(currentFileTree, baseRevIndex, revisions.length || 5);
        } else {
          bTree = deriveHistoricalFileTree(currentFileTree, baseRevIndex, revisions.length || 5);
        }

        if (isMounted) {
          setBaseTree(bTree);
          setTargetTree(tTree);
        }
      } catch (e) {
        console.error('Error resolving evolution trees:', e);
      } finally {
        if (isMounted) setLoadingTrees(false);
      }
    }

    resolveTrees();
    return () => { isMounted = false; };
  }, [repoName, currentFileTree, baseRevIndex, targetRevIndex, isUsingCustomBase, isUsingCustomTarget, baseCommit, targetCommit, revisions]);

  // Compute evolution graphs and diff summaries
  const evolutionData = useMemo(() => {
    if (!currentFileTree || currentFileTree.length === 0) return null;
    const bTree = baseTree.length > 0 ? baseTree : currentFileTree;
    const tTree = targetTree.length > 0 ? targetTree : currentFileTree;
    return computeEvolutionGraphs(repoName, bTree, tTree, baseCommit, targetCommit);
  }, [repoName, currentFileTree, baseTree, targetTree, baseCommit, targetCommit]);

  // Quick Comparison Presets Handler
  const applyPreset = (preset: ComparePreset) => {
    setIsUsingCustomBase(false);
    setIsUsingCustomTarget(false);

    if (preset === 'latest_vs_previous_release' && tags.length >= 2) {
      const latestTagIdx = revisions.findIndex(r => r.tag === tags[0].tag);
      const prevTagIdx = revisions.findIndex(r => r.tag === tags[1].tag);
      if (latestTagIdx >= 0 && prevTagIdx >= 0) {
        setTargetRevIndex(latestTagIdx);
        setBaseRevIndex(prevTagIdx);
        return;
      }
    }

    if (preset === 'latest_vs_initial') {
      setTargetRevIndex(0);
      setBaseRevIndex(Math.max(0, revisions.length - 1));
      return;
    }

    if (preset === 'head_vs_recent_commit') {
      const commitRevs = revisions.filter(r => r.kind === 'commit' || !r.tag);
      if (commitRevs.length >= 2) {
        const headIdx = revisions.findIndex(r => r.sha === commitRevs[0].sha);
        const prevIdx = revisions.findIndex(r => r.sha === (commitRevs[Math.min(3, commitRevs.length - 1)]?.sha));
        setTargetRevIndex(headIdx >= 0 ? headIdx : 0);
        setBaseRevIndex(prevIdx >= 0 ? prevIdx : Math.min(3, revisions.length - 1));
        return;
      }
    }

    // Default fallback
    setTargetRevIndex(0);
    setBaseRevIndex(Math.min(3, Math.max(0, revisions.length - 1)));
  };

  // Handle Swap Commits
  const handleSwapRevisions = () => {
    if (isUsingCustomBase || isUsingCustomTarget) {
      const tempCustom = customBaseRef;
      setCustomBaseRef(customTargetRef);
      setCustomTargetRef(tempCustom);
      const tempUsing = isUsingCustomBase;
      setIsUsingCustomBase(isUsingCustomTarget);
      setIsUsingCustomTarget(tempUsing);
    } else {
      const temp = baseRevIndex;
      setBaseRevIndex(targetRevIndex);
      setTargetRevIndex(temp);
    }
  };

  // Generate AI Evolution Analysis
  const handleGenerateAiInsight = async () => {
    if (!evolutionData) return;
    setIsGeneratingAi(true);
    setShowAiModal(true);
    try {
      const insight = await generateEvolutionAiInsight(repoName, evolutionData.summary);
      setAiInsight(insight);
    } catch (err) {
      console.error('AI insight generation failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Copy Full Comparison Report to Clipboard
  const handleCopyReport = () => {
    if (!evolutionData) return;
    const summary = evolutionData.summary;
    const report = `# Architectural Blueprint Comparison: ${repoName}

## Revisions Compared
- **Base (From):** ${baseCommit.tag ? `Tag [${baseCommit.tag}]` : baseCommit.shortSha} - ${baseCommit.message} (${baseCommit.author}, ${new Date(baseCommit.date).toLocaleDateString()})
- **Target (To):** ${targetCommit.tag ? `Tag [${targetCommit.tag}]` : targetCommit.shortSha} - ${targetCommit.message} (${targetCommit.author}, ${new Date(targetCommit.date).toLocaleDateString()})

## Architectural Diff Telemetry
- Total Scanned Components: ${summary.totalFiles}
- Added Components (+): ${summary.addedCount}
- Modified Components (~): ${summary.modifiedCount}
- Deleted/Deprecated Components (-): ${summary.deletedCount}
- Unchanged Components: ${summary.unchangedCount}
- Structural Churn Rate: ${summary.churnRate}%

## Impacted Architectural Tiers
${summary.impactedTiers.map(t => `- **${t.tier}**: ${t.count} files changed`).join('\n')}

${aiInsight ? `
## AI Architectural Audit
### Executive Summary
${aiInsight.executiveSummary}

### Key Architectural Shifts
${aiInsight.architecturalShifts.map(s => `- ${s}`).join('\n')}

### Breaking Changes
${aiInsight.breakingChanges.map(b => `- ⚠️ ${b}`).join('\n')}

### Migration & Regression Risks
${aiInsight.risks.map(r => `- 🛡️ ${r}`).join('\n')}
` : ''}

Generated by Link2Ink Architecture Studio.`;

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Handle Synchronized Zoom Broadcast
  const handleLeftZoom = (transform: { x: number; y: number; k: number }) => {
    if (syncZoom) {
      setSharedTransform(transform);
    }
  };

  const handleResetBothViews = () => {
    leftGraphRef.current?.resetView();
    rightGraphRef.current?.resetView();
    unifiedGraphRef.current?.resetView();
  };

  const handleFitBothViews = () => {
    leftGraphRef.current?.fitToContent();
    rightGraphRef.current?.fitToContent();
    unifiedGraphRef.current?.fitToContent();
  };

  // Filtered Revision items based on tab and search
  const filteredRevisions = useMemo(() => {
    let list = revisions;
    if (revisionFilterTab === 'tags') {
      list = revisions.filter(r => r.kind === 'tag' || Boolean(r.tag));
    } else if (revisionFilterTab === 'commits') {
      list = revisions.filter(r => r.kind === 'commit' || !r.tag);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r => 
      (r.tag && r.tag.toLowerCase().includes(q)) ||
      r.shortSha.toLowerCase().includes(q) ||
      r.message.toLowerCase().includes(q) ||
      r.author.toLowerCase().includes(q)
    );
  }, [revisions, revisionFilterTab, searchQuery]);

  if (loadingRevisions && revisions.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center min-h-[420px] gap-4">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-400" />
        <p className="font-mono text-xs text-emerald-300 tracking-wider animate-pulse">
          INITIALIZING BLUEPRINT COMPARISON MATRIX & GIT REVISION TIMELINE...
        </p>
      </div>
    );
  }

  const summary = evolutionData?.summary;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" id="compare-blueprints-container">
      
      {/* 1. TOP COMPARE BLUEPRINTS CONTROL DECK */}
      <div className="glass-panel rounded-3xl p-4 md:p-6 border border-white/10 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-emerald-500/10 via-violet-500/5 to-transparent pointer-events-none rounded-bl-full" />

        {/* Title and Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-violet-500/20 border border-emerald-500/30 text-emerald-300 shadow-inner">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-extrabold text-white font-mono tracking-tight">
                  COMPARE BLUEPRINTS
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-extrabold">
                  COMMITS & TAGS DIFF
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {revisions.length} Revisions Available
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Select any two tags, releases, or commits to inspect topological structural shifts, layer modifications, and breaking changes.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Viewport Sync Toggle */}
            {layoutMode === EvolutionViewLayout.SIDE_BY_SIDE && (
              <button
                onClick={() => setSyncZoom(!syncZoom)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs transition-all border ${
                  syncZoom 
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30' 
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
                title="Synchronize Pan & Zoom between Base and Target blueprints"
                id="compare-sync-zoom-btn"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sync Viewports: {syncZoom ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Fit to Content */}
            <button
              onClick={handleFitBothViews}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5"
              title="Fit Blueprint diagrams to viewport bounds"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Fit View</span>
            </button>

            {/* Reset Viewports */}
            <button
              onClick={handleResetBothViews}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Reset Viewports to Default Center"
            >
              <RotateCcw className="w-4 h-4 text-violet-400" />
            </button>

            {/* Copy Report */}
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs transition-colors"
              title="Copy Markdown diff report"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
            </button>

            {/* AI Architectural Evolution Audit */}
            <button
              onClick={handleGenerateAiInsight}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 via-violet-600/30 to-fuchsia-600/30 hover:from-emerald-600/50 hover:via-violet-600/50 hover:to-fuchsia-600/50 text-white font-mono text-xs font-bold border border-emerald-400/40 transition-all shadow-sm hover:shadow-neon-violet group"
              id="compare-ai-audit-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>AI Evolution Audit</span>
            </button>

          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Compare Presets:
          </span>

          <button
            onClick={() => applyPreset('latest_vs_previous_release')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
            title="Compare latest release tag against the previous release tag"
          >
            <Tag className="w-3 h-3" />
            <span>Latest Release vs Previous</span>
          </button>

          <button
            onClick={() => applyPreset('latest_vs_initial')}
            className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-all flex items-center gap-1.5"
            title="Compare current latest architecture against the initial baseline commit"
          >
            <Clock className="w-3 h-3" />
            <span>Latest vs Initial Baseline</span>
          </button>

          <button
            onClick={() => applyPreset('head_vs_recent_commit')}
            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 hover:border-sky-500/40 transition-all flex items-center gap-1.5"
            title="Compare latest commit against 3 commits ago"
          >
            <GitCommit className="w-3 h-3" />
            <span>HEAD vs Recent Commits</span>
          </button>
        </div>

        {/* Dual Commit & Tag Selectors Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          
          {/* BASE BLUEPRINT REVISION (FROM) */}
          <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl p-3.5 border border-white/10 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="uppercase tracking-wider">Base Blueprint (From / V1):</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300 border border-white/10">
                {baseCommit.tag ? `TAG: ${baseCommit.tag}` : `SHA: ${baseCommit.shortSha}`}
              </span>
            </div>

            {/* Selector or Custom Input */}
            {!isUsingCustomBase ? (
              <div className="space-y-1.5">
                <select
                  value={baseRevIndex}
                  onChange={(e) => setBaseRevIndex(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 cursor-pointer truncate"
                  id="compare-base-selector"
                >
                  {revisions.map((rev, i) => (
                    <option key={rev.sha + i} value={i} className="bg-slate-950 text-slate-200 py-1">
                      {rev.tag ? `[TAG ${rev.tag}] ` : `[COMMIT ${rev.shortSha}] `} 
                      {rev.message.slice(0, 55)} ({new Date(rev.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span className="truncate max-w-[200px]">Author: <span className="text-slate-300">{baseCommit.author}</span></span>
                  <button 
                    onClick={() => { setIsUsingCustomBase(true); setCustomBaseRef(baseCommit.tag || baseCommit.shortSha); }}
                    className="text-violet-400 hover:text-violet-300 underline text-[10px]"
                  >
                    Custom Ref...
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customBaseRef}
                    onChange={(e) => setCustomBaseRef(e.target.value)}
                    placeholder="Enter commit SHA, tag (v1.0.0), or branch"
                    className="w-full bg-slate-900 border border-violet-500/40 rounded-xl px-3 py-1.5 text-xs font-mono text-violet-200 placeholder-slate-500"
                  />
                  <button
                    onClick={() => setIsUsingCustomBase(false)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 text-[10px] font-mono"
                  >
                    Preset List
                  </button>
                </div>
                <p className="text-[10px] text-violet-400/80 font-mono px-1">
                  Resolves via GitHub Git Tree API: "{customBaseRef || 'type ref above'}"
                </p>
              </div>
            )}
          </div>

          {/* SWAP REVISIONS BUTTON */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-1.5 py-1">
            <button
              onClick={handleSwapRevisions}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all shadow-md group active:scale-95"
              title="Swap Base and Target Blueprints (Invert Diff)"
              id="compare-swap-revisions-btn"
            >
              <ArrowLeftRight className="w-5 h-5 text-emerald-400 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Swap</span>
          </div>

          {/* TARGET BLUEPRINT REVISION (TO) */}
          <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl p-3.5 border border-emerald-500/30 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-300 flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="uppercase tracking-wider">Target Blueprint (To / V2):</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {targetCommit.tag ? `TAG: ${targetCommit.tag}` : `SHA: ${targetCommit.shortSha}`}
              </span>
            </div>

            {/* Selector or Custom Input */}
            {!isUsingCustomTarget ? (
              <div className="space-y-1.5">
                <select
                  value={targetRevIndex}
                  onChange={(e) => setTargetRevIndex(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono text-emerald-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer truncate"
                  id="compare-target-selector"
                >
                  {revisions.map((rev, i) => (
                    <option key={rev.sha + i} value={i} className="bg-slate-950 text-slate-200 py-1">
                      {rev.tag ? `[TAG ${rev.tag}] ` : `[COMMIT ${rev.shortSha}] `} 
                      {rev.message.slice(0, 55)} ({new Date(rev.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span className="truncate max-w-[200px]">Author: <span className="text-emerald-300">{targetCommit.author}</span></span>
                  <button 
                    onClick={() => { setIsUsingCustomTarget(true); setCustomTargetRef(targetCommit.tag || targetCommit.shortSha); }}
                    className="text-emerald-400 hover:text-emerald-300 underline text-[10px]"
                  >
                    Custom Ref...
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customTargetRef}
                    onChange={(e) => setCustomTargetRef(e.target.value)}
                    placeholder="Enter commit SHA, tag (v2.0.0), or branch"
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-200 placeholder-slate-500"
                  />
                  <button
                    onClick={() => setIsUsingCustomTarget(false)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 text-[10px] font-mono"
                  >
                    Preset List
                  </button>
                </div>
                <p className="text-[10px] text-emerald-400/80 font-mono px-1">
                  Resolves via GitHub Git Tree API: "{customTargetRef || 'type ref above'}"
                </p>
              </div>
            )}
          </div>

        </div>

        {/* 2. DIFF KPI METRICS & FILTER BUTTONS BAR */}
        {summary && (
          <div className="pt-3 border-t border-white/10 space-y-3 font-mono text-xs">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Color-Coded Diff Counters & Filters */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus(filterStatus === 'added' ? 'all' : 'added')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    filterStatus === 'added' 
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 shadow-sm ring-1 ring-emerald-500/40' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  }`}
                  title="Filter Added Architecture Components"
                  id="compare-filter-added-btn"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="font-bold">+{summary.addedCount} Added</span>
                </button>

                <button
                  onClick={() => setFilterStatus(filterStatus === 'modified' ? 'all' : 'modified')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    filterStatus === 'modified' 
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-sm ring-1 ring-amber-500/40' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                  title="Filter Modified / Refactored Architecture Components"
                  id="compare-filter-modified-btn"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="font-bold">~{summary.modifiedCount} Modified</span>
                </button>

                <button
                  onClick={() => setFilterStatus(filterStatus === 'deleted' ? 'all' : 'deleted')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    filterStatus === 'deleted' 
                      ? 'bg-rose-500/30 text-rose-200 border-rose-400 shadow-sm ring-1 ring-rose-500/40' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                  title="Filter Deleted / Deprecated Architecture Components"
                  id="compare-filter-deleted-btn"
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span className="font-bold">-{summary.deletedCount} Deleted</span>
                </button>

                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white/15 text-white border-white/20'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                  title="Show All Architecture Components"
                >
                  <span>{summary.unchangedCount} Unchanged</span>
                </button>
              </div>

              {/* Churn Rate & View Layout Segmented Switcher */}
              <div className="flex items-center gap-3 flex-wrap">
                
                {/* Structural Churn Rate KPI */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                  <span className="text-slate-400">Churn Rate:</span>
                  <span className={`font-extrabold ${
                    summary.churnRate > 40 ? 'text-rose-400' : summary.churnRate > 20 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {summary.churnRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">({summary.totalFiles} files)</span>
                </div>

                {/* Layout Mode Switcher */}
                <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-white/10 shadow-sm">
                  <button
                    onClick={() => setLayoutMode(EvolutionViewLayout.SIDE_BY_SIDE)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all font-semibold ${
                      layoutMode === EvolutionViewLayout.SIDE_BY_SIDE
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="View Base and Target blueprints side-by-side"
                    id="compare-mode-side-by-side-btn"
                  >
                    Side-by-Side
                  </button>

                  <button
                    onClick={() => setLayoutMode(EvolutionViewLayout.UNIFIED_OVERLAY)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all font-semibold ${
                      layoutMode === EvolutionViewLayout.UNIFIED_OVERLAY
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="View single merged architectural blueprint overlay"
                    id="compare-mode-unified-overlay-btn"
                  >
                    Unified Overlay
                  </button>

                  <button
                    onClick={() => setLayoutMode(EvolutionViewLayout.CHANGELOG_MATRIX)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all font-semibold ${
                      layoutMode === EvolutionViewLayout.CHANGELOG_MATRIX
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="View detailed architectural tier diff matrix"
                    id="compare-mode-diff-matrix-btn"
                  >
                    Diff Matrix
                  </button>
                </div>

              </div>

            </div>

            {/* Impacted Architectural Tiers Distribution Bar */}
            {summary.impactedTiers.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-400">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Impacted Tiers:</span>
                {summary.impactedTiers.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTierFilter(activeTierFilter === t.tier ? null : t.tier)}
                    className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors ${
                      activeTierFilter === t.tier 
                        ? 'bg-white/20 text-white border-white/40' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                    title={`Filter by ${t.tier}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span>{t.tier}</span>
                    <span className="text-slate-400 font-bold">({t.count})</span>
                  </button>
                ))}
                {activeTierFilter && (
                  <button 
                    onClick={() => setActiveTierFilter(null)}
                    className="text-rose-400 hover:underline text-[10px] ml-1"
                  >
                    Clear Tier Filter ✕
                  </button>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* 3. MAIN BLUEPRINT COMPARISON VIEWPORT */}
      {evolutionData && (
        <div className="space-y-4">
          
          {/* Visual Legend for Architectural Diff Markers */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/80 rounded-2xl border border-white/10 text-xs font-mono shadow-md">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Diff Status Legend:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40 flex items-center justify-center text-[10px] text-black font-extrabold">+</span>
                <span className="text-emerald-300 font-semibold">Added Component</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-500/40 flex items-center justify-center text-[10px] text-black font-extrabold">Δ</span>
                <span className="text-amber-300 font-semibold">Modified / Refactored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-rose-500 bg-rose-500/20 border-dashed flex items-center justify-center text-[10px] text-rose-300 font-extrabold">✕</span>
                <span className="text-rose-400 font-semibold">Deleted / Deprecated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-slate-400">Unchanged</span>
              </div>
            </div>

            {/* Right side actions: Export & Clear Node */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/10"
                >
                  Clear Selected Node ✕
                </button>
              )}

              <button
                onClick={handleQuickExportDiffSvg}
                className="text-[11px] flex items-center gap-1 text-emerald-300 hover:text-white transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-semibold"
                title="Quick Export Vector SVG of Architecture Diff"
                id="diff-quick-svg-btn"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>SVG</span>
              </button>

              <button
                onClick={handleQuickExportDiffPng}
                className="text-[11px] flex items-center gap-1 text-sky-300 hover:text-white transition-colors bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/30 font-semibold"
                title="Quick Export High-Res PNG of Architecture Diff"
                id="diff-quick-png-btn"
              >
                <Download className="w-3 h-3 text-sky-400" />
                <span>PNG</span>
              </button>

              <button
                onClick={handleOpenExportDiff}
                className="text-[11px] flex items-center gap-1 text-violet-200 hover:text-white transition-all bg-violet-600/30 hover:bg-violet-600/50 px-2.5 py-1 rounded-lg border border-violet-500/40 font-bold shadow-sm"
                title="Open Export Options Studio for Diff Architecture"
                id="diff-export-studio-btn"
              >
                <Download className="w-3 h-3 text-violet-300" />
                <span>Export Diff</span>
              </button>
            </div>
          </div>

          {/* MODE 1: SIDE-BY-SIDE DUAL BLUEPRINT CANVASES */}
          {layoutMode === EvolutionViewLayout.SIDE_BY_SIDE && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Viewport: Base Version Blueprint */}
              <div className="glass-panel rounded-3xl p-2.5 border border-white/10 flex flex-col h-[580px] shadow-lg">
                <D3EvolutionGraph
                  ref={leftGraphRef}
                  data={evolutionData.baseGraph}
                  title={`BASE: ${baseCommit.tag ? `[TAG] ${baseCommit.tag}` : baseCommit.shortSha}`}
                  subTitle={baseCommit.message}
                  badgeColor="bg-slate-800 text-slate-300 border-white/15"
                  selectedNodeId={selectedNode?.id}
                  onNodeSelect={(node) => setSelectedNode(node)}
                  filterStatus={filterStatus}
                  onZoomChange={handleLeftZoom}
                  externalTransform={sharedTransform}
                />
              </div>

              {/* Right Viewport: Target Version Blueprint */}
              <div className="glass-panel rounded-3xl p-2.5 border border-emerald-500/30 flex flex-col h-[580px] shadow-lg">
                <D3EvolutionGraph
                  ref={rightGraphRef}
                  data={evolutionData.targetGraph}
                  title={`TARGET: ${targetCommit.tag ? `[TAG] ${targetCommit.tag}` : targetCommit.shortSha}`}
                  subTitle={targetCommit.message}
                  badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  selectedNodeId={selectedNode?.id}
                  onNodeSelect={(node) => setSelectedNode(node)}
                  filterStatus={filterStatus}
                  externalTransform={sharedTransform}
                />
              </div>

            </div>
          )}

          {/* MODE 2: UNIFIED ARCHITECTURAL DIFF OVERLAY */}
          {layoutMode === EvolutionViewLayout.UNIFIED_OVERLAY && (
            <div className="glass-panel rounded-3xl p-3 border border-white/10 h-[640px] shadow-lg">
              <D3EvolutionGraph
                ref={unifiedGraphRef}
                data={evolutionData.unifiedGraph}
                title={`UNIFIED BLUEPRINT OVERLAY (${baseCommit.tag || baseCommit.shortSha} → ${targetCommit.tag || targetCommit.shortSha})`}
                subTitle={`${summary?.addedCount || 0} Added • ${summary?.modifiedCount || 0} Modified • ${summary?.deletedCount || 0} Deprecated`}
                badgeColor="bg-violet-500/20 text-violet-300 border-violet-500/30"
                isUnified={true}
                selectedNodeId={selectedNode?.id}
                onNodeSelect={(node) => setSelectedNode(node)}
                filterStatus={filterStatus}
              />
            </div>
          )}

          {/* MODE 3: ARCHITECTURAL DIFF MATRIX & CHANGELOG */}
          {layoutMode === EvolutionViewLayout.CHANGELOG_MATRIX && (
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Architectural Churn Matrix ({evolutionData.unifiedGraph.nodes.length - 1} Modules)
                  </h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Detailed component changes grouped by architectural layer. Click any row to spotlight on diagram.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Search component or path..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-white/10 shadow-inner">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900/95 text-slate-400 border-b border-white/10 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Component Module</th>
                      <th className="p-3.5">Tier</th>
                      <th className="p-3.5">File Path</th>
                      <th className="p-3.5">Add / Del</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {evolutionData.unifiedGraph.nodes
                      .filter(n => n.id !== 'root')
                      .filter(n => filterStatus === 'all' || n.diffStatus === filterStatus)
                      .filter(n => !activeTierFilter || n.tier === activeTierFilter)
                      .filter(n => !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.path?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(node => (
                      <tr 
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`hover:bg-white/5 cursor-pointer transition-colors ${
                          selectedNode?.id === node.id ? 'bg-violet-500/15' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            node.diffStatus === 'added' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            node.diffStatus === 'modified' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            node.diffStatus === 'deleted' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {node.diffStatus === 'added' ? <PlusCircle className="w-3 h-3" /> :
                             node.diffStatus === 'modified' ? <Edit3 className="w-3 h-3" /> :
                             node.diffStatus === 'deleted' ? <MinusCircle className="w-3 h-3" /> : null}
                            {node.diffStatus}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-white flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-violet-400" />
                          <span>{node.label}</span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                            {node.tier || 'Services & Logic'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 truncate max-w-[260px]" title={node.path}>{node.path}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {node.additions ? <span className="text-emerald-400 font-bold">+{node.additions}</span> : null}
                            {node.deletions ? <span className="text-rose-400 font-bold">-{node.deletions}</span> : null}
                            {!node.additions && !node.deletions && <span className="text-slate-600">—</span>}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNode(node);
                              setLayoutMode(EvolutionViewLayout.SIDE_BY_SIDE);
                              setTimeout(() => {
                                leftGraphRef.current?.focusNode(node.id);
                                rightGraphRef.current?.focusNode(node.id);
                              }, 150);
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] border border-white/10"
                          >
                            Focus in Graph
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPONENT IMPACT INSPECTOR BAR */}
          {selectedNode && (
            <div className="glass-panel rounded-2xl p-4 border border-violet-500/40 flex flex-wrap items-center justify-between gap-4 font-mono text-xs animate-in slide-in-from-bottom-2 shadow-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  selectedNode.diffStatus === 'added' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                  selectedNode.diffStatus === 'modified' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                  selectedNode.diffStatus === 'deleted' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' :
                  'bg-slate-800 border-white/10 text-slate-300'
                }`}>
                  {selectedNode.diffStatus === 'added' ? <PlusCircle className="w-5 h-5" /> :
                   selectedNode.diffStatus === 'modified' ? <Edit3 className="w-5 h-5" /> :
                   selectedNode.diffStatus === 'deleted' ? <MinusCircle className="w-5 h-5" /> :
                   <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{selectedNode.label}</span>
                    <span className="text-slate-400 text-xs">({selectedNode.tier})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedNode.diffStatus === 'added' ? 'bg-emerald-500/20 text-emerald-300' :
                      selectedNode.diffStatus === 'modified' ? 'bg-amber-500/20 text-amber-300' :
                      selectedNode.diffStatus === 'deleted' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedNode.diffStatus}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{selectedNode.path || 'Root Module'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedNode.changesSummary && (
                  <span className="text-slate-300 italic hidden md:inline text-[11px] max-w-md">
                    "{selectedNode.changesSummary}"
                  </span>
                )}
                <button
                  onClick={() => {
                    leftGraphRef.current?.focusNode(selectedNode.id);
                    rightGraphRef.current?.focusNode(selectedNode.id);
                    unifiedGraphRef.current?.focusNode(selectedNode.id);
                  }}
                  className="px-3 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 rounded-lg text-xs font-semibold"
                >
                  Center Node
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. AI ARCHITECTURAL EVOLUTION AUDIT MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 border border-emerald-500/30 shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-violet-500/20 to-fuchsia-500/20 border border-emerald-500/30 text-emerald-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <span>AI Architectural Evolution Audit</span>
                    {aiInsight && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                        aiInsight.impactLevel === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        aiInsight.impactLevel === 'high' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {aiInsight.impactLevel} Impact
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Structural evolution analysis between {baseCommit.tag || baseCommit.shortSha} and {targetCommit.tag || targetCommit.shortSha}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {isGeneratingAi ? (
              <div className="py-14 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                <p className="text-emerald-300 font-mono text-xs animate-pulse tracking-wider">
                  GEMINI IS ANALYZING ARCHITECTURAL SHIFTS, CONTRACT CHANGES & REGRESSION RISKS...
                </p>
              </div>
            ) : aiInsight ? (
              <div className="space-y-5 font-mono text-xs animate-in fade-in">
                
                {/* Executive Summary */}
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-1.5">
                  <span className="text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                    Executive Summary
                  </span>
                  <p className="text-slate-200 text-sm font-sans leading-relaxed">
                    {aiInsight.executiveSummary}
                  </p>
                </div>

                {/* Architectural Shifts */}
                <div className="space-y-2">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Key Architectural Shifts
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {aiInsight.architecturalShifts.map((shift, i) => (
                      <div key={i} className="p-3 bg-slate-900/70 rounded-xl border border-white/5 flex items-start gap-2.5 text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">✓</span>
                        <span>{shift}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaking Changes & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2">
                    <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Breaking Changes & Deprecations
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiInsight.breakingChanges.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 space-y-2">
                    <span className="text-rose-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Regression Risks
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {aiInsight.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Migration Notes */}
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Migration & Consumption Checklist
                  </span>
                  <div className="space-y-1.5 text-slate-300">
                    {aiInsight.migrationNotes.map((note, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded bg-white/10 flex items-center justify-center text-[9px] text-violet-400">→</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <button
                onClick={handleCopyReport}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Copied Report' : 'Copy Full Report'}</span>
              </button>

              <button
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-xl font-mono text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Export Architecture Diff Blueprint Modal */}
      <ExportBlueprintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        repoName={repoName}
        svgElement={exportSvgElement}
        totalFiles={summary?.totalFiles}
        totalNodes={evolutionData?.unifiedGraph.nodes.length}
        totalLinks={evolutionData?.unifiedGraph.links.length}
        blueprintType="diff_blueprint"
      />

    </div>
  );
};
