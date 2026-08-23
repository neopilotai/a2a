import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AI_MODEL_DEFAULTS } from './aiConfig';

vi.mock('./svgInfographicService', () => ({
  generateAiVectorInfographic: vi.fn().mockResolvedValue('FALLBACK_SVG_BASE64'),
}));

import { generateAiVectorInfographic } from './svgInfographicService';
import {
  generateInfographic,
  askRepoQuestion,
  sendAssistantChatMessage,
} from './geminiService';

type FetchResponseInit = {
  ok?: boolean;
  json?: () => Promise<any>;
};

function mockFetchResolvedOnce({ ok = true, json = async () => ({}) }: FetchResponseInit) {
  (global.fetch as any).mockResolvedValueOnce({ ok, json });
}

function getLastFetchRequestBody() {
  const call = (global.fetch as any).mock.calls.at(-1);
  return JSON.parse(call[1].body);
}

describe('geminiService (proxy-backed Gemini calls)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(generateAiVectorInfographic).mockClear();
    vi.mocked(generateAiVectorInfographic).mockResolvedValue('FALLBACK_SVG_BASE64');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('generateInfographic', () => {
    it('calls the /api/gemini proxy with the image model and returns inline image data on success', async () => {
      mockFetchResolvedOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ inlineData: { data: 'BASE64IMAGEDATA', mimeType: 'image/png' } }] } },
          ],
        }),
      });

      const result = await generateInfographic('my-org/my-repo', [{ path: 'src/index.ts' } as any], 'Corporate Minimal');

      expect(result).toBe('BASE64IMAGEDATA');
      expect(global.fetch).toHaveBeenCalledWith('/api/gemini', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));

      const body = getLastFetchRequestBody();
      expect(body.model).toBe(AI_MODEL_DEFAULTS.image);
      expect(body.contents.parts[0].text).toContain('my-org/my-repo');
    });

    it('returns null when the response contains no inline image data', async () => {
      mockFetchResolvedOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'no image here' }] } }] }),
      });

      const result = await generateInfographic('my-org/my-repo', [], 'Corporate Minimal');
      expect(result).toBeNull();
      expect(generateAiVectorInfographic).not.toHaveBeenCalled();
    });

    it('falls back to the deterministic SVG infographic when the proxy response is not ok', async () => {
      mockFetchResolvedOnce({ ok: false, json: async () => ({ error: 'Model unavailable' }) });

      const result = await generateInfographic('my-org/my-repo', [], 'Neon Cyberpunk');

      expect(result).toBe('FALLBACK_SVG_BASE64');
      expect(generateAiVectorInfographic).toHaveBeenCalledTimes(1);
    });

    it('falls back to the deterministic SVG infographic when fetch throws (network failure)', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('network down'));

      const result = await generateInfographic('my-org/my-repo', [], 'Modern Data Flow');

      expect(result).toBe('FALLBACK_SVG_BASE64');
      expect(generateAiVectorInfographic).toHaveBeenCalledTimes(1);
    });
  });

  describe('askRepoQuestion', () => {
    it('sends the infographic image and file tree context to the reasoning model', async () => {
      mockFetchResolvedOnce({ ok: true, json: async () => ({ text: 'This repo uses a layered architecture.' }) });

      const result = await askRepoQuestion('What does this repo do?', 'BASE64IMG', [{ path: 'a.ts' } as any]);

      expect(result).toBe('This repo uses a layered architecture.');

      const body = getLastFetchRequestBody();
      expect(body.model).toBe(AI_MODEL_DEFAULTS.reasoning);
      expect(body.contents.parts[0].inlineData).toEqual({ mimeType: 'image/png', data: 'BASE64IMG' });
      expect(body.contents.parts[1].text).toContain('What does this repo do?');
    });

    it('returns a friendly fallback message when the response has no text', async () => {
      mockFetchResolvedOnce({ ok: true, json: async () => ({}) });

      const result = await askRepoQuestion('question', 'img', []);
      expect(result).toBe("I couldn't generate an answer at this time.");
    });

    it('propagates an error when the proxy request fails', async () => {
      mockFetchResolvedOnce({ ok: false, json: async () => ({ error: 'Bad request' }) });

      await expect(askRepoQuestion('question', 'img', [])).rejects.toThrow('Bad request');
    });
  });

  describe('sendAssistantChatMessage', () => {
    it('uses the default reasoning model and returns text without citations when search grounding is disabled', async () => {
      mockFetchResolvedOnce({ ok: true, json: async () => ({ text: 'Here is my architectural advice.' }) });

      const result = await sendAssistantChatMessage(
        [{ role: 'user', text: 'Hi' }],
        'What should I refactor?',
        'You are a helpful architect.'
      );

      expect(result).toEqual({ text: 'Here is my architectural advice.', citations: undefined });

      const body = getLastFetchRequestBody();
      expect(body.model).toBe(AI_MODEL_DEFAULTS.reasoning);
      expect(body.config.tools).toBeUndefined();
    });

    it('extracts and deduplicates citations when search grounding is enabled', async () => {
      mockFetchResolvedOnce({
        ok: true,
        json: async () => ({
          text: 'Grounded answer',
          candidates: [
            {
              groundingMetadata: {
                groundingChunks: [
                  { web: { uri: 'https://example.com/a', title: 'Doc A' } },
                  { web: { uri: 'https://example.com/a', title: 'Doc A duplicate' } },
                  { web: { uri: 'https://example.com/b' } },
                ],
              },
            },
          ],
        }),
      });

      const result = await sendAssistantChatMessage(
        [],
        'What are the latest best practices?',
        'system',
        'gemini-3.7-flash',
        undefined,
        true
      );

      expect(result.text).toBe('Grounded answer');
      // The Map-based de-duplication keeps each URI's first insertion position but
      // its most recently seen value, so the second "Doc A duplicate" chunk wins.
      expect(result.citations).toEqual([
        { uri: 'https://example.com/a', title: 'Doc A duplicate' },
        { uri: 'https://example.com/b', title: 'Search Reference' },
      ]);

      const body = getLastFetchRequestBody();
      expect(body.config.tools).toEqual([{ googleSearch: {} }]);
    });

    it('throws a descriptive error when the underlying request fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('proxy exploded'));

      await expect(
        sendAssistantChatMessage([], 'hello', 'system')
      ).rejects.toThrow('proxy exploded');
    });

    it('appends codebase context to the system instruction when provided', async () => {
      mockFetchResolvedOnce({ ok: true, json: async () => ({ text: 'ok' }) });

      await sendAssistantChatMessage([], 'hello', 'Base instruction', undefined, 'const x = 1;');

      const body = getLastFetchRequestBody();
      expect(body.config.systemInstruction).toContain('Base instruction');
      expect(body.config.systemInstruction).toContain('const x = 1;');
    });
  });
});