/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlueprintExportFormat = 'svg' | 'png';
export type BlueprintExportTheme = 'dark' | 'light' | 'corporate' | 'transparent';
export type BlueprintExportScale = 1 | 2 | 3 | 4;

export interface BlueprintExportOptions {
  repoName: string;
  title?: string;
  subtitle?: string;
  format?: BlueprintExportFormat;
  scale?: BlueprintExportScale;
  theme?: BlueprintExportTheme;
  includeHeader?: boolean;
  includeLegend?: boolean;
  includeTechBadges?: boolean;
  techStack?: string[];
  totalFiles?: number;
  totalNodes?: number;
  totalLinks?: number;
  timestamp?: string;
  sourceType?: '2d_blueprint' | 'live_graph' | 'diff_blueprint' | '3d_hologram';
}

export interface BlueprintExportResult {
  format: BlueprintExportFormat;
  blob: Blob;
  dataUrl: string;
  svgString?: string;
  filename: string;
  width: number;
  height: number;
}

const TIER_COLORS = [
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
 * Generates an architectural documentation SVG wrapping an image or vector graph
 */
export async function generateBlueprintSvg(
  imageSrcOrBase64: string | undefined,
  svgElement: SVGSVGElement | null | undefined,
  options: BlueprintExportOptions
): Promise<BlueprintExportResult> {
  const {
    repoName,
    title = `${repoName} — Architecture Blueprint`,
    subtitle = 'Architectural Topology & Technical Component Flow',
    theme = 'dark',
    includeHeader = true,
    includeLegend = true,
    includeTechBadges = true,
    techStack = [],
    totalFiles,
    totalNodes,
    totalLinks,
    timestamp = new Date().toISOString().split('T')[0],
  } = options;

  let baseWidth = 1400;
  let baseHeight = 900;
  let imageWidth = 1320;
  let imageHeight = 720;
  let loadedImg: HTMLImageElement | null = null;

  // Determine dimensions from image or SVG element
  if (imageSrcOrBase64) {
    loadedImg = await loadImage(imageSrcOrBase64);
    const aspect = loadedImg.naturalWidth / (loadedImg.naturalHeight || 1);
    imageWidth = Math.max(1200, Math.min(1800, loadedImg.naturalWidth));
    imageHeight = Math.round(imageWidth / aspect);
  } else if (svgElement) {
    const rect = svgElement.getBoundingClientRect();
    imageWidth = Math.max(rect.width || 1200, 1000);
    imageHeight = Math.max(rect.height || 750, 600);
  }

  const headerHeight = includeHeader ? 90 : 0;
  const legendHeight = includeLegend ? 50 : 0;
  const paddingX = 40;
  const paddingY = 24;

  baseWidth = imageWidth + paddingX * 2;
  baseHeight = imageHeight + headerHeight + legendHeight + paddingY * 2;

  const isLight = theme === 'light';
  const isTransparent = theme === 'transparent';
  const isCorporate = theme === 'corporate';

  // Theme colors
  const bgColor = isTransparent
    ? 'none'
    : isLight
    ? '#f8fafc'
    : isCorporate
    ? '#0f172a'
    : '#020617';

  const cardBg = isLight ? '#ffffff' : '#090d16';
  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const mutedTextColor = isLight ? '#64748b' : '#94a3b8';
  const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const gridStroke = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(148, 163, 184, 0.06)';
  const accentColor = isLight ? '#6366f1' : '#8b5cf6';

  let innerContentSvg = '';

  if (imageSrcOrBase64) {
    // Encapsulate image inside SVG
    innerContentSvg = `
      <g filter="url(#blueprint-shadow)">
        <rect
          x="${paddingX}"
          y="${paddingY + headerHeight}"
          width="${imageWidth}"
          height="${imageHeight}"
          rx="14"
          fill="${cardBg}"
          stroke="${borderColor}"
          stroke-width="1.5"
        />
        <image
          href="${imageSrcOrBase64}"
          x="${paddingX}"
          y="${paddingY + headerHeight}"
          width="${imageWidth}"
          height="${imageHeight}"
          preserveAspectRatio="xMidYMid meet"
          clip-path="url(#rounded-image-clip)"
        />
        <!-- Architectural corner drafting ticks -->
        <g stroke="${accentColor}" stroke-width="2.5" fill="none" opacity="0.8">
          <path d="M ${paddingX} ${paddingY + headerHeight + 24} L ${paddingX} ${paddingY + headerHeight} L ${paddingX + 24} ${paddingY + headerHeight}" />
          <path d="M ${paddingX + imageWidth - 24} ${paddingY + headerHeight} L ${paddingX + imageWidth} ${paddingY + headerHeight} L ${paddingX + imageWidth} ${paddingY + headerHeight + 24}" />
          <path d="M ${paddingX} ${paddingY + headerHeight + imageHeight - 24} L ${paddingX} ${paddingY + headerHeight + imageHeight} L ${paddingX + 24} ${paddingY + headerHeight + imageHeight}" />
          <path d="M ${paddingX + imageWidth - 24} ${paddingY + headerHeight + imageHeight} L ${paddingX + imageWidth} ${paddingY + headerHeight + imageHeight} L ${paddingX + imageWidth} ${paddingY + headerHeight + imageHeight - 24}" />
        </g>
      </g>
    `;
  } else if (svgElement) {
    // Clone and serialize vector content
    const cloned = svgElement.cloneNode(true) as SVGSVGElement;
    const serializer = new XMLSerializer();
    let serialized = serializer.serializeToString(cloned);
    // Strip outer svg tags
    serialized = serialized.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    innerContentSvg = `
      <g transform="translate(${paddingX}, ${paddingY + headerHeight})">
        ${serialized}
      </g>
    `;
  }

  // Header tech badges
  let techBadgesSvg = '';
  if (includeTechBadges && techStack.length > 0) {
    let currentBadgeX = baseWidth - paddingX;
    const badgeMarkupList: string[] = [];
    
    // Reverse so we position right to left
    [...techStack].slice(0, 4).reverse().forEach((tech) => {
      const badgeWidth = Math.max(70, tech.length * 8 + 18);
      currentBadgeX -= (badgeWidth + 8);
      badgeMarkupList.push(`
        <g transform="translate(${currentBadgeX}, ${paddingY + 36})">
          <rect width="${badgeWidth}" height="22" rx="6" fill="${isLight ? '#ede9fe' : 'rgba(139, 92, 246, 0.15)'}" stroke="${isLight ? '#c4b5fd' : 'rgba(139, 92, 246, 0.3)'}" stroke-width="1"/>
          <text x="${badgeWidth / 2}" y="15" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="${isLight ? '#6d28d9' : '#c4b5fd'}">${escapeXml(tech)}</text>
        </g>
      `);
    });
    techBadgesSvg = badgeMarkupList.join('\n');
  }

  // Header Meta strings (files / nodes / date)
  const metaParts: string[] = [];
  if (totalFiles !== undefined) metaParts.push(`${totalFiles} Files`);
  if (totalNodes !== undefined) metaParts.push(`${totalNodes} Nodes`);
  if (totalLinks !== undefined) metaParts.push(`${totalLinks} Dependencies`);
  metaParts.push(timestamp);
  const metaString = metaParts.join(' • ');

  // Construct Full SVG String
  const svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${baseWidth}"
  height="${baseHeight}"
  viewBox="0 0 ${baseWidth} ${baseHeight}"
  style="background: ${bgColor}; font-family: 'JetBrains Mono', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;"
>
  <defs>
    <!-- Architectural grid pattern -->
    <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${gridStroke}" stroke-width="0.75" />
    </pattern>
    <filter id="blueprint-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.6)'}" />
    </filter>
    <clipPath id="rounded-image-clip">
      <rect x="${paddingX}" y="${paddingY + headerHeight}" width="${imageWidth}" height="${imageHeight}" rx="14" />
    </clipPath>
  </defs>

  ${!isTransparent ? `<rect width="100%" height="100%" fill="url(#grid-pattern)" />` : ''}

  <!-- Header Banner -->
  ${
    includeHeader
      ? `
  <g transform="translate(${paddingX}, ${paddingY})">
    <!-- Icon & Title -->
    <circle cx="16" cy="20" r="14" fill="${isLight ? '#ede9fe' : 'rgba(139, 92, 246, 0.2)'}" stroke="${accentColor}" stroke-width="1.5" />
    <path d="M 10 20 L 16 14 L 22 20 M 16 14 L 16 26" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    
    <text x="40" y="19" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="800" fill="${textColor}">
      ${escapeXml(title)}
    </text>
    <text x="40" y="38" font-family="'JetBrains Mono', monospace" font-size="12" fill="${mutedTextColor}">
      ${escapeXml(subtitle)}
    </text>

    <!-- Top Right Meta -->
    <text x="${baseWidth - paddingX * 2}" y="19" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="${mutedTextColor}">
      ${escapeXml(metaString)}
    </text>

    <!-- Tech Badges -->
    ${techBadgesSvg}
  </g>
  `
      : ''
  }

  <!-- Blueprint Content -->
  ${innerContentSvg}

  <!-- Footer Legend -->
  ${
    includeLegend
      ? `
  <g transform="translate(${paddingX}, ${baseHeight - paddingY - 32})">
    <rect width="${imageWidth}" height="32" rx="8" fill="${isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.7)'}" stroke="${borderColor}" stroke-width="1" />
    <text x="14" y="20" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="${mutedTextColor}">
      ARCHITECTURAL TIERS:
    </text>
    <g transform="translate(150, 0)">
      ${TIER_COLORS.map((tier, idx) => {
        const itemX = idx * 140;
        return `
        <g transform="translate(${itemX}, 0)">
          <circle cx="6" cy="16" r="4" fill="${tier.color}" />
          <text x="16" y="20" font-family="'JetBrains Mono', monospace" font-size="10" fill="${textColor}">${tier.label}</text>
        </g>
        `;
      }).join('\n')}
    </g>
    <text x="${imageWidth - 14}" y="20" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9" fill="${mutedTextColor}">
      Link2Ink Visual Intelligence
    </text>
  </g>
  `
      : ''
  }
</svg>`;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  const safeName = repoName.replace(/[^a-zA-Z0-9-_]/g, '_');

  return {
    format: 'svg',
    blob,
    dataUrl,
    svgString,
    filename: `${safeName}-architecture-blueprint.svg`,
    width: baseWidth,
    height: baseHeight,
  };
}

/**
 * Generates a high-resolution PNG image for documentation from an SVG or Blueprint image
 */
export async function generateBlueprintPng(
  imageSrcOrBase64: string | undefined,
  svgElement: SVGSVGElement | null | undefined,
  options: BlueprintExportOptions
): Promise<BlueprintExportResult> {
  const {
    scale = 2,
    repoName,
  } = options;

  // First generate the framed SVG representation
  const svgResult = await generateBlueprintSvg(imageSrcOrBase64, svgElement, options);
  const baseWidth = svgResult.width;
  const baseHeight = svgResult.height;

  const canvasWidth = Math.round(baseWidth * scale);
  const canvasHeight = Math.round(baseHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to obtain 2D canvas context for PNG export');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Render SVG onto Canvas
  const svgBlob = new Blob([svgResult.svgString || ''], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to rasterize blueprint SVG to PNG: ${e}`));
    };
    img.src = url;
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob from canvas'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const safeName = repoName.replace(/[^a-zA-Z0-9-_]/g, '_');
        resolve({
          format: 'png',
          blob,
          dataUrl,
          filename: `${safeName}-architecture-blueprint-${scale}x.png`,
          width: canvasWidth,
          height: canvasHeight,
        });
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Triggers file download for any Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
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
 * Copies a PNG blob directly to the system clipboard
 */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy blob to clipboard:', err);
    return false;
  }
}

/**
 * Generates ready-to-paste markdown documentation embedding snippet
 */
export function generateMarkdownSnippet(repoName: string, filename: string, isSvg = true): string {
  const formatTag = isSvg ? 'Vector SVG' : 'High-Resolution PNG';
  return `<!-- Architecture Blueprint for ${repoName} -->
## 🏛️ Architecture & System Topology

![${repoName} Architecture Blueprint](./docs/${filename})

> *Generated with [Link2Ink](https://github.com) Visual Intelligence Suite (${formatTag})*
`;
}

/**
 * Helper to safely escape XML entities
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper to load an HTML Image
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
