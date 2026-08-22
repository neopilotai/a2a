/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Download, 
  Copy, 
  Check, 
  X, 
  Layers, 
  Sparkles, 
  Sliders, 
  FileCode, 
  RefreshCw, 
  Maximize2, 
  CheckCircle2, 
  Eye,
  FileImage,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { 
  captureD3SvgSnapshot, 
  downloadSnapshotBlob, 
  copySnapshotToClipboard, 
  SnapshotOptions, 
  SnapshotResult, 
  SnapshotScale, 
  SnapshotTheme, 
  SnapshotScope 
} from '../services/d3SnapshotService';

interface D3SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgElement: SVGSVGElement | null;
  repoName?: string;
  nodeCount?: number;
  linkCount?: number;
}

export const D3SnapshotModal: React.FC<D3SnapshotModalProps> = ({
  isOpen,
  onClose,
  svgElement,
  repoName = 'Repository',
  nodeCount,
  linkCount,
}) => {
  const [scale, setScale] = useState<SnapshotScale>(2);
  const [theme, setTheme] = useState<SnapshotTheme>('dark');
  const [scope, setScope] = useState<SnapshotScope>('full');
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [includeLegend, setIncludeLegend] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>(
    repoName ? `${repoName} — Architecture Topology` : 'Architecture Topology Diagram'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [snapshotResult, setSnapshotResult] = useState<SnapshotResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update default title when repoName changes
  useEffect(() => {
    if (repoName) {
      setCustomTitle(`${repoName} — Architecture Topology`);
    }
  }, [repoName]);

  // Generate snapshot whenever options change or modal opens
  useEffect(() => {
    if (!isOpen || !svgElement) return;

    let isMounted = true;
    const generate = async () => {
      setIsGenerating(true);
      setErrorMessage(null);
      try {
        const result = await captureD3SvgSnapshot(svgElement, {
          scale,
          theme,
          scope,
          includeHeader,
          includeLegend,
          title: customTitle,
          subtitle: 'D3 Architectural Data Flow & Component Dependencies',
          repoName,
          nodeCount,
          linkCount,
        });
        if (isMounted) {
          setSnapshotResult(result);
        }
      } catch (err: any) {
        console.error('Snapshot Generation Error:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to capture snapshot of D3 diagram.');
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    const timer = setTimeout(generate, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, svgElement, scale, theme, scope, includeHeader, includeLegend, customTitle, repoName, nodeCount, linkCount]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    if (!snapshotResult) return;
    const safeRepo = repoName ? repoName.replace(/[^a-zA-Z0-9-_]/g, '_') : 'architecture';
    const filename = `${safeRepo}-d3-architecture-${scale}x.png`;
    downloadSnapshotBlob(snapshotResult.blob, filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleCopyToClipboard = async () => {
    if (!snapshotResult) return;
    const ok = await copySnapshotToClipboard(snapshotResult.blob);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setErrorMessage('Could not copy image directly to clipboard. You can download the PNG instead.');
    }
  };

  const handleDownloadSvg = () => {
    if (!snapshotResult) return;
    const safeRepo = repoName ? repoName.replace(/[^a-zA-Z0-9-_]/g, '_') : 'architecture';
    const blob = new Blob([snapshotResult.svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadSnapshotBlob(blob, `${safeRepo}-architecture-diagram.svg`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                High-Resolution PNG Snapshot
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Ready for Slides & Docs
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Export presentation-grade rasterized diagrams with custom DPI scaling and clean formatting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view into Preview and Settings */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Left Column: Live High-Resolution Preview */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col gap-3 bg-black/40 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-violet-400" />
                <span>Live Canvas Preview</span>
              </div>
              {snapshotResult && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                  {snapshotResult.width} × {snapshotResult.height} px ({scale}x DPI)
                </span>
              )}
            </div>

            {/* Preview Viewport */}
            <div className="flex-1 min-h-[300px] sm:min-h-[380px] rounded-2xl border border-white/10 overflow-hidden relative flex items-center justify-center bg-slate-900/30 shadow-inner">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-xs font-mono text-violet-300 tracking-wider">
                    RASTERIZING HIGH-RES SNAPSHOT ({scale}x)...
                  </p>
                </div>
              ) : snapshotResult ? (
                <img
                  src={snapshotResult.dataUrl}
                  alt="D3 Snapshot Preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl p-2 select-none"
                />
              ) : errorMessage ? (
                <div className="p-6 text-center text-rose-400 text-xs font-mono">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            {/* Hint below preview */}
            <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
              <span>Crisp vector typography & neon node glows preserved</span>
              <span className="text-violet-400/80">300 DPI Slide Grade</span>
            </div>
          </div>

          {/* Right Column: Controls & Presets */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-5 bg-slate-950/80 overflow-y-auto">
            
            <div className="space-y-4">
              {/* Resolution / DPI Scale */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                  Resolution & DPI Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: '1x Web', desc: 'Standard' },
                    { val: 2, label: '2x HD', desc: 'Presentations' },
                    { val: 4, label: '4x Ultra 4K', desc: 'Print / Pitch' },
                  ].map((res) => (
                    <button
                      key={res.val}
                      type="button"
                      onClick={() => setScale(res.val as SnapshotScale)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        scale === res.val
                          ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{res.label}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{res.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Theme */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                  Color Theme & Canvas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark', label: 'Dark Cyberpunk', icon: Moon },
                    { id: 'corporate', label: 'Corporate Slate', icon: Laptop },
                    { id: 'light', label: 'White (Docs / Print)', icon: Sun },
                    { id: 'transparent', label: 'Transparent Alpha', icon: Layers },
                  ].map((t) => {
                    const IconComponent = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as SnapshotTheme)}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          theme === t.id
                            ? 'bg-violet-600/20 border-violet-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="text-xs font-mono">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope framing */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                  Framing Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('full')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      scope === 'full'
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">Auto-Fit Full Graph</div>
                    <div className="text-[10px] font-mono text-slate-500">Center all nodes with padding</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('viewport')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      scope === 'viewport'
                        ? 'bg-violet-600/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">Current Camera View</div>
                    <div className="text-[10px] font-mono text-slate-500">Exact current zoom & pan</div>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-white block">
                      Architectural Header Banner
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Include title, node/link counts, and generation timestamp
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-white/20"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-white block">
                      Color Legend Footer
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Include module tier classification color bullets
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeLegend}
                    onChange={(e) => setIncludeLegend(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-white/20"
                  />
                </label>
              </div>

              {/* Custom Title Input if Header Enabled */}
              {includeHeader && (
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Diagram Title Header:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter diagram title..."
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                
                {/* Download PNG Button */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!snapshotResult || isGenerating}
                  className="w-full py-2.5 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-lg hover:shadow-neon-violet flex items-center justify-center gap-2 disabled:opacity-50"
                  id="d3-snapshot-download-png-btn"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Downloaded PNG!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download {scale}x PNG</span>
                    </>
                  )}
                </button>

                {/* Copy to Clipboard Button */}
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={!snapshotResult || isGenerating}
                  className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  id="d3-snapshot-copy-btn"
                  title="Copy PNG directly to paste into Slides, Docs, or Figma"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-violet-400" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>

              {/* Vector SVG fallback button */}
              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!snapshotResult || isGenerating}
                className="w-full py-1.5 text-center text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Save Vector SVG for Illustrator / Figma</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
