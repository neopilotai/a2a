/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { EvolutionGraph, EvolutionNodeDiff, EvolutionLinkDiff, DiffStatus } from '../../types';
import { DIFF_COLORS } from '../../services/evolutionService';
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

export interface D3EvolutionGraphRef {
  resetView: () => void;
  fitToContent: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusNode: (nodeId: string) => void;
  getSvgElement: () => SVGSVGElement | null;
}

interface D3EvolutionGraphProps {
  data: EvolutionGraph;
  title: string;
  subTitle?: string;
  badgeLabel?: string;
  badgeColor?: string;
  isUnified?: boolean;
  selectedNodeId?: string | null;
  onNodeSelect?: (node: EvolutionNodeDiff) => void;
  filterStatus?: DiffStatus | 'all';
  activeGroupHighlight?: number | null;
  onZoomChange?: (transform: { x: number; y: number; k: number }) => void;
  externalTransform?: { x: number; y: number; k: number } | null;
  showMinimap?: boolean;
}

// Tier base colors
const TIER_COLORS: { [key: number]: string } = {
  0: "#8b5cf6", // Root: violet
  1: "#38bdf8", // UI: sky blue
  2: "#34d399", // API: emerald
  3: "#fbbf24", // Services: amber
  4: "#f472b6", // Data: pink
  5: "#a78bfa", // Utils: purple
  6: "#2dd4bf", // Config: teal
};

export const D3EvolutionGraph = forwardRef<D3EvolutionGraphRef, D3EvolutionGraphProps>(({
  data,
  title,
  subTitle,
  badgeLabel,
  badgeColor = 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  isUnified = false,
  selectedNodeId,
  onNodeSelect,
  filterStatus = 'all',
  activeGroupHighlight = null,
  onZoomChange,
  externalTransform = null,
  showMinimap = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesRef = useRef<EvolutionNodeDiff[]>([]);
  
  const [currentTransform, setCurrentTransform] = useState<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 450 });
  const [hoveredNode, setHoveredNode] = useState<EvolutionNodeDiff | null>(null);
  const [liveNodes, setLiveNodes] = useState<EvolutionNodeDiff[]>([]);
  const isSyncingFromExternal = useRef<boolean>(false);

  const resetView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .ease(d3.easeCubicOut)
      .call(zoomRef.current.transform, transform);
  }, []);

  const fitToContent = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;
    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    const bounds = computeGraphBounds(nodesRef.current);
    if (bounds) {
      smoothFitToBounds(svgRef.current, zoomRef.current, bounds, width, height, 550, 40);
    } else {
      resetView();
    }
  }, [resetView]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    smoothScaleBy(svgRef.current, zoomRef.current, 1.35, 260);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    smoothScaleBy(svgRef.current, zoomRef.current, 0.74, 260);
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    smoothPanBy(svgRef.current, zoomRef.current, currentTransform, dx, dy, 240);
  }, [currentTransform]);

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

  const focusNode = useCallback((nodeId: string) => {
    const target = nodesRef.current.find(n => n.id === nodeId);
    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
      smoothFocusOnNode(
        svgRef.current,
        zoomRef.current,
        target.x,
        target.y,
        containerDimensions.width,
        containerDimensions.height,
        1.4,
        500
      );
    }
  }, [containerDimensions]);

  const handleFocusSelected = useCallback(() => {
    if (selectedNodeId) {
      focusNode(selectedNodeId);
    }
  }, [selectedNodeId, focusNode]);

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

  useImperativeHandle(ref, () => ({
    resetView,
    fitToContent,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    focusNode,
    getSvgElement: () => svgRef.current,
  }), [resetView, fitToContent, handleZoomIn, handleZoomOut, focusNode]);

  // Handle external synchronized transform
  useEffect(() => {
    if (!externalTransform || !svgRef.current || !zoomRef.current) return;
    isSyncingFromExternal.current = true;
    const t = d3.zoomIdentity.translate(externalTransform.x, externalTransform.y).scale(externalTransform.k);
    d3.select(svgRef.current).call(zoomRef.current.transform, t);
    setCurrentTransform({
      x: externalTransform.x,
      y: externalTransform.y,
      k: externalTransform.k,
    });
    setTimeout(() => {
      isSyncingFromExternal.current = false;
    }, 50);
  }, [externalTransform]);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;
    setContainerDimensions({ width, height });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Defs for glowing diff filters and grid
    const defs = svg.append("defs");

    // Grid pattern
    const pattern = defs.append("pattern")
      .attr("id", `grid-${title.replace(/[^a-zA-Z0-9]/g, '-')}`)
      .attr("width", 28)
      .attr("height", 28)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 28 0 L 0 0 0 28")
      .attr("fill", "none")
      .attr("stroke", "rgba(255, 255, 255, 0.03)")
      .attr("stroke-width", 0.5);

    // Glow filters for diff markers
    const filterAdded = defs.append("filter").attr("id", "glow-added").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    filterAdded.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    filterAdded.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    const filterModified = defs.append("filter").attr("id", "glow-modified").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    filterModified.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    filterModified.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    const filterDeleted = defs.append("filter").attr("id", "glow-deleted").attr("x", "-40%").attr("y", "-40%").attr("width", "180%").attr("height", "180%");
    filterDeleted.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    filterDeleted.append("feMerge").selectAll("feMergeNode").data(["blur", "SourceGraphic"]).join("feMergeNode").attr("in", (d) => d);

    // Background rect
    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", `url(#grid-${title.replace(/[^a-zA-Z0-9]/g, '-')})`)
      .attr("pointer-events", "none");

    const g = svg.append("g").attr("class", "zoom-container");
    gRef.current = g;

    // Filter nodes if filterStatus is active
    let visibleNodes = data.nodes;
    if (filterStatus !== 'all') {
      visibleNodes = data.nodes.filter(n => n.id === 'root' || n.diffStatus === filterStatus);
    }

    const nodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = data.links.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });

    const nodes: EvolutionNodeDiff[] = visibleNodes.map(d => ({ ...d }));
    const links: EvolutionLinkDiff[] = visibleLinks.map(d => ({ ...d }));
    nodesRef.current = nodes;

    const simulation = d3.forceSimulation<EvolutionNodeDiff, EvolutionLinkDiff>(nodes)
      .force("link", d3.forceLink<EvolutionNodeDiff, EvolutionLinkDiff>(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(26))
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2).strength(0.06));

    // Links Rendering
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => {
        if (d.diffStatus === 'added') return DIFF_COLORS.added;
        if (d.diffStatus === 'deleted') return DIFF_COLORS.deleted;
        if (d.diffStatus === 'modified') return DIFF_COLORS.modified;
        return "#475569";
      })
      .attr("stroke-opacity", (d: any) => (d.diffStatus !== 'unchanged' ? 0.8 : 0.3))
      .attr("stroke-width", (d: any) => (d.diffStatus !== 'unchanged' ? 2.2 : 1.2))
      .attr("stroke-dasharray", (d: any) => (d.diffStatus === 'deleted' ? "4,4" : "none"));

    // Nodes Rendering
    const nodeGroup = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .attr("opacity", (d: EvolutionNodeDiff) => {
        if (activeGroupHighlight !== null && d.id !== 'root') {
          return d.group === activeGroupHighlight ? 1 : 0.2;
        }
        if (filterStatus !== 'all' && d.id !== 'root') {
          return d.diffStatus === filterStatus ? 1 : 0.2;
        }
        return d.diffStatus === 'deleted' ? 0.7 : 1;
      })
      .on("click", (event, d: EvolutionNodeDiff) => {
        event.stopPropagation();
        if (onNodeSelect) {
          onNodeSelect(d);
        }
        if (typeof d.x === 'number' && typeof d.y === 'number') {
          smoothFocusOnNode(svgRef.current, zoomRef.current, d.x, d.y, width, height, 1.4, 450);
        }
      })
      .on("mouseenter", (_, d: EvolutionNodeDiff) => setHoveredNode(d))
      .on("mouseleave", () => setHoveredNode(null));

    // Pulse / Diff Ring Halo
    nodeGroup.filter(d => d.diffStatus !== 'unchanged' && d.id !== 'root')
      .append("circle")
      .attr("r", 16)
      .attr("fill", "none")
      .attr("stroke", (d: EvolutionNodeDiff) => {
        if (d.diffStatus === 'added') return DIFF_COLORS.added;
        if (d.diffStatus === 'modified') return DIFF_COLORS.modified;
        if (d.diffStatus === 'deleted') return DIFF_COLORS.deleted;
        return "transparent";
      })
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d: EvolutionNodeDiff) => d.diffStatus === 'deleted' ? "3,3" : "none")
      .attr("opacity", 0.6)
      .attr("filter", (d: EvolutionNodeDiff) => {
        if (d.diffStatus === 'added') return "url(#glow-added)";
        if (d.diffStatus === 'modified') return "url(#glow-modified)";
        if (d.diffStatus === 'deleted') return "url(#glow-deleted)";
        return "none";
      });

    // Core Node Circle
    nodeGroup.append("circle")
      .attr("r", (d: EvolutionNodeDiff) => (d.id === 'root' ? 17 : 11))
      .attr("fill", (d: EvolutionNodeDiff) => {
        if (d.id === 'root') return "#8b5cf6";
        if (d.diffStatus === 'added') return DIFF_COLORS.added;
        if (d.diffStatus === 'modified') return DIFF_COLORS.modified;
        if (d.diffStatus === 'deleted') return "rgba(239, 68, 68, 0.4)";
        return TIER_COLORS[d.group % Object.keys(TIER_COLORS).length] || "#64748b";
      })
      .attr("stroke", (d: EvolutionNodeDiff) => {
        if (d.id === selectedNodeId) return "#ffffff";
        if (d.diffStatus === 'deleted') return DIFF_COLORS.deleted;
        if (d.diffStatus === 'added') return "#ffffff";
        if (d.diffStatus === 'modified') return "#ffffff";
        return "#0f172a";
      })
      .attr("stroke-width", (d: EvolutionNodeDiff) => (d.id === selectedNodeId ? 3 : 2))
      .attr("stroke-dasharray", (d: EvolutionNodeDiff) => d.diffStatus === 'deleted' ? "3,2" : "none");

    // Color-coded Diff Badge Icon on Node Center
    nodeGroup.filter(d => d.id !== 'root' && d.diffStatus !== 'unchanged')
      .append("text")
      .text((d: EvolutionNodeDiff) => {
        if (d.diffStatus === 'added') return '+';
        if (d.diffStatus === 'modified') return 'Δ';
        if (d.diffStatus === 'deleted') return '✕';
        return '';
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", (d: EvolutionNodeDiff) => d.diffStatus === 'deleted' ? '#fca5a5' : '#ffffff')
      .attr("font-size", "10px")
      .attr("font-weight", "900")
      .attr("font-family", "JetBrains Mono, monospace")
      .style("pointer-events", "none");

    // Text Label
    nodeGroup.append("text")
      .text((d: EvolutionNodeDiff) => d.label)
      .attr("x", (d: EvolutionNodeDiff) => (d.id === 'root' ? 22 : 16))
      .attr("y", 4)
      .attr("fill", (d: EvolutionNodeDiff) => {
        if (d.id === selectedNodeId) return "#ffffff";
        if (d.diffStatus === 'added') return "#6ee7b7";
        if (d.diffStatus === 'modified') return "#fde68a";
        if (d.diffStatus === 'deleted') return "#fca5a5";
        return "#cbd5e1";
      })
      .attr("font-size", (d: EvolutionNodeDiff) => (d.id === 'root' ? "12px" : "10px"))
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("font-weight", (d: EvolutionNodeDiff) => (d.diffStatus !== 'unchanged' || d.id === 'root' ? "700" : "500"))
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.95)")
      .style("pointer-events", "none");

    // Drag behavior
    const drag = d3.drag<SVGGElement, EvolutionNodeDiff>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(drag as any);

    // Smooth Zoom & Pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 8])
      .wheelDelta(createSmoothWheelDelta())
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
        
        if (!isSyncingFromExternal.current && onZoomChange) {
          onZoomChange({
            x: event.transform.x,
            y: event.transform.y,
            k: event.transform.k
          });
        }
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Double-click background to fit
    svg.on("dblclick.zoom", (event) => {
      event.preventDefault();
      fitToContent();
    });

    let tickCount = 0;
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as EvolutionNodeDiff).x!)
        .attr("y1", (d: any) => (d.source as EvolutionNodeDiff).y!)
        .attr("x2", (d: any) => (d.target as EvolutionNodeDiff).x!)
        .attr("y2", (d: any) => (d.target as EvolutionNodeDiff).y!);

      nodeGroup.attr("transform", (d: EvolutionNodeDiff) => `translate(${d.x},${d.y})`);

      tickCount++;
      if (tickCount % 10 === 0) {
        setLiveNodes([...nodes]);
      }
    });

    simulation.on("end", () => {
      setLiveNodes([...nodes]);
    });

    return () => {
      simulation.stop();
      svg.on(".zoom", null);
    };
  }, [data, title, selectedNodeId, filterStatus, activeGroupHighlight, onNodeSelect, fitToContent, onZoomChange]);

  const zoomPercent = Math.round(currentTransform.k * 100);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[380px] bg-slate-950/80 rounded-2xl overflow-hidden border border-white/10 select-none">
      
      {/* Top Header Tag */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg ${badgeColor}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{title}</span>
        </div>
        {subTitle && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-white/5 truncate max-w-[180px]">
            {subTitle}
          </span>
        )}
      </div>

      {/* Floating Diagram Controls Toolbar */}
      <div className="absolute top-3 right-3 z-20">
        <DiagramZoomToolbar
          zoomPercent={zoomPercent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={resetView}
          onFitToContent={fitToContent}
          onFocusSelected={handleFocusSelected}
          hasSelectedNode={!!selectedNodeId}
          onPan={handlePan}
          onSetScalePreset={handleSetScalePreset}
          showSnapshotButton={false}
        />
      </div>

      {/* Interactive Radar Minimap */}
      {showMinimap && (
        <GraphMinimap
          nodes={liveNodes.length > 0 ? liveNodes : data.nodes}
          links={data.links}
          containerDimensions={containerDimensions}
          currentTransform={currentTransform}
          onNavigate={handleMinimapNavigate}
          onFitAll={fitToContent}
          position="bottom-right"
          colorAccessor={(node) => {
            if (node.diffStatus === 'added') return DIFF_COLORS.added;
            if (node.diffStatus === 'modified') return DIFF_COLORS.modified;
            if (node.diffStatus === 'deleted') return DIFF_COLORS.deleted;
            return TIER_COLORS[(node.group || 0) % Object.keys(TIER_COLORS).length] || "#64748b";
          }}
        />
      )}

      {/* Hovered Node Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 z-20 max-w-xs bg-slate-900/95 border border-white/15 rounded-xl p-2.5 shadow-2xl backdrop-blur-md font-mono text-xs animate-in fade-in">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1.5">
            <span className="font-bold text-white truncate">{hoveredNode.label}</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase ${
              hoveredNode.diffStatus === 'added' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              hoveredNode.diffStatus === 'modified' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              hoveredNode.diffStatus === 'deleted' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
              'bg-slate-700/50 text-slate-300'
            }`}>
              {hoveredNode.diffStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mb-1">{hoveredNode.path || 'Root entry'}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Tier: <span className="text-slate-300">{hoveredNode.tier}</span></span>
            {(hoveredNode.additions || hoveredNode.deletions) ? (
              <span className="flex items-center gap-1">
                {hoveredNode.additions ? <span className="text-emerald-400">+{hoveredNode.additions}</span> : null}
                {hoveredNode.deletions ? <span className="text-red-400">-{hoveredNode.deletions}</span> : null}
              </span>
            ) : null}
          </div>
          {hoveredNode.changesSummary && (
            <p className="text-[10px] text-slate-300 mt-1 italic border-t border-white/5 pt-1">
              {hoveredNode.changesSummary}
            </p>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
    </div>
  );
});

D3EvolutionGraph.displayName = 'D3EvolutionGraph';
