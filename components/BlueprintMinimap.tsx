/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Map, Eye, EyeOff, Navigation } from 'lucide-react';

export interface MinimapTransform {
  x: number;
  y: number;
  k: number;
}

interface BlueprintMinimapProps {
  imageSrc: string;
  imageDimensions: { width: number; height: number };
  containerDimensions: { width: number; height: number };
  currentTransform: MinimapTransform;
  onNavigate: (newX: number, newY: number, smooth?: boolean) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const BlueprintMinimap: React.FC<BlueprintMinimapProps> = ({
  imageSrc,
  imageDimensions,
  containerDimensions,
  currentTransform,
  onNavigate,
  position = 'bottom-right',
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  // Determine fixed minimap width and maintain aspect ratio
  const maxMinimapWidth = 160;
  const maxMinimapHeight = 110;

  const aspectRatio = (imageDimensions.width || 1) / (imageDimensions.height || 1);
  
  let minimapWidth = maxMinimapWidth;
  let minimapHeight = minimapWidth / aspectRatio;

  if (minimapHeight > maxMinimapHeight) {
    minimapHeight = maxMinimapHeight;
    minimapWidth = minimapHeight * aspectRatio;
  }

  // Scale factor from real blueprint image to minimap thumbnail
  const scale = minimapWidth / (imageDimensions.width || 1);

  // Compute viewport rectangle in minimap coordinate space
  const { x, y, k } = currentTransform;
  const cWidth = containerDimensions.width || 800;
  const cHeight = containerDimensions.height || 500;

  // Real visible bounds in image coordinates
  const visibleImgLeft = -x / k;
  const visibleImgTop = -y / k;
  const visibleImgWidth = cWidth / k;
  const visibleImgHeight = cHeight / k;

  // Project to minimap box
  const boxX = visibleImgLeft * scale;
  const boxY = visibleImgTop * scale;
  const boxWidth = visibleImgWidth * scale;
  const boxHeight = visibleImgHeight * scale;

  // Handle click or drag on minimap
  const handleMinimapInteraction = useCallback(
    (clientX: number, clientY: number, smooth: boolean) => {
      if (!minimapRef.current) return;
      const rect = minimapRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, minimapWidth));
      const clickY = Math.max(0, Math.min(clientY - rect.top, minimapHeight));

      // Target image coordinate
      const targetImgX = clickX / scale;
      const targetImgY = clickY / scale;

      // Center container around (targetImgX, targetImgY)
      const targetX = cWidth / 2 - targetImgX * k;
      const targetY = cHeight / 2 - targetImgY * k;

      onNavigate(targetX, targetY, smooth);
    },
    [cWidth, cHeight, k, minimapHeight, minimapWidth, onNavigate, scale]
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
      e.preventDefault();
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

  // Position class mappings
  const positionClasses = {
    'bottom-right': 'bottom-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'top-right': 'top-14 right-3',
    'top-left': 'top-14 left-3',
  }[position];

  return (
    <div
      className={`absolute ${positionClasses} z-30 flex flex-col items-end transition-all select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Minimap Body */}
      {!isCollapsed && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-1.5 border border-white/15 shadow-2xl overflow-hidden mb-1.5 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-1 pb-1 mb-1 border-b border-white/10 text-[9px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <Navigation className="w-2.5 h-2.5 text-violet-400" />
              <span className="font-semibold text-slate-300">MINIMAP</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              title="Minimize radar"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>

          {/* Canvas Area */}
          <div
            ref={minimapRef}
            onMouseDown={handleMouseDown}
            style={{ width: `${minimapWidth}px`, height: `${minimapHeight}px` }}
            className="relative bg-slate-950 rounded-lg overflow-hidden border border-white/10 cursor-crosshair shadow-inner group/minimap"
          >
            {/* Blueprint thumbnail */}
            <img
              src={imageSrc}
              alt="Blueprint Thumbnail"
              className="w-full h-full object-contain pointer-events-none opacity-50 filter brightness-90 group-hover/minimap:opacity-75 transition-opacity"
              draggable={false}
            />

            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />

            {/* Viewport Indicator Rectangle */}
            <div
              style={{
                left: `${boxX}px`,
                top: `${boxY}px`,
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
              }}
              className={`absolute border-2 pointer-events-none transition-all duration-75 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/25 shadow-neon-emerald'
                  : 'border-violet-400 bg-violet-500/20 shadow-neon-violet'
              }`}
            >
              {/* Corner crosshair ticks */}
              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Toggle Button */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-violet-400 hover:text-violet-300 rounded-xl border border-white/10 shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 font-mono text-[11px]"
          title="Open Minimap Navigation"
        >
          <Map className="w-4 h-4" />
          <span className="hidden sm:inline">Minimap</span>
        </button>
      )}
    </div>
  );
};

export default BlueprintMinimap;
