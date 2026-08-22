/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Crosshair, 
  Camera, 
  HelpCircle,
  Sliders,
  Sparkles
} from 'lucide-react';

interface DiagramZoomToolbarProps {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitToContent?: () => void;
  onFocusSelected?: () => void;
  hasSelectedNode?: boolean;
  onPan?: (dx: number, dy: number) => void;
  onSetScalePreset?: (scale: number) => void;
  onTakeSnapshot?: () => void;
  showSnapshotButton?: boolean;
  className?: string;
  isSyncMode?: boolean;
}

export const DiagramZoomToolbar: React.FC<DiagramZoomToolbarProps> = ({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitToContent,
  onFocusSelected,
  hasSelectedNode = false,
  onPan,
  onSetScalePreset,
  onTakeSnapshot,
  showSnapshotButton = true,
  className = '',
  isSyncMode = false,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showCompass, setShowCompass] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const PAN_STEP = 120;

  const presets = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1.0 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2.0 },
  ];

  return (
    <div className={`relative flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl z-20 select-none ${className}`}>
      
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Smooth Zoom In (+)"
        aria-label="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Interactive Zoom Preset Dropdown / Readout */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="font-mono text-[11px] font-semibold text-slate-200 hover:text-white px-2 py-1 min-w-[52px] text-center rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-0.5"
          title="Change Zoom Level Preset"
        >
          <span>{zoomPercent}%</span>
        </button>

        {showPresets && (
          <div 
            className="absolute top-full left-0 mt-1 py-1 bg-slate-950/95 border border-white/15 rounded-xl shadow-2xl z-50 font-mono text-[11px] min-w-[80px] backdrop-blur-md animate-in fade-in zoom-in-95"
            onMouseLeave={() => setShowPresets(false)}
          >
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  if (onSetScalePreset) onSetScalePreset(p.value);
                  setShowPresets(false);
                }}
                className={`w-full px-3 py-1 text-left hover:bg-violet-600/30 hover:text-white transition-colors ${
                  Math.abs(zoomPercent - p.value * 100) < 5 ? 'text-violet-300 font-bold bg-white/5' : 'text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Smooth Zoom Out (-)"
        aria-label="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-0.5" />

      {/* Fit to Content / Auto-Frame All Nodes */}
      {onFitToContent && (
        <button
          onClick={onFitToContent}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Fit to Content (Auto-frame all components)"
          aria-label="Fit to content"
        >
          <Maximize2 className="w-4 h-4 text-sky-400" />
        </button>
      )}

      {/* Focus on Selected Node (if node is selected) */}
      {hasSelectedNode && onFocusSelected && (
        <button
          onClick={onFocusSelected}
          className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 rounded-lg transition-colors animate-pulse"
          title="Center & Zoom on Selected Node"
          aria-label="Focus on selected node"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      )}

      {/* Reset Viewport to Center 100% */}
      <button
        onClick={onResetView}
        className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Reset View: Center & Scale (100%)"
        aria-label="Reset view"
      >
        <RotateCcw className="w-4 h-4 text-violet-400" />
      </button>

      {/* Pan Navigation Compass Flyout */}
      {onPan && (
        <div className="relative">
          <button
            onClick={() => setShowCompass(!showCompass)}
            className={`p-1.5 rounded-lg transition-colors ${
              showCompass ? 'bg-violet-500/30 text-violet-200' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Pan Controls Compass"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {showCompass && (
            <div 
              className="absolute top-full right-0 mt-1 p-2 bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 flex flex-col items-center gap-1"
              onMouseLeave={() => setShowCompass(false)}
            >
              <span className="text-[9px] font-mono text-slate-400 mb-0.5 uppercase tracking-wider">Pan Canvas</span>
              <button
                onClick={() => onPan(0, PAN_STEP)}
                className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                title="Pan Up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPan(PAN_STEP, 0)}
                  className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                  title="Pan Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-3 h-3 rounded-full bg-violet-500/40 border border-violet-400" />
                <button
                  onClick={() => onPan(-PAN_STEP, 0)}
                  className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                  title="Pan Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => onPan(0, -PAN_STEP)}
                className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                title="Pan Down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Helper */}
      <div className="relative">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
          title="Zoom & Pan Keyboard Shortcuts"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {showShortcuts && (
          <div 
            className="absolute top-full right-0 mt-1 p-3 bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 font-mono text-xs w-56 text-slate-300 space-y-2"
            onMouseLeave={() => setShowShortcuts(false)}
          >
            <div className="font-bold text-white border-b border-white/10 pb-1 text-[11px] flex items-center justify-between">
              <span>Navigation Shortcuts</span>
              <span className="text-[9px] text-violet-400">Controls</span>
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Scroll / Trackpad</span>
                <span className="text-white">Smooth Zoom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Click + Drag</span>
                <span className="text-white">Pan Canvas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">+/- keys</span>
                <span className="text-white">Zoom In/Out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">0 key / Double Click</span>
                <span className="text-white">Fit Content</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arrow / WASD</span>
                <span className="text-white">Pan Directions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">M key</span>
                <span className="text-white">Toggle Radar</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Button */}
      {showSnapshotButton && onTakeSnapshot && (
        <>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            onClick={onTakeSnapshot}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 hover:text-white border border-violet-500/40 rounded-lg transition-all text-xs font-mono font-semibold shadow-sm hover:shadow-neon-violet"
            title="Take High-Resolution PNG Snapshot for Docs & Presentations"
            aria-label="Take high resolution snapshot"
          >
            <Camera className="w-3.5 h-3.5 text-violet-300" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
        </>
      )}

    </div>
  );
};
