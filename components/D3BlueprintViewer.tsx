/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Grid, Expand, Compass, Map, RefreshCw, Download } from 'lucide-react';
import { BlueprintMinimap, MinimapTransform } from './BlueprintMinimap';

import { createSmoothWheelDelta } from '../utils/diagramZoomHelper';

export interface D3BlueprintViewerRef {
  resetView: (animate?: boolean) => void;
  fitToScreen: (animate?: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getSvgElement: () => SVGSVGElement | null;
}

interface D3BlueprintViewerProps {
  imageSrc: string;
  alt: string;
  className?: string;
  minHeight?: string;
  onExpandFullScreen?: () => void;
  onExport?: () => void;
  showGridOverlay?: boolean;
}

export const D3BlueprintViewer = forwardRef<D3BlueprintViewerRef, D3BlueprintViewerProps>(({
  imageSrc,
  alt,
  className = '',
  minHeight = '420px',
  onExpandFullScreen,
  onExport,
  showGridOverlay = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [gridEnabled, setGridEnabled] = useState<boolean>(showGridOverlay);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  const [currentTransform, setCurrentTransform] = useState<MinimapTransform>({ x: 0, y: 0, k: 1 });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);

  // Load natural image dimensions
  useEffect(() => {
    if (!imageSrc) return;
    setIsLoaded(false);
    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth || 1200,
        height: img.naturalHeight || 800,
      });
      setIsLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Reset view to default state: centered with scale = 1
  const resetView = useCallback((animate = true) => {
    if (!svgRef.current || !containerRef.current || !zoomBehaviorRef.current) return;
    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 500;

    const imgW = imageDimensions.width;
    const imgH = imageDimensions.height;

    // Centered coordinates with scale = 1.0 (default state)
    const tx = (containerWidth - imgW) / 2;
    const ty = (containerHeight - imgH) / 2;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(1);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition()
        .duration(450)
        .ease(d3.easeCubicOut)
        .call(zoomBehaviorRef.current.transform, transform);
    } else {
      svg.call(zoomBehaviorRef.current.transform, transform);
    }
  }, [imageDimensions]);

  // Fit image to current viewport boundaries
  const fitToView = useCallback((animate = true) => {
    if (!svgRef.current || !containerRef.current || !zoomBehaviorRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 500;
    setContainerDimensions({ width: containerWidth, height: containerHeight });

    const imgW = imageDimensions.width;
    const imgH = imageDimensions.height;

    // Calculate scale factor with padding
    const padding = 24;
    const scaleX = (containerWidth - padding * 2) / imgW;
    const scaleY = (containerHeight - padding * 2) / imgH;
    const fitScale = Math.min(scaleX, scaleY, 1.2); // Cap initial scale to reasonable max

    const tx = (containerWidth - imgW * fitScale) / 2;
    const ty = (containerHeight - imgH * fitScale) / 2;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(fitScale);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition().duration(500).ease(d3.easeCubicOut).call(zoomBehaviorRef.current.transform, transform);
    } else {
      svg.call(zoomBehaviorRef.current.transform, transform);
    }
  }, [imageDimensions]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(280)
      .ease(d3.easeQuadOut)
      .call(zoomBehaviorRef.current.scaleBy, 1.35);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(280)
      .ease(d3.easeQuadOut)
      .call(zoomBehaviorRef.current.scaleBy, 0.74);
  }, []);

  // Expose imperative handle methods
  useImperativeHandle(ref, () => ({
    resetView: (animate = true) => resetView(animate),
    fitToScreen: (animate = true) => fitToView(animate),
    zoomIn: () => handleZoomIn(),
    zoomOut: () => handleZoomOut(),
    getSvgElement: () => svgRef.current,
  }), [resetView, fitToView, handleZoomIn, handleZoomOut]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !isLoaded) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('g.blueprint-content-layer');

    // Create D3 Zoom Behavior with smooth wheel delta and RAF-throttled React state updates
    let rafId: number | null = null;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 8]) // Deep zoom range for technical architectural blueprints
      .wheelDelta(createSmoothWheelDelta())
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            setZoomPercent(Math.round(event.transform.k * 100));
            setCurrentTransform({
              x: event.transform.x,
              y: event.transform.y,
              k: event.transform.k,
            });
          });
        }
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Double-click background to fit
    svg.on('dblclick.zoom', (event) => {
      event.preventDefault();
      fitToView(true);
    });

    // Initial fit
    fitToView(false);

    // ResizeObserver for dynamic responsiveness
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 500,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      svg.on('.zoom', null);
    };
  }, [isLoaded, fitToView]);

  // Keyboard navigation for power-users
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      resetView(true);
    }
  };

  // Navigate directly via minimap interaction
  const handleMinimapNavigate = useCallback((newX: number, newY: number, smooth = false) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const newTransform = d3.zoomIdentity.translate(newX, newY).scale(currentTransform.k);
    if (smooth) {
      d3.select(svgRef.current)
        .transition()
        .duration(260)
        .ease(d3.easeCubicOut)
        .call(zoomBehaviorRef.current.transform, newTransform);
    } else {
      d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, newTransform);
    }
  }, [currentTransform.k]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ minHeight }}
      className={`relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden select-none outline-none group border border-white/5 shadow-inner ${className}`}
    >
      {/* SVG Canvas for D3 Panning and Zooming */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 1) 100%)',
        }}
      >
        <defs>
          {/* Subtle Architectural Drafting Grid */}
          <pattern id="d3-blueprint-small-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="0.5" />
          </pattern>
          <pattern id="d3-blueprint-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#d3-blueprint-small-grid)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
          </pattern>

          {/* Blueprint Glow filter */}
          <filter id="blueprint-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="rgba(0, 0, 0, 0.6)" />
          </filter>
        </defs>

        {/* Optional Blueprint Background Grid */}
        {gridEnabled && (
          <rect width="100%" height="100%" fill="url(#d3-blueprint-grid)" className="pointer-events-none" />
        )}

        {/* Transformable Layer controlled by D3 Zoom */}
        <g className="blueprint-content-layer">
          {imageSrc && isLoaded && (
            <g filter="url(#blueprint-glow)">
              {/* Image Frame Shadow */}
              <rect
                x={0}
                y={0}
                width={imageDimensions.width}
                height={imageDimensions.height}
                rx={12}
                fill="#0b1120"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={1.5}
              />
              
              {/* Blueprint Image Element */}
              <image
                href={imageSrc}
                x={0}
                y={0}
                width={imageDimensions.width}
                height={imageDimensions.height}
                preserveAspectRatio="xMidYMid meet"
                className="select-none"
              />

              {/* Subtle Architectural Corner Ticks */}
              <g stroke="rgba(139, 92, 246, 0.6)" strokeWidth="2" fill="none" className="pointer-events-none">
                <path d={`M 0 20 L 0 0 L 20 0`} />
                <path d={`M ${imageDimensions.width - 20} 0 L ${imageDimensions.width} 0 L ${imageDimensions.width} 20`} />
                <path d={`M 0 ${imageDimensions.height - 20} L 0 ${imageDimensions.height} L 20 ${imageDimensions.height}`} />
                <path d={`M ${imageDimensions.width - 20} ${imageDimensions.height} L ${imageDimensions.width} ${imageDimensions.height} L ${imageDimensions.width} ${imageDimensions.height - 20}`} />
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* Floating Blueprint Controls Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-xl z-20 transition-opacity opacity-90 group-hover:opacity-100">
        {/* Zoom In Button */}
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom In (Scroll Up or +)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Percentage / Reset to 100% */}
        <button
          onClick={() => resetView(true)}
          className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-300 hover:text-violet-300 hover:bg-white/10 rounded-md transition-colors min-w-[50px] text-center"
          title="Reset View to 100% (Scale 1, Center)"
          aria-label="Reset zoom to 100%"
        >
          {zoomPercent}%
        </button>

        {/* Zoom Out Button */}
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom Out (Scroll Down or -)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        {/* Reset View Button (Center, Scale 1) */}
        <button
          onClick={() => resetView(true)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
          title="Reset View: Center & Scale 1 (R or 0)"
          aria-label="Reset View to default center and scale 1"
          id="d3-blueprint-reset-view-btn"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fit to View Button */}
        <button
          onClick={() => fitToView(true)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Fit to Screen Bounds"
          aria-label="Fit to screen bounds"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Grid Toggle */}
        <button
          onClick={() => setGridEnabled(!gridEnabled)}
          className={`p-1.5 rounded-lg transition-colors ${
            gridEnabled ? 'text-violet-400 bg-violet-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
          title={gridEnabled ? 'Hide Blueprint Grid' : 'Show Blueprint Grid'}
          aria-label="Toggle blueprint grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Minimap Toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className={`p-1.5 rounded-lg transition-colors ${
            showMinimap ? 'text-violet-400 bg-violet-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
          title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
          aria-label="Toggle minimap navigation"
        >
          <Map className="w-4 h-4" />
        </button>

        {/* Export Blueprint for Documentation */}
        {onExport && (
          <button
            onClick={onExport}
            className="p-1.5 text-violet-300 hover:text-white hover:bg-violet-500/20 rounded-lg transition-colors"
            title="Export Blueprint (SVG / PNG)"
            aria-label="Export architecture blueprint"
            id="d3-blueprint-export-btn"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Fullscreen Expansion if supported */}
        {onExpandFullScreen && (
          <button
            onClick={onExpandFullScreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Inspect Fullscreen"
            aria-label="Fullscreen blueprint inspection"
          >
            <Expand className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Helper Overlay Tag */}
      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[11px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity z-20">
        <Compass className="w-3.5 h-3.5 text-violet-400" />
        <span className="hidden sm:inline">D3 Interactive Canvas: Drag to Pan • Scroll / Double-Click to Zoom</span>
        <span className="sm:hidden">Drag • Pinch Zoom</span>
      </div>

      {/* Corner Minimap Component */}
      {showMinimap && imageSrc && isLoaded && (
        <BlueprintMinimap
          imageSrc={imageSrc}
          imageDimensions={imageDimensions}
          containerDimensions={containerDimensions}
          currentTransform={currentTransform}
          onNavigate={handleMinimapNavigate}
          position="bottom-right"
        />
      )}
    </div>
  );
});

export default D3BlueprintViewer;
