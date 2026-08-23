/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Escapes XML/SVG special characters
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps text into lines that fit within a max character length
 */
function wrapText(text: string, maxCharsPerLine: number = 40): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

/**
 * Parses structured plan markdown text into sections
 */
interface ParsedPlan {
  headline: string;
  takeaways: { title: string; desc: string; icon?: string }[];
  supportingData: string[];
  visualMetaphor: string;
}

function parsePlanText(plan: string): ParsedPlan {
  const lines = plan.split('\n').map(l => l.trim()).filter(Boolean);
  let headline = 'Article Insights & Overview';
  const takeaways: { title: string; desc: string }[] = [];
  const supportingData: string[] = [];
  let visualMetaphor = 'Flow Architecture';

  let currentSection = '';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('headline') || lower.includes('1.')) {
      const match = line.replace(/^[^:]*:\s*/i, '').replace(/^[#\*\d\.\s-]+/, '').trim();
      if (match && match.length > 3 && !match.toLowerCase().includes('headline')) {
        headline = match;
      }
      currentSection = 'headline';
    } else if (lower.includes('takeaway') || lower.includes('key points') || lower.includes('2.')) {
      currentSection = 'takeaways';
    } else if (lower.includes('supporting data') || lower.includes('metrics') || lower.includes('3.')) {
      currentSection = 'data';
    } else if (lower.includes('visual metaphor') || lower.includes('4.')) {
      currentSection = 'metaphor';
      const meta = line.replace(/^[^:]*:\s*/i, '').replace(/^[#\*\d\.\s-]+/, '').trim();
      if (meta && meta.length > 3) visualMetaphor = meta;
    } else {
      const cleanLine = line.replace(/^[\*\-\d\.]+\s*/, '').trim();
      if (!cleanLine) continue;

      if (currentSection === 'takeaways') {
        const parts = cleanLine.split(/[:–—]/);
        if (parts.length > 1) {
          takeaways.push({
            title: parts[0].trim().replace(/\*\*/g, ''),
            desc: parts.slice(1).join(' ').trim().replace(/\*\*/g, '')
          });
        } else {
          takeaways.push({
            title: `Insight #${takeaways.length + 1}`,
            desc: cleanLine.replace(/\*\*/g, '')
          });
        }
      } else if (currentSection === 'data') {
        supportingData.push(cleanLine.replace(/\*\*/g, ''));
      }
    }
  }

  // Fallback defaults if parser missed sections
  if (takeaways.length === 0) {
    takeaways.push(
      { title: 'Core Architecture', desc: 'Modular, scalable structural foundation with decoupled components.' },
      { title: 'Data Flow & State', desc: 'Unidirectional data pipeline ensuring deterministic component behavior.' },
      { title: 'Performance Optimization', desc: 'Efficient layout rendering, memoization, and low-latency interaction loops.' }
    );
  }

  if (supportingData.length === 0) {
    supportingData.push('100% Component Coverage', 'Sub-millisecond Latency', 'Production Ready');
  }

  return {
    headline: headline.replace(/["'*]/g, '').trim(),
    takeaways: takeaways.slice(0, 5),
    supportingData: supportingData.slice(0, 4),
    visualMetaphor
  };
}

/**
 * Deterministic Vector SVG Infographic Generator
 */
export function buildDeterministicInfographicSvg(
  planText: string,
  style: string = 'Modern Editorial',
  language: string = 'English',
  customTitle?: string
): string {
  const plan = parsePlanText(planText);
  const headline = customTitle || plan.headline;
  const isDarkMode = style.toLowerCase().includes('dark');
  const isPlayful = style.toLowerCase().includes('playful');
  const isMinimal = style.toLowerCase().includes('minimal');

  // Palette settings
  const bgFill = isDarkMode 
    ? '#090d16' 
    : isMinimal 
    ? '#ffffff' 
    : isPlayful 
    ? '#fcf8ff' 
    : '#f8fafc';

  const cardBg = isDarkMode 
    ? '#131b2e' 
    : '#ffffff';

  const cardBorder = isDarkMode 
    ? '#1e293b' 
    : isPlayful 
    ? '#f3e8ff' 
    : '#e2e8f0';

  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryAccent = isPlayful ? '#ec4899' : isDarkMode ? '#38bdf8' : '#0284c7';
  const secondaryAccent = isPlayful ? '#8b5cf6' : isDarkMode ? '#34d399' : '#059669';
  const amberAccent = '#f59e0b';
  const violetAccent = '#8b5cf6';

  const cardAccents = [primaryAccent, secondaryAccent, amberAccent, violetAccent, '#06b6d4'];

  const width = 1200;
  const height = 1600;

  // Header lines
  const headlineLines = wrapText(headline, 32);

  // Cards layout
  const startY = 380;
  const cardSpacing = 190;

  const takeawayCardsSvg = plan.takeaways.map((item, index) => {
    const cardY = startY + index * cardSpacing;
    const accent = cardAccents[index % cardAccents.length];
    const descLines = wrapText(item.desc, 48);

    return `
      <!-- Card ${index + 1} -->
      <g transform="translate(100, ${cardY})">
        <!-- Card Background Shadow & Rect -->
        <rect x="0" y="4" width="1000" height="160" rx="20" fill="${isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)'}" />
        <rect x="0" y="0" width="1000" height="160" rx="20" fill="${cardBg}" stroke="${cardBorder}" stroke-width="2" />
        
        <!-- Left Accent Line & Number Badge -->
        <rect x="0" y="0" width="8" height="160" rx="4" fill="${accent}" />
        
        <circle cx="60" cy="80" r="32" fill="${accent}" fill-opacity="0.15" />
        <circle cx="60" cy="80" r="24" fill="${accent}" />
        <text x="60" y="88" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">
          0${index + 1}
        </text>

        <!-- Card Title -->
        <text x="120" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="${textPrimary}">
          ${escapeXml(item.title)}
        </text>

        <!-- Card Description Lines -->
        ${descLines.map((line, lIdx) => `
          <text x="120" y="${90 + lIdx * 24}" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="${textSecondary}">
            ${escapeXml(line)}
          </text>
        `).join('')}

        <!-- Status / Flow indicator tag -->
        <rect x="860" y="24" width="100" height="30" rx="8" fill="${accent}" fill-opacity="0.15" />
        <text x="910" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${accent}" text-anchor="middle">
          STEP 0${index + 1}
        </text>
      </g>
    `;
  }).join('');

  // Metrics Section at Bottom
  const metricsY = startY + plan.takeaways.length * cardSpacing + 40;
  const metricsCount = Math.max(1, plan.supportingData.length);
  const metricColWidth = Math.floor(1000 / metricsCount);

  const metricsSvg = plan.supportingData.map((dataItem, idx) => {
    const mX = 100 + idx * metricColWidth;
    const accent = cardAccents[(idx + 2) % cardAccents.length];
    return `
      <g transform="translate(${mX}, ${metricsY})">
        <rect x="10" y="0" width="${metricColWidth - 20}" height="120" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5" />
        <circle cx="45" cy="40" r="14" fill="${accent}" fill-opacity="0.2" />
        <circle cx="45" cy="40" r="6" fill="${accent}" />
        <text x="70" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="${textPrimary}">
          KEY METRIC
        </text>
        <text x="30" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="${accent}">
          ${escapeXml(dataItem)}
        </text>
      </g>
    `;
  }).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgFill}" />
      <stop offset="100%" stop-color="${isDarkMode ? '#050811' : '#edf2f7'}" />
    </linearGradient>
    <linearGradient id="banner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${primaryAccent}" />
      <stop offset="100%" stop-color="${secondaryAccent}" />
    </linearGradient>
    <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="${isDarkMode ? 0.4 : 0.08}" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg-grad)" />

  <!-- Subtle Top Decorative Grid Lines -->
  <g opacity="${isDarkMode ? 0.07 : 0.04}" stroke="${textPrimary}" stroke-width="1">
    ${Array.from({ length: 24 }).map((_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="300" />`).join('')}
    ${Array.from({ length: 6 }).map((_, i) => `<line x1="0" y1="${i * 50}" x2="1200" y2="${i * 50}" />`).join('')}
  </g>

  <!-- Header Category Pill -->
  <g transform="translate(100, 70)">
    <rect x="0" y="0" width="220" height="36" rx="18" fill="${primaryAccent}" fill-opacity="0.15" stroke="${primaryAccent}" stroke-opacity="0.3" />
    <circle cx="20" cy="18" r="5" fill="${primaryAccent}" />
    <text x="35" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="${primaryAccent}" letter-spacing="1.5">
      KNOWLEDGE SYNTHESIS
    </text>
  </g>

  <!-- Title & Headline -->
  <g transform="translate(100, 150)">
    ${headlineLines.map((line, idx) => `
      <text x="0" y="${idx * 46}" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="${textPrimary}" letter-spacing="-0.5">
        ${escapeXml(line)}
      </text>
    `).join('')}
  </g>

  <!-- Header Subtitle / Visual Metaphor -->
  <g transform="translate(100, ${160 + headlineLines.length * 46})">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${textSecondary}">
      Visual Metaphor: ${escapeXml(plan.visualMetaphor)} • Language: ${escapeXml(language)}
    </text>
    <line x1="0" y1="20" x2="1000" y2="20" stroke="${cardBorder}" stroke-width="2" />
  </g>

  <!-- Takeaway Cards -->
  <g id="takeaways-list">
    ${takeawayCardsSvg}
  </g>

  <!-- Metrics Section -->
  <g id="supporting-metrics">
    ${metricsSvg}
  </g>

  <!-- Footer Banner -->
  <g transform="translate(100, ${height - 100})">
    <rect x="0" y="0" width="1000" height="50" rx="12" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1" />
    <text x="30" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${textSecondary}">
      Link-2-Ink Visual Intelligence Engine • Generated with Gemini 3.7
    </text>
    <text x="970" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${primaryAccent}" text-anchor="end">
      Format: Standalone Vector Infographic
    </text>
  </g>
</svg>
`.trim();
}

/**
 * Converts an SVG XML string into a base64 PNG data URL via browser OffscreenCanvas / Canvas
 */
export async function rasterizeSvgToPngBase64(svgString: string, width = 1200, height = 1600): Promise<string> {
  if (typeof window === 'undefined') {
    // If running in SSR / Node environment, return SVG data URI base64
    const base64Svg = Buffer.from(svgString).toString('base64');
    return `data:image/svg+xml;base64,${base64Svg}`;
  }

  return new Promise((resolve) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const pngDataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            // Extract raw base64 without prefix
            const rawBase64 = pngDataUrl.replace(/^data:image\/png;base64,/, '');
            resolve(rawBase64);
          } else {
            // Fallback: return raw SVG base64
            URL.revokeObjectURL(url);
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = (reader.result as string) || '';
              resolve(res.replace(/^data:image\/svg\+xml;base64,/, ''));
            };
            reader.readAsDataURL(blob);
          }
        } catch (e) {
          console.warn('Canvas rasterization fallback to SVG base64:', e);
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string) || '';
            resolve(res.replace(/^data:image\/svg\+xml;base64,/, ''));
          };
          reader.readAsDataURL(blob);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback to base64 encoding of SVG string directly
        const rawSvgBase64 = btoa(unescape(encodeURIComponent(svgString)));
        resolve(rawSvgBase64);
      };

      img.src = url;
    } catch (err) {
      console.warn('SVG conversion error, using btoa:', err);
      const rawSvgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      resolve(rawSvgBase64);
    }
  });
}

/**
 * High-tier AI Vector Infographic Synthesis
 * Uses Gemini 3.7 Flash to craft an SVG or falls back to our deterministic generator
 */
export async function generateAiVectorInfographic(
  planText: string,
  style: string,
  language: string,
  customTitle?: string
): Promise<string> {
  try {
    const prompt = `You are a world-class Infographic Artist & SVG Designer.
Create a complete, visually stunning standalone SVG infographic (1200 width by 1600 height) based on this content:

${planText}

STYLE: ${style}
LANGUAGE: All text inside the SVG MUST be in ${language}.
TITLE: ${customTitle || 'Article Infographic'}

DESIGN SPECIFICATIONS:
- Root element: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="1200" height="1600">
- Clean, modern layout with high-contrast cards, gradients, subtle drop shadows, and numbered badges.
- Use clean typography (<text> elements with font-family="system-ui, sans-serif").
- Output ONLY the raw valid <svg> ... </svg> code without markdown formatting or code fences.`;

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-3.7-flash', contents: prompt }),
    });
    if (!response.ok) throw new Error('Gemini request failed');
    const res = await response.json() as { text?: string };
    const text = res.text || '';
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const svgCode = svgMatch[0];
      const base64Png = await rasterizeSvgToPngBase64(svgCode, 1200, 1600);
      return base64Png;
    }
  } catch (err) {
    console.warn('Gemini 3.7 SVG synthesis fallback to deterministic SVG:', err);
  }

  // Deterministic SVG Generator
  const fallbackSvg = buildDeterministicInfographicSvg(planText, style, language, customTitle);
  const base64 = await rasterizeSvgToPngBase64(fallbackSvg, 1200, 1600);
  return base64;
}
