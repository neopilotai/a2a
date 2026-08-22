/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { CodeMapNodeItem, ModuleCategory, ArchitectureTier, CodeEntityType } from '../../types';
import { D3SnapshotModal } from '../D3SnapshotModal';
import { CodemapNodeAttributeLegend } from './CodemapNodeAttributeLegend';
import { DiagramZoomToolbar } from '../DiagramZoomToolbar';
import { GraphMinimap } from '../GraphMinimap';
import { 
  ViewportTransform, 
  createSmoothWheelDelta, 
  computeGraphBounds, 
  smoothFitToBounds, 
  smoothFocusOnNode, 
  smoothPanBy, 
  smoothScaleBy, 
  smoothSetScale 
} from '../../utils/diagramZoomHelper';

type SimCodemapNode = CodeMapNodeItem & { x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null };

interface CodemapTopologyProps {
  nodes: CodeMapNodeItem[];
  links: { source: string; target: string; value: number }[];
  selectedNode: CodeMapNodeItem | null;
  onSelectNode: (node: CodeMapNodeItem) => void;
  categoryColors: Record<ModuleCategory, { bg: string; text: string; hex: string; border: string }>;
  tierColors: Record<ArchitectureTier, { hex: string; label: string }>;
  slopFilter: 'all' | 'high_risk' | 'annotated';
  repoName?: string;
  colorMode?: 'category' | 'tier' | 'health';
  onColorModeChange?: (mode: 'category' | 'tier' | 'health') => void;
  healthFilter?: 'all' | 'critical' | 'warning' | 'cycles_only' | 'healthy';
  onHealthFilterChange?: (filter: 'all' | 'critical' | 'warning' | 'cycles_only' | 'healthy') => void;
  visibleEntityTypes?: Record<CodeEntityType, boolean>;
  onToggleEntityType?: (type: CodeEntityType) => void;
  onSetAllEntityTypes?: (visible: boolean) => void;
  onIsolateEntityType?: (type: CodeEntityType) => void;
  hoveredEntityType?: CodeEntityType | null;
  onHoverEntityType?: (type: CodeEntityType | null) => void;
}

export const CodemapTopology: React.FC<CodemapTopologyProps> = ({
  nodes,
  links,
  selectedNode,
  onSelectNode,
  categoryColors,
  tierColors,
  slopFilter,
  repoName = 'Codemap',
  colorMode: propColorMode = 'category',
  onColorModeChange,
  healthFilter: propHealthFilter = 'all',
  onHealthFilterChange,
  visibleEntityTypes: propVisibleEntityTypes,
  onToggleEntityType: propOnToggleEntityType,
  onSetAllEntityTypes: propOnSetAllEntityTypes,
  onIsolateEntityType: propOnIsolateEntityType,
  hoveredEntityType: propHoveredEntityType,
  onHoverEntityType: propOnHoverEntityType,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodesRef = useRef<SimCodemapNode[]>([]);
  const activeWorkerRef = useRef<Worker | null>(null);
  
  const [currentTransform, setCurrentTransform] = useState<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 900, height: 580 });
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [liveNodes, setLiveNodes] = useState<SimCodemapNode[]>([]);
  const [localColorMode, setLocalColorMode] = useState<'category' | 'tier' | 'health'>('category');
  const [localHealthFilter, setLocalHealthFilter] = useState<'all' | 'critical' | 'warning' | 'cycles_only' | 'healthy'>('all');

  const activeColorMode = propColorMode || localColorMode;
  const activeHealthFilter = propHealthFilter || localHealthFilter;

  const handleSetColorMode = (mode: 'category' | 'tier' | 'health') => {
    if (onColorModeChange) onColorModeChange(mode);
    else setLocalColorMode(mode);
  };

  const handleSetHealthFilter = (f: 'all' | 'critical' | 'warning' | 'cycles_only' | 'healthy') => {
    if (onHealthFilterChange) onHealthFilterChange(f);
    else setLocalHealthFilter(f);
  };

  // Local fallback state if not controlled externally
  const [localVisibleEntities, setLocalVisibleEntities] = useState<Record<CodeEntityType, boolean>>({
    module: true,
    class: true,
    function: true,
    component: true,
    interface: true,
    config: true,
    test: true,
  });
  const [localHoveredEntity, setLocalHoveredEntity] = useState<CodeEntityType | null>(null);

  const visibleEntityTypes = propVisibleEntityTypes || localVisibleEntities;
  const hoveredEntityType = propHoveredEntityType !== undefined ? propHoveredEntityType : localHoveredEntity;

  const handleToggleEntityType = (type: CodeEntityType) => {
    if (propOnToggleEntityType) {
      propOnToggleEntityType(type);
    } else {
      setLocalVisibleEntities(prev => ({ ...prev, [type]: !prev[type] }));
    }
  };

  const handleSetAllEntityTypes = (visible: boolean) => {
    if (propOnSetAllEntityTypes) {
      propOnSetAllEntityTypes(visible);
    } else {
      const next: Record<CodeEntityType, boolean> = {
        module: visible,
        class: visible,
        function: visible,
        component: visible,
        interface: visible,
        config: visible,
        test: visible,
      };
      setLocalVisibleEntities(next);
    }
  };

  const handleIsolateEntityType = (type: CodeEntityType) => {
    if (propOnIsolateEntityType) {
      propOnIsolateEntityType(type);
    } else {
      const next: Record<CodeEntityType, boolean> = {
        module: type === 'module',
        class: type === 'class',
        function: type === 'function',
        component: type === 'component',
        interface: type === 'interface',
        config: type === 'config',
        test: type === 'test',
      };
      setLocalVisibleEntities(next);
    }
  };

  const handleHoverEntityType = (type: CodeEntityType | null) => {
    if (propOnHoverEntityType) {
      propOnHoverEntityType(type);
    } else {
      setLocalHoveredEntity(type);
    }
  };

  // Filter nodes based on entity visibility, slopFilter, AND healthFilter
  const displayNodes = React.useMemo(() => {
    let filtered = nodes.filter(n => visibleEntityTypes[n.entityType || 'module']);

    if (slopFilter === 'high_risk') {
      filtered = filtered.filter(n => n.annotation?.slopRisk === 'high' || n.importance === 'critical');
    } else if (slopFilter === 'annotated') {
      filtered = filtered.filter(n => !!n.annotation);
    }

    if (activeHealthFilter === 'critical') {
      filtered = filtered.filter(n => n.healthStatus?.severity === 'critical');
    } else if (activeHealthFilter === 'warning') {
      filtered = filtered.filter(n => n.healthStatus?.severity === 'warning');
    } else if (activeHealthFilter === 'cycles_only') {
      filtered = filtered.filter(n => n.healthStatus?.isCycleMember);
    } else if (activeHealthFilter === 'healthy') {
      filtered = filtered.filter(n => n.healthStatus?.severity === 'healthy');
    }

    return filtered;
  }, [nodes, slopFilter, activeHealthFilter, visibleEntityTypes]);

  // Smooth Zoom & Pan Handlers
  const handleResetView = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !zoomBehaviorRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 580;
    
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .ease(d3.easeCubicOut)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(1));
  }, []);

  const handleFitToContent = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !zoomBehaviorRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 580;

    const bounds = computeGraphBounds(nodesRef.current);
    if (bounds) {
      smoothFitToBounds(svgRef.current, zoomBehaviorRef.current, bounds, width, height, 550, 48);
    } else {
      handleResetView();
    }
  }, [handleResetView]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    smoothScaleBy(svgRef.current, zoomBehaviorRef.current, 1.35, 260);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    smoothScaleBy(svgRef.current, zoomBehaviorRef.current, 0.74, 260);
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    smoothPanBy(svgRef.current, zoomBehaviorRef.current, currentTransform, dx, dy, 240);
  }, [currentTransform]);

  const handleSetScalePreset = useCallback((scale: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    smoothSetScale(
      svgRef.current,
      zoomBehaviorRef.current,
      currentTransform,
      containerDimensions.width,
      containerDimensions.height,
      scale,
      350
    );
  }, [currentTransform, containerDimensions]);

  const handleFocusSelected = useCallback(() => {
    if (!selectedNode) return;
    const target = nodesRef.current.find(n => n.id === selectedNode.id);
    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
      smoothFocusOnNode(
        svgRef.current,
        zoomBehaviorRef.current,
        target.x,
        target.y,
        containerDimensions.width,
        containerDimensions.height,
        1.45,
        500
      );
    }
  }, [selectedNode, containerDimensions]);

  const handleMinimapNavigate = useCallback((targetX: number, targetY: number, smooth = false) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const transform = d3.zoomIdentity.translate(targetX, targetY).scale(currentTransform.k);
    if (smooth) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .call(zoomBehaviorRef.current.transform, transform);
    } else {
      d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, transform);
    }
  }, [currentTransform.k]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || displayNodes.length === 0) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 580;
    setContainerDimensions({ width, height });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs
    const defs = svg.append('defs');

    // Grid Pattern
    const pattern = defs.append('pattern')
      .attr('id', 'topology-grid')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
      .attr('d', 'M 24 0 L 0 0 0 24')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.03)')
      .attr('stroke-width', 0.5);

    // Glow filter for critical nodes
    const glowFilter = defs.append('filter')
      .attr('id', 'glow-critical')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');

    glowFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .join('feMergeNode')
      .attr('in', (d: any) => d);

    // Background rect
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#topology-grid)')
      .attr('pointer-events', 'none');

    // Container group
    const g = svg.append('g').attr('class', 'topology-zoom-layer');

    // Clone data for simulation
    const simNodes: SimCodemapNode[] = displayNodes.map(d => ({ ...d }));
    nodesRef.current = simNodes;

    const nodeIds = new Set(simNodes.map(n => n.id));
    const simLinks = links
      .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map(l => ({ ...l }));

    // Force Simulation
    const simulation = d3.forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(75))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.importance === 'critical' ? 26 : 18)))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulation.stop(); // Stop main thread simulation; worker computes the heavy layout!

    // Asynchronous Web Worker layout computation
    if (activeWorkerRef.current) {
      activeWorkerRef.current.terminate();
    }

    const workerBlob = new Blob([`
      self.onmessage = function(e) {
        const { nodes, links, width, height, iterations = 150 } = e.data;
        let useD3 = false;
        try {
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js');
          if (typeof d3 !== 'undefined') {
            useD3 = true;
          }
        } catch (err) {}

        if (useD3) {
          try {
            const simLinks = links.map(l => ({
              source: typeof l.source === 'object' ? l.source.id : l.source,
              target: typeof l.target === 'object' ? l.target.id : l.target,
              value: l.value
            }));

            const simulation = d3.forceSimulation(nodes)
              .force('link', d3.forceLink(simLinks).id(d => d.id).distance(75))
              .force('charge', d3.forceManyBody().strength(-300))
              .force('center', d3.forceCenter(width / 2, height / 2))
              .force('collision', d3.forceCollide().radius(d => d.importance === 'critical' ? 26 : 18))
              .force('x', d3.forceX(width / 2).strength(0.05))
              .force('y', d3.forceY(height / 2).strength(0.05));

            simulation.stop();
            for (let i = 0; i < iterations; i++) {
              simulation.tick();
              if (i % 12 === 0 || i === iterations - 1) {
                self.postMessage({
                  type: 'tick',
                  nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, vx: n.vx, vy: n.vy, fx: n.fx, fy: n.fy })),
                  progress: (i + 1) / iterations
                });
              }
            }
            self.postMessage({ type: 'end', nodes });
            return;
          } catch (err) {}
        }

        // Fallback Custom physics engine inside Worker (Offline-first / fail-safe)
        const nodeMap = new Map();
        nodes.forEach(n => {
          n.x = n.x !== undefined ? n.x : (width / 2) + (Math.random() - 0.5) * 50;
          n.y = n.y !== undefined ? n.y : (height / 2) + (Math.random() - 0.5) * 50;
          n.vx = n.vx || 0;
          n.vy = n.vy || 0;
          nodeMap.set(n.id, n);
        });

        const resolvedLinks = links.map(l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return { source: nodeMap.get(sId), target: nodeMap.get(tId) };
        }).filter(l => l.source && l.target);

        for (let step = 0; step < iterations; step++) {
          nodes.forEach(n => {
            if (n.fx !== undefined && n.fx !== null) {
              n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; return;
            }
            n.vx += (width / 2 - n.x) * 0.01;
            n.vy += (height / 2 - n.y) * 0.01;
          });

          for (let i = 0; i < nodes.length; i++) {
            const u = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
              const v = nodes[j];
              const dx = v.x - u.x;
              const dy = v.y - u.y;
              const distSq = dx * dx + dy * dy + 1;
              const dist = Math.sqrt(distSq);
              const force = -150 / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              u.vx += fx; u.vy += fy;
              v.vx -= fx; v.vy -= fy;
            }
          }

          resolvedLinks.forEach(l => {
            const u = l.source;
            const v = l.target;
            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const k = 0.035 * (dist - 75);
            const fx = (dx / dist) * k;
            const fy = (dy / dist) * k;
            u.vx += fx; u.vy += fy;
            v.vx -= fx; v.vy -= fy;
          });

          for (let i = 0; i < nodes.length; i++) {
            const u = nodes[i];
            const rU = u.importance === 'critical' ? 26 : 18;
            for (let j = i + 1; j < nodes.length; j++) {
              const v = nodes[j];
              const rV = v.importance === 'critical' ? 26 : 18;
              const minRadius = rU + rV;
              const dx = v.x - u.x;
              const dy = v.y - u.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              if (dist < minRadius) {
                const overlap = minRadius - dist;
                const forceX = (dx / dist) * overlap * 0.25;
                const forceY = (dy / dist) * overlap * 0.25;
                u.vx -= forceX; u.vy -= forceY;
                v.vx += forceX; v.vy += forceY;
              }
            }
          }

          nodes.forEach(n => {
            if (n.fx !== undefined && n.fx !== null) return;
            n.x += n.vx;
            n.y += n.vy;
            n.vx *= 0.82;
            n.vy *= 0.82;
          });

          if (step % 12 === 0 || step === iterations - 1) {
            self.postMessage({
              type: 'tick',
              nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, vx: n.vx, vy: n.vy, fx: n.fx, fy: n.fy })),
              progress: (step + 1) / iterations
            });
          }
        }
        self.postMessage({ type: 'end', nodes });
      };
    `], { type: 'application/javascript' });

    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    activeWorkerRef.current = worker;

    worker.postMessage({
      nodes: simNodes.map(n => ({ id: n.id, importance: n.importance, x: n.x, y: n.y, fx: n.fx, fy: n.fy })),
      links: simLinks.map(l => ({ source: typeof l.source === 'object' ? (l.source as any).id : l.source, target: typeof l.target === 'object' ? (l.target as any).id : l.target, value: l.value })),
      width,
      height
    });

    worker.onmessage = (e) => {
      const { type: msgType, nodes: workerNodes } = e.data;
      if (msgType === 'tick' || msgType === 'end') {
        const nodeMap = new Map<string, any>(workerNodes.map((n: any) => [n.id, n]));
        simNodes.forEach(node => {
          const updated = nodeMap.get(node.id);
          if (updated) {
            node.x = updated.x;
            node.y = updated.y;
            node.vx = updated.vx;
            node.vy = updated.vy;
          }
        });

        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

        if (msgType === 'end') {
          setLiveNodes([...simNodes]);
        }
      }
    };

    // Create node mapping for fast link inspection
    const nodeMap = new Map<string, SimCodemapNode>();
    simNodes.forEach(n => nodeMap.set(n.id, n));

    // Links Rendering
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('class', 'topology-link')
      .attr('stroke', (d: any) => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        const sNode = nodeMap.get(sId);
        const tNode = nodeMap.get(tId);
        if (sNode?.healthStatus?.isCycleMember && tNode?.healthStatus?.isCycleMember) {
          return '#ef4444'; // Glowing crimson for cyclic dependencies!
        }
        return 'rgba(255, 255, 255, 0.14)';
      })
      .attr('stroke-width', (d: any) => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        const sNode = nodeMap.get(sId);
        const tNode = nodeMap.get(tId);
        if (sNode?.healthStatus?.isCycleMember && tNode?.healthStatus?.isCycleMember) {
          return 2.5;
        }
        return Math.min(3, Math.max(1, d.value || 1));
      })
      .attr('stroke-dasharray', (d: any) => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        const sNode = nodeMap.get(sId);
        const tNode = nodeMap.get(tId);
        if (sNode?.healthStatus?.isCycleMember && tNode?.healthStatus?.isCycleMember) {
          return '4,2';
        }
        return d.value > 3 ? '4,4' : 'none';
      });

    // Nodes Rendering
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('class', 'node-element cursor-pointer')
      .attr('data-entity-type', (d: any) => d.entityType || 'module')
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        onSelectNode(d);
        if (typeof d.x === 'number' && typeof d.y === 'number') {
          smoothFocusOnNode(svgRef.current, zoomBehaviorRef.current, d.x, d.y, width, height, 1.45, 450);
        }
      });

    // Drag behavior
    node.call(
      d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // Node Outer Ring / Halo (Enhanced for Circular Dependencies & Health Check Alerts)
    node.each(function(d: any) {
      const isCriticalImportance = d.importance === 'critical';
      const isHighSlop = d.annotation?.slopRisk === 'high';
      const isSelected = selectedNode?.id === d.id;
      const isCycle = d.healthStatus?.isCycleMember;
      const isCriticalAlert = d.healthStatus?.severity === 'critical';
      const isWarningAlert = d.healthStatus?.severity === 'warning';

      if (isSelected || isCycle || isCriticalAlert || isWarningAlert || isHighSlop || isCriticalImportance) {
        const strokeColor = 
          isSelected ? '#38bdf8' :
          (isCycle || isCriticalAlert) ? '#ef4444' :
          isWarningAlert ? '#f59e0b' :
          isHighSlop ? '#f59e0b' : '#6366f1';

        d3.select(this)
          .append('circle')
          .attr('class', 'node-halo')
          .attr('r', (isCriticalImportance || isCycle || isCriticalAlert) ? 20 : 16)
          .attr('fill', 'none')
          .attr('stroke', strokeColor)
          .attr('stroke-width', isSelected ? 2.5 : (isCycle || isCriticalAlert) ? 2.2 : 1.5)
          .attr('stroke-dasharray', isCycle ? '4,2' : isHighSlop ? '3,2' : 'none')
          .attr('opacity', 0.85)
          .style('filter', (isCycle || isCriticalAlert || isCriticalImportance) ? 'url(#glow-critical)' : 'none');
      }
    });

    // Core Circle (Evaluates activeColorMode)
    node.append('circle')
      .attr('class', 'node-core')
      .attr('r', (d: any) => (d.importance === 'critical' || d.healthStatus?.isCycleMember ? 13 : d.importance === 'normal' ? 9.5 : 7.5))
      .attr('fill', (d: any) => {
        if (activeColorMode === 'health' && d.healthStatus) {
          return d.healthStatus.color;
        }
        if (activeColorMode === 'tier') {
          return tierColors[d.tier as ArchitectureTier]?.hex || '#6366f1';
        }
        return categoryColors[d.category as ModuleCategory]?.hex || '#6366f1';
      })
      .attr('fill-opacity', (d: any) => (selectedNode?.id === d.id ? 1 : 0.88))
      .attr('stroke', (d: any) => {
        if (selectedNode?.id === d.id) return '#ffffff';
        if (d.healthStatus?.severity === 'critical') return '#ef4444';
        if (d.annotation) return '#38bdf8'; // Cyan border if AI-annotated
        return 'rgba(255, 255, 255, 0.35)';
      })
      .attr('stroke-width', (d: any) => (selectedNode?.id === d.id ? 3 : d.healthStatus?.severity === 'critical' ? 2 : d.annotation ? 2 : 1))
      .style('filter', (d: any) => (d.importance === 'critical' || d.healthStatus?.severity === 'critical' ? 'url(#glow-critical)' : 'none'));

    // Inner indicator icon/dot for Annotated Nodes or Circular Loops
    node.each(function(d: any) {
      if (d.healthStatus?.isCycleMember) {
        d3.select(this)
          .append('circle')
          .attr('class', 'node-inner-cycle-dot')
          .attr('r', 3)
          .attr('fill', '#ef4444')
          .attr('pointer-events', 'none');
      } else if (d.annotation) {
        d3.select(this)
          .append('circle')
          .attr('class', 'node-inner-dot')
          .attr('r', 2.5)
          .attr('fill', '#ffffff')
          .attr('pointer-events', 'none');
      }
    });

    // Node Labels
    node.append('text')
      .attr('class', 'node-label')
      .text((d: any) => d.label)
      .attr('x', (d: any) => (d.importance === 'critical' ? 18 : 13))
      .attr('y', 4)
      .attr('fill', (d: any) => (selectedNode?.id === d.id ? '#ffffff' : '#cbd5e1'))
      .attr('font-size', (d: any) => (d.importance === 'critical' ? '11px' : '9.5px'))
      .attr('font-weight', (d: any) => (d.importance === 'critical' || selectedNode?.id === d.id ? '700' : '500'))
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // Smooth D3 Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 8])
      .wheelDelta(createSmoothWheelDelta())
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setCurrentTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Double-click background to fit
    svg.on('dblclick.zoom', (event) => {
      event.preventDefault();
      handleFitToContent();
    });

    return () => {
      simulation.stop();
      if (activeWorkerRef.current) {
        activeWorkerRef.current.terminate();
      }
      svg.on('.zoom', null);
    };
  }, [displayNodes, links, selectedNode, categoryColors, onSelectNode, handleFitToContent]);

  // Fast entity hover highlight effect without restarting simulation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (!hoveredEntityType) {
      svg.selectAll('.node-element')
        .transition()
        .duration(120)
        .style('opacity', 1);

      svg.selectAll('.topology-link')
        .transition()
        .duration(120)
        .style('opacity', 1)
        .attr('stroke', 'rgba(255, 255, 255, 0.14)');
    } else {
      svg.selectAll('.node-element')
        .transition()
        .duration(120)
        .style('opacity', function() {
          const el = d3.select(this);
          const type = el.attr('data-entity-type');
          return type === hoveredEntityType ? 1 : 0.18;
        });

      svg.selectAll('.topology-link')
        .transition()
        .duration(120)
        .style('opacity', (d: any) => {
          const sType = d.source?.entityType;
          const tType = d.target?.entityType;
          return sType === hoveredEntityType || tType === hoveredEntityType ? 0.85 : 0.08;
        });
    }
  }, [hoveredEntityType]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleFitToContent();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handlePan(0, 100);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handlePan(0, -100);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePan(100, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handlePan(-100, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleFitToContent, handlePan]);

  const zoomPercent = Math.round(currentTransform.k * 100);

  return (
    <div ref={containerRef} className="h-[540px] md:h-[620px] w-full relative bg-slate-950/60 overflow-hidden select-none">
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Interactive, Collapsible Node Attribute Legend & Entity Visibility */}
      <CodemapNodeAttributeLegend
        nodes={nodes}
        visibleEntityTypes={visibleEntityTypes}
        onToggleEntityType={handleToggleEntityType}
        onSetAllEntityTypes={handleSetAllEntityTypes}
        onIsolateEntityType={handleIsolateEntityType}
        hoveredEntityType={hoveredEntityType}
        onHoverEntityType={handleHoverEntityType}
        initialCollapsed={false}
      />

      {/* Floating Zoom & Pan Toolbar */}
      <div className="absolute top-4 right-4 z-20">
        <DiagramZoomToolbar
          zoomPercent={zoomPercent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onFitToContent={handleFitToContent}
          onFocusSelected={handleFocusSelected}
          hasSelectedNode={!!selectedNode}
          onPan={handlePan}
          onSetScalePreset={handleSetScalePreset}
          onTakeSnapshot={() => setIsSnapshotOpen(true)}
          showSnapshotButton={true}
        />
      </div>

      {/* Interactive Graph Radar Minimap */}
      <GraphMinimap
        nodes={liveNodes.length > 0 ? liveNodes : displayNodes}
        links={links}
        containerDimensions={containerDimensions}
        currentTransform={currentTransform}
        onNavigate={handleMinimapNavigate}
        onFitAll={handleFitToContent}
        position="bottom-right"
        colorAccessor={(node) => categoryColors[node.category as ModuleCategory]?.hex || '#6366f1'}
      />

      {/* Top Center: View Color Mode & Health Filter Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-2xl">
          <button
            onClick={() => handleSetColorMode('category')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
              activeColorMode === 'category'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Category
          </button>
          <button
            onClick={() => handleSetColorMode('tier')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
              activeColorMode === 'tier'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tier
          </button>
          <button
            onClick={() => handleSetColorMode('health')}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeColorMode === 'health'
                ? 'bg-rose-600 text-white shadow-neon-rose'
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>Health Alerts</span>
          </button>
        </div>

        {/* Health Mode Sub-Filters */}
        {activeColorMode === 'health' && (
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-xl border border-rose-500/20 text-[10px] font-mono animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-slate-400 font-bold mr-1">Filter:</span>
            <button
              onClick={() => handleSetHealthFilter('all')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                activeHealthFilter === 'all' ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleSetHealthFilter('cycles_only')}
              className={`px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeHealthFilter === 'cycles_only' ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Cycles Only</span>
            </button>
            <button
              onClick={() => handleSetHealthFilter('critical')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                activeHealthFilter === 'critical' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => handleSetHealthFilter('warning')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                activeHealthFilter === 'warning' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              Hotspots
            </button>
            <button
              onClick={() => handleSetHealthFilter('healthy')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                activeHealthFilter === 'healthy' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Clean
            </button>
          </div>
        )}
      </div>

      {/* Snapshot Studio Modal */}
      <D3SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        svgElement={svgRef.current}
        repoName={repoName}
        nodeCount={displayNodes.length}
        linkCount={links.length}
      />

      {/* Visual Indicator Overlay (Compact Status Badge) */}
      <div className="absolute bottom-4 left-4 p-2.5 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-400 z-10 pointer-events-none">
        {activeColorMode === 'health' ? (
          <>
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400 inline-block animate-pulse" />
              <span>Critical Cycle / Anti-Pattern</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400 inline-block" />
              <span>Complexity Hotspot</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400 inline-block" />
              <span>Clean Healthy Node</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-400 bg-sky-500/20 inline-block" />
              <span>AI Annotated</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-400 border-dashed inline-block" />
              <span>Slop Hotspot</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-3 h-3 rounded-full bg-indigo-500/40 border border-indigo-400 inline-block" />
              <span>Critical Entrypoint</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
