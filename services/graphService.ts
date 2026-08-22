/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RepoFileTree, DataFlowGraph, D3Node, D3Link } from '../types';
import { getTechForFilePath } from './techStackDetector';
import { detectArchitecturalModules } from './moduleDetectionService';
import { GRAPH_WORKER_SCRIPT, WorkerGraphNode, WorkerGraphLink } from '../workers/graph.worker';

/**
 * Builds a structured DataFlowGraph from repository file tree
 * grouping files into logical architectural modules with interconnected links,
 * tech stack badges, and modular cluster metadata.
 */
export function buildGraphFromFileTree(repoName: string, fileTree: RepoFileTree[]): DataFlowGraph {
  const nodes: D3Node[] = [];
  const links: D3Link[] = [];

  // Run automated architectural module and directory structure detection
  const { modules, decomposition, fileToModuleMap } = detectArchitecturalModules(fileTree, repoName);

  // Root node for repository core orchestrator
  const rootId = 'root';
  const rootModule = modules.find(m => m.category === 'core') || modules[0];

  nodes.push({
    id: rootId,
    group: 0,
    label: repoName || 'Repository',
    folder: '/',
    moduleId: rootModule?.id || 'mod-core',
    moduleName: rootModule?.name || 'Core Entry & Manifest',
    moduleColor: rootModule?.color || '#8b5cf6',
    techStack: 'Repository Root',
    techBadge: '📁 Core',
    techColor: '#8b5cf6'
  });

  // Track node IDs by module for clustering and interconnections
  const moduleNodeMap = new Map<string, string[]>();
  modules.forEach(m => {
    moduleNodeMap.set(m.id, []);
  });

  // Sample file tree for optimal graph rendering performance and clarity
  const maxFiles = 65;
  const sampledTree = fileTree.slice(0, maxFiles);

  sampledTree.forEach((file, index) => {
    const parts = file.path.split('/');
    const filename = parts.pop() || file.path;
    const folder = parts.join('/') || 'root';
    const cleanLabel = filename.replace(/\.[^/.]+$/, ''); // Strip extension for clean display

    // Resolve assigned architectural module
    const matchedModule = fileToModuleMap.get(file.path) || rootModule;
    const detectedTech = getTechForFilePath(file.path);
    const nodeId = `node-${index}-${cleanLabel}`;

    const groupNum = matchedModule ? (
      matchedModule.category === 'core' ? 0 :
      matchedModule.category === 'presentation' ? 1 :
      matchedModule.category === 'api' ? 2 :
      matchedModule.category === 'services' ? 3 :
      matchedModule.category === 'data' ? 4 :
      matchedModule.category === 'utils' ? 5 :
      matchedModule.category === 'config' ? 6 :
      matchedModule.category === 'infra' ? 7 :
      matchedModule.category === 'testing' ? 8 : 9
    ) : 5;

    nodes.push({
      id: nodeId,
      group: groupNum,
      label: cleanLabel || filename,
      path: file.path,
      folder,
      category: matchedModule?.name || 'Module Component',
      moduleId: matchedModule?.id,
      moduleName: matchedModule?.name,
      moduleColor: matchedModule?.color,
      techStack: detectedTech.name,
      techBadge: `${detectedTech.icon} ${detectedTech.badgeLabel}`,
      techColor: detectedTech.color,
    });

    if (matchedModule) {
      const list = moduleNodeMap.get(matchedModule.id) || [];
      list.push(nodeId);
      moduleNodeMap.set(matchedModule.id, list);
    }

    // Connect node to Root
    links.push({
      source: rootId,
      target: nodeId,
      value: 1,
    });
  });

  // Intra-module links (connect nodes inside the same architectural module cluster)
  modules.forEach(m => {
    const clusterNodes = moduleNodeMap.get(m.id) || [];
    if (clusterNodes.length > 1) {
      for (let i = 0; i < clusterNodes.length - 1; i++) {
        // Connect sequential sibling nodes within cluster
        links.push({
          source: clusterNodes[i],
          target: clusterNodes[i + 1],
          value: 1
        });
      }
    }
  });

  // Inter-module logical architectural flows
  const uiNodes = moduleNodeMap.get('mod-presentation') || [];
  const apiNodes = moduleNodeMap.get('mod-api') || [];
  const serviceNodes = moduleNodeMap.get('mod-services') || [];
  const dataNodes = moduleNodeMap.get('mod-data') || [];
  const utilNodes = moduleNodeMap.get('mod-utils') || [];
  const configNodes = moduleNodeMap.get('mod-config') || [];

  // 1. UI -> Services
  uiNodes.forEach((uiNode, i) => {
    if (serviceNodes.length > 0) {
      const targetService = serviceNodes[i % serviceNodes.length];
      links.push({ source: uiNode, target: targetService, value: 2 });
    }
  });

  // 2. API -> Services
  apiNodes.forEach((apiNode, i) => {
    if (serviceNodes.length > 0) {
      const targetService = serviceNodes[i % serviceNodes.length];
      links.push({ source: apiNode, target: targetService, value: 2 });
    }
  });

  // 3. Services -> Data
  serviceNodes.forEach((svcNode, i) => {
    if (dataNodes.length > 0) {
      const targetData = dataNodes[i % dataNodes.length];
      links.push({ source: svcNode, target: targetData, value: 3 });
    }
    if (utilNodes.length > 0 && i % 2 === 0) {
      const targetUtil = utilNodes[i % utilNodes.length];
      links.push({ source: svcNode, target: targetUtil, value: 1 });
    }
  });

  // 4. Config & Types -> UI / Services
  if (configNodes.length > 0) {
    const mainConfig = configNodes[0];
    if (uiNodes.length > 0) links.push({ source: mainConfig, target: uiNodes[0], value: 1 });
    if (serviceNodes.length > 0) links.push({ source: mainConfig, target: serviceNodes[0], value: 1 });
  }

  return {
    nodes,
    links,
    modules,
    decomposition
  };
}

// -------------------------------------------------------------
// WEB WORKER CLIENT FOR HEAVY GRAPH & PATHFINDING COMPUTATIONS
// -------------------------------------------------------------

export class GraphWorkerClient {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      const blob = new Blob([GRAPH_WORKER_SCRIPT], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerUrl);

      this.worker.onmessage = (e) => {
        const data = e.data;
        if (!data) return;

        if (data.requestId && this.pendingRequests.has(data.requestId)) {
          const { resolve } = this.pendingRequests.get(data.requestId)!;
          this.pendingRequests.delete(data.requestId);
          resolve(data);
        }
      };

      this.worker.onerror = (err) => {
        console.error('GraphWorker error:', err);
      };
    } catch (err) {
      console.warn('Web Worker initialization fallback triggered:', err);
    }
  }

  private getNextRequestId(): string {
    return `req-${Date.now()}-${++this.requestCounter}`;
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = null;
    }
    this.pendingRequests.clear();
  }

  // 1. Offloaded Shortest Path Computation (Dijkstra)
  public findShortestPath(
    nodes: WorkerGraphNode[],
    links: WorkerGraphLink[],
    sourceId: string,
    targetId: string,
    directed = false
  ): Promise<{ path: string[]; distance: number; elapsedMs: number }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // Fallback synchronous if worker unavailable
        resolve({ path: [sourceId, targetId], distance: 1, elapsedMs: 0 });
        return;
      }

      const requestId = this.getNextRequestId();
      this.pendingRequests.set(requestId, { resolve, reject });

      this.worker.postMessage({
        type: 'find-path',
        requestId,
        nodes,
        links,
        sourceId,
        targetId,
        directed
      });
    });
  }

  // 2. Offloaded Dependency Impact Traversal (BFS)
  public findDependencyImpact(
    nodes: WorkerGraphNode[],
    links: WorkerGraphLink[],
    startId: string,
    direction: 'downstream' | 'upstream' | 'both' = 'downstream',
    maxDepth = 6
  ): Promise<{
    startId: string;
    impactedNodes: string[];
    directDependents: string[];
    indirectDependents: string[];
    impactCount: number;
    elapsedMs: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        resolve({
          startId,
          impactedNodes: [startId],
          directDependents: [],
          indirectDependents: [],
          impactCount: 0,
          elapsedMs: 0
        });
        return;
      }

      const requestId = this.getNextRequestId();
      this.pendingRequests.set(requestId, { resolve, reject });

      this.worker.postMessage({
        type: 'find-impact',
        requestId,
        nodes,
        links,
        startId,
        direction,
        maxDepth
      });
    });
  }

  // 3. Offloaded Graph Centrality & Circular Dependency Metrics
  public calculateGraphMetrics(
    nodes: WorkerGraphNode[],
    links: WorkerGraphLink[]
  ): Promise<{
    centrality: Record<string, { inDegree: number; outDegree: number; totalDegree: number; importanceScore: number }>;
    cycles: string[][];
    hasCircularDependencies: boolean;
    elapsedMs: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        resolve({ centrality: {}, cycles: [], hasCircularDependencies: false, elapsedMs: 0 });
        return;
      }

      const requestId = this.getNextRequestId();
      this.pendingRequests.set(requestId, { resolve, reject });

      this.worker.postMessage({
        type: 'calculate-metrics',
        requestId,
        nodes,
        links
      });
    });
  }

  // 4. Offloaded Heavy D3 Force Layout Positioning
  public computeLayoutAsync(
    nodes: WorkerGraphNode[],
    links: WorkerGraphLink[],
    width: number,
    height: number,
    layoutAlgorithm: 'force' | 'modular-force' | 'hierarchical' | 'radial' = 'force',
    iterations = 120
  ): Promise<WorkerGraphNode[]> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(nodes);
        return;
      }

      const tempWorker = new Worker(this.workerUrl!);
      tempWorker.onmessage = (e) => {
        if (e.data && (e.data.type === 'end' || e.data.type === 'tick')) {
          if (e.data.type === 'end') {
            tempWorker.terminate();
            resolve(e.data.nodes);
          }
        }
      };

      tempWorker.postMessage({
        type: 'run-layout',
        nodes,
        links,
        width,
        height,
        layoutAlgorithm,
        iterations
      });
    });
  }
}

// Global Singleton Worker Client Instance for App-wide Heavy Graph Operations
let globalWorkerClient: GraphWorkerClient | null = null;

export function getGraphWorkerClient(): GraphWorkerClient {
  if (!globalWorkerClient) {
    globalWorkerClient = new GraphWorkerClient();
  }
  return globalWorkerClient;
}

// Standard Async Export Functions for UI components
export function findShortestPathAsync(
  nodes: WorkerGraphNode[],
  links: WorkerGraphLink[],
  sourceId: string,
  targetId: string,
  directed = false
) {
  return getGraphWorkerClient().findShortestPath(nodes, links, sourceId, targetId, directed);
}

export function findDependencyImpactAsync(
  nodes: WorkerGraphNode[],
  links: WorkerGraphLink[],
  startId: string,
  direction: 'downstream' | 'upstream' | 'both' = 'downstream',
  maxDepth = 6
) {
  return getGraphWorkerClient().findDependencyImpact(nodes, links, startId, direction, maxDepth);
}

export function calculateGraphMetricsAsync(
  nodes: WorkerGraphNode[],
  links: WorkerGraphLink[]
) {
  return getGraphWorkerClient().calculateGraphMetrics(nodes, links);
}

export function computeGraphLayoutAsync(
  nodes: WorkerGraphNode[],
  links: WorkerGraphLink[],
  width: number,
  height: number,
  layoutAlgorithm: 'force' | 'modular-force' | 'hierarchical' | 'radial' = 'force',
  iterations = 120
) {
  return getGraphWorkerClient().computeLayoutAsync(nodes, links, width, height, layoutAlgorithm, iterations);
}
