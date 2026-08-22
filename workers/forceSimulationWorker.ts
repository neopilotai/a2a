/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dedicated Web Worker for D3 Force Simulation Offloading
// Computes graph physics completely off the main UI thread to ensure consistent 60fps UI performance.

export interface WorkerNode {
  id: string;
  label?: string;
  group?: number;
  moduleId?: string;
  importance?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  radius?: number;
}

export interface WorkerLink {
  source: string;
  target: string;
  value?: number;
  distance?: number;
}

export interface WorkerClusterCenter {
  x: number;
  y: number;
}

export interface WorkerInitMessage {
  type: 'init';
  nodes: WorkerNode[];
  links: WorkerLink[];
  width: number;
  height: number;
  layoutAlgorithm?: 'force' | 'modular-force' | 'hierarchical' | string;
  clusterCenters?: Record<string, WorkerClusterCenter> | null;
  iterations?: number;
}

export interface WorkerDragMessage {
  type: 'drag';
  id: string;
  fx: number | null;
  fy: number | null;
  alpha?: number;
}

export interface WorkerStopMessage {
  type: 'stop';
}

export type WorkerMessage = WorkerInitMessage | WorkerDragMessage | WorkerStopMessage;

// Self-contained Worker script logic in string format for Blob Worker creation
export const FORCE_WORKER_SCRIPT = `
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
  let alphaDecay = 0.0228; // ~300 iterations default
  let velocityDecay = 0.6;
  let nodeMap = new Map();

  function initSimulation(data) {
    nodes = data.nodes.map(n => ({
      id: n.id,
      label: n.label,
      group: n.group || 0,
      moduleId: n.moduleId || 'mod-core',
      importance: n.importance || 'medium',
      x: typeof n.x === 'number' ? n.x : (data.width / 2) + (Math.random() - 0.5) * 100,
      y: typeof n.y === 'number' ? n.y : (data.height / 2) + (Math.random() - 0.5) * 100,
      vx: n.vx || 0,
      vy: n.vy || 0,
      fx: n.fx !== undefined ? n.fx : null,
      fy: n.fy !== undefined ? n.fy : null,
      radius: n.importance === 'critical' ? 28 : (n.id === 'root' ? 24 : 18)
    }));

    width = data.width || 900;
    height = data.height || 600;
    layoutAlgorithm = data.layoutAlgorithm || 'force';
    clusterCenters = data.clusterCenters || null;

    nodeMap = new Map(nodes.map(n => [n.id, n]));

    links = data.links.map(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return {
        source: nodeMap.get(sId),
        target: nodeMap.get(tId),
        sourceId: sId,
        targetId: tId,
        value: l.value || 1,
        distance: l.distance || (layoutAlgorithm === 'modular-force' ? 55 : 90)
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
        n.vx += (center.x - n.x) * 0.035 * alpha;
        n.vy += (center.y - n.y) * 0.035 * alpha;
      } else {
        n.vx += (cx - n.x) * 0.012 * alpha;
        n.vy += (cy - n.y) * 0.012 * alpha;
      }
    });

    // 2. Many-body Repulsion (Coulomb) Force
    const chargeStrength = layoutAlgorithm === 'modular-force' ? -280 : -380;
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

    // 3. Link Spring Attraction Force
    links.forEach(l => {
      const u = l.source;
      const v = l.target;
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetLen = (layoutAlgorithm === 'modular-force' && u.moduleId === v.moduleId) ? 50 : (l.distance || 90);
      const k = 0.045 * (dist - targetLen) * alpha;
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
          const overlap = (minDist - dist) / dist * 0.3 * alpha;
          const fx = dx * overlap;
          const fy = dy * overlap;
          if (u.fx === null || u.fx === undefined) { u.vx -= fx; u.vy -= fy; }
          if (v.fx === null || v.fx === undefined) { v.vx += fx; v.vy += fy; }
        }
      }
    }

    // 5. Integrate & Velocity Decay
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

  self.onmessage = function(e) {
    const msg = e.data;
    if (!msg) return;

    if (msg.type === 'init') {
      initSimulation(msg);
      // Run initial batch
      runTicksBatch(3);
    } else if (msg.type === 'step') {
      runTicksBatch(msg.count || 2);
    } else if (msg.type === 'drag') {
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
    } else if (msg.type === 'heat') {
      alpha = Math.max(alpha, msg.alpha || 0.3);
      isRunning = true;
      runTicksBatch(2);
    } else if (msg.type === 'stop') {
      isRunning = false;
    }
  };
})();
`;
