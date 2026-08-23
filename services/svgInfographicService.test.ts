import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_MODEL_DEFAULTS } from './aiConfig';
import { generateAiVectorInfographic } from './svgInfographicService';

const mockFetch = vi.fn();

describe('svgInfographicService.generateAiVectorInfographic (Next.js proxy integration)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Note: this suite runs in a Node (non-DOM) environment, so
  // rasterizeSvgToPngBase64 takes its `typeof window === 'undefined'`
  // branch and returns a deterministic base64 data URI instead of using
  // Canvas/Image APIs.

  it('posts to /api/gemini with the infographic path and default model', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: '<svg xmlns="http://www.w3.org/2000/svg"><rect /></svg>' }),
    });

    await generateAiVectorInfographic('Some plan text', 'Clean Minimalist', 'English', 'My Title');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/gemini');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });

    const body = JSON.parse(init.body);
    expect(body.path).toBe('infographic');
    expect(body.model).toBe(AI_MODEL_DEFAULTS.infographic);
    expect(typeof body.contents).toBe('string');
    expect(body.contents).toContain('Some plan text');
    expect(body.contents).toContain('Clean Minimalist');
    expect(body.contents).toContain('My Title');
  });

  it('rasterizes the SVG returned by the model into a base64 data URI', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5" /></svg>';
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ text: `some preamble\n${svg}\ntrailer` }) });

    const result = await generateAiVectorInfographic('plan', 'Fun & Playful', 'English');

    expect(result).toBe(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  });

  it('falls back to the deterministic generator when the response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'model unavailable' }) });

    const result = await generateAiVectorInfographic('plan text', 'Dark Mode Tech', 'English');

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    const decoded = Buffer.from(result.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
    expect(decoded).toContain('<svg');
  });

  it('falls back to the deterministic generator when fetch rejects outright', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    const result = await generateAiVectorInfographic('plan text', 'Modern Editorial', 'English');

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('falls back to the deterministic generator when the model response has no <svg> tag', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ text: 'no svg markup here' }) });

    const result = await generateAiVectorInfographic('plan text', 'Custom style', 'English');

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    const decoded = Buffer.from(result.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
    // Deterministic fallback should not just echo the raw model response.
    expect(decoded).not.toBe('no svg markup here');
  });
});