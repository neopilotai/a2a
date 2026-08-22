/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { 
  RepoFileTree, 
  DataFlowGraph, 
  D3Node, 
  D3Link, 
  DiffStatus, 
  GitCommitItem, 
  EvolutionNodeDiff, 
  EvolutionLinkDiff, 
  EvolutionGraph, 
  EvolutionDiffSummary 
} from '../types';

export const DIFF_COLORS = {
  added: '#10b981',     // Neon Emerald Green
  modified: '#f59e0b',  // Neon Amber Gold
  deleted: '#ef4444',   // Neon Crimson Red
  unchanged: '#64748b', // Slate Muted
  addedBg: 'rgba(16, 185, 129, 0.15)',
  modifiedBg: 'rgba(245, 158, 11, 0.15)',
  deletedBg: 'rgba(239, 68, 68, 0.15)',
  unchangedBg: 'rgba(100, 116, 139, 0.08)',
};

const TIER_CATEGORIES = [
  { key: 'ui', label: 'UI / Components', color: '#38bdf8', match: /(components|views|pages|screens|ui|layouts|app|frontend)/i, group: 1 },
  { key: 'api', label: 'API / Endpoints', color: '#34d399', match: /(routes|controllers|endpoints|api|handlers|router|server)/i, group: 2 },
  { key: 'services', label: 'Services & Logic', color: '#fbbf24', match: /(services|usecases|managers|store|redux|context|hooks|lib)/i, group: 3 },
  { key: 'data', label: 'Data & Schemas', color: '#f472b6', match: /(models|schemas|db|database|entities|queries|repositories|prisma|drizzle)/i, group: 4 },
  { key: 'utils', label: 'Utils & Helpers', color: '#a78bfa', match: /(utils|helpers|common|shared|formatters|validators)/i, group: 5 },
  { key: 'config', label: 'Config & Types', color: '#2dd4bf', match: /(types|interfaces|config|constants|env|styles|index)/i, group: 6 },
];

export function getFileCategoryAndTier(filePath: string): { key: string; label: string; group: number; color: string } {
  for (const cat of TIER_CATEGORIES) {
    if (cat.match.test(filePath)) {
      return cat;
    }
  }
  return { key: 'services', label: 'Services & Logic', group: 3, color: '#fbbf24' };
}

/**
 * Derives a realistic historical file tree from a later file tree and chronological distance
 */
export function deriveHistoricalFileTree(
  currentTree: RepoFileTree[], 
  commitIndexFromLatest: number, 
  totalCommits: number
): RepoFileTree[] {
  if (commitIndexFromLatest === 0) return [...currentTree];

  // The older the commit, the fewer files it had, and some older files were replaced
  const fraction = Math.max(0.35, 1 - (commitIndexFromLatest / Math.max(1, totalCommits)) * 0.6);
  const targetCount = Math.floor(currentTree.length * fraction);

  // Take foundational files (configs, core entrypoints, basic models)
  const coreFiles = currentTree.filter(f => 
    f.path.includes('config') || 
    f.path.includes('index') || 
    f.path.includes('App') || 
    f.path.includes('main') ||
    f.path.includes('model') ||
    f.path.includes('types')
  );

  const otherFiles = currentTree.filter(f => !coreFiles.includes(f));
  const selectedOthers = otherFiles.slice(0, Math.max(5, targetCount - coreFiles.length));

  // Synthesize legacy files that might have been removed later in the older version
  const legacyFiles: RepoFileTree[] = [];
  if (commitIndexFromLatest >= 2) {
    legacyFiles.push({ path: 'src/legacy/old_state_dispatcher.js', type: 'blob' });
    legacyFiles.push({ path: 'src/utils/deprecated_xml_parser.ts', type: 'blob' });
  }
  if (commitIndexFromLatest >= 3) {
    legacyFiles.push({ path: 'src/services/monolith_sync_handler.js', type: 'blob' });
  }

  return [...coreFiles, ...selectedOthers, ...legacyFiles];
}

/**
 * Builds side-by-side evolution graphs and unified diff graph from Base and Target trees
 */
export function computeEvolutionGraphs(
  repoName: string,
  baseTree: RepoFileTree[],
  targetTree: RepoFileTree[],
  baseCommit: GitCommitItem,
  targetCommit: GitCommitItem,
  rawGitDiffFiles?: { filename: string; status: DiffStatus; additions?: number; deletions?: number }[]
): {
  baseGraph: EvolutionGraph;
  targetGraph: EvolutionGraph;
  unifiedGraph: EvolutionGraph;
  summary: EvolutionDiffSummary;
} {
  const baseMap = new Map<string, RepoFileTree>();
  baseTree.forEach(f => baseMap.set(f.path, f));

  const targetMap = new Map<string, RepoFileTree>();
  targetTree.forEach(f => targetMap.set(f.path, f));

  const gitDiffMap = new Map<string, { status: DiffStatus; additions: number; deletions: number }>();
  if (rawGitDiffFiles) {
    rawGitDiffFiles.forEach(f => {
      gitDiffMap.set(f.filename, {
        status: f.status,
        additions: f.additions || 0,
        deletions: f.deletions || 0
      });
    });
  }

  // All unique paths
  const allPaths = Array.from(new Set([...baseMap.keys(), ...targetMap.keys()]));

  // Categorize paths
  let addedCount = 0;
  let modifiedCount = 0;
  let deletedCount = 0;
  let unchangedCount = 0;

  const nodeDiffEntries: {
    path: string;
    label: string;
    diffStatus: DiffStatus;
    category: string;
    group: number;
    tier: string;
    additions: number;
    deletions: number;
    changesSummary: string;
  }[] = [];

  const tierCountMap = new Map<string, { count: number; color: string }>();

  allPaths.forEach((path) => {
    const inBase = baseMap.has(path);
    const inTarget = targetMap.has(path);
    const explicitDiff = gitDiffMap.get(path);

    let status: DiffStatus = 'unchanged';
    let additions = explicitDiff?.additions || 0;
    let deletions = explicitDiff?.deletions || 0;
    let changesSummary = 'Unmodified across revisions';

    if (explicitDiff) {
      status = explicitDiff.status;
    } else if (!inBase && inTarget) {
      status = 'added';
      additions = Math.floor(Math.random() * 80) + 15;
      changesSummary = 'New architectural component created';
    } else if (inBase && !inTarget) {
      status = 'deleted';
      deletions = Math.floor(Math.random() * 50) + 10;
      changesSummary = 'Deprecated / removed in target revision';
    } else {
      // Both in base and target: check if simulated modified
      const hashDiff = (path.length + baseCommit.timestamp + targetCommit.timestamp) % 5 === 0;
      if (hashDiff && baseCommit.sha !== targetCommit.sha) {
        status = 'modified';
        additions = Math.floor(Math.random() * 35) + 5;
        deletions = Math.floor(Math.random() * 20) + 2;
        changesSummary = 'Internal logic refactored & contracts updated';
      } else {
        status = 'unchanged';
      }
    }

    if (status === 'added') addedCount++;
    else if (status === 'modified') modifiedCount++;
    else if (status === 'deleted') deletedCount++;
    else unchangedCount++;

    const catInfo = getFileCategoryAndTier(path);
    const filename = path.split('/').pop() || path;
    const cleanLabel = filename.replace(/\.[^/.]+$/, '');

    if (status !== 'unchanged') {
      const current = tierCountMap.get(catInfo.label) || { count: 0, color: catInfo.color };
      tierCountMap.set(catInfo.label, { count: current.count + 1, color: catInfo.color });
    }

    nodeDiffEntries.push({
      path,
      label: cleanLabel,
      diffStatus: status,
      category: catInfo.key,
      group: catInfo.group,
      tier: catInfo.label,
      additions,
      deletions,
      changesSummary
    });
  });

  const totalFiles = allPaths.length;
  const churnRate = totalFiles > 0 
    ? Math.round(((addedCount + modifiedCount + deletedCount) / totalFiles) * 100)
    : 0;

  const impactedTiers = Array.from(tierCountMap.entries()).map(([tier, val]) => ({
    tier,
    count: val.count,
    color: val.color
  })).sort((a, b) => b.count - a.count);

  const summary: EvolutionDiffSummary = {
    addedCount,
    modifiedCount,
    deletedCount,
    unchangedCount,
    totalFiles,
    churnRate,
    baseCommit,
    targetCommit,
    impactedTiers
  };

  // Helper to build a graph from a subset of node diffs
  const buildGraphFromEntries = (entries: typeof nodeDiffEntries, isBaseOnly: boolean): EvolutionGraph => {
    const nodes: EvolutionNodeDiff[] = [];
    const links: EvolutionLinkDiff[] = [];

    // Root node
    const rootId = 'root';
    nodes.push({
      id: rootId,
      label: repoName || 'Repository',
      path: '',
      group: 0,
      category: 'root',
      diffStatus: 'unchanged',
      tier: 'Root Core'
    });

    const categoryGroups: { [key: number]: string[] } = {};

    entries.forEach((entry, idx) => {
      const nodeId = `node-${idx}-${entry.label}`;
      
      // If Base view, an item deleted in Target is displayed as 'deleted' marker or normal in base
      let displayStatus = entry.diffStatus;
      if (isBaseOnly) {
        if (entry.diffStatus === 'deleted') displayStatus = 'deleted';
        else if (entry.diffStatus === 'added') return; // Do not show added in base
      } else {
        // Target view
        if (entry.diffStatus === 'deleted') return; // Do not show deleted in pure target view unless unified
      }

      nodes.push({
        id: nodeId,
        label: entry.label,
        path: entry.path,
        group: entry.group,
        category: entry.category,
        diffStatus: displayStatus,
        tier: entry.tier,
        additions: entry.additions,
        deletions: entry.deletions,
        changesSummary: entry.changesSummary
      });

      if (!categoryGroups[entry.group]) categoryGroups[entry.group] = [];
      categoryGroups[entry.group].push(nodeId);

      // Link to root
      links.push({
        source: rootId,
        target: nodeId,
        value: 1,
        diffStatus: displayStatus
      });
    });

    // Interconnect nodes logically
    const group1 = categoryGroups[1] || []; // UI
    const group2 = categoryGroups[2] || []; // API
    const group3 = categoryGroups[3] || []; // Services
    const group4 = categoryGroups[4] || []; // Data

    group1.forEach((uiNode, i) => {
      if (group3.length > 0) {
        const targetSvc = group3[i % group3.length];
        links.push({ source: uiNode, target: targetSvc, value: 2, diffStatus: 'unchanged' });
      }
    });

    group2.forEach((apiNode, i) => {
      if (group3.length > 0) {
        const targetSvc = group3[i % group3.length];
        links.push({ source: apiNode, target: targetSvc, value: 2, diffStatus: 'unchanged' });
      }
    });

    group3.forEach((svcNode, i) => {
      if (group4.length > 0) {
        const targetData = group4[i % group4.length];
        links.push({ source: svcNode, target: targetData, value: 3, diffStatus: 'unchanged' });
      }
    });

    return { nodes, links };
  };

  // Build Base Graph
  const baseEntries = nodeDiffEntries.filter(e => baseMap.has(e.path));
  const baseGraph = buildGraphFromEntries(baseEntries, true);

  // Build Target Graph
  const targetEntries = nodeDiffEntries.filter(e => targetMap.has(e.path));
  const targetGraph = buildGraphFromEntries(targetEntries, false);

  // Build Unified Evolution Overlay Graph (contains all nodes with diff statuses)
  const unifiedNodes: EvolutionNodeDiff[] = [];
  const unifiedLinks: EvolutionLinkDiff[] = [];

  const rootId = 'root';
  unifiedNodes.push({
    id: rootId,
    label: repoName || 'Repository',
    path: '',
    group: 0,
    category: 'root',
    diffStatus: 'unchanged',
    tier: 'Root Core'
  });

  const catMap: { [key: number]: string[] } = {};

  nodeDiffEntries.forEach((entry, idx) => {
    const nodeId = `unified-${idx}-${entry.label}`;
    unifiedNodes.push({
      id: nodeId,
      label: entry.label,
      path: entry.path,
      group: entry.group,
      category: entry.category,
      diffStatus: entry.diffStatus,
      tier: entry.tier,
      additions: entry.additions,
      deletions: entry.deletions,
      changesSummary: entry.changesSummary
    });

    if (!catMap[entry.group]) catMap[entry.group] = [];
    catMap[entry.group].push(nodeId);

    unifiedLinks.push({
      source: rootId,
      target: nodeId,
      value: 1,
      diffStatus: entry.diffStatus
    });
  });

  // Cross links for unified
  const uGroup1 = catMap[1] || [];
  const uGroup3 = catMap[3] || [];
  const uGroup4 = catMap[4] || [];

  uGroup1.forEach((uiNode, i) => {
    if (uGroup3.length > 0) {
      unifiedLinks.push({ source: uiNode, target: uGroup3[i % uGroup3.length], value: 2, diffStatus: 'unchanged' });
    }
  });

  uGroup3.forEach((svcNode, i) => {
    if (uGroup4.length > 0) {
      unifiedLinks.push({ source: svcNode, target: uGroup4[i % uGroup4.length], value: 3, diffStatus: 'unchanged' });
    }
  });

  const unifiedGraph: EvolutionGraph = { nodes: unifiedNodes, links: unifiedLinks };

  return {
    baseGraph,
    targetGraph,
    unifiedGraph,
    summary
  };
}
