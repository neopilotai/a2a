import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AI_MODEL_DEFAULTS } from './aiConfig';
import { generateAiVectorInfographic } from './svgInfographicService';

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  set src(value: string) {
    this._src = value;
    // Simulate the async image decode completing successfully on the next microtask.
    queueMicrotask(() => this.onload && this.onload());
  }
  get src() {
    return this._src;
  }
}

let capturedBlobParts: any[] | null = null;

class FakeBlob {
  parts: any[];
  type: string;
  constructor(parts: any[], options?: { type?: string }) {
    this.parts = parts;
    this.type = options?.type || '';
    capturedBlobParts = parts;
  }
}

function getLastFetchRequestBody() {
  const call = (global.fetch as any).mock.calls.at(-1);
  return JSON.parse(call[1].body);
}

describe('svgInfographicService.generateAiVectorInfographic', () => {
  beforeEach(() => {
    capturedBlobParts = null;
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('Image', FakeImage as any);
    vi.stubGlobal('Blob', FakeBlob as any);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:fake-url'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,MOCKPNGDATA');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the plan text to the /api/gemini infographic path with the correct model', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '<svg xmlns="http://www.w3.org/2000/svg"><text>AI Generated</text></svg>' }),
    });

    await generateAiVectorInfographic('Plan: build a widget', 'Modern Editorial', 'English', 'My Title');

    expect(global.fetch).toHaveBeenCalledWith('/api/gemini', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));

    const body = getLastFetchRequestBody();
    expect(body.path).toBe('infographic');
    expect(body.model).toBe(AI_MODEL_DEFAULTS.infographic);
    expect(body.contents).toContain('Plan: build a widget');
    expect(body.contents).toContain('My Title');
  });

  it('rasterizes the AI-generated SVG returned by the proxy', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Some preamble text <svg xmlns="http://www.w3.org/2000/svg"><text>AI Generated</text></svg> trailing text' }),
    });

    const result = await generateAiVectorInfographic('Plan text', 'Dark Mode Tech', 'English');

    expect(result).toBe('MOCKPNGDATA');
    expect(capturedBlobParts).not.toBeNull();
    expect(capturedBlobParts![0]).toContain('<svg');
    expect(capturedBlobParts![0]).toContain('AI Generated');
  });

  it('falls back to the deterministic SVG generator when the response has no <svg> tag', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'no svg markup here' }),
    });

    const result = await generateAiVectorInfographic('Headline: Article Insights', 'Clean Minimalist', 'English', 'Fallback Title');

    expect(result).toBe('MOCKPNGDATA');
    expect(capturedBlobParts).not.toBeNull();
    // The deterministic generator embeds its own branding + the provided custom title.
    expect(capturedBlobParts![0]).toContain('KNOWLEDGE SYNTHESIS');
    expect(capturedBlobParts![0]).toContain('Fallback Title');
  });

  it('falls back to the deterministic SVG generator when the proxy responds with an error status', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'unavailable' }) });

    const result = await generateAiVectorInfographic('Plan text', 'Fun & Playful', 'English', 'Error Fallback Title');

    expect(result).toBe('MOCKPNGDATA');
    expect(capturedBlobParts![0]).toContain('Error Fallback Title');
  });

  it('falls back to the deterministic SVG generator when fetch throws a network error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('network unreachable'));

    const result = await generateAiVectorInfographic('Plan text', 'Modern Editorial', 'English', 'Network Fallback Title');

    expect(result).toBe('MOCKPNGDATA');
    expect(capturedBlobParts![0]).toContain('Network Fallback Title');
  });
});