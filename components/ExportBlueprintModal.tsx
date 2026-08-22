/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  Layers,
  FileCode,
  FileImage,
  Sun,
  Moon,
  Laptop,
  Eye,
  RefreshCw,
  Sparkles,
  Share2,
  Code,
  CheckCircle2,
  FileText,
  Sliders,
  ExternalLink,
  Cpu
} from 'lucide-react';
import {
  BlueprintExportFormat,
  BlueprintExportTheme,
  BlueprintExportScale,
  BlueprintExportOptions,
  BlueprintExportResult,
  generateBlueprintSvg,
  generateBlueprintPng,
  downloadBlob,
  copyBlobToClipboard,
  generateMarkdownSnippet
} from '../services/blueprintExportService';

interface ExportBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  imageSrc?: string;
  svgElement?: SVGSVGElement | null;
  blueprintType?: '2d_blueprint' | 'live_graph' | 'diff_blueprint' | '3d_hologram';
  techStack?: string[];
  totalFiles?: number;
  totalNodes?: number;
  totalLinks?: number;
}

export const ExportBlueprintModal: React.FC<ExportBlueprintModalProps> = ({
  isOpen,
  onClose,
  repoName = 'Repository',
  imageSrc,
  svgElement,
  blueprintType = '2d_blueprint',
  techStack = [],
  totalFiles,
  totalNodes,
  totalLinks,
}) => {
  const [format, setFormat] = useState<BlueprintExportFormat>('svg');
  const [scale, setScale] = useState<BlueprintExportScale>(2);
  const [theme, setTheme] = useState<BlueprintExportTheme>('dark');
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [includeLegend, setIncludeLegend] = useState<boolean>(true);
  const [includeTechBadges, setIncludeTechBadges] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>(
    repoName ? `${repoName} — Architecture Blueprint` : 'System Architecture Blueprint'
  );
  const [customSubtitle, setCustomSubtitle] = useState<string>(
    blueprintType === 'live_graph'
      ? 'Interactive D3 Module Dependency Topology'
      : blueprintType === 'diff_blueprint'
      ? 'Architectural Evolution & Structural Diff'
      : 'Architectural Blueprint & Component Data Flow'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<BlueprintExportResult | null>(null);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync title when repoName or blueprintType changes
  useEffect(() => {
    if (repoName) {
      setCustomTitle(`${repoName} — Architecture Blueprint`);
      setCustomSubtitle(
        blueprintType === 'live_graph'
          ? 'Interactive D3 Module Dependency Topology'
          : blueprintType === 'diff_blueprint'
          ? 'Architectural Evolution & Structural Diff'
          : 'Architectural Blueprint & Component Data Flow'
      );
    }
  }, [repoName, blueprintType]);

  // Generate / Render Export
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const generate = async () => {
      setIsGenerating(true);
      setErrorMessage(null);

      try {
        const options: BlueprintExportOptions = {
          repoName,
          title: customTitle,
          subtitle: customSubtitle,
          format,
          scale,
          theme,
          includeHeader,
          includeLegend,
          includeTechBadges,
          techStack,
          totalFiles,
          totalNodes,
          totalLinks,
          sourceType: blueprintType,
        };

        let result: BlueprintExportResult;
        if (format === 'svg') {
          result = await generateBlueprintSvg(imageSrc, svgElement, options);
        } else {
          result = await generateBlueprintPng(imageSrc, svgElement, options);
        }

        if (isMounted) {
          setExportResult(result);
        }
      } catch (err: any) {
        console.error('Failed to generate blueprint export:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to export architecture blueprint.');
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    const timer = setTimeout(generate, 60);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    imageSrc,
    svgElement,
    format,
    scale,
    theme,
    includeHeader,
    includeLegend,
    includeTechBadges,
    customTitle,
    customSubtitle,
    repoName,
    techStack,
    totalFiles,
    totalNodes,
    totalLinks,
    blueprintType,
  ]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!exportResult) return;
    downloadBlob(exportResult.blob, exportResult.filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleCopyPngImage = async () => {
    try {
      let pngBlob: Blob;
      if (exportResult?.format === 'png') {
        pngBlob = exportResult.blob;
      } else {
        // Convert to PNG on demand for clipboard
        const pngRes = await generateBlueprintPng(imageSrc, svgElement, {
          repoName,
          title: customTitle,
          subtitle: customSubtitle,
          scale: 2,
          theme,
          includeHeader,
          includeLegend,
          includeTechBadges,
          techStack,
          totalFiles,
          totalNodes,
          totalLinks,
          sourceType: blueprintType,
        });
        pngBlob = pngRes.blob;
      }

      const ok = await copyBlobToClipboard(pngBlob);
      if (ok) {
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        setErrorMessage('Could not copy image directly to clipboard. You can download the file instead.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to copy image: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleCopyMarkdown = () => {
    const filename = exportResult?.filename || `${repoName}-blueprint.svg`;
    const snippet = generateMarkdownSnippet(repoName, filename, format === 'svg');
    navigator.clipboard.writeText(snippet);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  const handleCopyHtml = () => {
    const filename = exportResult?.filename || `${repoName}-blueprint.svg`;
    const htmlSnippet = `<img src="./docs/${filename}" alt="${repoName} Architecture Blueprint" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />`;
    navigator.clipboard.writeText(htmlSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Export Architecture Blueprint
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Ready for GitHub & Docs
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Export presentation-grade vector SVG or high-resolution PNG blueprints for READMEs, wikis, and slides.
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
                <span>Live Blueprint Preview</span>
              </div>
              {exportResult && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                  {exportResult.width} × {exportResult.height} px • {format.toUpperCase()}
                </span>
              )}
            </div>

            {/* Preview Viewport */}
            <div className="flex-1 min-h-[300px] sm:min-h-[380px] rounded-2xl border border-white/10 overflow-hidden relative flex items-center justify-center bg-slate-900/30 shadow-inner p-2">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-xs font-mono text-violet-300 tracking-wider">
                    RENDERING {format.toUpperCase()} BLUEPRINT FOR DOCUMENTATION...
                  </p>
                </div>
              ) : exportResult ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  {format === 'svg' && exportResult.svgString ? (
                    <div
                      className="max-h-full max-w-full rounded-lg shadow-2xl overflow-hidden flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: exportResult.svgString }}
                    />
                  ) : (
                    <img
                      src={exportResult.dataUrl}
                      alt="Blueprint Export Preview"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
                    />
                  )}
                </div>
              ) : errorMessage ? (
                <div className="p-6 text-center text-rose-400 text-xs font-mono">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            {/* Hint & Snippet Copy Bar below preview */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-violet-400" />
                Documentation Embed:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy Markdown embed snippet"
                >
                  {copiedMarkdown ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMarkdown ? 'Copied MD!' : 'Copy Markdown'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyHtml}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy HTML image tag"
                >
                  {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3" />}
                  <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Presets */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-5 bg-slate-950/80 overflow-y-auto">
            
            <div className="space-y-4">
              
              {/* 1. Format Selection: SVG vs PNG */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('svg')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      format === 'svg'
                        ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-violet-300">
                      <FileCode className="w-4 h-4 text-violet-400" />
                      Vector SVG (.svg)
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Infinite resolution, crisp vector text & icons, web docs & Figma.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      format === 'png'
                        ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-sky-300">
                      <FileImage className="w-4 h-4 text-sky-400" />
                      Raster PNG (.png)
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      High-DPI raster image for Google Docs, Word, Slack & Slides.
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. PNG DPI Scale (shown when PNG is selected) */}
              {format === 'png' && (
                <div>
                  <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                    Raster Resolution & DPI Scale
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 1, label: '1x Web', desc: 'Standard 72 DPI' },
                      { val: 2, label: '2x HD', desc: 'Retina / Docs' },
                      { val: 4, label: '4x Ultra', desc: '300 DPI Print' },
                    ].map((res) => (
                      <button
                        key={res.val}
                        type="button"
                        onClick={() => setScale(res.val as BlueprintExportScale)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          scale === res.val
                            ? 'bg-sky-600/20 border-sky-500 text-white shadow-sm'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-mono font-bold">{res.label}</div>
                        <div className="text-[9px] font-mono text-slate-500">{res.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Documentation Theme */}
              <div>
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block mb-2">
                  Documentation Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark', label: 'Dark Cyberpunk', icon: Moon },
                    { id: 'light', label: 'White (Docs / Print)', icon: Sun },
                    { id: 'corporate', label: 'Corporate Slate', icon: Laptop },
                    { id: 'transparent', label: 'Transparent Alpha', icon: Layers },
                  ].map((t) => {
                    const IconComponent = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as BlueprintExportTheme)}
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

              {/* 4. Formatting Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-white block">
                      Documentation Header Banner
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Repository name, file metrics & timestamp
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
                      Detected Tech Stack Badges
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Display framework chips in header
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeTechBadges}
                    onChange={(e) => setIncludeTechBadges(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-white/20"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-white block">
                      Color Legend & Classification Footer
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Architectural tier labels (Core, UI, API, Data, etc.)
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

              {/* 5. Custom Title & Subtitle */}
              {includeHeader && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Blueprint Document Title:
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. repo — Architecture Blueprint"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      Subtitle / Documentation Note:
                    </label>
                    <input
                      type="text"
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      placeholder="e.g. Component Flow & System Topology"
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                
                {/* Download Primary File Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!exportResult || isGenerating}
                  className="w-full py-2.5 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-lg hover:shadow-neon-violet flex items-center justify-center gap-2 disabled:opacity-50"
                  id="export-blueprint-download-btn"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Downloaded {format.toUpperCase()}!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download {format.toUpperCase()}</span>
                    </>
                  )}
                </button>

                {/* Copy Image to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyPngImage}
                  disabled={isGenerating}
                  className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  id="export-blueprint-copy-btn"
                  title="Copy PNG image directly to paste into Google Docs, Slack, Notion, or Slides"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-violet-400" />
                      <span>Copy PNG Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
