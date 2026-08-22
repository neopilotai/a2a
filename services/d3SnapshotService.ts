/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SnapshotTheme = 'dark' | 'corporate' | 'light' | 'transparent';
export type SnapshotScope = 'viewport' | 'full';
export type SnapshotScale = 1 | 2 | 3 | 4;

export interface SnapshotOptions {
  scale?: SnapshotScale;
  theme?: SnapshotTheme;
  scope?: SnapshotScope;
  includeHeader?: boolean;
  includeLegend?: boolean;
  title?: string;
  subtitle?: string;
  repoName?: string;
  nodeCount?: number;
  linkCount?: number;
  customWidth?: number;
  customHeight?: number;
}

export interface SnapshotResult {
  dataUrl: string;
  blob: Blob;
  svgString: string;
  width: number;
  height: number;
}

const TIER_LEGEND = [
  { label: 'Core / Root', color: '#8b5cf6' },
  { label: 'UI / View', color: '#38bdf8' },
  { label: 'API / Routes', color: '#34d399' },
  { label: 'Services', color: '#fbbf24' },
  { label: 'Data / Models', color: '#f472b6' },
  { label: 'Utils / Libs', color: '#a78bfa' },
  { label: 'Config / Build', color: '#2dd4bf' },
  { label: 'Auth / Security', color: '#f87171' },
];

/**
 * High-Resolution SVG to PNG Snapshot Renderer for D3 Architectural Diagrams
 */
export async function captureD3SvgSnapshot(
  svgElement: SVGSVGElement,
  options: SnapshotOptions = {}
): Promise<SnapshotResult> {
  const {
    scale = 2,
    theme = 'dark',
    scope = 'full',
    includeHeader = true,
    includeLegend = true,
    title = 'Architectural Topology Diagram',
    subtitle = 'D3 Force-Directed Module Dependency Graph',
    repoName = '',
    nodeCount,
    linkCount,
  } = options;

  // Clone SVG to avoid modifying the active DOM tree
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Ensure namespaces
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Get base dimensions from the original SVG element
  const rect = svgElement.getBoundingClientRect();
  let baseWidth = Math.max(rect.width || 800, 600);
  let baseHeight = Math.max(rect.height || 500, 400);

  // If scope is 'full', find zoom container bounding box and center the diagram
  if (scope === 'full') {
    const zoomGroup = clonedSvg.querySelector('.zoom-container') as SVGGElement | null;
    const origZoomGroup = svgElement.querySelector('.zoom-container') as SVGGElement | null;

    if (origZoomGroup) {
      try {
        const bbox = origZoomGroup.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          const padding = 60;
          const graphWidth = bbox.width + padding * 2;
          const graphHeight = bbox.height + padding * 2;
          
          baseWidth = Math.max(graphWidth, 900);
          baseHeight = Math.max(graphHeight, 600);

          if (zoomGroup) {
            // Center the graph in the calculated canvas area
            const tx = (baseWidth - bbox.width) / 2 - bbox.x;
            const ty = (baseHeight - bbox.height) / 2 - bbox.y;
            zoomGroup.setAttribute('transform', `translate(${tx}, ${ty}) scale(1)`);
          }
        }
      } catch (e) {
        console.warn('Could not compute getBBox for full scope snapshot, falling back to viewport:', e);
      }
    }
  }

  clonedSvg.setAttribute('width', `${baseWidth}`);
  clonedSvg.setAttribute('height', `${baseHeight}`);
  clonedSvg.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);

  // Inject required font styles and SVG definitions
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    text {
      font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  `;
  clonedSvg.insertBefore(styleEl, clonedSvg.firstChild);

  // Serialize SVG to XML String
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Clean XML fixes for SVG data URL
  svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;

  // Calculate high-resolution canvas dimensions
  const headerHeight = includeHeader ? 75 : 0;
  const legendHeight = includeLegend ? 40 : 0;
  const totalBaseHeight = baseHeight + headerHeight + legendHeight;

  const canvasWidth = Math.round(baseWidth * scale);
  const canvasHeight = Math.round(totalBaseHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for snapshot rendering.');
  }

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Scale context to target scale
  ctx.save();
  ctx.scale(scale, scale);

  // 1. Draw Background based on theme
  drawBackground(ctx, baseWidth, totalBaseHeight, theme);

  // 2. Draw Header Banner if enabled
  if (includeHeader) {
    drawHeaderBanner(ctx, {
      width: baseWidth,
      height: headerHeight,
      theme,
      title: repoName ? `${repoName} — ${title}` : title,
      subtitle,
      nodeCount,
      linkCount,
    });
  }

  // 3. Render the SVG diagram onto the canvas
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw SVG starting below header
      ctx.drawImage(img, 0, headerHeight, baseWidth, baseHeight);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG into canvas for snapshot: ${err}`));
    };
    img.src = url;
  });

  // 4. Draw Legend Bar at bottom if enabled
  if (includeLegend) {
    drawLegendBar(ctx, {
      width: baseWidth,
      y: headerHeight + baseHeight,
      height: legendHeight,
      theme,
    });
  }

  ctx.restore();

  // 5. Convert to Blob & Data URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob from canvas.'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        resolve({
          dataUrl,
          blob,
          svgString,
          width: canvasWidth,
          height: canvasHeight,
        });
      },
      'image/png',
      1.0
    );
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: SnapshotTheme
) {
  if (theme === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    return;
  }

  if (theme === 'dark') {
    // Dark radial gradient
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      50,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(1, '#020617'); // slate-950

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (theme === 'corporate') {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, width - 16, height - 16);
  } else if (theme === 'light') {
    // Light paper theme for print / documentation
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
}

interface HeaderOptions {
  width: number;
  height: number;
  theme: SnapshotTheme;
  title: string;
  subtitle: string;
  nodeCount?: number;
  linkCount?: number;
}

function drawHeaderBanner(ctx: CanvasRenderingContext2D, opts: HeaderOptions) {
  const { width, height, theme, title, subtitle, nodeCount, linkCount } = opts;
  const isLight = theme === 'light';

  // Banner background container
  ctx.fillStyle = isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(0, 0, width, height);

  // Border bottom
  ctx.strokeStyle = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.stroke();

  // Accent glowing line
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, height);
  ctx.lineTo(140, height);
  ctx.stroke();

  // Title
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 24, 16);

  // Subtitle
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
  ctx.fillText(subtitle, 24, 38);

  // Right side badges / timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  let metaStr = `Generated: ${dateStr}`;
  if (nodeCount !== undefined && linkCount !== undefined) {
    metaStr = `${nodeCount} Modules • ${linkCount} Dependencies • ${metaStr}`;
  }

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = isLight ? '#475569' : '#a78bfa';
  ctx.textAlign = 'right';
  ctx.fillText(metaStr, width - 24, 20);

  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = isLight ? '#94a3b8' : '#64748b';
  ctx.fillText('Link2Ink Visual Intelligence Suite', width - 24, 38);
}

interface LegendOptions {
  width: number;
  y: number;
  height: number;
  theme: SnapshotTheme;
}

function drawLegendBar(ctx: CanvasRenderingContext2D, opts: LegendOptions) {
  const { width, y, height, theme } = opts;
  const isLight = theme === 'light';

  // Legend bar background
  ctx.fillStyle = isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(0, y, width, height);

  ctx.strokeStyle = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  // Render items horizontally
  const startX = 24;
  const itemWidth = (width - 48) / TIER_LEGEND.length;

  TIER_LEGEND.forEach((item, idx) => {
    const itemX = startX + idx * itemWidth;
    const centerY = y + height / 2;

    // Color bullet
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(itemX + 5, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text label
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, itemX + 13, centerY);
  });
}

/**
 * Trigger file download for generated snapshot blob
 */
export function downloadSnapshotBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copy snapshot PNG directly to system clipboard
 */
export async function copySnapshotToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy snapshot to clipboard:', err);
    return false;
  }
}
