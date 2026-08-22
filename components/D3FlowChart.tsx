/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as d3 from 'd3';
import { DataFlowGraph, D3Node, D3Link, DiagramLayoutAlgorithm, ArchitecturalModule } from '../types';
import { Compass, Filter, Eye, Camera, Zap, Workflow, ArrowDownRight, ArrowUpLeft, Lock, Unlock, X, Sparkles, Layers, Network, LayoutGrid, Crosshair, Target, Boxes, FolderTree, Flame } from 'lucide-react';
import VisualLegend from './VisualLegend';
import { D3SnapshotModal } from './D3SnapshotModal';
import { DiagramZoomToolbar } from './DiagramZoomToolbar';
import { GraphMinimap } from './GraphMinimap';
import { calculateFileImpact } from '../services/fileImpactService';
import { D3ForceWorkerManager } from '../services/d3ForceWorkerManager';
import { 
  computeHierarchicalLayout, 
  computeModuleClusterCenters,
  computeModuleConvexHull,
  ArchitecturalTierMetadata 
} from '../utils/layoutAlgorithms';
import { 
  ViewportTransform, 
  createSmoothWheelDelta, 
  computeGraphBounds, 
  smoothFitToBounds, 
  smoothFocusOnNode, 
  smoothSpatialFocusTransition,
  smoothSpatialNeighborhoodTransition,
  smoothPanBy, 
  smoothScaleBy, 
  smoothSetScale 
} from '../utils/diagramZoomHelper';

export interface D3FlowChartRef {
  resetView: () => void;
  fitToContent: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusNode: (nodeId: string) => void;
  focusNeighborhood: (nodeId: string) => void;
  openSnapshotModal: () => void;
  getSvgElement: () => SVGSVGElement | null;
  toggleDependencyTrace?: () => void;
  toggleFocusMode?: () => void;
  setFocusMode?: (enabled: boolean) => void;
  setFocalNode?: (nodeId: string | null) => void;
  setLayoutAlgorithm?: (mode: DiagramLayoutAlgorithm) => void;
  toggleLayoutAlgorithm?: () => void;
}

interface D3FlowChartProps {
  data: DataFlowGraph;
  repoName?: string;
  onNodeClick?: (node: D3Node) => void;
  onSelectionChange?: (nodes: D3Node[]) => void;
  selectedNodeId?: string | null;
  highlightedGroupIndex?: number | null;
  onHighlightGroup?: (groupIndex: number | null) => void;
  showLegend?: boolean;
  enableDependencyTrace?: boolean;
  isFocusMode?: boolean;
  onFocusModeChange?: (enabled: boolean) => void;
  onTraceNodeChange?: (focalNode: D3Node | null, traceInfo?: { incoming: D3Node[]; outgoing: D3Node[] } | null) => void;
  layoutAlgorithm?: DiagramLayoutAlgorithm;
  onLayoutAlgorithmChange?: (layout: DiagramLayoutAlgorithm) => void;
}

// Architectural neon colors for different module tiers
const NEON_COLORS = [
  "#8b5cf6", // 0: root / core: violet
  "#38bdf8", // 1: ui: sky blue
  "#34d399", // 2: api: emerald
  "#fbbf24", // 3: services: amber
  "#f472b6", // 4: data: pink
  "#a78bfa", // 5: utils: purple
  "#2dd4bf", // 6: config: teal
  "#f87171", // 7: errors/auth: red
];

// Connector colors based on link type/value
const LINK_COLORS: { [key: number]: string } = {
  1: "#64748b", // structural / util: slate
  2: "#38bdf8", // action dispatch / API routing: sky
  3: "#f472b6", // persistence query: pink
};

// High-contrast colors for Dependency Trace
export const TRACE_COLORS = {
  INCOMING: '#00f0ff', // High-Contrast Electric Cyan for standard incoming callers
  OUTGOING: '#ff9f1c', // High-Contrast Vivid Amber/Orange for standard outgoing dependencies
  CRITICAL_PATH: '#ff007a', // High-Contrast Vivid Neon Rose / Hot Pink for Critical Architectural Paths leading to High-Traffic Hubs
  CRITICAL_INCOMING: '#ff3366', // High-Contrast Rose for Critical Incoming Callers from high-traffic hubs
  CRITICAL_HUB: '#f43f5e',
  FOCAL: '#ffffff',    // High-Contrast Pure White with Violet Glow for focal node
  DIMMED_LINK: '#1e293b',
};

const D3FlowChart = forwardRef<D3FlowChartRef, D3FlowChartProps>(({ 
  data, 
  repoName = 'Repository',
  onNodeClick, 
  onSelectionChange,
  selectedNodeId,
  highlightedGroupIndex = null,
  onHighlightGroup,
  showLegend = true,
  enableDependencyTrace = true,
  isFocusMode: externalFocusMode = false,
  onFocusModeChange,
  onTraceNodeChange,
  layoutAlgorithm: externalLayoutAlgorithm = 'force',
  onLayoutAlgorithmChange
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const workerManagerRef = useRef<D3ForceWorkerManager | null>(null);
  const activeWorkerRef = useRef<Worker | null>(null);
  const zoomContainerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<DiagramLayoutAlgorithm>(externalLayoutAlgorithm);
  const [currentTransform, setCurrentTransform] = useState<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);
  const [isDependencyTraceEnabled, setIsDependencyTraceEnabled] = useState<boolean>(enableDependencyTrace);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(externalFocusMode);
  const [pinnedNodeIds, setPinnedNodeIds] = useState<string[]>(selectedNodeId ? [selectedNodeId] : []);
  const pinnedNodeId = pinnedNodeIds[0] || null;
  const [activeGroupHighlight, setActiveGroupHighlight] = useState<number | null>(highlightedGroupIndex);
  const [highlightedModuleId, setHighlightedModuleId] = useState<string | null>(null);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [liveNodes, setLiveNodes] = useState<D3Node[]>([]);

  // Stable callback references to prevent infinite simulation rebuild loops
  const onNodeClickRef = useRef(onNodeClick);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onTraceNodeChangeRef = useRef(onTraceNodeChange);
  const onFocusModeChangeRef = useRef(onFocusModeChange);
  const onLayoutAlgorithmChangeRef = useRef(onLayoutAlgorithmChange);
  const onHighlightGroupRef = useRef(onHighlightGroup);

  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);
  useEffect(() => { onTraceNodeChangeRef.current = onTraceNodeChange; }, [onTraceNodeChange]);
  useEffect(() => { onFocusModeChangeRef.current = onFocusModeChange; }, [onFocusModeChange]);
  useEffect(() => { onLayoutAlgorithmChangeRef.current = onLayoutAlgorithmChange; }, [onLayoutAlgorithmChange]);
  useEffect(() => { onHighlightGroupRef.current = onHighlightGroup; }, [onHighlightGroup]);

  // Keep track of previously notified trace structures to prevent redundant parent state updates
  const prevTraceRef = useRef<{
    focalNodeId: string | null;
    incomingIds: string;
    outgoingIds: string;
  }>({ focalNodeId: null, incomingIds: '', outgoingIds: '' });

  // Sync external layout algorithm prop
  useEffect(() => {
    if (externalLayoutAlgorithm && externalLayoutAlgorithm !== layoutAlgorithm) {
      setLayoutAlgorithm(externalLayoutAlgorithm);
    }
  }, [externalLayoutAlgorithm]);

  // Sync external focus mode prop
  useEffect(() => {
    if (externalFocusMode !== undefined && externalFocusMode !== isFocusMode) {
      setIsFocusMode(externalFocusMode);
    }
  }, [externalFocusMode]);

  // Sync external selectedNodeId to pinnedNodeIds
  useEffect(() => {
    if (selectedNodeId !== undefined) {
      if (selectedNodeId) {
        setPinnedNodeIds(prev => prev.includes(selectedNodeId) ? prev : [selectedNodeId]);
      } else {
        setPinnedNodeIds([]);
      }
    }
  }, [selectedNodeId]);

  // Sync external group highlight
  useEffect(() => {
    setActiveGroupHighlight(highlightedGroupIndex);
  }, [highlightedGroupIndex]);

  const handleSetGroupHighlight = (groupIndex: number | null) => {
    setActiveGroupHighlight(groupIndex);
    if (onHighlightGroup) {
      onHighlightGroup(groupIndex);
    }
  };

  // Compute graph-wide node in-degree and identify high-traffic hub files
  const { inDegreeMap, outDegreeMap, highTrafficNodeIds } = useMemo(() => {
    const inDegMap = new Map<string, number>();
    const outDegMap = new Map<string, number>();

    if (data && data.links) {
      data.links.forEach(link => {
        const sId = typeof link.source === 'object' ? (link.source as D3Node).id : (link.source as string);
        const tId = typeof link.target === 'object' ? (link.target as D3Node).id : (link.target as string);
        inDegMap.set(tId, (inDegMap.get(tId) || 0) + 1);
        outDegMap.set(sId, (outDegMap.get(sId) || 0) + 1);
      });
    }

    const highTrafficSet = new Set<string>();
    if (data && data.nodes) {
      const inCounts = Array.from(inDegMap.values()).sort((a, b) => b - a);
      const highTrafficThreshold = inCounts.length > 0 ? Math.max(3, inCounts[Math.min(inCounts.length - 1, Math.floor(inCounts.length * 0.25))] || 2) : 2;

      data.nodes.forEach(n => {
        const inDeg = inDegMap.get(n.id) || 0;
        const outDeg = outDegMap.get(n.id) || 0;
        // High traffic files: root orchestrator, files with inDegree >= 3, top quartile inbound hubs, or heavily connected nodes
        if (
          n.id === 'root' || 
          inDeg >= 3 || 
          (inDeg >= highTrafficThreshold && inDeg >= 2) || 
          (inDeg + outDeg >= 5) || 
          n.group === 0 || 
          n.group === 4
        ) {
          highTrafficSet.add(n.id);
        }
      });
    }

    return { inDegreeMap: inDegMap, outDegreeMap: outDegMap, highTrafficNodeIds: highTrafficSet };
  }, [data]);

  // Determine active trace/focus focal nodes: hover has preview precedence, falls back to pinned group, falls back to root in focus mode
  const activeFocalNodes = useMemo(() => {
    const allNodes = liveNodes.length > 0 ? liveNodes : data.nodes;
    if (hoveredNode) {
      return [hoveredNode];
    }
    if (pinnedNodeIds.length > 0) {
      return allNodes.filter(n => pinnedNodeIds.includes(n.id));
    }
    // Default focal node in Focus Mode
    if (isFocusMode && allNodes.length > 0) {
      const defaultNode = allNodes.find(n => n.id === 'root') || allNodes[0];
      return defaultNode ? [defaultNode] : [];
    }
    return [];
  }, [isFocusMode, hoveredNode, pinnedNodeIds, liveNodes, data.nodes]);

  const activeFocalNode = activeFocalNodes[0] || null;

  // Compute dependency trace relationships for active focal nodes
  const traceDetails = useMemo(() => {
    if (activeFocalNodes.length === 0 || !data) return null;

    const focalIds = new Set<string>(activeFocalNodes.map(n => n.id));
    const incomingNodeIds = new Set<string>();
    const outgoingNodeIds = new Set<string>();
    const incomingLinks: D3Link[] = [];
    const outgoingLinks: D3Link[] = [];

    data.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as D3Node).id : (link.source as string);
      const targetId = typeof link.target === 'object' ? (link.target as D3Node).id : (link.target as string);

      if (focalIds.has(targetId) && !focalIds.has(sourceId)) {
        incomingNodeIds.add(sourceId);
        incomingLinks.push(link);
      }
      if (focalIds.has(sourceId) && !focalIds.has(targetId)) {
        outgoingNodeIds.add(targetId);
        outgoingLinks.push(link);
      }
    });

    const allNodes = liveNodes.length > 0 ? liveNodes : data.nodes;
    const incomingNodes = allNodes.filter(n => incomingNodeIds.has(n.id));
    const outgoingNodes = allNodes.filter(n => outgoingNodeIds.has(n.id));

    // Calculate critical paths to high traffic files
    const criticalOutgoingNodes = outgoingNodes.filter(n => highTrafficNodeIds.has(n.id));
    const criticalIncomingNodes = incomingNodes.filter(n => highTrafficNodeIds.has(n.id));

    return {
      focalNode: activeFocalNode,
      focalNodes: activeFocalNodes,
      focalIds,
      incomingNodeIds,
      outgoingNodeIds,
      incomingLinks,
      outgoingLinks,
      incomingNodes,
      outgoingNodes,
      criticalOutgoingNodes,
      criticalIncomingNodes,
      totalIncoming: incomingNodes.length,
      totalOutgoing: outgoingNodes.length,
      criticalOutgoingCount: criticalOutgoingNodes.length,
      criticalIncomingCount: criticalIncomingNodes.length,
      isPinned: pinnedNodeIds.length > 0 && !hoveredNode
    };
  }, [activeFocalNodes, data, liveNodes, pinnedNodeIds, hoveredNode, highTrafficNodeIds]);

  // Compute live Architectural Impact Analysis for active focal node
  const focalImpact = useMemo(() => {
    if (!traceDetails?.focalNode || !data) return null;
    return calculateFileImpact(traceDetails.focalNode, data);
  }, [traceDetails?.focalNode, data]);

  // Notify parent component of trace changes with strict structural primitive checking
  useEffect(() => {
    if (onTraceNodeChangeRef.current) {
      const focalNodeId = traceDetails?.focalNode?.id || null;
      const incomingIds = traceDetails ? Array.from(traceDetails.incomingNodeIds).sort().join(',') : '';
      const outgoingIds = traceDetails ? Array.from(traceDetails.outgoingNodeIds).sort().join(',') : '';

      if (
        prevTraceRef.current.focalNodeId !== focalNodeId ||
        prevTraceRef.current.incomingIds !== incomingIds ||
        prevTraceRef.current.outgoingIds !== outgoingIds
      ) {
        prevTraceRef.current = { focalNodeId, incomingIds, outgoingIds };
        if (traceDetails) {
          onTraceNodeChangeRef.current(traceDetails.focalNode, {
            incoming: traceDetails.incomingNodes,
            outgoing: traceDetails.outgoingNodes,
          });
        } else {
          onTraceNodeChangeRef.current(null, null);
        }
      }
    }
  }, [traceDetails]);

  // Reset view to default (Center with Scale = 1)
  const resetView = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .ease(d3.easeCubicOut)
      .call(zoomRef.current.transform, transform);
  }, []);

  // Fit all nodes smoothly in the viewport
  const fitToContent = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const bounds = computeGraphBounds(nodesRef.current);
    if (bounds) {
      smoothFitToBounds(svgRef.current, zoomRef.current, bounds, width, height, 550, 48);
    } else {
      resetView();
    }
  }, [resetView]);

  // Smooth Zoom In & Out
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    smoothScaleBy(svgRef.current, zoomRef.current, 1.35, 260);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    smoothScaleBy(svgRef.current, zoomRef.current, 0.74, 260);
  }, []);

  // Smooth Pan
  const handlePan = useCallback((dx: number, dy: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    smoothPanBy(svgRef.current, zoomRef.current, currentTransform, dx, dy, 240);
  }, [currentTransform]);

  // Set Preset Scale
  const handleSetScalePreset = useCallback((scale: number) => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
    smoothSetScale(
      svgRef.current,
      zoomRef.current,
      currentTransform,
      containerDimensions.width,
      containerDimensions.height,
      scale,
      350
    );
  }, [currentTransform, containerDimensions]);

  // Trigger a visual spatial awareness radar pulse ripple around a node coordinate
  const triggerSpatialRipple = useCallback((x: number, y: number, color: string = '#10b981') => {
    if (!zoomContainerRef.current) return;
    const g = zoomContainerRef.current;
    
    // Remove previous spatial ripples
    g.selectAll('.spatial-ripple-ring').remove();

    const rippleG = g.append('g')
      .attr('class', 'spatial-ripple-ring')
      .attr('pointer-events', 'none');

    // Inner expanding pulse ring with glow
    rippleG.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('opacity', 0.95)
      .attr('filter', 'url(#glow-cyan)')
      .transition()
      .duration(900)
      .ease(d3.easeQuadOut)
      .attr('r', 54)
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .remove();

    // Outer delayed expanding radar ring
    rippleG.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.85)
      .transition()
      .delay(120)
      .duration(1100)
      .ease(d3.easeQuadOut)
      .attr('r', 82)
      .attr('stroke-width', 0.8)
      .attr('opacity', 0)
      .remove();
  }, []);

  // Focus on a specific node ID with smooth spatial zoom and pan trajectory
  const focusNode = useCallback((nodeId: string) => {
    const target = nodesRef.current.find(n => n.id === nodeId);
    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
      const width = containerDimensions.width || 800;
      const height = containerDimensions.height || 500;
      smoothSpatialFocusTransition(
        svgRef.current,
        zoomRef.current,
        target.x,
        target.y,
        width,
        height,
        1.45,
        720,
        () => triggerSpatialRipple(target.x!, target.y!, '#10b981')
      );
    }
  }, [containerDimensions, triggerSpatialRipple]);

  // Focus on currently selected/pinned node
  const handleFocusSelected = useCallback(() => {
    if (pinnedNodeId) {
      focusNode(pinnedNodeId);
    }
  }, [pinnedNodeId, focusNode]);

  // Minimap Navigation Handler
  const handleMinimapNavigate = useCallback((targetX: number, targetY: number, smooth = false) => {
    if (!svgRef.current || !zoomRef.current) return;
    const transform = d3.zoomIdentity.translate(targetX, targetY).scale(currentTransform.k);
    if (smooth) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .ease(d3.easeCubicOut)
        .call(zoomRef.current.transform, transform);
    } else {
      d3.select(svgRef.current).call(zoomRef.current.transform, transform);
    }
  }, [currentTransform.k]);

  // Update organic convex hull enclosures around detected architectural module clusters
  const updateModuleHulls = useCallback(() => {
    if (!zoomContainerRef.current) return;
    const g = zoomContainerRef.current;
    const hullsGroup = g.select<SVGGElement>('.module-hulls-group');
    if (hullsGroup.empty()) return;

    if (layoutAlgorithm !== 'modular-force' && !isFocusMode) {
      hullsGroup.selectAll("*").remove();
      return;
    }

    const modules = data.modules || [];
    const focalIds = traceDetails ? traceDetails.focalIds : new Set<string>();
    const incomingNodeIds = traceDetails ? traceDetails.incomingNodeIds : new Set<string>();
    const outgoingNodeIds = traceDetails ? traceDetails.outgoingNodeIds : new Set<string>();

    const hullData: {
      module: ArchitecturalModule;
      pathD: string;
      centroid: { x: number; y: number };
      nodeCount: number;
    }[] = [];

    modules.forEach(mod => {
      const memberNodes = nodesRef.current.filter(n => {
        const belongs = (n.moduleId === mod.id) || (mod.category === 'core' && n.id === 'root');
        if (!belongs) return false;

        if (isFocusMode) {
          // Only include nodes that are in the 1st-degree neighborhood and not dimmed
          return focalIds.has(n.id) || incomingNodeIds.has(n.id) || outgoingNodeIds.has(n.id);
        }
        return true;
      });

      if (memberNodes.length > 0) {
        const hullRes = computeModuleConvexHull(memberNodes, 36);
        if (hullRes) {
          hullData.push({
            module: mod,
            pathD: hullRes.pathD,
            centroid: hullRes.centroid,
            nodeCount: memberNodes.length
          });
        }
      }
    });

    const hulls = hullsGroup.selectAll<SVGGElement, (typeof hullData)[0]>(".module-hull-cluster")
      .data(hullData, (d: any) => d.module.id);

    const hullsEnter = hulls.enter()
      .append("g")
      .attr("class", "module-hull-cluster")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setHighlightedModuleId(prev => (prev === d.module.id ? null : d.module.id));
        if (d.centroid) {
          smoothFocusOnNode(svgRef.current, zoomRef.current, d.centroid.x, d.centroid.y, containerDimensions.width || 800, containerDimensions.height || 500, 1.25, 400);
        }
      });

    // Convex Hull boundary path
    hullsEnter.append("path")
      .attr("class", "hull-path")
      .attr("fill", d => d.module.bgColor || "rgba(56, 189, 248, 0.12)")
      .attr("stroke", d => d.module.borderColor || "rgba(56, 189, 248, 0.55)")
      .attr("stroke-width", 1.6)
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-opacity", 0.75)
      .style("transition", "fill 0.2s, stroke 0.2s");

    // Module Tag Badge Group
    const badgeG = hullsEnter.append("g")
      .attr("class", "hull-badge-g");

    badgeG.append("rect")
      .attr("class", "hull-badge-bg")
      .attr("height", 20)
      .attr("rx", 6)
      .attr("fill", "rgba(15, 23, 42, 0.88)")
      .attr("stroke", d => d.module.color)
      .attr("stroke-width", 1.2);

    badgeG.append("text")
      .attr("class", "hull-badge-text")
      .attr("font-size", "10px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", "700")
      .attr("fill", d => d.module.color)
      .attr("y", 13)
      .attr("x", 8);

    const hullsMerged = hullsEnter.merge(hulls);

    hullsMerged.select<SVGPathElement>(".hull-path")
      .attr("d", d => d.pathD)
      .attr("fill", d => highlightedModuleId && highlightedModuleId !== d.module.id ? "rgba(15, 23, 42, 0.04)" : (d.module.bgColor || "rgba(56, 189, 248, 0.12)"))
      .attr("stroke-opacity", d => highlightedModuleId && highlightedModuleId !== d.module.id ? 0.2 : 0.85)
      .attr("stroke-width", d => highlightedModuleId === d.module.id ? 2.5 : 1.5);

    hullsMerged.select<SVGGElement>(".hull-badge-g")
      .attr("transform", d => `translate(${d.centroid.x - 65}, ${d.centroid.y - 45})`);

    hullsMerged.select<SVGTextElement>(".hull-badge-text")
      .text(d => `${d.module.icon} ${d.module.name} (${d.nodeCount})`);

    hullsMerged.select<SVGRectElement>(".hull-badge-bg")
      .attr("width", d => Math.max(120, (`${d.module.icon} ${d.module.name} (${d.nodeCount})`).length * 7 + 16));

    hulls.exit().remove();
  }, [data.modules, layoutAlgorithm, highlightedModuleId, containerDimensions, isFocusMode, traceDetails]);

  // Apply layout algorithm (Modular Force-Directed vs Standard Force vs Hierarchical)
  const applyLayoutAlgorithm = useCallback((newLayout: DiagramLayoutAlgorithm, autoFit = true) => {
    setLayoutAlgorithm(newLayout);
    if (onLayoutAlgorithmChange) {
      onLayoutAlgorithmChange(newLayout);
    }

    if (!simulationRef.current || !zoomContainerRef.current || nodesRef.current.length === 0) return;

    const width = containerDimensions.width || 800;
    const height = containerDimensions.height || 500;
    const g = zoomContainerRef.current;
    const tierLanesGroup = g.select<SVGGElement>('.tier-lanes-group');
    const hullsGroup = g.select<SVGGElement>('.module-hulls-group');

    if (newLayout === 'hierarchical') {
      // Release cluster forces & hulls
      simulationRef.current.force("clusterX", null);
      simulationRef.current.force("clusterY", null);
      if (!hullsGroup.empty()) hullsGroup.selectAll("*").remove();

      // Calculate tiered hierarchical positioning
      const result = computeHierarchicalLayout(nodesRef.current, linksRef.current, width, height);

      // Fix nodes at their hierarchical target positions
      nodesRef.current.forEach(node => {
        const targetPos = result.nodePositions.get(node.id);
        if (targetPos) {
          node.fx = targetPos.x;
          node.fy = targetPos.y;
          node.x = targetPos.x;
          node.y = targetPos.y;
        }
      });

      // Render architectural tier lanes in background
      if (!tierLanesGroup.empty()) {
        tierLanesGroup.selectAll("*").remove();

        const lanes = tierLanesGroup.selectAll(".tier-lane")
          .data(result.tiers)
          .join("g")
          .attr("class", "tier-lane")
          .attr("transform", d => `translate(0, ${d.y})`);

        // Translucent architectural tier lane banner
        lanes.append("rect")
          .attr("x", result.minX - 40)
          .attr("y", -36)
          .attr("width", (result.maxX - result.minX) + 80)
          .attr("height", d => d.height)
          .attr("rx", 14)
          .attr("fill", "rgba(15, 23, 42, 0.45)")
          .attr("stroke", d => d.color)
          .attr("stroke-opacity", 0.22)
          .attr("stroke-width", 1.2)
          .attr("stroke-dasharray", "4,4");

        // Tier badge background pill
        lanes.append("rect")
          .attr("x", result.minX - 30)
          .attr("y", -30)
          .attr("width", d => d.badge.length * 7 + 20)
          .attr("height", 18)
          .attr("rx", 5)
          .attr("fill", d => `${d.color}20`)
          .attr("stroke", d => `${d.color}60`)
          .attr("stroke-width", 1);

        // Tier badge text
        lanes.append("text")
          .attr("x", result.minX - 22)
          .attr("y", -17)
          .text(d => d.badge)
          .attr("fill", d => d.color)
          .attr("font-size", "9px")
          .attr("font-family", "JetBrains Mono, monospace")
          .attr("font-weight", "800")
          .attr("letter-spacing", "0.5px");

        // Tier title and count
        lanes.append("text")
          .attr("x", result.minX - 30 + 130)
          .attr("y", -17)
          .text(d => `• ${d.name} (${d.nodeCount} ${d.nodeCount === 1 ? 'module' : 'modules'})`)
          .attr("fill", "rgba(148, 163, 184, 0.7)")
          .attr("font-size", "10px")
          .attr("font-family", "JetBrains Mono, monospace")
          .attr("font-weight", "600");
      }

      simulationRef.current
        .force("link", d3.forceLink<D3Node, D3Link>(linksRef.current).id(d => d.id).distance(90))
        .force("charge", d3.forceManyBody().strength(-100));

      // Re-heat simulation slightly to align links smoothly
      simulationRef.current.alpha(0.3).restart();

      if (autoFit) {
        setTimeout(() => {
          fitToContent();
        }, 180);
      }

    } else {
      // Release pinned coordinates
      nodesRef.current.forEach(node => {
        node.fx = null;
        node.fy = null;
      });

      // Clear tier lanes and hulls
      if (!tierLanesGroup.empty()) {
        tierLanesGroup.selectAll("*").remove();
      }
      if (!hullsGroup.empty()) {
        hullsGroup.selectAll("*").remove();
      }

      if (activeWorkerRef.current) {
        activeWorkerRef.current.terminate();
      }

      const workerBlob = new Blob([`
        self.onmessage = function(e) {
          const { nodes, links, width, height, layoutAlgorithm, iterations = 150, clusterCenters } = e.data;
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

              const simulation = d3.forceSimulation(nodes);
              if (layoutAlgorithm === 'modular-force' && clusterCenters) {
                const centerMap = new Map(Object.entries(clusterCenters));
                simulation
                  .force("clusterX", d3.forceX(d => {
                    const center = centerMap.get(d.moduleId || 'mod-core');
                    return center ? center.x : (width / 2);
                  }).strength(0.24))
                  .force("clusterY", d3.forceY(d => {
                    const center = centerMap.get(d.moduleId || 'mod-core');
                    return center ? center.y : (height / 2);
                  }).strength(0.24))
                  .force("link", d3.forceLink(simLinks).id(d => d.id).distance(l => {
                    const srcMod = l.source.moduleId;
                    const tgtMod = l.target.moduleId;
                    return (srcMod && tgtMod && srcMod === tgtMod) ? 50 : 135;
                  }).strength(0.65))
                  .force("charge", d3.forceManyBody().strength(-260))
                  .force("center", d3.forceCenter(width / 2, height / 2))
                  .force("collision", d3.forceCollide().radius(30));
              } else {
                simulation
                  .force("link", d3.forceLink(simLinks).id(d => d.id).distance(90))
                  .force("charge", d3.forceManyBody().strength(-360))
                  .force("center", d3.forceCenter(width / 2, height / 2))
                  .force("collision", d3.forceCollide().radius(28))
                  .force("x", d3.forceX(width / 2).strength(0.06))
                  .force("y", d3.forceY(height / 2).strength(0.06));
              }
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

          const centerMap = clusterCenters ? new Map(Object.entries(clusterCenters)) : null;

          for (let step = 0; step < iterations; step++) {
            nodes.forEach(n => {
              if (n.fx !== undefined && n.fx !== null) {
                n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; return;
              }
              if (layoutAlgorithm === 'modular-force' && centerMap) {
                const center = centerMap.get(n.moduleId || 'mod-core') || { x: width / 2, y: height / 2 };
                n.vx += (center.x - n.x) * 0.024;
                n.vy += (center.y - n.y) * 0.024;
              } else {
                n.vx += (width / 2 - n.x) * 0.01;
                n.vy += (height / 2 - n.y) * 0.01;
              }
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
              const restLen = (layoutAlgorithm === 'modular-force' && u.moduleId === v.moduleId) ? 50 : 100;
              const k = 0.035 * (dist - restLen);
              const fx = (dx / dist) * k;
              const fy = (dy / dist) * k;
              u.vx += fx; u.vy += fy;
              v.vx -= fx; v.vy -= fy;
            });

            const minRadius = 32;
            for (let i = 0; i < nodes.length; i++) {
              const u = nodes[i];
              for (let j = i + 1; j < nodes.length; j++) {
                const v = nodes[j];
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

      const clusterCenters = newLayout === 'modular-force'
        ? Object.fromEntries(computeModuleClusterCenters(data.modules || [], width, height))
        : null;

      worker.postMessage({
        nodes: nodesRef.current.map(n => ({ id: n.id, label: n.label, group: n.group, moduleId: n.moduleId, importance: n.importance, x: n.x, y: n.y, fx: n.fx, fy: n.fy })),
        links: linksRef.current.map(l => ({ source: typeof l.source === 'object' ? (l.source as any).id : l.source, target: typeof l.target === 'object' ? (l.target as any).id : l.target, value: l.value })),
        width,
        height,
        layoutAlgorithm: newLayout,
        clusterCenters
      });

      worker.onmessage = (e) => {
        const { type: msgType, nodes: workerNodes } = e.data;
        if (msgType === 'tick' || msgType === 'end') {
          const nodeMap = new Map<string, any>(workerNodes.map((n: any) => [n.id, n]));
          nodesRef.current.forEach(node => {
            const updated = nodeMap.get(node.id);
            if (updated) {
              node.x = updated.x;
              node.y = updated.y;
              node.vx = updated.vx;
              node.vy = updated.vy;
            }
          });

          const container = zoomContainerRef.current;
          if (container) {
            container.selectAll<SVGLineElement, any>(".links line")
              .attr("x1", (d: any) => d.source.x!)
              .attr("y1", (d: any) => d.source.y!)
              .attr("x2", (d: any) => d.target.x!)
              .attr("y2", (d: any) => d.target.y!);

            container.selectAll<SVGGElement, any>(".nodes g")
              .attr("transform", (d: D3Node) => `translate(${d.x},${d.y})`);

            if (newLayout === 'modular-force' || isFocusMode) {
              updateModuleHulls();
            }
          }

          if (msgType === 'end') {
            setLiveNodes([...nodesRef.current]);
            if (autoFit) {
              setTimeout(() => {
                fitToContent();
              }, 120);
            }
          }
        }
      };
    }
  }, [containerDimensions, onLayoutAlgorithmChange, fitToContent, data.modules]);

  // Smooth focus on node and its direct 1st-degree neighborhood bounds with spatial awareness
  const focusNeighborhood = useCallback((nodeId: string) => {
    const allNodes = liveNodes.length > 0 ? liveNodes : data.nodes;
    const focal = allNodes.find(n => n.id === nodeId);
    if (!focal || !svgRef.current || !zoomRef.current || !containerRef.current) return;

    const connectedIds = new Set<string>([nodeId]);
    data.links.forEach(l => {
      const sId = typeof l.source === 'object' ? (l.source as D3Node).id : (l.source as string);
      const tId = typeof l.target === 'object' ? (l.target as D3Node).id : (l.target as string);
      if (sId === nodeId) connectedIds.add(tId);
      if (tId === nodeId) connectedIds.add(sId);
    });

    const neighborhoodNodes = allNodes.filter(n => connectedIds.has(n.id) && typeof n.x === 'number' && typeof n.y === 'number');
    if (neighborhoodNodes.length <= 1) {
      focusNode(nodeId);
      return;
    }

    const bounds = computeGraphBounds(neighborhoodNodes);
    if (bounds) {
      const width = containerDimensions.width || containerRef.current.clientWidth || 800;
      const height = containerDimensions.height || containerRef.current.clientHeight || 500;
      smoothSpatialNeighborhoodTransition(
        svgRef.current,
        zoomRef.current,
        bounds,
        width,
        height,
        780,
        96,
        1.55,
        0.45,
        () => {
          if (typeof focal.x === 'number' && typeof focal.y === 'number') {
            triggerSpatialRipple(focal.x, focal.y, '#10b981');
          }
        }
      );
    } else {
      focusNode(nodeId);
    }
  }, [liveNodes, data.nodes, data.links, focusNode, containerDimensions, triggerSpatialRipple]);

  // Toggle layout algorithm helper across 3 modes
  const toggleLayoutAlgorithm = useCallback(() => {
    const nextLayout: DiagramLayoutAlgorithm = 
      layoutAlgorithm === 'modular-force' ? 'force' :
      layoutAlgorithm === 'force' ? 'hierarchical' : 'modular-force';
    applyLayoutAlgorithm(nextLayout);
  }, [layoutAlgorithm, applyLayoutAlgorithm]);

  // Toggle 1st-degree Focus Mode helper
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const next = !prev;
      if (onFocusModeChange) onFocusModeChange(next);
      // When activating Focus Mode, smoothly frame focal node and its neighborhood
      if (next && !pinnedNodeId && !hoveredNode && data.nodes.length > 0) {
        const root = data.nodes.find(n => n.id === 'root') || data.nodes[0];
        if (root) {
          setPinnedNodeIds([root.id]);
          setTimeout(() => focusNeighborhood(root.id), 50);
        }
      } else if (next && pinnedNodeId) {
        setTimeout(() => focusNeighborhood(pinnedNodeId), 50);
      }
      return next;
    });
  }, [onFocusModeChange, pinnedNodeId, hoveredNode, data.nodes, focusNeighborhood]);

  useImperativeHandle(ref, () => ({
    resetView,
    fitToContent,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    focusNode,
    focusNeighborhood,
    openSnapshotModal: () => setIsSnapshotModalOpen(true),
    getSvgElement: () => svgRef.current,
    toggleDependencyTrace: () => setIsDependencyTraceEnabled(prev => !prev),
    toggleFocusMode,
    setFocusMode: (enabled: boolean) => {
      setIsFocusMode(enabled);
      if (onFocusModeChange) onFocusModeChange(enabled);
      if (enabled && pinnedNodeId) {
        setTimeout(() => focusNeighborhood(pinnedNodeId), 50);
      }
    },
    setFocalNode: (nodeId: string | null) => {
      setPinnedNodeIds(nodeId ? [nodeId] : []);
      if (nodeId) {
        setTimeout(() => focusNeighborhood(nodeId), 50);
      }
    },
    setLayoutAlgorithm: (mode: DiagramLayoutAlgorithm) => applyLayoutAlgorithm(mode),
    toggleLayoutAlgorithm,
  }), [resetView, fitToContent, handleZoomIn, handleZoomOut, focusNode, focusNeighborhood, toggleFocusMode, onFocusModeChange, applyLayoutAlgorithm, toggleLayoutAlgorithm, pinnedNodeId]);

  // Dynamic Visual Updater for Focus Mode (1st-degree isolation) and Dependency Trace
  const applyVisualHighlights = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const linkSelection = svg.selectAll<SVGLineElement, D3Link>('.links line');
    const nodeSelection = svg.selectAll<SVGGElement, D3Node>('.nodes g');

    // SCENARIO 1: FOCUS MODE (Strict 1st-degree neighborhood isolation with Critical Path highlighting)
    if (isFocusMode && traceDetails) {
      const { focalNodes, focalIds, incomingNodeIds, outgoingNodeIds } = traceDetails;
      const firstDegreeIds = new Set<string>([...focalIds, ...incomingNodeIds, ...outgoingNodeIds]);

      // Highlight 1st-degree edges; color-code Critical Architectural Paths leading to High-Traffic Hubs
      linkSelection
        .each(function(d: any) {
          const sId = typeof d.source === 'object' ? d.source.id : d.source;
          const tId = typeof d.target === 'object' ? d.target.id : d.target;
          const isIncoming = focalIds.has(tId) && incomingNodeIds.has(sId);
          const isOutgoing = focalIds.has(sId) && outgoingNodeIds.has(tId);

          const isTargetHighTraffic = highTrafficNodeIds.has(tId);
          const isSourceHighTraffic = highTrafficNodeIds.has(sId);

          const el = d3.select(this);
          if (isOutgoing) {
            if (isTargetHighTraffic) {
              // CRITICAL ARCHITECTURAL PATH (Dependency leads to High-Traffic Core/Hub)
              el.attr('stroke', TRACE_COLORS.CRITICAL_PATH)
                .attr('stroke-width', 4.8)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '8,4')
                .attr('marker-end', 'url(#arrow-critical)')
                .attr('filter', 'url(#glow-critical)')
                .attr('class', 'link-critical-trace');
            } else {
              // Standard 1st-degree outgoing dependency
              el.attr('stroke', TRACE_COLORS.OUTGOING)
                .attr('stroke-width', 3.8)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '6,3')
                .attr('marker-end', 'url(#arrow-outgoing)')
                .attr('filter', 'url(#glow-amber)')
                .attr('class', 'link-outgoing-trace');
            }
          } else if (isIncoming) {
            if (isSourceHighTraffic) {
              // Inbound caller is a high-traffic hub / central orchestrator
              el.attr('stroke', TRACE_COLORS.CRITICAL_INCOMING)
                .attr('stroke-width', 4.4)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '8,4')
                .attr('marker-end', 'url(#arrow-critical-incoming)')
                .attr('filter', 'url(#glow-critical)')
                .attr('class', 'link-critical-trace');
            } else {
              // Standard 1st-degree incoming caller
              el.attr('stroke', TRACE_COLORS.INCOMING)
                .attr('stroke-width', 3.8)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '6,3')
                .attr('marker-end', 'url(#arrow-incoming)')
                .attr('filter', 'url(#glow-cyan)')
                .attr('class', 'link-incoming-trace');
            }
          } else {
            // Gray out non-1st-degree links completely
            el.attr('stroke', '#0f172a')
              .attr('stroke-width', 0.8)
              .attr('stroke-opacity', 0.03)
              .attr('stroke-dasharray', 'none')
              .attr('marker-end', 'none')
              .attr('filter', 'none')
              .attr('class', '');
          }
        });

      // Highlight focal module + immediate 1st-degree neighbors; gray out all other nodes with smooth transition
      nodeSelection
        .transition('node-focus-fade')
        .duration(480)
        .ease(d3.easeCubicOut)
        .attr('opacity', (d: D3Node) => {
          if (focalIds.has(d.id)) return 1.0;
          if (firstDegreeIds.has(d.id)) return 1.0;
          return 0.08; // Smoothly dimmed
        });

      nodeSelection.select('circle.main-node-circle')
        .attr('fill', (d: D3Node) => {
          if (firstDegreeIds.has(d.id)) {
            return NEON_COLORS[d.group % NEON_COLORS.length];
          }
          return '#1e293b'; // Slate gray for grayed-out nodes
        })
        .attr('stroke', (d: D3Node) => {
          if (focalIds.has(d.id)) return '#ffffff';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_PATH;
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_INCOMING;
          if (incomingNodeIds.has(d.id)) return TRACE_COLORS.INCOMING;
          if (outgoingNodeIds.has(d.id)) return TRACE_COLORS.OUTGOING;
          return '#0f172a';
        })
        .attr('stroke-width', (d: D3Node) => {
          if (focalIds.has(d.id)) return 4.5;
          if (firstDegreeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return 4.5;
          if (incomingNodeIds.has(d.id) || outgoingNodeIds.has(d.id)) return 3.5;
          return 1;
        })
        .attr('filter', (d: D3Node) => {
          if (focalIds.has(d.id)) return 'url(#glow-focal)';
          if (firstDegreeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return 'url(#glow-critical)';
          if (incomingNodeIds.has(d.id)) return 'url(#glow-cyan)';
          if (outgoingNodeIds.has(d.id)) return 'url(#glow-amber)';
          return 'none';
        });

      nodeSelection.select('text.node-label')
        .attr('fill', (d: D3Node) => {
          if (focalIds.has(d.id)) return '#ffffff';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return '#fda4af'; // rose-300
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return '#fda4af';
          if (incomingNodeIds.has(d.id)) return '#67e8f9';
          if (outgoingNodeIds.has(d.id)) return '#fde047';
          return '#334155'; // Muted dark gray for unselected nodes
        })
        .attr('font-weight', (d: D3Node) => {
          if (focalIds.has(d.id)) return '800';
          if (firstDegreeIds.has(d.id)) return '700';
          return '400';
        });

      nodeSelection.select('text.trace-role-badge')
        .text((d: D3Node) => {
          if (focalIds.has(d.id)) return '🎯 FOCAL MODULE';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) {
            const callers = inDegreeMap.get(d.id) || 0;
            return `⚡ CRITICAL PATH HUB (${callers} callers)`;
          }
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) {
            return '▲ CRITICAL CALLER';
          }
          if (incomingNodeIds.has(d.id)) return '▲ 1st-DEG CALLER';
          if (outgoingNodeIds.has(d.id)) return '▼ 1st-DEG DEPENDENCY';
          return '';
        })
        .attr('fill', (d: D3Node) => {
          if (focalIds.has(d.id)) return '#38bdf8';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_PATH;
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_INCOMING;
          if (incomingNodeIds.has(d.id)) return TRACE_COLORS.INCOMING;
          if (outgoingNodeIds.has(d.id)) return TRACE_COLORS.OUTGOING;
          return 'transparent';
        });

    // SCENARIO 2: DEPENDENCY TRACE (Soft dimming of background with Critical Path highlighting)
    } else if (traceDetails && isDependencyTraceEnabled) {
      const { focalIds, incomingNodeIds, outgoingNodeIds } = traceDetails;

      // Update Links: High-Contrast Incoming (Cyan) vs Outgoing (Amber) vs Critical Paths (Rose) vs Dimmed Background
      linkSelection
        .each(function(d: any) {
          const sId = typeof d.source === 'object' ? d.source.id : d.source;
          const tId = typeof d.target === 'object' ? d.target.id : d.target;
          const isIncoming = focalIds.has(tId);
          const isOutgoing = focalIds.has(sId);
          const isTargetHighTraffic = highTrafficNodeIds.has(tId);
          const isSourceHighTraffic = highTrafficNodeIds.has(sId);

          const el = d3.select(this);
          if (isOutgoing) {
            if (isTargetHighTraffic) {
              el.attr('stroke', TRACE_COLORS.CRITICAL_PATH)
                .attr('stroke-width', 4.5)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '8,4')
                .attr('marker-end', 'url(#arrow-critical)')
                .attr('filter', 'url(#glow-critical)')
                .attr('class', 'link-critical-trace');
            } else {
              el.attr('stroke', TRACE_COLORS.OUTGOING)
                .attr('stroke-width', 3.5)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '6,3')
                .attr('marker-end', 'url(#arrow-outgoing)')
                .attr('filter', 'url(#glow-amber)')
                .attr('class', 'link-outgoing-trace');
            }
          } else if (isIncoming) {
            if (isSourceHighTraffic) {
              el.attr('stroke', TRACE_COLORS.CRITICAL_INCOMING)
                .attr('stroke-width', 4.2)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '8,4')
                .attr('marker-end', 'url(#arrow-critical-incoming)')
                .attr('filter', 'url(#glow-critical)')
                .attr('class', 'link-critical-trace');
            } else {
              el.attr('stroke', TRACE_COLORS.INCOMING)
                .attr('stroke-width', 3.5)
                .attr('stroke-opacity', 1.0)
                .attr('stroke-dasharray', '6,3')
                .attr('marker-end', 'url(#arrow-incoming)')
                .attr('filter', 'url(#glow-cyan)')
                .attr('class', 'link-incoming-trace');
            }
          } else {
            el.attr('stroke', TRACE_COLORS.DIMMED_LINK)
              .attr('stroke-width', 1.0)
              .attr('stroke-opacity', 0.08)
              .attr('stroke-dasharray', 'none')
              .attr('marker-end', 'none')
              .attr('filter', 'none')
              .attr('class', '');
          }
        });

      // Update Nodes: Highlight Focal Nodes, Critical Hubs, Incoming Callers (Cyan), Outgoing Dependencies (Amber)
      nodeSelection
        .attr('opacity', (d: D3Node) => {
          if (focalIds.has(d.id) || incomingNodeIds.has(d.id) || outgoingNodeIds.has(d.id)) {
            return 1.0;
          }
          return 0.14; // Dim out non-involved nodes
        });

      nodeSelection.select('circle.main-node-circle')
        .attr('fill', (d: D3Node) => NEON_COLORS[d.group % NEON_COLORS.length])
        .attr('stroke', (d: D3Node) => {
          if (focalIds.has(d.id)) return TRACE_COLORS.FOCAL;
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_PATH;
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_INCOMING;
          if (incomingNodeIds.has(d.id)) return TRACE_COLORS.INCOMING;
          if (outgoingNodeIds.has(d.id)) return TRACE_COLORS.OUTGOING;
          return '#0f172a';
        })
        .attr('stroke-width', (d: D3Node) => {
          if (focalIds.has(d.id)) return 4;
          if ((incomingNodeIds.has(d.id) || outgoingNodeIds.has(d.id)) && highTrafficNodeIds.has(d.id)) return 4;
          if (incomingNodeIds.has(d.id) || outgoingNodeIds.has(d.id)) return 3;
          return 2;
        })
        .attr('filter', (d: D3Node) => {
          if (focalIds.has(d.id)) return 'url(#glow-focal)';
          if ((incomingNodeIds.has(d.id) || outgoingNodeIds.has(d.id)) && highTrafficNodeIds.has(d.id)) return 'url(#glow-critical)';
          if (incomingNodeIds.has(d.id)) return 'url(#glow-cyan)';
          if (outgoingNodeIds.has(d.id)) return 'url(#glow-amber)';
          return 'none';
        });

      nodeSelection.select('text.node-label')
        .attr('fill', (d: D3Node) => {
          if (focalIds.has(d.id)) return '#ffffff';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return '#fda4af';
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return '#fda4af';
          if (incomingNodeIds.has(d.id)) return '#67e8f9'; // cyan-300
          if (outgoingNodeIds.has(d.id)) return '#fde047'; // amber-300
          return '#475569';
        })
        .attr('font-weight', (d: D3Node) => {
          if (focalIds.has(d.id) || incomingNodeIds.has(d.id) || outgoingNodeIds.has(d.id)) return '700';
          return '500';
        });

      // Update structural role badge text
      nodeSelection.select('text.trace-role-badge')
        .text((d: D3Node) => {
          if (focalIds.has(d.id)) return '● FOCAL';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) {
            const callers = inDegreeMap.get(d.id) || 0;
            return `⚡ CRITICAL HUB (${callers})`;
          }
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return '▲ CRITICAL CALLER';
          if (incomingNodeIds.has(d.id)) return '▲ CALLER';
          if (outgoingNodeIds.has(d.id)) return '▼ DEPENDENCY';
          return '';
        })
        .attr('fill', (d: D3Node) => {
          if (focalIds.has(d.id)) return '#ffffff';
          if (outgoingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_PATH;
          if (incomingNodeIds.has(d.id) && highTrafficNodeIds.has(d.id)) return TRACE_COLORS.CRITICAL_INCOMING;
          if (incomingNodeIds.has(d.id)) return TRACE_COLORS.INCOMING;
          if (outgoingNodeIds.has(d.id)) return TRACE_COLORS.OUTGOING;
          return 'transparent';
        });

    } else {
      // SCENARIO 3: STANDARD GRAPH STATE (No Active Trace or Focus Filter)
      linkSelection
        .attr('stroke', (d: any) => LINK_COLORS[d.value] || '#64748b')
        .attr('stroke-opacity', (d: any) => (d.value === 3 ? 0.7 : d.value === 2 ? 0.55 : 0.28))
        .attr('stroke-width', (d: any) => (d.value === 3 ? 3.5 : d.value === 2 ? 2 : 1.2))
        .attr('stroke-dasharray', (d: any) => (d.value === 1 && d.target?.group === 5 ? '4,4' : 'none'))
        .attr('marker-end', 'none')
        .attr('filter', 'none')
        .attr('class', '');

      nodeSelection
        .attr('opacity', (d: D3Node) => {
          if (activeGroupHighlight === null) return 1.0;
          return d.group === activeGroupHighlight ? 1.0 : 0.22;
        });

      nodeSelection.select('circle.main-node-circle')
        .attr('fill', (d: D3Node) => NEON_COLORS[d.group % NEON_COLORS.length])
        .attr('stroke', (d: D3Node) => (d.id === pinnedNodeId ? '#ffffff' : d.group === activeGroupHighlight ? '#ffffff' : '#0f172a'))
        .attr('stroke-width', (d: D3Node) => (d.id === pinnedNodeId || d.group === activeGroupHighlight ? 3 : 2))
        .attr('filter', (d: D3Node) => (d.id === 'root' || d.id === pinnedNodeId ? 'url(#glow-flow)' : 'none'));

      nodeSelection.select('text.node-label')
        .attr('fill', (d: D3Node) => (d.id === pinnedNodeId || d.group === activeGroupHighlight ? '#ffffff' : '#cbd5e1'))
        .attr('font-weight', (d: D3Node) => (d.id === 'root' || d.group === activeGroupHighlight ? '700' : '500'));

      nodeSelection.select('text.trace-role-badge')
        .text('');
    }
  }, [traceDetails, isFocusMode, isDependencyTraceEnabled, activeGroupHighlight, pinnedNodeId, highTrafficNodeIds, inDegreeMap]);

  // Apply visual highlights whenever trace state changes
  useEffect(() => {
    applyVisualHighlights();
  }, [applyVisualHighlights]);

  // D3 Simulation and Zoom initialization
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    setContainerDimensions({ width, height });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Append background grid pattern and markers in defs
    const defs = svg.append("defs");

    // CSS Keyframes for directional dependency pulse flow
    defs.append("style").text(`
      @keyframes traceFlowIncoming {
        from { stroke-dashoffset: 18; }
        to { stroke-dashoffset: 0; }
      }
      @keyframes traceFlowOutgoing {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -18; }
      }
      @keyframes traceFlowCritical {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -24; }
      }
      .link-incoming-trace {
        animation: traceFlowIncoming 0.75s linear infinite;
      }
      .link-outgoing-trace {
        animation: traceFlowOutgoing 0.75s linear infinite;
      }
      .link-critical-trace {
        animation: traceFlowCritical 0.55s linear infinite;
      }
    `);

    const pattern = defs.append("pattern")
      .attr("id", "flow-chart-grid")
      .attr("width", 30)
      .attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 30 0 L 0 0 0 30")
      .attr("fill", "none")
      .attr("stroke", "rgba(148, 163, 184, 0.05)")
      .attr("stroke-width", 0.5);

    // Filter glow for critical/active nodes
    const filter = defs.append("filter").attr("id", "glow-flow").attr("x", "-30%").attr("y", "-30%").attr("width", "160%").attr("height", "160%");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    filter.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    // High-Contrast Glow Filters for Dependency Trace & Critical Paths
    const filterCyan = defs.append("filter").attr("id", "glow-cyan").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    filterCyan.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "blur");
    filterCyan.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    const filterAmber = defs.append("filter").attr("id", "glow-amber").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    filterAmber.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "blur");
    filterAmber.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    const filterCritical = defs.append("filter").attr("id", "glow-critical").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filterCritical.append("feGaussianBlur").attr("stdDeviation", "4.5").attr("result", "blur");
    filterCritical.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    const filterFocal = defs.append("filter").attr("id", "glow-focal").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filterFocal.append("feGaussianBlur").attr("stdDeviation", "5").attr("result", "blur");
    filterFocal.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    // SVG Arrowhead Markers for High-Contrast Trace Connections
    defs.append("marker")
      .attr("id", "arrow-incoming")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", TRACE_COLORS.INCOMING);

    defs.append("marker")
      .attr("id", "arrow-outgoing")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", TRACE_COLORS.OUTGOING);

    defs.append("marker")
      .attr("id", "arrow-critical")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 21)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L9,0L0,4")
      .attr("fill", TRACE_COLORS.CRITICAL_PATH);

    defs.append("marker")
      .attr("id", "arrow-critical-incoming")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 21)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L9,0L0,4")
      .attr("fill", TRACE_COLORS.CRITICAL_INCOMING);

    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#flow-chart-grid)")
      .attr("pointer-events", "none");

    const g = svg.append("g").attr("class", "zoom-container");
    zoomContainerRef.current = g;

    // Background Architectural Tier Lanes Group (rendered below links and nodes)
    const tierLanesGroup = g.append("g")
      .attr("class", "tier-lanes-group")
      .attr("pointer-events", "none");

    // Background Architectural Module Clusters Group (convex hull boundary & badges)
    const moduleHullsGroup = g.append("g")
      .attr("class", "module-hulls-group");

    // Clone data for simulation
    const nodes: D3Node[] = data.nodes.map(d => ({ ...d }));
    const links: D3Link[] = data.links.map(d => ({ ...d }));
    nodesRef.current = nodes;
    linksRef.current = links;

    // Apply initial hierarchical layout if selected
    if (layoutAlgorithm === 'hierarchical') {
      const result = computeHierarchicalLayout(nodes, links, width, height);
      nodes.forEach(node => {
        const targetPos = result.nodePositions.get(node.id);
        if (targetPos) {
          node.fx = targetPos.x;
          node.fy = targetPos.y;
          node.x = targetPos.x;
          node.y = targetPos.y;
        }
      });

      // Render initial architectural tier lanes
      const lanes = tierLanesGroup.selectAll(".tier-lane")
        .data(result.tiers)
        .join("g")
        .attr("class", "tier-lane")
        .attr("transform", d => `translate(0, ${d.y})`);

      lanes.append("rect")
        .attr("x", result.minX - 40)
        .attr("y", -36)
        .attr("width", (result.maxX - result.minX) + 80)
        .attr("height", d => d.height)
        .attr("rx", 14)
        .attr("fill", "rgba(15, 23, 42, 0.45)")
        .attr("stroke", d => d.color)
        .attr("stroke-opacity", 0.22)
        .attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "4,4");

      lanes.append("rect")
        .attr("x", result.minX - 30)
        .attr("y", -30)
        .attr("width", d => d.badge.length * 7 + 20)
        .attr("height", 18)
        .attr("rx", 5)
        .attr("fill", d => `${d.color}20`)
        .attr("stroke", d => `${d.color}60`)
        .attr("stroke-width", 1);

      lanes.append("text")
        .attr("x", result.minX - 22)
        .attr("y", -17)
        .text(d => d.badge)
        .attr("fill", d => d.color)
        .attr("font-size", "9px")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-weight", "800")
        .attr("letter-spacing", "0.5px");

      lanes.append("text")
        .attr("x", result.minX - 30 + 130)
        .attr("y", -17)
        .text(d => `• ${d.name} (${d.nodeCount} ${d.nodeCount === 1 ? 'module' : 'modules'})`)
        .attr("fill", "rgba(148, 163, 184, 0.7)")
        .attr("font-size", "10px")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-weight", "600");
    }

    const simulation = d3.forceSimulation<D3Node, D3Link>(nodes);

    if (layoutAlgorithm === 'modular-force') {
      const clusterCenters = computeModuleClusterCenters(data.modules || [], width, height);
      simulation
        .force("clusterX", d3.forceX<D3Node>(d => clusterCenters.get(d.moduleId || 'mod-core')?.x || (width / 2)).strength(0.24))
        .force("clusterY", d3.forceY<D3Node>(d => clusterCenters.get(d.moduleId || 'mod-core')?.y || (height / 2)).strength(0.24))
        .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance((l: any) => {
          const srcMod = (l.source as D3Node).moduleId;
          const tgtMod = (l.target as D3Node).moduleId;
          return (srcMod && tgtMod && srcMod === tgtMod) ? 50 : 135;
        }).strength(0.65))
        .force("charge", d3.forceManyBody().strength(-260))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30));
    } else {
      simulation
        .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(90))
        .force("charge", d3.forceManyBody().strength(layoutAlgorithm === 'hierarchical' ? -100 : -360))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(28))
        .force("x", d3.forceX(width / 2).strength(0.06))
        .force("y", d3.forceY(height / 2).strength(0.06));
    }

    simulation.stop(); // Stop main thread simulation; worker computes the heavy layout!
    simulationRef.current = simulation;

    // Asynchronous Web Worker layout computation off main thread
    if (workerManagerRef.current) {
      workerManagerRef.current.destroy();
    }
    const workerMgr = new D3ForceWorkerManager();
    workerManagerRef.current = workerMgr;

    const clusterCentersObj = layoutAlgorithm === 'modular-force'
      ? Object.fromEntries(computeModuleClusterCenters(data.modules || [], width, height))
      : null;

    workerMgr.init({
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        group: n.group,
        moduleId: n.moduleId,
        importance: n.importance,
        x: n.x || width / 2,
        y: n.y || height / 2,
        vx: n.vx || 0,
        vy: n.vy || 0,
        fx: n.fx,
        fy: n.fy
      })),
      links: links.map(l => ({
        source: typeof l.source === 'object' ? (l.source as any).id : l.source,
        target: typeof l.target === 'object' ? (l.target as any).id : l.target,
        value: l.value
      })),
      width,
      height,
      layoutAlgorithm,
      clusterCenters: clusterCentersObj,
      onTick: (workerNodes) => {
        const nodeMap = new Map<string, any>(workerNodes.map(n => [n.id, n]));
        nodes.forEach(node => {
          const updated = nodeMap.get(node.id);
          if (updated) {
            node.x = updated.x;
            node.y = updated.y;
            node.vx = updated.vx;
            node.vy = updated.vy;
          }
        });

        link
          .attr("x1", (d: any) => (d.source as D3Node).x!)
          .attr("y1", (d: any) => (d.source as D3Node).y!)
          .attr("x2", (d: any) => (d.target as D3Node).x!)
          .attr("y2", (d: any) => (d.target as D3Node).y!);

        nodeGroup.attr("transform", (d: D3Node) => `translate(${d.x},${d.y})`);

        if (layoutAlgorithm === 'modular-force' || isFocusMode) {
          updateModuleHulls();
        }
      },
      onEnd: (workerNodes) => {
        const nodeMap = new Map<string, any>(workerNodes.map(n => [n.id, n]));
        nodes.forEach(node => {
          const updated = nodeMap.get(node.id);
          if (updated) {
            node.x = updated.x;
            node.y = updated.y;
          }
        });
        setLiveNodes([...nodes]);
        if (layoutAlgorithm === 'modular-force' || isFocusMode) {
          updateModuleHulls();
        }
      }
    });

    // Links with distinct styles based on connector type value
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => LINK_COLORS[d.value] || "#64748b")
      .attr("stroke-opacity", (d: any) => (d.value === 3 ? 0.7 : d.value === 2 ? 0.55 : 0.28))
      .attr("stroke-width", (d: any) => (d.value === 3 ? 3.5 : d.value === 2 ? 2 : 1.2))
      .attr("stroke-dasharray", (d: any) => (d.value === 1 && d.target?.group === 5 ? "4,4" : "none"));

    // Nodes group
    const nodeGroup = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .attr("opacity", (d: D3Node) => {
        if (activeGroupHighlight === null) return 1;
        return d.group === activeGroupHighlight ? 1 : 0.22;
      })
      .on("click", (event, d: D3Node) => {
        event.stopPropagation();

        let newIds: string[] = [];
        if (event.shiftKey) {
          // Shift-click: toggle node selection
          newIds = pinnedNodeIds.includes(d.id)
            ? pinnedNodeIds.filter(id => id !== d.id)
            : [...pinnedNodeIds, d.id];
        } else {
          // Regular click: clear and select only clicked node
          newIds = [d.id];
        }

        setPinnedNodeIds(newIds);

        if (onNodeClickRef.current) {
          onNodeClickRef.current(d);
        }

        const selectedNodes = nodes.filter(n => newIds.includes(n.id));
        if (onSelectionChangeRef.current) {
          onSelectionChangeRef.current(selectedNodes);
        }

        // Smoothly bring node into focus
        if (typeof d.x === 'number' && typeof d.y === 'number') {
          smoothFocusOnNode(svgRef.current, zoomRef.current, d.x, d.y, width, height, 1.4, 450);
        }
      })
      .on("mouseenter", (_, d: D3Node) => {
        setHoveredNode(d);
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
      });

    // Halo pulse ring for pinned/selected nodes
    nodeGroup.filter((d: D3Node) => pinnedNodeIds.includes(d.id))
      .append("circle")
      .attr("class", "selected-halo")
      .attr("r", 22)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.8)
      .attr("filter", "url(#glow-flow)");

    // Node outer glow / core circle
    nodeGroup.append("circle")
      .attr("class", "main-node-circle")
      .attr("r", (d: D3Node) => (d.id === 'root' ? 18 : 10))
      .attr("fill", (d: D3Node) => NEON_COLORS[d.group % NEON_COLORS.length])
      .attr("fill-opacity", (d: D3Node) => {
        if (activeGroupHighlight !== null && d.group === activeGroupHighlight) return 1;
        return 0.85;
      })
      .attr("stroke", (d: D3Node) => (pinnedNodeIds.includes(d.id) ? "#ffffff" : d.group === activeGroupHighlight ? "#ffffff" : "#0f172a"))
      .attr("stroke-width", (d: D3Node) => (pinnedNodeIds.includes(d.id) || d.group === activeGroupHighlight ? 3 : 2))
      .attr("filter", (d: D3Node) => (d.id === 'root' || pinnedNodeIds.includes(d.id) ? "url(#glow-flow)" : "none"));

    // Node text label
    nodeGroup.append("text")
      .attr("class", "node-label")
      .text((d: D3Node) => d.label)
      .attr("x", (d: D3Node) => (d.id === 'root' ? 22 : 14))
      .attr("y", 4)
      .attr("fill", (d: D3Node) => (pinnedNodeIds.includes(d.id) || d.group === activeGroupHighlight ? "#ffffff" : "#cbd5e1"))
      .attr("font-size", (d: D3Node) => (d.id === 'root' ? "13px" : "11px"))
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", (d: D3Node) => (d.id === 'root' || d.group === activeGroupHighlight ? "700" : "500"))
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.9)")
      .style("pointer-events", "none");

    // Trace Role Badge (▲ CALLER / ▼ DEPENDENCY / ● FOCAL)
    nodeGroup.append("text")
      .attr("class", "trace-role-badge")
      .text("")
      .attr("x", (d: D3Node) => (d.id === 'root' ? 22 : 14))
      .attr("y", -10)
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", "800")
      .attr("letter-spacing", "0.5px")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.95)")
      .style("pointer-events", "none");

    // Drag behavior offloaded to Web Worker
    const drag = d3.drag<SVGGElement, D3Node>()
      .on("start", (event, d) => {
        d.fx = d.x;
        d.fy = d.y;
        if (workerManagerRef.current) {
          workerManagerRef.current.handleDrag(d.id, d.x, d.y, 0.35);
        }
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
        d.x = event.x;
        d.y = event.y;
        if (workerManagerRef.current) {
          workerManagerRef.current.handleDrag(d.id, event.x, event.y, 0.35);
        }
      })
      .on("end", (event, d) => {
        d.fx = null;
        d.fy = null;
        if (workerManagerRef.current) {
          workerManagerRef.current.handleDrag(d.id, null, null, 0);
        }
      });

    nodeGroup.call(drag as any);

    // Smooth D3 Zoom & Pan Behavior with RAF throttling
    let zoomRafId: number | null = null;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 8]) // Generous zoom range for vast architecture maps
      .wheelDelta(createSmoothWheelDelta())
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        if (!zoomRafId) {
          zoomRafId = requestAnimationFrame(() => {
            zoomRafId = null;
            setCurrentTransform({
              x: event.transform.x,
              y: event.transform.y,
              k: event.transform.k,
            });
          });
        }
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Double-click background to fit content smoothly
    svg.on("dblclick.zoom", (event) => {
      event.preventDefault();
      fitToContent();
    });

    // Clicking background clears pinned trace
    svg.on("click", (event) => {
      if (event.target === svgRef.current || (event.target as HTMLElement).tagName === 'rect') {
        setPinnedNodeIds([]);
        if (onSelectionChangeRef.current) {
          onSelectionChangeRef.current([]);
        }
      }
    });

    if (layoutAlgorithm === 'hierarchical') {
      let tickCount = 0;
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => (d.source as D3Node).x!)
          .attr("y1", (d: any) => (d.source as D3Node).y!)
          .attr("x2", (d: any) => (d.target as D3Node).x!)
          .attr("y2", (d: any) => (d.target as D3Node).y!);

        nodeGroup.attr("transform", (d: D3Node) => `translate(${d.x},${d.y})`);

        if (isFocusMode) {
          updateModuleHulls();
        }

        tickCount++;
        // Sync radar node positions occasionally
        if (tickCount % 10 === 0) {
          setLiveNodes([...nodes]);
        }
      });

      simulation.on("end", () => {
        setLiveNodes([...nodes]);
        if (isFocusMode) {
          updateModuleHulls();
        }
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth || 800;
        const newHeight = containerRef.current.clientHeight || 500;
        setContainerDimensions({ width: newWidth, height: newHeight });
        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
        if (layoutAlgorithm === 'hierarchical') {
          simulation.alpha(0.2).restart();
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      simulation.stop();
      if (workerManagerRef.current) {
        workerManagerRef.current.destroy();
      }
      if (activeWorkerRef.current) {
        activeWorkerRef.current.terminate();
      }
      resizeObserver.disconnect();
      svg.on(".zoom", null);
    };
  }, [data, fitToContent]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        fitToContent();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handlePan(0, 100);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handlePan(0, -100);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePan(100, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handlePan(-100, 0);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFocusMode();
      } else if (e.key === 't' || e.key === 'T') {
        setIsDependencyTraceEnabled(prev => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        toggleLayoutAlgorithm();
      } else if (e.key === 'Escape') {
        setPinnedNodeIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, fitToContent, handlePan, toggleFocusMode, toggleLayoutAlgorithm]);

  const zoomPercent = Math.round(currentTransform.k * 100);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden relative group border border-white/5 select-none shadow-inner"
    >
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        style={{
          background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.25) 0%, rgba(2, 6, 23, 1) 100%)',
        }}
      />

      {/* Floating Visual Legend in the Diagram */}
      {showLegend && (
        <div className="absolute top-3 left-3 z-30">
          <VisualLegend
            activeGroupHighlight={activeGroupHighlight}
            onHighlightGroup={handleSetGroupHighlight}
            defaultExpanded={false}
          />
        </div>
      )}

      {/* Floating Diagram Zoom, Layout Algorithm, Focus Mode & Dependency Trace Toolbar */}
      <div className="absolute top-3 right-3 z-30 flex flex-wrap items-center justify-end gap-2">
        {/* Layout Algorithm Segmented Switch (Modular Clusters / Force-Directed / Hierarchical) */}
        <div 
          className="flex items-center p-0.5 bg-slate-900/90 rounded-xl border border-white/10 shadow-xl backdrop-blur-md font-mono text-xs"
          role="group"
          aria-label="Diagram Layout Algorithm"
        >
          <button
            onClick={() => applyLayoutAlgorithm('modular-force')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              layoutAlgorithm === 'modular-force'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Auto-Detected Architectural Module Clusters Layout with Convex Enclosures (Press L to toggle)"
            id="d3-flow-layout-modular-btn"
          >
            <Boxes className={`w-3.5 h-3.5 ${layoutAlgorithm === 'modular-force' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="text-[11px]">Modular Clusters</span>
          </button>

          <button
            onClick={() => applyLayoutAlgorithm('force')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              layoutAlgorithm === 'force'
                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Force-Directed Physics Simulation Layout (Press L to toggle)"
            id="d3-flow-layout-force-btn"
          >
            <Network className={`w-3.5 h-3.5 ${layoutAlgorithm === 'force' ? 'text-sky-400' : 'text-slate-400'}`} />
            <span className="text-[11px]">Force Physics</span>
          </button>

          <button
            onClick={() => applyLayoutAlgorithm('hierarchical')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              layoutAlgorithm === 'hierarchical'
                ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Hierarchical 7-Tier Architecture Layout (Press L to toggle)"
            id="d3-flow-layout-hierarchical-btn"
          >
            <Layers className={`w-3.5 h-3.5 ${layoutAlgorithm === 'hierarchical' ? 'text-violet-400' : 'text-slate-400'}`} />
            <span className="text-[11px]">Hierarchical</span>
          </button>
        </div>

        {/* Focus Mode (1st-Degree Isolation) Toggle Button */}
        <button
          onClick={toggleFocusMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border shadow-lg backdrop-blur-md ${
            isFocusMode
              ? 'bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-500/20 ring-1 ring-emerald-500/40'
              : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Toggle 1st-Degree Focus Mode (Press F) - Grays out all modules except selected module & immediate 1st-degree neighbors"
          id="focus-mode-toggle-btn"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isFocusMode ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Focus Mode</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
            isFocusMode ? 'bg-emerald-500/30 text-emerald-200 font-extrabold' : 'bg-white/10 text-slate-500'
          }`}>
            {isFocusMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Dependency Trace Toggle Button */}
        <button
          onClick={() => setIsDependencyTraceEnabled(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border shadow-lg backdrop-blur-md ${
            isDependencyTraceEnabled && !isFocusMode
              ? 'bg-gradient-to-r from-cyan-950/80 to-amber-950/80 text-white border-cyan-500/50 shadow-cyan-500/10 ring-1 ring-cyan-500/30'
              : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title="Toggle High-Contrast Dependency Trace (T)"
          id="dependency-trace-toggle-btn"
        >
          <Zap className={`w-3.5 h-3.5 ${isDependencyTraceEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Dependency Trace</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
            isDependencyTraceEnabled ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-slate-500'
          }`}>
            {isDependencyTraceEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <DiagramZoomToolbar
          zoomPercent={zoomPercent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={resetView}
          onFitToContent={fitToContent}
          onFocusSelected={handleFocusSelected}
          hasSelectedNode={!!pinnedNodeId}
          onPan={handlePan}
          onSetScalePreset={handleSetScalePreset}
          onTakeSnapshot={() => setIsSnapshotModalOpen(true)}
          showSnapshotButton={true}
        />
      </div>

      {/* Interactive Radar Minimap */}
      <GraphMinimap
        nodes={liveNodes.length > 0 ? liveNodes : data.nodes}
        links={data.links}
        containerDimensions={containerDimensions}
        currentTransform={currentTransform}
        onNavigate={handleMinimapNavigate}
        onFitAll={fitToContent}
        position="bottom-right"
        colorAccessor={(node) => NEON_COLORS[(node.group || 0) % NEON_COLORS.length]}
      />

      {/* Focus Mode Notification when active but no node hovered or pinned */}
      {isFocusMode && !activeFocalNode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-mono text-emerald-200 flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Click any module in the diagram to isolate it and its 1st-degree neighbors (Press F to exit)</span>
        </div>
      )}

      {/* Focus Mode & Dependency Trace Floating HUD */}
      {(isFocusMode || isDependencyTraceEnabled) && traceDetails && (
        <div className={`absolute top-16 right-3 z-30 w-84 max-w-[calc(100vw-32px)] glass-panel p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200 font-mono text-xs space-y-2.5 ${
          isFocusMode 
            ? 'border-emerald-500/30 bg-slate-950/95 ring-1 ring-emerald-500/20' 
            : 'border-white/15 bg-slate-950/90'
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`p-1.5 rounded-lg border ${
                isFocusMode 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}>
                {isFocusMode ? <Crosshair className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-cyan-400" />}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isFocusMode ? 'text-emerald-300' : 'text-cyan-400'
                  }`}>
                    {isFocusMode ? '🎯 Focus Mode: 1st-Deg Isolation' : 'Dependency Trace'}
                  </span>
                  {traceDetails.focalNode.techBadge && (
                    <span 
                      style={{ color: traceDetails.focalNode.techColor || '#38bdf8' }}
                      className="text-[9px] px-1.5 py-0.2 bg-white/5 rounded border border-white/10 font-bold"
                    >
                      {traceDetails.focalNode.techBadge}
                    </span>
                  )}
                  {traceDetails.isPinned && (
                    <span className="text-[9px] px-1 bg-violet-500/30 text-violet-300 rounded border border-violet-500/40">
                      PINNED
                    </span>
                  )}
                </div>
                <h4 className="text-white font-bold text-xs truncate max-w-[190px]">
                  {traceDetails.focalNode.label}
                </h4>
                {traceDetails.focalNode.folder && (
                  <span className="text-[10px] text-slate-400 truncate block">
                    📁 {traceDetails.focalNode.folder}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {isFocusMode && (
                <button
                  onClick={toggleFocusMode}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/40 transition-colors"
                  title="Exit Focus Mode"
                >
                  Exit (F)
                </button>
              )}
              {pinnedNodeIds.length > 0 && (
                <button
                  onClick={() => {
                    setPinnedNodeIds([]);
                    if (onSelectionChangeRef.current) onSelectionChangeRef.current([]);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear Pinned Selection Group"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Focus Mode Summary Metrics */}
          {isFocusMode && (
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Isolated Network:
              </span>
              <span className="text-white font-bold font-mono">
                {1 + traceDetails.totalIncoming + traceDetails.totalOutgoing} visible • {Math.max(0, data.nodes.length - 1 - traceDetails.totalIncoming - traceDetails.totalOutgoing)} grayed out
              </span>
            </div>
          )}

          {/* Impact Factor & Downstream LOC Metrics */}
          {focalImpact && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-emerald-400" />
                  Impact Factor
                </span>
                <span 
                  style={{ color: focalImpact.impactColor }}
                  className="font-extrabold text-xs font-mono"
                >
                  {focalImpact.impactScore}/100 ({focalImpact.impactLevel.toUpperCase()})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
                <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-cyan-300">
                  <div className="text-[9px] text-slate-400 uppercase">Consuming Callers</div>
                  <div className="font-bold text-white font-mono mt-0.5">
                    {focalImpact.totalConsumingComponents} <span className="text-[9px] text-slate-400 font-normal">({focalImpact.directConsumingCount} direct)</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-amber-950/50 border border-amber-500/20 text-amber-300">
                  <div className="text-[9px] text-slate-400 uppercase">Downstream LOC</div>
                  <div className="font-bold text-white font-mono mt-0.5">
                    {focalImpact.totalDownstreamLoc.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">({focalImpact.totalDownstreamNodes} deps)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* High-Contrast Directional Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {/* Incoming Callers (Cyan) */}
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-cyan-400">
                <span className="flex items-center gap-1 font-bold text-[10px]">
                  <ArrowUpLeft className="w-3 h-3 text-cyan-300" />
                  1st-DEG CALLERS
                </span>
                <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-200 rounded text-[10px] font-bold">
                  {traceDetails.totalIncoming}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                Direct inbound callers to this module
              </p>
              {traceDetails.incomingNodes.length > 0 ? (
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar pt-1">
                  {traceDetails.incomingNodes.map(node => {
                    const isHighTraffic = highTrafficNodeIds.has(node.id);
                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setPinnedNodeIds([node.id]);
                          if (onSelectionChangeRef.current) onSelectionChangeRef.current([node]);
                          focusNode(node.id);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate max-w-[115px] transition-colors text-left font-semibold border ${
                          isHighTraffic
                            ? 'bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border-rose-500/40'
                            : 'bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-200 border-cyan-500/20'
                        }`}
                        title={isHighTraffic ? `⚡ High-Traffic Caller: ${node.label}` : `Focus 1st-degree neighbor ${node.label}`}
                      >
                        {isHighTraffic ? '⚡ ' : ''}{node.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic pt-1">Root / No inbound callers</div>
              )}
            </div>

            {/* Outgoing Dependencies (Amber) */}
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400">
                <span className="flex items-center gap-1 font-bold text-[10px]">
                  <ArrowDownRight className="w-3 h-3 text-amber-300" />
                  1st-DEG DEPS
                </span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-200 rounded text-[10px] font-bold">
                  {traceDetails.totalOutgoing}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                Direct outbound dependencies required
              </p>
              {traceDetails.outgoingNodes.length > 0 ? (
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar pt-1">
                  {traceDetails.outgoingNodes.map(node => {
                    const isHighTraffic = highTrafficNodeIds.has(node.id);
                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setPinnedNodeIds([node.id]);
                          if (onSelectionChangeRef.current) onSelectionChangeRef.current([node]);
                          focusNode(node.id);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate max-w-[115px] transition-colors text-left font-semibold border ${
                          isHighTraffic
                            ? 'bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border-rose-500/40'
                            : 'bg-amber-500/10 hover:bg-amber-500/30 text-amber-200 border-amber-500/20'
                        }`}
                        title={isHighTraffic ? `⚡ Critical Path to High-Traffic Hub: ${node.label} (${inDegreeMap.get(node.id) || 0} callers)` : `Focus 1st-degree neighbor ${node.label}`}
                      >
                        {isHighTraffic ? '⚡ ' : ''}{node.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic pt-1">Leaf module / No outgoing deps</div>
              )}
            </div>
          </div>

          {/* Critical Paths Highlight Notice if connecting to high traffic hubs */}
          {(traceDetails.criticalOutgoingCount > 0 || traceDetails.criticalIncomingCount > 0) && (
            <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between text-[10px]">
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                <span className="text-xs">⚡</span>
                Critical Architectural Paths:
              </span>
              <span className="text-rose-200 font-bold font-mono px-1.5 py-0.5 bg-rose-500/20 rounded border border-rose-500/30">
                {traceDetails.criticalOutgoingCount} high-traffic hubs
              </span>
            </div>
          )}

          {/* High-Contrast Visual Flow Key */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 border-t border-white/5">
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
              Cyan: Inbound
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              Amber: Outbound
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              ⚡ Rose: Critical Path
            </span>
          </div>
        </div>
      )}

      {/* Snapshot Studio Modal */}
      <D3SnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        svgElement={svgRef.current}
        repoName={repoName}
        nodeCount={data.nodes.length}
        linkCount={data.links.length}
      />

      {/* Active Hover / Info Badge & Filter Status */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 z-20">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[11px] font-mono text-slate-400 flex items-center gap-2 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-violet-400" />
          {hoveredNode ? (
            <div className="flex items-center gap-1.5 truncate max-w-[340px]">
              <span className="text-violet-300 font-semibold truncate">
                {hoveredNode.label}
              </span>
              {hoveredNode.techBadge && (
                <span 
                  style={{ color: hoveredNode.techColor || '#38bdf8' }}
                  className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 border border-white/10 font-bold shrink-0"
                >
                  {hoveredNode.techBadge}
                </span>
              )}
              {hoveredNode.folder && (
                <span className="text-slate-500 text-[10px] truncate hidden sm:inline">
                  ({hoveredNode.folder})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">
              {isFocusMode
                ? 'Focus Mode Active: Click any module to isolate its 1st-degree neighbors • Press F to exit'
                : isDependencyTraceEnabled 
                  ? 'Hover node to trace inbound/outbound links • Click to lock trace' 
                  : 'Drag to Pan • Smooth Wheel Zoom • Double Click to Fit'}
            </span>
          )}
        </div>

        {/* Focus Mode HUD Status Pill */}
        <button
          onClick={toggleFocusMode}
          className={`backdrop-blur-md px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 shadow-lg transition-all ${
            isFocusMode
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70 shadow-emerald-500/10'
              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Click or press 'F' to toggle 1st-degree Focus Mode (grays out non-neighbor modules)"
          id="d3-flow-focus-mode-status-pill"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isFocusMode ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{isFocusMode ? 'Focus Mode: ON (1st-Deg)' : 'Focus Mode: OFF'}</span>
          <span className="text-[9px] opacity-60 ml-0.5">(F)</span>
        </button>

        {/* Layout Algorithm Mode HUD Pill */}
        <button
          onClick={toggleLayoutAlgorithm}
          className={`backdrop-blur-md px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 shadow-lg transition-all ${
            layoutAlgorithm === 'hierarchical'
              ? 'bg-violet-950/60 border-violet-500/40 text-violet-300 hover:bg-violet-900/60 hover:text-white'
              : 'bg-sky-950/60 border-sky-500/40 text-sky-300 hover:bg-sky-900/60 hover:text-white'
          }`}
          title="Click or press 'L' to toggle layout algorithm (Force-Directed vs Hierarchical)"
          id="d3-flow-layout-status-pill"
        >
          {layoutAlgorithm === 'hierarchical' ? (
            <>
              <Layers className="w-3 h-3 text-violet-400" />
              <span>Hierarchical Tiers</span>
            </>
          ) : (
            <>
              <Network className="w-3 h-3 text-sky-400" />
              <span>Force Physics</span>
            </>
          )}
          <span className="text-[9px] opacity-60 ml-0.5">(L)</span>
        </button>

        {activeGroupHighlight !== null && (
          <div className="bg-violet-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-violet-500/40 text-[11px] font-mono text-violet-200 flex items-center gap-2 shadow-lg">
            <Filter className="w-3 h-3 text-violet-400" />
            <span>Filtering Layer</span>
            <button
              onClick={() => handleSetGroupHighlight(null)}
              className="text-violet-300 hover:text-white underline text-[10px] ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default D3FlowChart;
