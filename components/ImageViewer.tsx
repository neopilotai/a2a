/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { X, ZoomIn, ZoomOut, RotateCcw, Grid, Download, Map, Maximize2 } from 'lucide-react';
import { BlueprintMinimap, MinimapTransform } from './BlueprintMinimap';
import { createSmoothWheelDelta } from '../utils/diagramZoomHelper';

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 1400, height: 900 });
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 1400, height: 900 });
  const [currentTransform, setCurrentTransform] = useState<MinimapTransform>({ x: 0, y: 0, k: 1 });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load natural dimensions
  useEffect(() => {
    if (!src) return;
    setIsLoaded(false);
    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth || 1400,
        height: img.naturalHeight || 900,
      });
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  // Fit to screen calculation
  const fitToScreen = useCallback((animate = true) => {
    if (!svgRef.current || !containerRef.current || !zoomBehaviorRef.current) return;

    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || (window.innerHeight - 80);
    setContainerDimensions({ width: containerWidth, height: containerHeight });

    const imgW = imageDimensions.width;
    const imgH = imageDimensions.height;

    const padding = 40;
    const scaleX = (containerWidth - padding * 2) / imgW;
    const scaleY = (containerHeight - padding * 2) / imgH;
    const fitScale = Math.min(scaleX, scaleY, 1.5);

    const tx = (containerWidth - imgW * fitScale) / 2;
    const ty = (containerHeight - imgH * fitScale) / 2;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(fitScale);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition().duration(400).ease(d3.easeCubicOut).call(zoomBehaviorRef.current.transform, transform);
    } else {
      svg.call(zoomBehaviorRef.current.transform, transform);
    }
  }, [imageDimensions]);

  // D3 Zoom attachment
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !isLoaded) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('g.image-viewer-layer');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10]) // Generous zoom range for high-detail blueprints
      .wheelDelta(createSmoothWheelDelta())
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomPercent(Math.round(event.transform.k * 100));
        setCurrentTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Double click to fit
    svg.on('dblclick.zoom', (event) => {
      event.preventDefault();
      fitToScreen(true);
    });

    fitToScreen(false);

    const handleResize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth || window.innerWidth,
          height: containerRef.current.clientHeight || (window.innerHeight - 80),
        });
      }
      fitToScreen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      svg.on('.zoom', null);
    };
  }, [isLoaded, fitToScreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        fitToScreen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, fitToScreen]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(260)
      .ease(d3.easeQuadOut)
      .call(zoomBehaviorRef.current.scaleBy, 1.35);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(260)
      .ease(d3.easeQuadOut)
      .call(zoomBehaviorRef.current.scaleBy, 0.74);
  };

  const resetView = useCallback((animate = true) => {
    if (!svgRef.current || !containerRef.current || !zoomBehaviorRef.current) return;
    const containerWidth = containerRef.current.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current.clientHeight || (window.innerHeight - 80);
    const tx = (containerWidth - imageDimensions.width) / 2;
    const ty = (containerHeight - imageDimensions.height) / 2;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(1);

    const svg = d3.select(svgRef.current);
    if (animate) {
      svg.transition()
        .duration(400)
        .ease(d3.easeCubicOut)
        .call(zoomBehaviorRef.current.transform, transform);
    } else {
      svg.call(zoomBehaviorRef.current.transform, transform);
    }
  }, [imageDimensions]);

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
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200 select-none">
      {/* Technical Toolbar */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-slate-900/80 border-b border-white/10 z-50">
        <div className="flex items-center gap-3 min-w-0 max-w-[50%]">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
          <h3 className="text-slate-200 font-mono text-sm font-semibold truncate tracking-tight">{alt}</h3>
          <span className="hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
            D3 Interactive Viewport
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Percent / Reset to 100% Button */}
          <button
            onClick={() => resetView(true)}
            className="font-mono text-xs text-slate-300 hover:text-violet-300 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors min-w-[56px] text-center"
            title="Reset View to 100% (Center, Scale 1)"
            aria-label="Reset zoom to 100%"
          >
            {zoomPercent}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset View Button */}
          <button
            onClick={() => resetView(true)}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Reset View: Center & Scale 1 (R)"
            aria-label="Reset view to center and scale 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fit to View Button */}
          <button
            onClick={() => fitToScreen(true)}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Fit to Screen (0)"
            aria-label="Fit to screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Grid Toggle Button */}
          <button
            onClick={() => setGridEnabled(!gridEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              gridEnabled ? 'text-violet-400 bg-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={gridEnabled ? 'Hide Grid' : 'Show Grid'}
            aria-label="Toggle grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Minimap Toggle */}
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`p-2 rounded-lg transition-colors ${
              showMinimap ? 'text-violet-400 bg-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
            aria-label="Toggle minimap"
          >
            <Map className="w-4 h-4" />
          </button>

          {/* Download Blueprint */}
          <a
            href={src}
            download={`${alt.toLowerCase().replace(/\s+/g, '-')}-blueprint.png`}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Download PNG"
          >
            <Download className="w-4 h-4" />
          </a>

          <div className="w-px h-6 bg-white/10 mx-1"></div>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-lg transition-colors"
            title="Close (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* D3 SVG Interactive Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          style={{
            background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 1) 100%)',
          }}
        >
          <defs>
            <pattern id="viewer-blueprint-subgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="0.5" />
            </pattern>
            <pattern id="viewer-blueprint-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#viewer-blueprint-subgrid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid Background */}
          {gridEnabled && (
            <rect width="100%" height="100%" fill="url(#viewer-blueprint-grid)" className="pointer-events-none" />
          )}

          {/* Transformable Layer */}
          <g className="image-viewer-layer">
            {src && isLoaded && (
              <g>
                <rect
                  x={0}
                  y={0}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  rx={10}
                  fill="#020617"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth={1}
                />
                <image
                  href={src}
                  x={0}
                  y={0}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  preserveAspectRatio="xMidYMid meet"
                  className="select-none"
                />
              </g>
            )}
          </g>
        </svg>

        {/* Footer Hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs text-slate-400 font-mono pointer-events-none shadow-2xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
          <span>Pan: Click & Drag • Zoom: Scroll Wheel or Pinch • Reset: Press 0</span>
        </div>

        {/* Fullscreen Minimap */}
        {showMinimap && src && isLoaded && (
          <BlueprintMinimap
            imageSrc={src}
            imageDimensions={imageDimensions}
            containerDimensions={containerDimensions}
            currentTransform={currentTransform}
            onNavigate={handleMinimapNavigate}
            position="bottom-right"
          />
        )}
      </div>
    </div>
  );
};

export default ImageViewer;
