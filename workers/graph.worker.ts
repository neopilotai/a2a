/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dedicated Web Worker for Heavy D3 Force Simulations & Topological Pathfinding
// Executes intensive graph algorithms off the main UI thread to prevent thread lockup.

export interface WorkerGraphNode {
  id: string;
  label?: string;
  group?: number;
  folder?: string;
  moduleId?: string;
  moduleName?: string;
  importance?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  radius?: number;
}

export interface WorkerGraphLink {
  source: string | { id: string };
  target: string | { id: string };
  value?: number;
  distance?: number;
}

export interface PathfindingRequest {
  requestId: string;
  type: 'find-path';
  nodes: WorkerGraphNode[];
  links: WorkerGraphLink[];
  sourceId: string;
  targetId: string;
  directed?: boolean;
}

export interface DependencyImpactRequest {
  requestId: string;
  type: 'find-impact';
  nodes: WorkerGraphNode[];
  links: WorkerGraphLink[];
  startId: string;
  direction?: 'downstream' | 'upstream' | 'both';
  maxDepth?: number;
}

export interface GraphMetricsRequest {
  requestId: string;
  type: 'calculate-metrics';
  nodes: WorkerGraphNode[];
  links: WorkerGraphLink[];
}

export interface ForceLayoutRequest {
  requestId?: string;
  type: 'init-simulation' | 'run-layout';
  nodes: WorkerGraphNode[];
  links: WorkerGraphLink[];
  width: number;
  height: number;
  layoutAlgorithm?: 'force' | 'modular-force' | 'hierarchical' | 'radial';
  clusterCenters?: Record<string, { x: number; y: number }> | null;
  iterations?: number;
}

export interface DragNodeRequest {
  type: 'drag';
  id: string;
  fx: number | null;
  fy: number | null;
  alpha?: number;
}

export type GraphWorkerRequest =
  | PathfindingRequest
  | DependencyImpactRequest
  | GraphMetricsRequest
  | ForceLayoutRequest
  | DragNodeRequest;

export const GRAPH_WORKER_SCRIPT = `
(function() {
  let nodes = [];
  let links = [];
  let width = 900;
  let height = 600;
  let layoutAlgorithm = 'force';
  let clusterCenters = null;
  let isRunning = false;
  let alpha = 1.0;
  let alphaMin = 0.001;
  let alphaDecay = 0.0228;
  let velocityDecay = 0.6;
  let nodeMap = new Map();

  // Helper: Extract string ID from link endpoint
  function getLinkId(endpoint) {
    if (typeof endpoint === 'object' && endpoint !== null) {
      return endpoint.id;
    }
    return String(endpoint);
  }

  // -------------------------------------------------------------
  // 1. D3 FORCE SIMULATION ENGINE
  // -------------------------------------------------------------
  function initSimulation(data) {
    width = data.width || 900;
    height = data.height || 600;
    layoutAlgorithm = data.layoutAlgorithm || 'force';
    clusterCenters = data.clusterCenters || null;

    nodes = data.nodes.map(n => ({
      id: String(n.id),
      label: n.label || String(n.id),
      group: n.group || 0,
      folder: n.folder || '',
      moduleId: n.moduleId || 'mod-core',
      importance: n.importance || 'medium',
      x: typeof n.x === 'number' ? n.x : (width / 2) + (Math.random() - 0.5) * 120,
      y: typeof n.y === 'number' ? n.y : (height / 2) + (Math.random() - 0.5) * 120,
      vx: n.vx || 0,
      vy: n.vy || 0,
      fx: n.fx !== undefined ? n.fx : null,
      fy: n.fy !== undefined ? n.fy : null,
      radius: n.importance === 'critical' ? 28 : (n.id === 'root' ? 24 : 18)
    }));

    nodeMap = new Map(nodes.map(n => [n.id, n]));

    links = data.links.map(l => {
      const sId = getLinkId(l.source);
      const tId = getLinkId(l.target);
      return {
        source: nodeMap.get(sId),
        target: nodeMap.get(tId),
        sourceId: sId,
        targetId: tId,
        value: l.value || 1,
        distance: l.distance || (layoutAlgorithm === 'modular-force' ? 60 : 95)
      };
    }).filter(l => l.source && l.target);

    alpha = 1.0;
    isRunning = true;
  }

  function stepSimulation() {
    if (!isRunning) return;

    if (alpha < alphaMin) {
      isRunning = false;
      self.postMessage({
        type: 'end',
        nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, vx: n.vx, vy: n.vy, fx: n.fx, fy: n.fy }))
      });
      return;
    }

    const centerMap = clusterCenters ? new Map(Object.entries(clusterCenters)) : null;

    // 1. Center / Gravity Forces
    const cx = width / 2;
    const cy = height / 2;
    nodes.forEach(n => {
      if (n.fx !== null && n.fx !== undefined) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0;
        n.vy = 0;
        return;
      }

      if (layoutAlgorithm === 'modular-force' && centerMap) {
        const center = centerMap.get(n.moduleId) || { x: cx, y: cy };
        n.vx += (center.x - n.x) * 0.04 * alpha;
        n.vy += (center.y - n.y) * 0.04 * alpha;
      } else {
        n.vx += (cx - n.x) * 0.015 * alpha;
        n.vy += (cy - n.y) * 0.015 * alpha;
      }
    });

    // 2. Repulsion (Coulomb) Force
    const chargeStrength = layoutAlgorithm === 'modular-force' ? -300 : -400;
    for (let i = 0; i < nodes.length; i++) {
      const u = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const v = nodes[j];
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);
        const force = (chargeStrength * alpha) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (u.fx === null || u.fx === undefined) { u.vx += fx; u.vy += fy; }
        if (v.fx === null || v.fx === undefined) { v.vx -= fx; v.vy -= fy; }
      }
    }

    // 3. Link Spring Tension Force
    links.forEach(l => {
      const u = l.source;
      const v = l.target;
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetLen = (layoutAlgorithm === 'modular-force' && u.moduleId === v.moduleId) ? 50 : (l.distance || 95);
      const k = 0.04 * (dist - targetLen) * alpha;
      const fx = (dx / dist) * k;
      const fy = (dy / dist) * k;

      if (u.fx === null || u.fx === undefined) { u.vx += fx; u.vy += fy; }
      if (v.fx === null || v.fx === undefined) { v.vx -= fx; v.vy -= fy; }
    });

    // 4. Collision Separation
    for (let i = 0; i < nodes.length; i++) {
      const u = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const v = nodes[j];
        const minDist = (u.radius || 20) + (v.radius || 20);
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < minDist) {
          const overlap = (minDist - dist) / dist * 0.35 * alpha;
          const fx = dx * overlap;
          const fy = dy * overlap;
          if (u.fx === null || u.fx === undefined) { u.vx -= fx; u.vy -= fy; }
          if (v.fx === null || v.fx === undefined) { v.vx += fx; v.vy += fy; }
        }
      }
    }

    // 5. Integration & Velocity Decay
    nodes.forEach(n => {
      if (n.fx !== null && n.fx !== undefined) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0;
        n.vy = 0;
      } else {
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= velocityDecay;
        n.vy *= velocityDecay;
      }
    });

    alpha *= (1 - alphaDecay);
  }

  function runTicksBatch(steps) {
    for (let s = 0; s < steps; s++) {
      stepSimulation();
      if (!isRunning) break;
    }

    self.postMessage({
      type: 'tick',
      nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, vx: n.vx, vy: n.vy, fx: n.fx, fy: n.fy })),
      alpha: alpha
    });
  }

  // -------------------------------------------------------------
  // 2. PATHFINDING COMPUTATIONS (Dijkstra Shortest Path)
  // -------------------------------------------------------------
  function computeShortestPath(data) {
    const { requestId, nodes: reqNodes, links: reqLinks, sourceId, targetId, directed = false } = data;
    const startMs = performance.now();

    const adj = new Map();
    reqNodes.forEach(n => adj.set(String(n.id), []));

    reqLinks.forEach(l => {
      const s = getLinkId(l.source);
      const t = getLinkId(l.target);
      const w = l.value || 1;
      if (adj.has(s)) adj.get(s).push({ node: t, weight: w });
      if (!directed && adj.has(t)) adj.get(t).push({ node: s, weight: w });
    });

    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    reqNodes.forEach(n => {
      const id = String(n.id);
      distances.set(id, Infinity);
      unvisited.add(id);
    });

    distances.set(sourceId, 0);

    while (unvisited.size > 0) {
      let current = null;
      let minDist = Infinity;

      unvisited.forEach(id => {
        const d = distances.get(id);
        if (d < minDist) {
          minDist = d;
          current = id;
        }
      });

      if (!current || minDist === Infinity || current === targetId) {
        break;
      }

      unvisited.delete(current);

      const neighbors = adj.get(current) || [];
      neighbors.forEach(edge => {
        if (unvisited.has(edge.node)) {
          const alt = distances.get(current) + edge.weight;
          if (alt < distances.get(edge.node)) {
            distances.set(edge.node, alt);
            previous.set(edge.node, current);
          }
        }
      });
    }

    const path = [];
    let curr = targetId;
    if (distances.get(targetId) !== Infinity) {
      while (curr) {
        path.unshift(curr);
        curr = previous.get(curr);
      }
    }

    const elapsedMs = performance.now() - startMs;

    self.postMessage({
      type: 'path-found',
      requestId,
      sourceId,
      targetId,
      path,
      distance: distances.get(targetId) === Infinity ? -1 : distances.get(targetId),
      elapsedMs
    });
  }

  // -------------------------------------------------------------
  // 3. DEPENDENCY IMPACT PATHFINDING (BFS Traversal)
  // -------------------------------------------------------------
  function computeDependencyImpact(data) {
    const { requestId, nodes: reqNodes, links: reqLinks, startId, direction = 'downstream', maxDepth = 6 } = data;
    const startMs = performance.now();

    const graph = new Map();
    reqNodes.forEach(n => graph.set(String(n.id), { outgoing: [], incoming: [] }));

    reqLinks.forEach(l => {
      const s = getLinkId(l.source);
      const t = getLinkId(l.target);
      if (graph.has(s)) graph.get(s).outgoing.push(t);
      if (graph.has(t)) graph.get(t).incoming.push(s);
    });

    const visited = new Map(); // id -> depth
    const queue = [{ id: startId, depth: 0 }];
    visited.set(startId, 0);

    const directDependents = [];
    const indirectDependents = [];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      const nodeData = graph.get(id);
      if (!nodeData) continue;

      let neighbors = [];
      if (direction === 'downstream' || direction === 'both') {
        neighbors = neighbors.concat(nodeData.outgoing);
      }
      if (direction === 'upstream' || direction === 'both') {
        neighbors = neighbors.concat(nodeData.incoming);
      }

      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          const nextDepth = depth + 1;
          visited.set(neighborId, nextDepth);
          queue.push({ id: neighborId, depth: nextDepth });

          if (nextDepth === 1) {
            directDependents.push(neighborId);
          } else {
            indirectDependents.push(neighborId);
          }
        }
      });
    }

    const elapsedMs = performance.now() - startMs;

    self.postMessage({
      type: 'impact-result',
      requestId,
      startId,
      impactedNodes: Array.from(visited.keys()),
      directDependents,
      indirectDependents,
      impactCount: visited.size - 1,
      elapsedMs
    });
  }

  // -------------------------------------------------------------
  // 4. GRAPH CENTRALITY & CIRCULAR DEPENDENCY METRICS
  // -------------------------------------------------------------
  function computeGraphMetrics(data) {
    const { requestId, nodes: reqNodes, links: reqLinks } = data;
    const startMs = performance.now();

    const adj = new Map();
    const inDegree = new Map();
    const outDegree = new Map();

    reqNodes.forEach(n => {
      const id = String(n.id);
      adj.set(id, []);
      inDegree.set(id, 0);
      outDegree.set(id, 0);
    });

    reqLinks.forEach(l => {
      const s = getLinkId(l.source);
      const t = getLinkId(l.target);
      if (adj.has(s)) adj.get(s).push(t);
      if (outDegree.has(s)) outDegree.set(s, (outDegree.get(s) || 0) + 1);
      if (inDegree.has(t)) inDegree.set(t, (inDegree.get(t) || 0) + 1);
    });

    // Detect Circular Dependencies (DFS Cycles)
    const cycles = [];
    const visitedState = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited

    function dfsCycle(nodeId, path) {
      visitedState.set(nodeId, 1);
      path.push(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const nextId of neighbors) {
        const state = visitedState.get(nextId) || 0;
        if (state === 1) {
          // Found cycle
          const cycleStartIdx = path.indexOf(nextId);
          if (cycleStartIdx !== -1) {
            cycles.push(path.slice(cycleStartIdx));
          }
        } else if (state === 0) {
          dfsCycle(nextId, path);
        }
      }

      path.pop();
      visitedState.set(nodeId, 2);
    }

    reqNodes.forEach(n => {
      const id = String(n.id);
      if ((visitedState.get(id) || 0) === 0) {
        dfsCycle(id, []);
      }
    });

    // Degree Metrics & Topological Importance Scoring
    const centralityMap = {};
    reqNodes.forEach(n => {
      const id = String(n.id);
      const inD = inDegree.get(id) || 0;
      const outD = outDegree.get(id) || 0;
      centralityMap[id] = {
        inDegree: inD,
        outDegree: outD,
        totalDegree: inD + outD,
        importanceScore: Math.round((inD * 1.5 + outD * 1.0) * 10) / 10
      };
    });

    const elapsedMs = performance.now() - startMs;

    self.postMessage({
      type: 'metrics-result',
      requestId,
      centrality: centralityMap,
      cycles: cycles.slice(0, 15), // Top 15 cycles
      hasCircularDependencies: cycles.length > 0,
      elapsedMs
    });
  }

  // -------------------------------------------------------------
  // MESSAGE DISPATCHER
  // -------------------------------------------------------------
  self.onmessage = function(e) {
    const msg = e.data;
    if (!msg) return;

    switch (msg.type) {
      case 'init-simulation':
      case 'run-layout':
        initSimulation(msg);
        runTicksBatch(msg.iterations || 3);
        break;

      case 'find-path':
        computeShortestPath(msg);
        break;

      case 'find-impact':
        computeDependencyImpact(msg);
        break;

      case 'calculate-metrics':
        computeGraphMetrics(msg);
        break;

      case 'drag':
        const target = nodeMap.get(msg.id);
        if (target) {
          target.fx = msg.fx;
          target.fy = msg.fy;
          if (msg.fx !== null && msg.fy !== null) {
            target.x = msg.fx;
            target.y = msg.fy;
          }
        }
        if (msg.alpha) {
          alpha = Math.max(alpha, msg.alpha);
          isRunning = true;
        }
        runTicksBatch(1);
        break;

      case 'stop':
        isRunning = false;
        break;
    }
  };
})();
`;
