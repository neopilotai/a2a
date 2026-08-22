/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  CodeMapNodeItem, 
  ArchitectureTier, 
  ModuleCategory, 
  ArchitecturalHealthReport, 
  NodeHealthStatus, 
  AntiPatternAlert, 
  AntiPatternType, 
  HealthSeverity 
} from '../types';

export const HEALTH_SEVERITY_COLORS: Record<HealthSeverity, { hex: string; bg: string; border: string; text: string }> = {
  critical: {
    hex: '#ef4444',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
  },
  warning: {
    hex: '#f59e0b',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  notice: {
    hex: '#38bdf8',
    bg: 'bg-sky-500/20',
    border: 'border-sky-500/40',
    text: 'text-sky-400',
  },
  healthy: {
    hex: '#10b981',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
  },
};

const TIER_ORDER: Record<ArchitectureTier, number> = {
  entrypoint: 1,
  routing_api: 2,
  core_domain: 3,
  data_state: 4,
  infra_config: 5,
  testing_qa: 6,
};

/**
 * Finds all simple directed cycles in a graph of nodes and links using DFS cycle extraction.
 */
function findDirectedCycles(
  nodeIds: string[],
  adjList: Map<string, string[]>
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(curr: string, startNode: string) {
    visited.add(curr);
    recStack.add(curr);
    path.push(curr);

    const neighbors = adjList.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, startNode);
      } else if (recStack.has(neighbor)) {
        // Cycle detected!
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex);
          cyclePath.push(neighbor); // Close cycle for clarity
          // Check for duplicate cycle permutations
          const cycleKey = [...cyclePath.slice(0, -1)].sort().join('->');
          const isDup = cycles.some(c => [...c.slice(0, -1)].sort().join('->') === cycleKey);
          if (!isDup && cyclePath.length >= 3) {
            cycles.push(cyclePath);
          }
        }
      }
    }

    path.pop();
    recStack.delete(curr);
  }

  for (const node of nodeIds) {
    if (!visited.has(node)) {
      dfs(node, node);
    }
  }

  return cycles.slice(0, 15); // Cap to avoid runaway reports on highly tangled meshes
}

/**
 * Analyzes the codebase graph structure to perform a proactive Architectural Health Check.
 * Detects circular dependencies, excessive complexity/god modules, layer inversions, and dead code.
 */
export function runArchitecturalHealthCheck(
  repoName: string,
  nodes: CodeMapNodeItem[],
  links: { source: string; target: string; value: number }[]
): ArchitecturalHealthReport {
  const nodeMap = new Map<string, CodeMapNodeItem>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const outDegreeMap = new Map<string, Set<string>>();
  const inDegreeMap = new Map<string, Set<string>>();

  nodes.forEach(n => {
    outDegreeMap.set(n.id, new Set<string>());
    inDegreeMap.set(n.id, new Set<string>());
  });

  links.forEach(l => {
    const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
    const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
    if (outDegreeMap.has(s) && inDegreeMap.has(t)) {
      outDegreeMap.get(s)!.add(t);
      inDegreeMap.get(t)!.add(s);
    }
  });

  // 1. Detect Circular Dependencies
  const adjListForCycles = new Map<string, string[]>();
  nodes.forEach(n => {
    adjListForCycles.set(n.id, Array.from(outDegreeMap.get(n.id) || []));
  });

  const rawCycles = findDirectedCycles(nodes.map(n => n.id), adjListForCycles);

  const cycleMembership = new Map<string, string[][]>();
  rawCycles.forEach(cycle => {
    // Each element except the closing duplicated element
    const members = cycle.slice(0, -1);
    members.forEach(m => {
      if (!cycleMembership.has(m)) cycleMembership.set(m, []);
      cycleMembership.get(m)!.push(cycle);
    });
  });

  // Track summary counts
  const antiPatternCounts: Record<AntiPatternType, number> = {
    circular_dependency: rawCycles.length,
    excessive_complexity: 0,
    god_module: 0,
    layer_inversion: 0,
    orphan_module: 0,
    high_coupling: 0,
    shotgun_surgery_risk: 0,
  };

  const highComplexityHotspots: ArchitecturalHealthReport['highComplexityHotspots'] = [];
  const nodeHealthMap: Record<string, NodeHealthStatus> = {};

  let healthyCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  let noticeCount = 0;

  // Process each node for health evaluation
  nodes.forEach(node => {
    const alerts: AntiPatternAlert[] = [];
    const fanIn = (inDegreeMap.get(node.id) || new Set()).size;
    const fanOut = (outDegreeMap.get(node.id) || new Set()).size;
    const totalConnections = fanIn + fanOut;
    const isCycle = cycleMembership.has(node.id);
    const nodeCycles = cycleMembership.get(node.id) || [];

    // Check 1: Circular Dependency
    if (isCycle && nodeCycles.length > 0) {
      nodeCycles.forEach((cyc, idx) => {
        alerts.push({
          id: `cycle-${node.id}-${idx}`,
          type: 'circular_dependency',
          severity: 'critical',
          title: 'Circular Dependency Anti-Pattern',
          description: `Module is locked in a cyclic dependency loop: ${cyc.map(p => p.split('/').pop()).join(' ➔ ')}`,
          targetNodeId: node.id,
          targetFilePath: node.path,
          affectedCycle: cyc,
          metrics: {
            cycleLength: cyc.length - 1,
            fanIn,
            fanOut,
            connectionsCount: totalConnections,
          },
          impact: 'Tight coupling prevents tree-shaking, complicates unit testing, and risks runtime initialization deadlock.',
          mitigation: 'Extract shared contracts or event interfaces into an intermediate abstraction layer.',
          suggestedActionLabel: 'Break Cycle via Interface Decoupling',
        });
      });
    }

    // Check 2: God Module / Excessive Coupling
    const isGodModule = totalConnections >= 7 || (fanIn >= 5 && fanOut >= 4);
    if (isGodModule) {
      antiPatternCounts.god_module++;
      alerts.push({
        id: `god-${node.id}`,
        type: 'god_module',
        severity: totalConnections >= 9 ? 'critical' : 'warning',
        title: 'God Module (Excessive Centralization)',
        description: `Module acts as a bloated architectural bottleneck connected to ${totalConnections} modules (${fanIn} fan-in, ${fanOut} fan-out).`,
        targetNodeId: node.id,
        targetFilePath: node.path,
        metrics: {
          fanIn,
          fanOut,
          connectionsCount: totalConnections,
          couplingScore: Math.round((totalConnections / Math.max(1, nodes.length)) * 100),
        },
        impact: 'High churn rate in this module causes widespread regression cascades across dependent features.',
        mitigation: 'Decompose into focused single-responsibility domain services with scoped facades.',
        suggestedActionLabel: 'Split God Module with Refactoring Catalog',
      });
    }

    // Check 3: Excessive Complexity (Nesting, High Fan-out / Shotgun Surgery Risk)
    const isHighFanOut = fanOut >= 6;
    if (isHighFanOut && !isGodModule) {
      antiPatternCounts.shotgun_surgery_risk++;
      alerts.push({
        id: `fanout-${node.id}`,
        type: 'shotgun_surgery_risk',
        severity: 'warning',
        title: 'High Fan-Out (Shotgun Surgery Risk)',
        description: `Directly invokes or depends on ${fanOut} separate modules. Any API shift requires widespread edits.`,
        targetNodeId: node.id,
        targetFilePath: node.path,
        metrics: { fanOut, fanIn, connectionsCount: totalConnections },
        impact: 'Fragile orchestration layer vulnerable to breaking changes in any downstream dependency.',
        mitigation: 'Introduce mediator or aggregator design patterns to decouple direct dependencies.',
        suggestedActionLabel: 'Introduce Mediator Pattern',
      });
    }

    // Check 4: Layer Inversion (Architectural Tier Violation)
    const outgoingTargets = Array.from(outDegreeMap.get(node.id) || []);
    const nodeTierRank = TIER_ORDER[node.tier] || 3;

    outgoingTargets.forEach(targetId => {
      const targetNode = nodeMap.get(targetId);
      if (targetNode) {
        const targetTierRank = TIER_ORDER[targetNode.tier] || 3;
        // If lower tier (data/state = 4, infra = 5) depends on higher tier (entrypoint = 1, routing = 2)
        if (nodeTierRank >= 4 && targetTierRank <= 2) {
          antiPatternCounts.layer_inversion++;
          alerts.push({
            id: `inversion-${node.id}-${targetId}`,
            type: 'layer_inversion',
            severity: 'critical',
            title: 'Layer Inversion (Tier Rule Breach)',
            description: `Lower-level ${node.tier} (${node.label}) imports higher-level ${targetNode.tier} (${targetNode.label}).`,
            targetNodeId: node.id,
            targetFilePath: node.path,
            metrics: { depth: node.depth },
            impact: 'Violates Clean Architecture hierarchy; pollutes infrastructure/data layer with UI/routing concerns.',
            mitigation: 'Invert dependency using dependency injection or observable event contracts.',
            suggestedActionLabel: 'Apply Inversion of Control',
          });
        }
      }
    });

    // Check 5: Orphan / Dead Module
    if (totalConnections === 0 && node.category !== 'docs' && node.category !== 'config' && nodes.length > 5) {
      antiPatternCounts.orphan_module++;
      alerts.push({
        id: `orphan-${node.id}`,
        type: 'orphan_module',
        severity: 'notice',
        title: 'Isolated / Orphan Module Candidate',
        description: `Module has 0 identified graph connections in the active architecture slice.`,
        targetNodeId: node.id,
        targetFilePath: node.path,
        metrics: { connectionsCount: 0 },
        impact: 'Possible dead code accumulating technical debt, or an unreferenced utility.',
        mitigation: 'Verify if module is exported via package barrel or can be safely pruned.',
        suggestedActionLabel: 'Audit Module Dead Code',
      });
    }

    // Complexity score computation (0 - 100)
    const rawComplexity = Math.min(100, Math.round(
      (totalConnections * 8) + 
      (node.depth * 5) + 
      (isCycle ? 30 : 0) + 
      (node.annotation?.slopRisk === 'high' ? 20 : 0)
    ));

    const complexityRank: NodeHealthStatus['complexityRank'] = 
      rawComplexity > 75 ? 'extreme' :
      rawComplexity > 50 ? 'high' :
      rawComplexity > 25 ? 'moderate' : 'low';

    if (rawComplexity >= 45) {
      antiPatternCounts.excessive_complexity++;
      highComplexityHotspots.push({
        nodeId: node.id,
        filePath: node.path,
        fanIn,
        fanOut,
        connections: totalConnections,
        complexityScore: rawComplexity,
        recommendation: isCycle 
          ? 'Break cyclic dependency loops' 
          : isGodModule 
          ? 'Decompose god module into modular services' 
          : 'Refactor high coupling using interfaces',
      });
    }

    // Determine highest severity
    const hasCritical = alerts.some(a => a.severity === 'critical');
    const hasWarning = alerts.some(a => a.severity === 'warning');
    const hasNotice = alerts.some(a => a.severity === 'notice');

    const severity: HealthSeverity = 
      hasCritical ? 'critical' :
      hasWarning ? 'warning' :
      hasNotice ? 'notice' : 'healthy';

    let healthScore = 100;
    if (hasCritical) healthScore = Math.max(15, 60 - alerts.length * 15);
    else if (hasWarning) healthScore = Math.max(45, 80 - alerts.length * 10);
    else if (hasNotice) healthScore = 88;

    if (severity === 'critical') criticalCount++;
    else if (severity === 'warning') warningCount++;
    else if (severity === 'notice') noticeCount++;
    else healthyCount++;

    const status: NodeHealthStatus = {
      nodeId: node.id,
      filePath: node.path,
      severity,
      healthScore,
      color: HEALTH_SEVERITY_COLORS[severity].hex,
      badgeLabel: 
        severity === 'critical' ? 'Critical Alert' :
        severity === 'warning' ? 'Warning Alert' :
        severity === 'notice' ? 'Advisory' : 'Healthy Node',
      alerts,
      fanIn,
      fanOut,
      isCycleMember: isCycle,
      cycleChain: nodeCycles[0],
      complexityRank,
    };

    nodeHealthMap[node.id] = status;
  });

  // Calculate Overall Architecture Health Score
  const total = Math.max(1, nodes.length);
  const weightedHealth = Math.round(
    ((healthyCount * 100) + (noticeCount * 85) + (warningCount * 50) + (criticalCount * 15)) / total
  );

  const overallHealthScore = Math.min(100, Math.max(10, weightedHealth));

  const healthGrade: ArchitecturalHealthReport['healthGrade'] = 
    overallHealthScore >= 92 ? 'A+' :
    overallHealthScore >= 84 ? 'A' :
    overallHealthScore >= 72 ? 'B' :
    overallHealthScore >= 60 ? 'C' :
    overallHealthScore >= 45 ? 'D' : 'F';

  // Format anti-pattern breakdown
  const antiPatternBreakdown: ArchitecturalHealthReport['antiPatternBreakdown'] = [
    {
      type: 'circular_dependency',
      label: 'Circular Dependencies',
      count: rawCycles.length,
      severity: 'critical',
      color: '#ef4444',
      description: 'Cyclic loops between interdependent modules that hinder modularity and tree-shaking.',
    },
    {
      type: 'god_module',
      label: 'God Modules / Bottlenecks',
      count: antiPatternCounts.god_module,
      severity: 'critical',
      color: '#f43f5e',
      description: 'Heavily centralized files with high fan-in and fan-out violating single responsibility.',
    },
    {
      type: 'layer_inversion',
      label: 'Layer Inversions',
      count: antiPatternCounts.layer_inversion,
      severity: 'critical',
      color: '#dc2626',
      description: 'Lower architectural tiers illegally importing higher-level routing or entrypoints.',
    },
    {
      type: 'excessive_complexity',
      label: 'Excessive Complexity Hotspots',
      count: highComplexityHotspots.length,
      severity: 'warning',
      color: '#f59e0b',
      description: 'Modules with elevated cognitive load, deep directory nesting, or multi-role coupling.',
    },
    {
      type: 'shotgun_surgery_risk',
      label: 'High Fan-Out Modules',
      count: antiPatternCounts.shotgun_surgery_risk,
      severity: 'warning',
      color: '#ea580c',
      description: 'Modules with direct ties to multiple disparate dependencies requiring widespread ripple edits.',
    },
    {
      type: 'orphan_module',
      label: 'Orphan / Dead Modules',
      count: antiPatternCounts.orphan_module,
      severity: 'notice',
      color: '#38bdf8',
      description: 'Unconnected or isolated code assets that may be obsolete remnants.',
    },
  ];

  // Detected cycle objects
  const detectedCycles = rawCycles.map((cyc, idx) => ({
    id: `cycle-report-${idx + 1}`,
    nodes: cyc,
    description: cyc.map(p => p.split('/').pop() || p).join(' ➔ '),
    severity: 'critical' as HealthSeverity,
  }));

  // Recommendations
  const recommendations: string[] = [];
  if (rawCycles.length > 0) {
    recommendations.push(`Decouple ${rawCycles.length} circular dependency loop(s) by introducing dedicated interface contracts or dependency injection.`);
  }
  if (antiPatternCounts.god_module > 0) {
    recommendations.push(`Decompose ${antiPatternCounts.god_module} God Module(s) into distinct domain handlers using the Intelligent Refactoring catalog.`);
  }
  if (antiPatternCounts.layer_inversion > 0) {
    recommendations.push(`Enforce strict tier boundaries to eliminate ${antiPatternCounts.layer_inversion} layering inversion(s) in data and state stores.`);
  }
  if (highComplexityHotspots.length > 0) {
    recommendations.push(`Apply custom hook extraction and interface hardening to reduce cognitive load in ${highComplexityHotspots.length} complex hotspot(s).`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Architecture maintains excellent decoupling with clean single-direction data flows and zero cyclic traps.');
  }

  const summary = `Proactive Architectural Health Scan completed across ${nodes.length} modules in ${repoName}. Detected ${rawCycles.length} circular dependency cycle(s), ${antiPatternCounts.god_module} god module hotspot(s), and ${highComplexityHotspots.length} high complexity areas. Overall architectural health grade is ${healthGrade} (${overallHealthScore}/100).`;

  return {
    repoName,
    scannedAt: Date.now(),
    totalModulesScanned: nodes.length,
    overallHealthScore,
    healthGrade,
    healthyModulesCount: healthyCount,
    warningModulesCount: warningCount,
    criticalModulesCount: criticalCount,
    noticeModulesCount: noticeCount,
    summary,
    antiPatternBreakdown,
    detectedCycles,
    highComplexityHotspots: highComplexityHotspots.sort((a, b) => b.complexityScore - a.complexityScore),
    nodeHealthMap,
    recommendations,
  };
}
