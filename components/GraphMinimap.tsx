/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Map, Eye, EyeOff, Navigation, Maximize2 } from 'lucide-react';
import { ViewportTransform, GraphNodePosition, computeGraphBounds } from '../utils/diagramZoomHelper';

interface GraphMinimapProps {
  nodes: GraphNodePosition[];
  links?: { source: any; target: any }[];
  containerDimensions: { width: number; height: number };
  currentTransform: ViewportTransform;
  onNavigate: (targetX: number, targetY: number, smooth?: boolean) => void;
  onFitAll?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  colorAccessor?: (node: GraphNodePosition) => string;
}

const DEFAULT_NODE_COLOR = '#8b5cf6';

export const GraphMinimap: React.FC<GraphMinimapProps> = ({
  nodes,
  links = [],
  containerDimensions,
  currentTransform,
  onNavigate,
  onFitAll,
  position = 'bottom-right',
  className = '',
  colorAccessor,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  const minimapWidth = 160;
  const minimapHeight = 110;

  // Compute graph bounds
  const bounds = useMemo(() => {
    return computeGraphBounds(nodes) || {
      minX: -200,
      minY: -150,
      maxX: 200,
      maxY: 150,
      width: 400,
      height: 300,
      centerX: 0,
      centerY: 0,
    };
  }, [nodes]);

  // Transform coordinates from Graph Space -> Minimap Space
  const padding = 12;
  const scaleX = (minimapWidth - padding * 2) / Math.max(1, bounds.width);
  const scaleY = (minimapHeight - padding * 2) / Math.max(1, bounds.height);
  const minimapScale = Math.min(scaleX, scaleY);

  const graphToMinimap = useCallback((gx: number, gy: number) => {
    const mx = padding + (gx - bounds.minX) * minimapScale + (minimapWidth - padding * 2 - bounds.width * minimapScale) / 2;
    const my = padding + (gy - bounds.minY) * minimapScale + (minimapHeight - padding * 2 - bounds.height * minimapScale) / 2;
    return { x: mx, y: my };
  }, [bounds, minimapScale]);

  const minimapToGraph = useCallback((mx: number, my: number) => {
    const offsetX = padding + (minimapWidth - padding * 2 - bounds.width * minimapScale) / 2;
    const offsetY = padding + (minimapHeight - padding * 2 - bounds.height * minimapScale) / 2;
    const gx = bounds.minX + (mx - offsetX) / minimapScale;
    const gy = bounds.minY + (my - offsetY) / minimapScale;
    return { x: gx, y: gy };
  }, [bounds, minimapScale]);

  // Compute viewport rectangle in minimap coordinate space
  const { x, y, k } = currentTransform;
  const cWidth = containerDimensions.width || 800;
  const cHeight = containerDimensions.height || 500;

  // Visible bounds in graph coordinates
  const visibleGraphLeft = -x / k;
  const visibleGraphTop = -y / k;
  const visibleGraphRight = (cWidth - x) / k;
  const visibleGraphBottom = (cHeight - y) / k;

  const topLeft = graphToMinimap(visibleGraphLeft, visibleGraphTop);
  const bottomRight = graphToMinimap(visibleGraphRight, visibleGraphBottom);

  const boxX = Math.max(-5, Math.min(minimapWidth + 5, topLeft.x));
  const boxY = Math.max(-5, Math.min(minimapHeight + 5, topLeft.y));
  const boxWidth = Math.max(8, bottomRight.x - topLeft.x);
  const boxHeight = Math.max(8, bottomRight.y - topLeft.y);

  // Handle click or drag on minimap
  const handleMinimapInteraction = useCallback(
    (clientX: number, clientY: number, smooth: boolean) => {
      if (!minimapRef.current) return;
      const rect = minimapRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, minimapWidth));
      const clickY = Math.max(0, Math.min(clientY - rect.top, minimapHeight));

      // Target graph coordinate
      const targetGraph = minimapToGraph(clickX, clickY);

      // Center viewport around target graph coordinate
      const targetX = cWidth / 2 - targetGraph.x * k;
      const targetY = cHeight / 2 - targetGraph.y * k;

      onNavigate(targetX, targetY, smooth);
    },
    [cWidth, cHeight, k, minimapToGraph, onNavigate]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    handleMinimapInteraction(e.clientX, e.clientY, false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMinimapInteraction(e.clientX, e.clientY, false);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMinimapInteraction]);

  const posClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }[position];

  if (nodes.length === 0) return null;

  return (
    <div className={`absolute ${posClasses} z-20 select-none ${className}`}>
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 shadow-xl backdrop-blur-md transition-all text-xs font-mono group"
          title="Show Graph Radar Minimap (M)"
        >
          <Map className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Radar</span>
        </button>
      ) : (
        <div className="bg-slate-950/90 backdrop-blur-md rounded-2xl border border-white/15 p-2 shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-violet-400" />
              <span className="font-bold text-slate-300">RADAR</span>
              <span className="text-[9px] text-slate-500">({nodes.length}n)</span>
            </div>
            <div className="flex items-center gap-1">
              {onFitAll && (
                <button
                  onClick={onFitAll}
                  className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
                  title="Fit All Nodes"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
                title="Collapse Minimap"
              >
                <EyeOff className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Minimap SVG Canvas */}
          <div
            ref={minimapRef}
            onMouseDown={handleMouseDown}
            className="relative bg-slate-900/80 rounded-xl overflow-hidden cursor-crosshair border border-white/10"
            style={{ width: minimapWidth, height: minimapHeight }}
          >
            <svg width={minimapWidth} height={minimapHeight} className="block pointer-events-none">
              {/* Mini Grid */}
              <defs>
                <pattern id="radar-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={minimapWidth} height={minimapHeight} fill="url(#radar-grid)" />

              {/* Mini Links */}
              {links.map((l, i) => {
                const s = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
                const t = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
                if (!s || !t || typeof s.x !== 'number' || typeof t.x !== 'number') return null;
                const p1 = graphToMinimap(s.x, s.y);
                const p2 = graphToMinimap(t.x, t.y);
                return (
                  <line
                    key={i}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="rgba(148, 163, 184, 0.25)"
                    strokeWidth="0.75"
                  />
                );
              })}

              {/* Mini Node Dots */}
              {nodes.map((node) => {
                if (typeof node.x !== 'number' || typeof node.y !== 'number') return null;
                const pt = graphToMinimap(node.x, node.y);
                const color = colorAccessor ? colorAccessor(node) : DEFAULT_NODE_COLOR;
                const isRoot = node.id === 'root';
                return (
                  <circle
                    key={node.id}
                    cx={pt.x}
                    cy={pt.y}
                    r={isRoot ? 3 : 1.75}
                    fill={color}
                    opacity={0.85}
                  />
                );
              })}
            </svg>

            {/* Viewport Frustum Box */}
            <div
              className="absolute border border-violet-400 bg-violet-500/15 pointer-events-none rounded transition-all duration-75 shadow-sm"
              style={{
                left: `${boxX}px`,
                top: `${boxY}px`,
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.35)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
