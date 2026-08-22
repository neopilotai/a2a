/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as d3 from 'd3';
import { D3Node, D3Link, DiagramLayoutAlgorithm, ArchitecturalModule } from '../types';

export interface ArchitecturalTierMetadata {
  tierIndex: number;
  group: number;
  name: string;
  category: string;
  color: string;
  badge: string;
  y: number;
  height: number;
  nodeCount: number;
}

export interface HierarchicalLayoutResult {
  nodePositions: Map<string, { x: number; y: number }>;
  tiers: ArchitecturalTierMetadata[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Architectural tier definitions in top-down hierarchical order
export const ARCHITECTURAL_TIERS_CONFIG: {
  group: number;
  name: string;
  category: string;
  color: string;
  badge: string;
}[] = [
  { group: 0, name: 'Core Entrypoint & Manifest', category: 'Root / Entry', color: '#8b5cf6', badge: 'TIER 0 • CORE' },
  { group: 6, name: 'Configuration & Types', category: 'Config / Types', color: '#2dd4bf', badge: 'TIER 1 • CONFIG' },
  { group: 1, name: 'UI & Presentation Components', category: 'Presentation / Views', color: '#38bdf8', badge: 'TIER 2 • UI / VIEWS' },
  { group: 2, name: 'API Routing & Request Handlers', category: 'API / Routing', color: '#34d399', badge: 'TIER 3 • API / ROUTING' },
  { group: 3, name: 'Domain Logic & Services', category: 'Services / State', color: '#fbbf24', badge: 'TIER 4 • SERVICES' },
  { group: 4, name: 'Database & Data Models', category: 'Data / Persistence', color: '#f472b6', badge: 'TIER 5 • DATA & MODELS' },
  { group: 5, name: 'Shared Utilities & Helpers', category: 'Utils / Shared', color: '#a78bfa', badge: 'TIER 6 • UTILITIES' },
];

/**
 * Computes radial cluster center coordinates for detected architectural modules.
 * Arranges modular cluster centroids in an aesthetically balanced polygon/circle around the canvas center.
 */
export function computeModuleClusterCenters(
  modules: ArchitecturalModule[],
  width = 800,
  height = 500
): Map<string, { x: number; y: number }> {
  const centers = new Map<string, { x: number; y: number }>();
  const centerX = width / 2;
  const centerY = height / 2;

  if (!modules || modules.length === 0) return centers;

  // Find root / core module (place near top or center)
  const coreModule = modules.find(m => m.category === 'core');
  const nonCoreModules = modules.filter(m => m.id !== coreModule?.id);

  if (coreModule) {
    // If only core, place center
    if (nonCoreModules.length === 0) {
      centers.set(coreModule.id, { x: centerX, y: centerY });
      return centers;
    }
    // Place core module in upper-center
    centers.set(coreModule.id, { x: centerX, y: centerY - 40 });
  }

  const count = nonCoreModules.length;
  // Compute radial distribution radius scaled with viewport
  const radiusX = Math.min(width * 0.38, Math.max(180, count * 45));
  const radiusY = Math.min(height * 0.38, Math.max(140, count * 35));

  nonCoreModules.forEach((mod, i) => {
    // Angular distribution offset so UI is top-left, API top-right, Data bottom, Utils right, etc.
    let targetAngle: number;

    if (mod.category === 'presentation') {
      targetAngle = Math.PI * 0.85; // Top-Left
    } else if (mod.category === 'api') {
      targetAngle = Math.PI * 0.15; // Top-Right
    } else if (mod.category === 'services') {
      targetAngle = Math.PI * 0.55; // Mid-Right
    } else if (mod.category === 'data') {
      targetAngle = Math.PI * 1.5; // Bottom
    } else if (mod.category === 'utils') {
      targetAngle = Math.PI * 1.8; // Bottom-Right
    } else if (mod.category === 'config') {
      targetAngle = Math.PI * 1.2; // Bottom-Left
    } else {
      const step = (2 * Math.PI) / Math.max(1, count);
      targetAngle = i * step;
    }

    const x = centerX + radiusX * Math.cos(targetAngle);
    const y = centerY + radiusY * Math.sin(targetAngle);

    centers.set(mod.id, { x, y });
  });

  return centers;
}

/**
 * Computes a smooth, padded 2D convex hull SVG path for a cluster of nodes.
 */
export function computeModuleConvexHull(
  nodes: D3Node[],
  padding = 34
): { pathD: string; centroid: { x: number; y: number } } | null {
  const validNodes = nodes.filter(n => typeof n.x === 'number' && typeof n.y === 'number');
  if (validNodes.length === 0) return null;

  // Calculate geometric centroid
  let sumX = 0;
  let sumY = 0;
  validNodes.forEach(n => {
    sumX += n.x!;
    sumY += n.y!;
  });
  const centroid = { x: sumX / validNodes.length, y: sumY / validNodes.length };

  const lineGenerator = d3.line<[number, number]>()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveCatmullRomClosed.alpha(0.5));

  // Case 1: Single Node - create smooth 8-point circular hull
  if (validNodes.length === 1) {
    const node = validNodes[0];
    const r = padding + (node.size || 12);
    const pts: [number, number][] = [];
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      pts.push([node.x! + r * Math.cos(angle), node.y! + r * Math.sin(angle)]);
    }
    const pathD = lineGenerator(pts);
    return pathD ? { pathD, centroid } : null;
  }

  // Case 2: 2 Nodes - create smooth capsule hull
  if (validNodes.length === 2) {
    const n1 = validNodes[0];
    const n2 = validNodes[1];
    const dx = n2.x! - n1.x!;
    const dy = n2.y! - n1.y!;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const r = padding;

    const pts: [number, number][] = [
      [n1.x! + nx * r - (dx / dist) * r, n1.y! + ny * r - (dy / dist) * r],
      [n1.x! - nx * r - (dx / dist) * r, n1.y! - ny * r - (dy / dist) * r],
      [n2.x! - nx * r + (dx / dist) * r, n2.y! - ny * r + (dy / dist) * r],
      [n2.x! + nx * r + (dx / dist) * r, n2.y! + ny * r + (dy / dist) * r],
    ];

    const pathD = lineGenerator(pts);
    return pathD ? { pathD, centroid } : null;
  }

  // Case 3: 3+ Nodes - compute 2D convex hull with d3.polygonHull
  const rawPoints: [number, number][] = validNodes.map(n => [n.x!, n.y!]);
  const hull = d3.polygonHull(rawPoints);

  if (!hull || hull.length < 3) {
    // If nodes are collinear, expand each point in 4 directions
    const expandedPts: [number, number][] = [];
    validNodes.forEach(n => {
      const r = padding;
      expandedPts.push([n.x! - r, n.y! - r]);
      expandedPts.push([n.x! + r, n.y! - r]);
      expandedPts.push([n.x! + r, n.y! + r]);
      expandedPts.push([n.x! - r, n.y! + r]);
    });
    const fallbackHull = d3.polygonHull(expandedPts);
    if (!fallbackHull) return null;
    const pathD = lineGenerator(fallbackHull);
    return pathD ? { pathD, centroid } : null;
  }

  // Expand hull vertices outward from centroid by padding
  const paddedHull: [number, number][] = hull.map(([vx, vy]) => {
    const dx = vx - centroid.x;
    const dy = vy - centroid.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const scale = (dist + padding) / dist;
    return [centroid.x + dx * scale, centroid.y + dy * scale];
  });

  const pathD = lineGenerator(paddedHull);
  return pathD ? { pathD, centroid } : null;
}

/**
 * Computes a layered, hierarchical layout for architecture flow diagrams.
 * Organizes nodes into structured architectural tiers from top to bottom.
 */
export function computeHierarchicalLayout(
  nodes: D3Node[],
  links: D3Link[],
  width = 800,
  height = 600
): HierarchicalLayoutResult {
  const nodePositions = new Map<string, { x: number; y: number }>();
  const centerX = width / 2;
  const startY = 80;
  const tierVerticalGap = 135;

  // Group nodes by architectural tier group
  const tierBuckets = new Map<number, D3Node[]>();
  ARCHITECTURAL_TIERS_CONFIG.forEach(cfg => {
    tierBuckets.set(cfg.group, []);
  });

  // Track any leftover groups
  const unassignedNodes: D3Node[] = [];

  nodes.forEach(node => {
    const grp = node.group ?? (node.id === 'root' ? 0 : 5);
    if (tierBuckets.has(grp)) {
      tierBuckets.get(grp)!.push(node);
    } else {
      unassignedNodes.push(node);
    }
  });

  // Place unassigned nodes in utilities or bottom tier
  if (unassignedNodes.length > 0) {
    const utilBucket = tierBuckets.get(5) || [];
    unassignedNodes.forEach(n => utilBucket.push(n));
    tierBuckets.set(5, utilBucket);
  }

  const activeTiers: ArchitecturalTierMetadata[] = [];
  let currentY = startY;
  let minX = centerX - 100;
  let maxX = centerX + 100;
  let minY = startY;
  let maxY = startY;

  ARCHITECTURAL_TIERS_CONFIG.forEach((cfg, idx) => {
    const tierNodes = tierBuckets.get(cfg.group) || [];
    if (tierNodes.length === 0) return; // Skip empty tiers to keep layout compact

    const count = tierNodes.length;
    const tierY = currentY;

    // Dynamic horizontal distribution
    const maxTierWidth = Math.max(width * 0.85, count * 140);
    const spacingX = count > 1 ? Math.min(180, maxTierWidth / (count - 1)) : 0;
    const totalRowWidth = (count - 1) * spacingX;
    const startX = centerX - totalRowWidth / 2;

    tierNodes.forEach((node, nodeIdx) => {
      let x = count === 1 ? centerX : startX + nodeIdx * spacingX;
      let y = tierY;

      // For tiers with many nodes (> 7), gently stagger alternating nodes to avoid label overlap
      if (count > 7) {
        y += (nodeIdx % 2 === 1 ? 26 : -14);
      }

      nodePositions.set(node.id, { x, y });

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    activeTiers.push({
      tierIndex: idx,
      group: cfg.group,
      name: cfg.name,
      category: cfg.category,
      color: cfg.color,
      badge: cfg.badge,
      y: tierY,
      height: count > 7 ? 100 : 70,
      nodeCount: count
    });

    currentY += tierVerticalGap;
  });

  maxY = Math.max(maxY, currentY - 40);

  return {
    nodePositions,
    tiers: activeTiers,
    minX: minX - 80,
    maxX: maxX + 80,
    minY: minY - 50,
    maxY: maxY + 60
  };
}

