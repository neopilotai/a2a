/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { D3Node, D3Link, DataFlowGraph, FileImpactAnalysis, ConsumingComponentInfo, DownstreamDependencyInfo, TierBlastRadius } from '../types';

/**
 * Deterministically estimates realistic lines of code (LOC) for a file
 * based on file extension, architectural category, depth, and label characteristics.
 */
export function estimateFileLinesOfCode(path?: string, label?: string, category?: string): number {
  if (!path && !label) return 150;
  const filePath = (path || label || '').toLowerCase();
  
  // Base lines by file extension / role
  let baseLoc = 180;
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    baseLoc = 260;
  } else if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    if (filePath.includes('service') || filePath.includes('engine') || filePath.includes('pipeline')) {
      baseLoc = 380;
    } else if (filePath.includes('type') || filePath.includes('interface')) {
      baseLoc = 140;
    } else {
      baseLoc = 220;
    }
  } else if (filePath.endsWith('.json') || filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    baseLoc = 75;
  } else if (filePath.endsWith('.sql') || filePath.endsWith('.prisma')) {
    baseLoc = 190;
  } else if (filePath.endsWith('.py')) {
    baseLoc = 240;
  } else if (filePath.endsWith('.go') || filePath.endsWith('.rs')) {
    baseLoc = 320;
  } else if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
    baseLoc = 160;
  } else if (filePath.endsWith('.md')) {
    baseLoc = 110;
  }

  // Adjust by category
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes('core') || cat.includes('root') || cat.includes('orchestrat')) baseLoc += 120;
    if (cat.includes('service') || cat.includes('api')) baseLoc += 80;
    if (cat.includes('data') || cat.includes('store')) baseLoc += 60;
  }

  // Deterministic jitter based on string hash for realistic variation
  let hash = 0;
  const str = path || label || 'code';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const jitter = (Math.abs(hash) % 120) - 50;

  return Math.max(25, baseLoc + jitter);
}

/**
 * Calculates complete architectural Impact Factor and blast radius metrics for a chosen graph node.
 */
export function calculateFileImpact(
  selectedNode: D3Node,
  graph: DataFlowGraph
): FileImpactAnalysis {
  const nodes = graph.nodes || [];
  const links = graph.links || [];
  const totalNodesCount = Math.max(1, nodes.length);

  // Map of node ID to Node
  const nodeMap = new Map<string, D3Node>();
  const nodeLocMap = new Map<string, number>();
  nodes.forEach(n => {
    nodeMap.set(n.id, n);
    nodeLocMap.set(n.id, estimateFileLinesOfCode(n.path, n.label, n.category));
  });

  const selfLoc = nodeLocMap.get(selectedNode.id) || estimateFileLinesOfCode(selectedNode.path, selectedNode.label, selectedNode.category);

  // Helper to extract node id from link endpoint
  const getLinkId = (endpoint: string | D3Node | any): string => {
    if (typeof endpoint === 'object' && endpoint !== null && 'id' in endpoint) {
      return (endpoint as D3Node).id;
    }
    return String(endpoint);
  };

  // Build adjacency maps
  // incomingMap: target -> sources (who calls this node)
  const incomingMap = new Map<string, string[]>();
  // outgoingMap: source -> targets (who this node calls)
  const outgoingMap = new Map<string, string[]>();

  links.forEach(l => {
    const sourceId = getLinkId(l.source);
    const targetId = getLinkId(l.target);

    if (!outgoingMap.has(sourceId)) outgoingMap.set(sourceId, []);
    outgoingMap.get(sourceId)!.push(targetId);

    if (!incomingMap.has(targetId)) incomingMap.set(targetId, []);
    incomingMap.get(targetId)!.push(sourceId);
  });

  // 1. Traverse Upstream to find all Consuming Components (Callers)
  const consumingComponents: ConsumingComponentInfo[] = [];
  const visitedUpstream = new Set<string>([selectedNode.id]);
  const queueUpstream: { id: string; distance: number }[] = [];

  const directCallers = incomingMap.get(selectedNode.id) || [];
  directCallers.forEach(callerId => {
    if (!visitedUpstream.has(callerId)) {
      visitedUpstream.add(callerId);
      queueUpstream.push({ id: callerId, distance: 1 });
    }
  });

  let directConsumingCount = 0;
  let transitiveConsumingCount = 0;

  while (queueUpstream.length > 0) {
    const { id, distance } = queueUpstream.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      const loc = nodeLocMap.get(id) || 150;
      if (distance === 1) directConsumingCount++;
      else transitiveConsumingCount++;

      consumingComponents.push({
        id: node.id,
        label: node.label,
        path: node.path,
        folder: node.folder,
        techBadge: node.techBadge,
        techColor: node.techColor,
        distance,
        loc
      });

      // Next level callers
      const nextCallers = incomingMap.get(id) || [];
      nextCallers.forEach(nextId => {
        if (!visitedUpstream.has(nextId)) {
          visitedUpstream.add(nextId);
          queueUpstream.push({ id: nextId, distance: distance + 1 });
        }
      });
    }
  }

  // 2. Traverse Downstream to find all Dependencies and calculate Downstream Lines of Code
  const downstreamDependencies: DownstreamDependencyInfo[] = [];
  const visitedDownstream = new Set<string>([selectedNode.id]);
  const queueDownstream: { id: string; distance: number }[] = [];

  const directDeps = outgoingMap.get(selectedNode.id) || [];
  directDeps.forEach(depId => {
    if (!visitedDownstream.has(depId)) {
      visitedDownstream.add(depId);
      queueDownstream.push({ id: depId, distance: 1 });
    }
  });

  let directDownstreamCount = 0;
  let transitiveDownstreamCount = 0;
  let totalDownstreamLoc = 0;

  while (queueDownstream.length > 0) {
    const { id, distance } = queueDownstream.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      const loc = nodeLocMap.get(id) || 150;
      totalDownstreamLoc += loc;
      if (distance === 1) directDownstreamCount++;
      else transitiveDownstreamCount++;

      downstreamDependencies.push({
        id: node.id,
        label: node.label,
        path: node.path,
        folder: node.folder,
        techBadge: node.techBadge,
        techColor: node.techColor,
        distance,
        loc
      });

      // Next level dependencies
      const nextDeps = outgoingMap.get(id) || [];
      nextDeps.forEach(nextId => {
        if (!visitedDownstream.has(nextId)) {
          visitedDownstream.add(nextId);
          queueDownstream.push({ id: nextId, distance: distance + 1 });
        }
      });
    }
  }

  const totalConsumingComponents = consumingComponents.length;
  const totalDownstreamNodes = downstreamDependencies.length;
  const combinedImpactedLoc = selfLoc + totalDownstreamLoc;

  // 3. Compute Blast Radius across Architectural Tiers
  const tierCategories = [
    { name: 'Core & Root', category: 'core', color: '#8b5cf6' },
    { name: 'UI & Presentation', category: 'presentation', color: '#38bdf8' },
    { name: 'API & Handlers', category: 'api', color: '#34d399' },
    { name: 'Services & Domain', category: 'services', color: '#fbbf24' },
    { name: 'Data & Persistence', category: 'data', color: '#f472b6' },
    { name: 'Config & Shared Utilities', category: 'utils', color: '#a78bfa' }
  ];

  // Set of all affected node IDs (self + upstream consumers + downstream deps)
  const allAffectedNodeIds = new Set<string>([selectedNode.id, ...visitedUpstream, ...visitedDownstream]);
  const blastRadiusPercent = Math.min(100, Math.round((allAffectedNodeIds.size / totalNodesCount) * 100));

  const tierBreakdown: TierBlastRadius[] = tierCategories.map(tier => {
    const tierNodes = nodes.filter(n => {
      const g = n.group;
      if (tier.category === 'core') return g === 0;
      if (tier.category === 'presentation') return g === 1;
      if (tier.category === 'api') return g === 2;
      if (tier.category === 'services') return g === 3;
      if (tier.category === 'data') return g === 4;
      return g >= 5;
    });

    const affectedInTier = tierNodes.filter(n => allAffectedNodeIds.has(n.id)).length;
    const totalInTier = Math.max(1, tierNodes.length);
    const percentage = Math.round((affectedInTier / totalInTier) * 100);

    return {
      tierName: tier.name,
      category: tier.category,
      color: tier.color,
      affectedCount: affectedInTier,
      totalTierCount: totalInTier,
      percentage
    };
  }).filter(t => t.totalTierCount > 0);

  // 4. Calculate Mathematical Impact Factor Score (0 to 100)
  // Weightings:
  // - Consuming Components (Inbound fan-in gravity): 38%
  // - Downstream LOC & dependencies reach: 37%
  // - Architectural Centrality / Tier Criticality: 25%
  
  const consumingScore = Math.min(38, (totalConsumingComponents / Math.max(3, totalNodesCount * 0.25)) * 38);
  const downstreamScore = Math.min(37, ((totalDownstreamNodes + (totalDownstreamLoc / 1200)) / Math.max(4, totalNodesCount * 0.35)) * 37);
  
  // Tier weight
  let tierBaseWeight = 8;
  const isRoot = selectedNode.id === 'root' || selectedNode.group === 0;
  if (isRoot) tierBaseWeight = 25;
  else if (selectedNode.group === 6 || selectedNode.group === 5) tierBaseWeight = 22; // Config / Utils
  else if (selectedNode.group === 3 || selectedNode.group === 2) tierBaseWeight = 18; // Services / API
  else if (selectedNode.group === 4) tierBaseWeight = 16; // Data
  else tierBaseWeight = 10; // UI Component

  const rawScore = Math.round(consumingScore + downstreamScore + tierBaseWeight);
  const impactScore = Math.min(100, Math.max(12, rawScore));

  // Determine Impact Level & Color
  let impactLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let impactColor = '#34d399'; // Emerald
  if (impactScore >= 75 || isRoot) {
    impactLevel = 'critical';
    impactColor = '#f43f5e'; // Rose / Red
  } else if (impactScore >= 50) {
    impactLevel = 'high';
    impactColor = '#fb923c'; // Amber / Orange
  } else if (impactScore >= 25) {
    impactLevel = 'moderate';
    impactColor = '#38bdf8'; // Sky blue
  } else {
    impactLevel = 'low';
    impactColor = '#34d399'; // Emerald
  }

  // 5. Generate Risk Summary and Refactoring Safety Advice
  let riskSummary = '';
  const refactoringAdvice: string[] = [];

  if (impactLevel === 'critical') {
    riskSummary = `High-gravity architectural core with ${totalConsumingComponents} consuming callers and ${totalDownstreamLoc.toLocaleString()} downstream lines of code. Modifications carry high regression probability.`;
    refactoringAdvice.push(`Audit contract signatures across all ${totalConsumingComponents} consuming components before modifying exported types.`);
    refactoringAdvice.push(`Provide non-breaking fallback defaults for parameter extensions.`);
    refactoringAdvice.push(`Run full integration testing across ${downstreamDependencies.length} downstream dependencies.`);
  } else if (impactLevel === 'high') {
    riskSummary = `Significant hub with ${totalConsumingComponents} consuming modules and ${totalDownstreamLoc.toLocaleString()} LOC downstream reach across ${tierBreakdown.filter(t => t.affectedCount > 0).length} architectural tiers.`;
    refactoringAdvice.push(`Isolate state mutations to avoid cascading re-renders in ${directConsumingCount} direct callers.`);
    refactoringAdvice.push(`Ensure typed error handling across downstream services (${totalDownstreamLoc.toLocaleString()} LOC).`);
  } else if (impactLevel === 'moderate') {
    riskSummary = `Modular component with bounded scope (${totalConsumingComponents} callers, ${totalDownstreamLoc.toLocaleString()} downstream LOC). Low-to-moderate regression risk.`;
    refactoringAdvice.push(`Verify prop interface parity for ${directConsumingCount} direct consumer(s).`);
    refactoringAdvice.push(`Unit test local logic and downstream mock handlers.`);
  } else {
    riskSummary = `Localized leaf component with ${totalConsumingComponents} consumer(s) and minimal downstream footprint. Safe for rapid refactoring.`;
    refactoringAdvice.push(`Standard visual inspection and component unit testing.`);
    refactoringAdvice.push(`Safe for clean-room refactoring and isolated stylistic upgrades.`);
  }

  return {
    nodeId: selectedNode.id,
    label: selectedNode.label,
    path: selectedNode.path || selectedNode.label,
    folder: selectedNode.folder,
    selfLoc,
    impactScore,
    impactLevel,
    impactColor,
    directConsumingCount,
    transitiveConsumingCount,
    totalConsumingComponents,
    consumingComponents,
    directDownstreamCount,
    transitiveDownstreamCount,
    totalDownstreamNodes,
    totalDownstreamLoc,
    combinedImpactedLoc,
    downstreamDependencies,
    blastRadiusPercent,
    tierBreakdown,
    riskSummary,
    refactoringAdvice
  };
}

/**
 * Calculates complete aggregated architectural Impact Factor and blast radius metrics for a collection of selected nodes (selection group).
 */
export function calculateMultipleFilesImpact(
  selectedNodes: D3Node[],
  graph: DataFlowGraph
): FileImpactAnalysis {
  if (selectedNodes.length === 0) {
    throw new Error("No nodes selected for multiple file impact analysis");
  }
  if (selectedNodes.length === 1) {
    return calculateFileImpact(selectedNodes[0], graph);
  }

  const nodes = graph.nodes || [];
  const links = graph.links || [];
  const totalNodesCount = Math.max(1, nodes.length);

  const selectedIds = new Set<string>(selectedNodes.map(n => n.id));

  // Map of node ID to Node
  const nodeMap = new Map<string, D3Node>();
  const nodeLocMap = new Map<string, number>();
  nodes.forEach(n => {
    nodeMap.set(n.id, n);
    nodeLocMap.set(n.id, estimateFileLinesOfCode(n.path, n.label, n.category));
  });

  // Self LOC is the sum of lines of code of all selected nodes
  let selfLoc = 0;
  selectedNodes.forEach(n => {
    selfLoc += nodeLocMap.get(n.id) || estimateFileLinesOfCode(n.path, n.label, n.category);
  });

  // Helper to extract node id from link endpoint
  const getLinkId = (endpoint: string | D3Node | any): string => {
    if (typeof endpoint === 'object' && endpoint !== null && 'id' in endpoint) {
      return (endpoint as D3Node).id;
    }
    return String(endpoint);
  };

  // Build adjacency maps
  const incomingMap = new Map<string, string[]>();
  const outgoingMap = new Map<string, string[]>();

  links.forEach(l => {
    const sourceId = getLinkId(l.source);
    const targetId = getLinkId(l.target);

    if (!outgoingMap.has(sourceId)) outgoingMap.set(sourceId, []);
    outgoingMap.get(sourceId)!.push(targetId);

    if (!incomingMap.has(targetId)) incomingMap.set(targetId, []);
    incomingMap.get(targetId)!.push(sourceId);
  });

  // 1. Upstream (Consuming Components) that consume ANY node in the group
  const consumingComponents: ConsumingComponentInfo[] = [];
  const visitedUpstream = new Set<string>(selectedIds);
  const queueUpstream: { id: string; distance: number }[] = [];

  // Initialize with direct callers of any selected node
  selectedNodes.forEach(node => {
    const callers = incomingMap.get(node.id) || [];
    callers.forEach(callerId => {
      if (!visitedUpstream.has(callerId)) {
        visitedUpstream.add(callerId);
        queueUpstream.push({ id: callerId, distance: 1 });
      }
    });
  });

  let directConsumingCount = 0;
  let transitiveConsumingCount = 0;

  while (queueUpstream.length > 0) {
    const { id, distance } = queueUpstream.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      const loc = nodeLocMap.get(id) || 150;
      if (distance === 1) directConsumingCount++;
      else transitiveConsumingCount++;

      consumingComponents.push({
        id: node.id,
        label: node.label,
        path: node.path,
        folder: node.folder,
        techBadge: node.techBadge,
        techColor: node.techColor,
        distance,
        loc
      });

      const nextCallers = incomingMap.get(id) || [];
      nextCallers.forEach(nextId => {
        if (!visitedUpstream.has(nextId)) {
          visitedUpstream.add(nextId);
          queueUpstream.push({ id: nextId, distance: distance + 1 });
        }
      });
    }
  }

  // 2. Downstream Dependencies called by ANY node in the group
  const downstreamDependencies: DownstreamDependencyInfo[] = [];
  const visitedDownstream = new Set<string>(selectedIds);
  const queueDownstream: { id: string; distance: number }[] = [];

  selectedNodes.forEach(node => {
    const callees = outgoingMap.get(node.id) || [];
    callees.forEach(calleeId => {
      if (!visitedDownstream.has(calleeId)) {
        visitedDownstream.add(calleeId);
        queueDownstream.push({ id: calleeId, distance: 1 });
      }
    });
  });

  let directDownstreamCount = 0;
  let transitiveDownstreamCount = 0;
  let totalDownstreamLoc = 0;

  while (queueDownstream.length > 0) {
    const { id, distance } = queueDownstream.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      const loc = nodeLocMap.get(id) || 150;
      totalDownstreamLoc += loc;
      if (distance === 1) directDownstreamCount++;
      else transitiveDownstreamCount++;

      downstreamDependencies.push({
        id: node.id,
        label: node.label,
        path: node.path,
        folder: node.folder,
        techBadge: node.techBadge,
        techColor: node.techColor,
        distance,
        loc
      });

      const nextCallees = outgoingMap.get(id) || [];
      nextCallees.forEach(nextId => {
        if (!visitedDownstream.has(nextId)) {
          visitedDownstream.add(nextId);
          queueDownstream.push({ id: nextId, distance: distance + 1 });
        }
      });
    }
  }

  const totalConsumingComponents = consumingComponents.length;
  const totalDownstreamNodes = downstreamDependencies.length;
  const combinedImpactedLoc = selfLoc + totalDownstreamLoc;

  // 3. Blast radius & tier impact metrics
  const affectedUniqueNodeIds = new Set<string>([
    ...selectedIds,
    ...consumingComponents.map(c => c.id),
    ...downstreamDependencies.map(d => d.id)
  ]);
  const blastRadiusPercent = Math.round((affectedUniqueNodeIds.size / totalNodesCount) * 100);

  // Group by category/tier
  const tiers = [
    { tierName: 'Core Engine & Entrypoints', category: 'core', color: '#f43f5e' },
    { tierName: 'Data Repositories & Store', category: 'data', color: '#3b82f6' },
    { tierName: 'Orchestrators & Pipelines', category: 'orchestrator', color: '#a855f7' },
    { tierName: 'Services & Utility Adapters', category: 'service', color: '#10b981' },
    { tierName: 'UI Components & Viewers', category: 'ui', color: '#eab308' }
  ];

  const tierBreakdown: TierBlastRadius[] = tiers.map(tier => {
    const tierNodes = nodes.filter(n => n.category === tier.category);
    const affectedInTier = tierNodes.filter(n => affectedUniqueNodeIds.has(n.id));
    return {
      tierName: tier.tierName,
      category: tier.category,
      color: tier.color,
      affectedCount: affectedInTier.length,
      totalTierCount: tierNodes.length,
      percentage: tierNodes.length > 0 ? Math.round((affectedInTier.length / tierNodes.length) * 100) : 0
    };
  });

  // Calculate composite impact score
  const wSelection = Math.min(25, selectedNodes.length * 3);
  const wConsumers = Math.min(45, totalConsumingComponents * 4);
  const wBlast = Math.min(30, blastRadiusPercent * 0.35);
  const impactScore = Math.min(100, Math.round(wSelection + wConsumers + wBlast));

  let impactLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let impactColor = '#34d399';

  if (impactScore >= 75) {
    impactLevel = 'critical';
    impactColor = '#f43f5e';
  } else if (impactScore >= 50) {
    impactLevel = 'high';
    impactColor = '#fb923c';
  } else if (impactScore >= 25) {
    impactLevel = 'moderate';
    impactColor = '#facc15';
  }

  let riskSummary = '';
  const refactoringAdvice: string[] = [];

  const labelsList = selectedNodes.map(n => n.label).slice(0, 3).join(', ') + (selectedNodes.length > 3 ? ` +${selectedNodes.length - 3} more` : '');

  if (impactLevel === 'critical') {
    riskSummary = `Critical selection group [${labelsList}] with substantial structural impact, affecting ${totalConsumingComponents} consumers and ${totalDownstreamLoc.toLocaleString()} downstream lines of code.`;
    refactoringAdvice.push(`Coordinate code migrations in distinct phases across all ${selectedNodes.length} selected files to avoid massive circular-reference locks.`);
    refactoringAdvice.push(`Establish non-breaking proxy wrappers/interfaces before moving major functions out of this group.`);
    refactoringAdvice.push(`Ensure automated testing covers all ${downstreamDependencies.length} downstream dependent modules.`);
  } else if (impactLevel === 'high') {
    riskSummary = `High impact selection group [${labelsList}] with cascading downstream reach across ${tierBreakdown.filter(t => t.affectedCount > 0).length} architectural tiers.`;
    refactoringAdvice.push(`Isolate mutations of shared types in this group to prevent recursive re-renders across the ${directConsumingCount} direct callers.`);
    refactoringAdvice.push(`Conduct comprehensive impact analysis on API service boundaries affected by this group.`);
  } else if (impactLevel === 'moderate') {
    riskSummary = `Moderate impact selection group [${labelsList}] with bounded dependencies (${totalConsumingComponents} callers, ${totalDownstreamLoc.toLocaleString()} downstream LOC).`;
    refactoringAdvice.push(`Verify interface compatibility for the ${directConsumingCount} direct consumer components.`);
    refactoringAdvice.push(`Run targeted unit tests on each of the ${selectedNodes.length} modules.`);
  } else {
    riskSummary = `Isolated selection group [${labelsList}] with a minimal footprint. Highly safe for collective refactoring.`;
    refactoringAdvice.push(`Standard visual checking and single-component unit testing is sufficient.`);
    refactoringAdvice.push(`Safe for clean-room upgrades and modular encapsulation.`);
  }

  return {
    nodeId: 'group-selection',
    label: `Selection Group (${selectedNodes.length} Files)`,
    path: `Multiple Selection: ${selectedNodes.length} Files`,
    folder: 'Multiple Folders',
    selfLoc,
    impactScore,
    impactLevel,
    impactColor,
    directConsumingCount,
    transitiveConsumingCount,
    totalConsumingComponents,
    consumingComponents,
    directDownstreamCount,
    transitiveDownstreamCount,
    totalDownstreamNodes,
    totalDownstreamLoc,
    combinedImpactedLoc,
    downstreamDependencies,
    blastRadiusPercent,
    tierBreakdown,
    riskSummary,
    refactoringAdvice
  };
}
