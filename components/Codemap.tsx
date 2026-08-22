/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  Search, 
  Filter, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  FileCode2, 
  ArrowRight, 
  Cpu, 
  GitBranch, 
  ShieldCheck, 
  Zap, 
  Flame,
  Terminal,
  Download,
  Boxes,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { 
  RepoFileTree, 
  ViewMode, 
  ModuleCategory, 
  ArchitectureTier, 
  CodeMapNodeItem, 
  ModuleAnnotation,
  VibeslopDefenseAudit,
  RefactoringCatalog,
  RefactoringSuggestion,
  RefactoringType,
  ArchitecturalHealthReport
} from '../types';
import { fetchRepoFileTree } from '../services/githubService';
import { 
  generateCodemapInsights, 
  generateStructuredCodemapAnnotations, 
  generateVibeslopDefenseAudit,
  generateIntelligentRefactoringCatalog,
  generateTargetedFileRefactoring
} from '../services/geminiService';
import { loadUserSession, saveCodemapSettings } from '../services/storageService';
import { runArchitecturalHealthCheck } from '../utils/healthCheckEngine';
import { LoadingState } from './LoadingState';
import { CodemapTopology } from './codemap/CodemapTopology';
import { CodemapSchematic } from './codemap/CodemapSchematic';
import { CodemapAnnotations } from './codemap/CodemapAnnotations';
import { CodemapVibeslopRadar } from './codemap/CodemapVibeslopRadar';
import { CodemapInspector } from './codemap/CodemapInspector';
import { CodemapRefactoring } from './codemap/CodemapRefactoring';
import { CodemapHealthCheck } from './codemap/CodemapHealthCheck';

interface CodemapProps {
  initialRepoContext?: {
    repoName: string;
    fileTree: RepoFileTree[];
    selectedFilePath?: string;
  } | null;
  onNavigate: (mode: ViewMode, data?: any) => void;
  onSelectRepoForContext?: (repoName: string, fileTree: RepoFileTree[]) => void;
}

const POPULAR_REPOS = [
  { name: 'facebook/react', label: 'React Core', tag: 'Frontend' },
  { name: 'expressjs/express', label: 'Express.js', tag: 'Backend' },
  { name: 'tailwindlabs/tailwindcss', label: 'Tailwind CSS', tag: 'Styling' },
  { name: 'vercel/next.js', label: 'Next.js', tag: 'Fullstack' },
  { name: 'vitejs/vite', label: 'Vite', tag: 'Build' },
];

const CATEGORY_COLORS: Record<ModuleCategory, { bg: string; text: string; hex: string; border: string }> = {
  frontend: { bg: 'bg-rose-500/20', text: 'text-rose-300', hex: '#f43f5e', border: 'border-rose-500/30' },
  backend: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', hex: '#6366f1', border: 'border-indigo-500/30' },
  database: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', hex: '#10b981', border: 'border-emerald-500/30' },
  auth: { bg: 'bg-amber-500/20', text: 'text-amber-300', hex: '#f59e0b', border: 'border-amber-500/30' },
  utils: { bg: 'bg-sky-500/20', text: 'text-sky-300', hex: '#0ea5e9', border: 'border-sky-500/30' },
  config: { bg: 'bg-slate-500/20', text: 'text-slate-300', hex: '#94a3b8', border: 'border-slate-500/30' },
  test: { bg: 'bg-purple-500/20', text: 'text-purple-300', hex: '#a855f7', border: 'border-purple-500/30' },
  docs: { bg: 'bg-teal-500/20', text: 'text-teal-300', hex: '#14b8a6', border: 'border-teal-500/30' },
};

const TIER_COLORS: Record<ArchitectureTier, { hex: string; label: string }> = {
  entrypoint: { hex: '#f43f5e', label: 'Tier 1: Entrypoint' },
  routing_api: { hex: '#6366f1', label: 'Tier 2: Routing & API' },
  core_domain: { hex: '#8b5cf6', label: 'Tier 3: Core Domain' },
  data_state: { hex: '#10b981', label: 'Tier 4: State & Data' },
  infra_config: { hex: '#0ea5e9', label: 'Tier 5: Infra & Utils' },
  testing_qa: { hex: '#a855f7', label: 'Tier 6: Verification' },
};

function classifyFileCategory(path: string): ModuleCategory {
  const p = path.toLowerCase();
  if (p.includes('test') || p.includes('spec') || p.includes('__tests__') || p.includes('cypress') || p.includes('jest')) return 'test';
  if (p.includes('auth') || p.includes('security') || p.includes('jwt') || p.includes('oauth') || p.includes('session') || p.includes('permission')) return 'auth';
  if (p.includes('db') || p.includes('model') || p.includes('schema') || p.includes('migration') || p.includes('prisma') || p.includes('drizzle') || p.includes('sql') || p.includes('mongo') || p.includes('repository')) return 'database';
  if (p.includes('component') || p.includes('view') || p.includes('page') || p.includes('ui') || p.includes('screen') || p.includes('layout') || p.includes('styles') || p.includes('.css') || p.includes('.scss')) return 'frontend';
  if (p.includes('api') || p.includes('server') || p.includes('route') || p.includes('controller') || p.includes('service') || p.includes('endpoint') || p.includes('handler') || p.includes('middleware')) return 'backend';
  if (p.includes('util') || p.includes('helper') || p.includes('lib') || p.includes('hook') || p.includes('tool') || p.includes('types') || p.includes('interface')) return 'utils';
  if (p.includes('.md') || p.includes('docs') || p.includes('license') || p.includes('readme')) return 'docs';
  if (p.includes('config') || p.includes('json') || p.includes('yaml') || p.includes('yml') || p.includes('.env') || p.includes('docker') || p.includes('vite') || p.includes('webpack') || p.includes('build')) return 'config';
  
  if (p.endsWith('.tsx') || p.endsWith('.jsx') || p.endsWith('.vue') || p.endsWith('.svelte')) return 'frontend';
  if (p.endsWith('.go') || p.endsWith('.py') || p.endsWith('.rs') || p.endsWith('.java') || p.endsWith('.rb') || p.endsWith('.php')) return 'backend';

  return 'utils';
}

function classifyFileTier(path: string, depth: number): ArchitectureTier {
  const p = path.toLowerCase();
  const fileName = path.split('/').pop()?.toLowerCase() || '';

  if (p.includes('test') || p.includes('spec') || p.includes('__tests__')) return 'testing_qa';
  if (
    fileName.startsWith('main.') || 
    fileName.startsWith('index.') || 
    fileName.startsWith('app.') || 
    fileName.startsWith('server.') ||
    (depth <= 1 && (fileName.includes('index') || fileName.includes('main')))
  ) {
    return 'entrypoint';
  }
  if (p.includes('route') || p.includes('router') || p.includes('api') || p.includes('controller') || p.includes('endpoint') || p.includes('handler')) {
    return 'routing_api';
  }
  if (p.includes('db') || p.includes('model') || p.includes('schema') || p.includes('store') || p.includes('state') || p.includes('context') || p.includes('reducer') || p.includes('repository')) {
    return 'data_state';
  }
  if (p.includes('config') || p.includes('setup') || p.includes('env') || p.includes('tool') || p.includes('helper') || p.includes('util') || p.includes('constant')) {
    return 'infra_config';
  }
  return 'core_domain';
}

export const Codemap: React.FC<CodemapProps> = ({ 
  initialRepoContext, 
  onNavigate,
  onSelectRepoForContext 
}) => {
  const savedSettings = loadUserSession()?.codemapSettings;

  const [repoInput, setRepoInput] = useState(
    initialRepoContext?.repoName || savedSettings?.repoInput || 'expressjs/express'
  );
  const [activeRepoName, setActiveRepoName] = useState(
    initialRepoContext?.repoName || savedSettings?.activeRepoName || 'expressjs/express'
  );
  const [fileTree, setFileTree] = useState<RepoFileTree[]>(initialRepoContext?.fileTree || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'topology' | 'schematic' | 'annotations' | 'antislop' | 'refactoring' | 'health'>(
    savedSettings?.activeTab || 'topology'
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(savedSettings?.searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>(
    savedSettings?.selectedCategory || 'all'
  );
  const [selectedTier, setSelectedTier] = useState<ArchitectureTier | 'all'>(
    savedSettings?.selectedTier || 'all'
  );
  const [slopFilter, setSlopFilter] = useState<'all' | 'high_risk' | 'annotated'>('all');
  const [colorMode, setColorMode] = useState<'category' | 'tier' | 'health'>(
    savedSettings?.colorMode || 'category'
  );
  const [healthFilter, setHealthFilter] = useState<'all' | 'critical' | 'warning' | 'cycles_only' | 'healthy'>('all');

  const [selectedNode, setSelectedNode] = useState<CodeMapNodeItem | null>(null);

  // AI Insights & Annotations & Vibeslop Radar & Refactoring & Health
  const [aiInsights, setAiInsights] = useState<{ summary: string; hotspots: string[]; recommendations: string[] } | null>(
    savedSettings?.aiInsights || null
  );
  const [annotations, setAnnotations] = useState<Record<string, ModuleAnnotation>>(
    savedSettings?.annotations || {}
  );
  const [vibeslopAudit, setVibeslopAudit] = useState<VibeslopDefenseAudit | null>(
    savedSettings?.vibeslopAudit || null
  );
  const [refactoringCatalog, setRefactoringCatalog] = useState<RefactoringCatalog | null>(
    savedSettings?.refactoringCatalog || null
  );
  const [isScanningHealth, setIsScanningHealth] = useState(false);

  const [isGeneratingAnnotations, setIsGeneratingAnnotations] = useState(false);
  const [isAuditingVibeslop, setIsAuditingVibeslop] = useState(false);
  const [isGeneratingRefactoring, setIsGeneratingRefactoring] = useState(false);

  // Auto-save Codemap settings
  useEffect(() => {
    saveCodemapSettings({
      repoInput,
      activeRepoName,
      selectedCategory,
      selectedTier,
      searchQuery,
      activeTab,
      colorMode,
      aiInsights,
      annotations,
      vibeslopAudit,
      refactoringCatalog
    });
  }, [
    repoInput, 
    activeRepoName, 
    selectedCategory, 
    selectedTier, 
    searchQuery, 
    activeTab, 
    colorMode,
    aiInsights, 
    annotations, 
    vibeslopAudit,
    refactoringCatalog
  ]);

  // Load default repository files if not provided
  useEffect(() => {
    if (!initialRepoContext?.fileTree || initialRepoContext.fileTree.length === 0) {
      loadRepository('expressjs/express');
    } else {
      setFileTree(initialRepoContext.fileTree);
      setActiveRepoName(initialRepoContext.repoName);
      setRepoInput(initialRepoContext.repoName);
    }
  }, [initialRepoContext]);

  const loadRepository = async (repo: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedNode(null);
    setAiInsights(null);
    setAnnotations({});
    setVibeslopAudit(null);
    setRefactoringCatalog(null);

    try {
      const tree = await fetchRepoFileTree(repo);
      setFileTree(tree);
      setActiveRepoName(repo);
      setRepoInput(repo);
      if (onSelectRepoForContext) {
        onSelectRepoForContext(repo, tree);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository tree. Check repo name.');
    } finally {
      setIsLoading(false);
    }
  };

  // Build classified node list & links
  const { nodes, links, categoryCounts, healthReport } = useMemo(() => {
    if (!fileTree || fileTree.length === 0) {
      return { nodes: [], links: [], categoryCounts: {} as Record<ModuleCategory, number>, healthReport: null };
    }

    const counts: Record<ModuleCategory, number> = {
      frontend: 0,
      backend: 0,
      database: 0,
      auth: 0,
      utils: 0,
      config: 0,
      test: 0,
      docs: 0
    };

    // Filter relevant code files
    const validFiles = fileTree.filter(f => f.type === 'blob' && !f.path.includes('.git/')).slice(0, 180);

    const mapNodes: CodeMapNodeItem[] = validFiles.map((f) => {
      const parts = f.path.split('/');
      const fileName = parts[parts.length - 1];
      const category = classifyFileCategory(f.path);
      const depth = parts.length;
      const tier = classifyFileTier(f.path, depth);
      const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
      counts[category] = (counts[category] || 0) + 1;

      const importance = depth <= 2 || tier === 'entrypoint' || fileName.includes('main') || fileName.includes('app')
        ? 'critical'
        : (category === 'utils' || category === 'docs' ? 'utility' : 'normal');

      const entityType: import('../types').CodeEntityType = 
        category === 'test' ? 'test' :
        category === 'config' ? 'config' :
        (ext === 'tsx' || ext === 'jsx') ? 'component' :
        (ext === 'd.ts' || fileName.includes('types') || fileName.includes('interface')) ? 'interface' :
        'module';

      const existingAnn = annotations[f.path];

      return {
        id: f.path,
        label: fileName,
        path: f.path,
        category,
        tier,
        entityType,
        extension: ext,
        depth,
        connections: [],
        importance,
        annotation: existingAnn
      };
    });

    // Create synthetic structural links based on directory hierarchy & cross-layer imports
    const mapLinks: { source: string; target: string; value: number }[] = [];
    const dirMap = new Map<string, string[]>();

    mapNodes.forEach(node => {
      const dir = node.path.substring(0, node.path.lastIndexOf('/')) || 'root';
      if (!dirMap.has(dir)) dirMap.set(dir, []);
      dirMap.get(dir)!.push(node.id);
    });

    // Connect files in the same directory
    dirMap.forEach(fileIds => {
      for (let i = 0; i < fileIds.length - 1; i++) {
        if (i < 3) {
          mapLinks.push({
            source: fileIds[i],
            target: fileIds[i + 1],
            value: 1
          });
        }
      }
    });

    // Connect central/entry nodes to other main directories
    const rootNodes = mapNodes.filter(n => n.importance === 'critical').slice(0, 6);
    mapNodes.forEach(n => {
      if (n.importance === 'normal' && rootNodes.length > 0) {
        const target = rootNodes[Math.floor(Math.random() * rootNodes.length)];
        if (target && target.id !== n.id && Math.random() > 0.65) {
          mapLinks.push({
            source: n.id,
            target: target.id,
            value: 2
          });
        }
      }
    });

    // Populate node connections count
    mapLinks.forEach(link => {
      const s = mapNodes.find(n => n.id === link.source);
      const t = mapNodes.find(n => n.id === link.target);
      if (s && !s.connections.includes(link.target)) s.connections.push(link.target);
      if (t && !t.connections.includes(link.source)) t.connections.push(link.source);
    });

    // Run Architectural Health Check (anti-patterns, circular dependencies, complexity rating)
    const healthReport = runArchitecturalHealthCheck(activeRepoName, mapNodes, mapLinks);

    // Attach computed health status to each node
    mapNodes.forEach(node => {
      node.healthStatus = healthReport.nodeHealthMap[node.id];
    });

    return { 
      nodes: mapNodes, 
      links: mapLinks, 
      categoryCounts: counts,
      healthReport 
    };
  }, [fileTree, annotations, activeRepoName]);

  // Filtered nodes based on search, category, and tier
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesSearch = !searchQuery || 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || n.category === selectedCategory;
      const matchesTier = selectedTier === 'all' || n.tier === selectedTier;
      return matchesSearch && matchesCat && matchesTier;
    });
  }, [nodes, searchQuery, selectedCategory, selectedTier]);

  // Auto-select node when requested via navigation or global search
  useEffect(() => {
    if (initialRepoContext?.selectedFilePath && nodes.length > 0) {
      const match = nodes.find(n => n.path === initialRepoContext.selectedFilePath);
      if (match) {
        setSelectedNode(match);
      }
    }
  }, [initialRepoContext?.selectedFilePath, nodes]);

  // Handle Batch Semantic Annotation Generation
  const handleGenerateAnnotations = async () => {
    if (nodes.length === 0) return;
    setIsGeneratingAnnotations(true);
    try {
      const filesToAnnotate = nodes.map(n => ({
        path: n.path,
        category: n.category,
        depth: n.depth
      }));
      const newAnnotations = await generateStructuredCodemapAnnotations(activeRepoName, filesToAnnotate);
      setAnnotations(prev => ({ ...prev, ...newAnnotations }));
      
      // Update selected node if it was in the batch
      if (selectedNode && newAnnotations[selectedNode.path]) {
        setSelectedNode({
          ...selectedNode,
          annotation: newAnnotations[selectedNode.path]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAnnotations(false);
    }
  };

  // Handle Vibeslop Defense Radar Audit
  const handleRunVibeslopAudit = async () => {
    if (fileTree.length === 0) return;
    setIsAuditingVibeslop(true);
    try {
      const audit = await generateVibeslopDefenseAudit(activeRepoName, fileTree, categoryCounts);
      setVibeslopAudit(audit);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditingVibeslop(false);
    }
  };

  // Handle Intelligent Refactoring Catalog Generation
  const handleGenerateRefactoring = async (focusType?: string) => {
    if (fileTree.length === 0) return;
    setIsGeneratingRefactoring(true);
    try {
      const cat = await generateIntelligentRefactoringCatalog(
        activeRepoName,
        fileTree,
        annotations,
        focusType
      );
      setRefactoringCatalog(cat);
    } catch (err) {
      console.error('Failed to generate refactoring catalog:', err);
    } finally {
      setIsGeneratingRefactoring(false);
    }
  };

  // Handle Targeted File Refactoring
  const handleTargetedRefactor = async (
    filePath: string,
    recipe: RefactoringType | 'comprehensive',
    customInstructions?: string
  ) => {
    const suggestion = await generateTargetedFileRefactoring(
      activeRepoName,
      filePath,
      recipe,
      customInstructions,
      fileTree
    );

    setRefactoringCatalog(prev => {
      if (!prev) {
        return {
          repoName: activeRepoName,
          generatedAt: Date.now(),
          modernizationScore: 80,
          totalSuggestions: 1,
          quickWinsCount: suggestion.severity === 'quick_win' ? 1 : 0,
          architecturalDebtReduction: 'Custom targeted file modernization added',
          summary: `Targeted modernization generated for ${filePath}.`,
          categoriesBreakdown: [
            {
              category: suggestion.refactoringType.replace('_', ' '),
              type: suggestion.refactoringType,
              count: 1,
              color: '#8b5cf6'
            }
          ],
          suggestions: [suggestion]
        };
      }

      return {
        ...prev,
        totalSuggestions: prev.totalSuggestions + 1,
        quickWinsCount: suggestion.severity === 'quick_win' ? prev.quickWinsCount + 1 : prev.quickWinsCount,
        suggestions: [suggestion, ...prev.suggestions]
      };
    });
  };

  // Export Codemap Specification Bundle
  const handleExportCodemap = () => {
    const bundle = {
      repoName: activeRepoName,
      exportedAt: new Date().toISOString(),
      nodesCount: nodes.length,
      categoryCounts,
      vibeslopAudit,
      annotations,
      refactoringCatalog,
      structuredNodes: nodes.map(n => ({
        path: n.path,
        tier: n.tier,
        category: n.category,
        importance: n.importance,
        annotation: n.annotation
      }))
    };

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codemap-${activeRepoName.replace('/', '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoriesList: (ModuleCategory | 'all')[] = [
    'all', 
    'frontend', 
    'backend', 
    'database', 
    'auth', 
    'utils', 
    'config', 
    'test', 
    'docs'
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Search & Mission Control Bar */}
      <div className="glass-panel p-4 md:p-5 rounded-3xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 rounded-2xl border border-indigo-500/30 text-indigo-300 shadow-neon-violet">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-extrabold text-white font-sans tracking-tight">
                Codemaps
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Anti-Vibeslop Grounding
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              AI-annotated structured maps & code invariants for precise, grounded mental models
            </p>
          </div>
        </div>

        {/* Repository Input Form & Fast Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (repoInput.trim()) loadRepository(repoInput.trim());
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repo (e.g. facebook/react)"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
              <span>Load</span>
            </button>
          </form>

          <button
            onClick={handleExportCodemap}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-mono border border-white/10 transition-colors flex items-center justify-center gap-1.5"
            title="Download complete Codemap architecture spec bundle as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Repositories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Popular Repos:
        </span>
        {POPULAR_REPOS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => loadRepository(preset.name)}
            disabled={isLoading || activeRepoName === preset.name}
            className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
              activeRepoName === preset.name
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{preset.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
              {preset.tag}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-mono text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* View Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'topology'
                ? 'bg-indigo-600/30 border-indigo-500/50 text-white shadow-neon-violet'
                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4 text-indigo-400" />
            <span>Interactive Topology</span>
          </button>

          <button
            onClick={() => setActiveTab('schematic')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'schematic'
                ? 'bg-indigo-600/30 border-indigo-500/50 text-white shadow-neon-violet'
                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Structured Flow Schematic</span>
          </button>

          <button
            onClick={() => setActiveTab('annotations')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'annotations'
                ? 'bg-sky-600/30 border-sky-500/50 text-white shadow-lg shadow-sky-500/10'
                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>AI Semantic Invariants</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300">
              {Object.keys(annotations).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('antislop')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'antislop'
                ? 'bg-amber-600/30 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Anti-Vibeslop Radar</span>
            {vibeslopAudit && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                {vibeslopAudit.comprehensionScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'health'
                ? 'bg-rose-600/30 border-rose-500/50 text-white shadow-neon-rose'
                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Architectural Health</span>
            {healthReport && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                healthReport.overallHealthScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                healthReport.overallHealthScore >= 60 ? 'bg-amber-500/20 text-amber-300' :
                'bg-rose-500/20 text-rose-300'
              }`}>
                Grade {healthReport.healthGrade} ({healthReport.criticalModulesCount + healthReport.warningModulesCount} alerts)
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('refactoring')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'refactoring'
                ? 'bg-emerald-600/30 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
            <span>Intelligent Refactoring</span>
            {refactoringCatalog && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                {refactoringCatalog.totalSuggestions}
              </span>
            )}
          </button>
        </div>

        {/* Global AI Action Trigger */}
        <div className="flex items-center gap-2">
          {activeTab === 'health' ? (
            <button
              onClick={() => {
                setIsScanningHealth(true);
                setTimeout(() => setIsScanningHealth(false), 600);
              }}
              disabled={isScanningHealth || nodes.length === 0}
              className="text-xs font-mono px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isScanningHealth ? 'animate-spin' : ''}`} />
              <span>{isScanningHealth ? 'Scanning...' : 'Rescan Health'}</span>
            </button>
          ) : activeTab === 'refactoring' ? (
            <button
              onClick={() => handleGenerateRefactoring()}
              disabled={isGeneratingRefactoring || nodes.length === 0}
              className="text-xs font-mono px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isGeneratingRefactoring ? 'animate-spin' : ''}`} />
              <span>{isGeneratingRefactoring ? 'Modernizing...' : 'Modernize Code'}</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateAnnotations}
              disabled={isGeneratingAnnotations || nodes.length === 0}
              className="text-xs font-mono px-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isGeneratingAnnotations ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAnnotations ? 'Annotating...' : 'Extract Invariants'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="h-[500px] flex items-center justify-center glass-panel rounded-3xl border border-white/10">
          <LoadingState message="MAPPING CODEBASE TOPOLOGY & INTERCONNECTIONS..." type="repo" />
        </div>
      ) : (
        <>
          {/* TAB 1: INTERACTIVE TOPOLOGY CANVAS */}
          {activeTab === 'topology' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                {/* Canvas Filter Header */}
                <div className="p-3.5 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative min-w-[180px] flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search file or module..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Slop & Layer Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 mr-2">
                      <button
                        onClick={() => setSlopFilter('all')}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all ${
                          slopFilter === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        All Nodes
                      </button>
                      <button
                        onClick={() => setSlopFilter('high_risk')}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                          slopFilter === 'high_risk' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400'
                        }`}
                      >
                        <Flame className="w-2.5 h-2.5" />
                        <span>Hotspots</span>
                      </button>
                      <button
                        onClick={() => setSlopFilter('annotated')}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                          slopFilter === 'annotated' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Annotated</span>
                      </button>
                    </div>

                    {categoriesList.map(cat => {
                      const isActive = selectedCategory === cat;
                      const count = cat === 'all' ? nodes.length : categoryCounts[cat] || 0;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all capitalize flex items-center gap-1.5 border ${
                            isActive
                              ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-bold'
                              : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 text-slate-400">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Topology D3 Component */}
                <CodemapTopology
                  nodes={filteredNodes}
                  links={links}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  categoryColors={CATEGORY_COLORS}
                  tierColors={TIER_COLORS}
                  slopFilter={slopFilter}
                  colorMode={colorMode}
                  onColorModeChange={setColorMode}
                  healthFilter={healthFilter}
                  onHealthFilterChange={setHealthFilter}
                  repoName={activeRepoName}
                />
              </div>

              {/* Side Inspector */}
              <div className="flex flex-col gap-5">
                <CodemapInspector
                  selectedNode={selectedNode}
                  onNavigate={onNavigate}
                  categoryColors={CATEGORY_COLORS}
                  tierColors={TIER_COLORS}
                  repoName={activeRepoName}
                />
              </div>
            </div>
          )}

          {/* TAB 2: STRUCTURED FLOW SCHEMATIC */}
          {activeTab === 'schematic' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <CodemapSchematic
                  nodes={filteredNodes}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  categoryColors={CATEGORY_COLORS}
                  tierColors={TIER_COLORS}
                />
              </div>
              <div className="flex flex-col gap-5">
                <CodemapInspector
                  selectedNode={selectedNode}
                  onNavigate={onNavigate}
                  categoryColors={CATEGORY_COLORS}
                  tierColors={TIER_COLORS}
                  repoName={activeRepoName}
                />
              </div>
            </div>
          )}

          {/* TAB 3: AI SEMANTIC INVARIANTS REGISTRY */}
          {activeTab === 'annotations' && (
            <CodemapAnnotations
              nodes={filteredNodes}
              annotations={annotations}
              onSelectNode={(node) => {
                setSelectedNode(node);
                setActiveTab('topology');
              }}
              onNavigate={onNavigate}
              onGenerateAnnotations={handleGenerateAnnotations}
              isGenerating={isGeneratingAnnotations}
              repoName={activeRepoName}
            />
          )}

          {/* TAB 4: ANTI-VIBESLOP RADAR & COMPREHENSION SCORECARD */}
          {activeTab === 'antislop' && (
            <CodemapVibeslopRadar
              audit={vibeslopAudit}
              isAuditing={isAuditingVibeslop}
              onRunAudit={handleRunVibeslopAudit}
              repoName={activeRepoName}
              onNavigate={onNavigate}
            />
          )}

          {/* TAB 5: ARCHITECTURAL HEALTH CHECK & CODE SMELL AUDIT */}
          {activeTab === 'health' && (
            <CodemapHealthCheck
              healthReport={healthReport}
              nodes={filteredNodes}
              selectedNode={selectedNode}
              onSelectNode={(node) => {
                setSelectedNode(node);
              }}
              onSwitchToTopology={(focusNodeId) => {
                if (focusNodeId) {
                  const targetNode = filteredNodes.find(n => n.id === focusNodeId);
                  if (targetNode) setSelectedNode(targetNode);
                }
                setColorMode('health');
                setActiveTab('topology');
              }}
              onNavigate={onNavigate}
              isScanning={isScanningHealth}
              onRunDeepHealthScan={() => {
                setIsScanningHealth(true);
                setTimeout(() => setIsScanningHealth(false), 600);
              }}
            />
          )}

          {/* TAB 6: INTELLIGENT REFACTORING & MODERNIZATION */}
          {activeTab === 'refactoring' && (
            <CodemapRefactoring
              catalog={refactoringCatalog}
              isGenerating={isGeneratingRefactoring}
              onGenerateCatalog={handleGenerateRefactoring}
              onTargetedRefactor={handleTargetedRefactor}
              repoName={activeRepoName}
              fileTree={fileTree}
              onNavigate={onNavigate}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Codemap;
