import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_MODEL_DEFAULTS } from './aiConfig';

vi.mock('./svgInfographicService', () => ({
  generateAiVectorInfographic: vi.fn(),
}));

import { generateAiVectorInfographic } from './svgInfographicService';
import {
  askRepoQuestion,
  editImageWithGemini,
  generateInfographic,
  sendAssistantChatMessage,
} from './geminiService';

const mockFetch = vi.fn();

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe('geminiService (Next.js proxy integration)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.mocked(generateAiVectorInfographic).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('editImageWithGemini', () => {
    it('POSTs to /api/gemini with the image model and returns the inline image data on success', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          candidates: [{ content: { parts: [{ inlineData: { data: 'base64img', mimeType: 'image/png' } }] } }],
        })
      );

      const result = await editImageWithGemini('srcBase64', 'image/png', 'make it blue');

      expect(result).toBe('base64img');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/gemini');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });

      const body = JSON.parse(init.body);
      expect(body.model).toBe(AI_MODEL_DEFAULTS.image);
      expect(body.contents.parts[0].inlineData).toEqual({ data: 'srcBase64', mimeType: 'image/png' });
      expect(body.contents.parts[1].text).toBe('make it blue');
    });

    it('returns null when the response has no inline image data', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ candidates: [{ content: { parts: [{ text: 'no image' }] } }] }));

      const result = await editImageWithGemini('srcBase64', 'image/png', 'prompt');

      expect(result).toBeNull();
    });

    it('rethrows an error using the API-provided message when the proxy responds with an error', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'quota exceeded' }, false, 429));

      await expect(editImageWithGemini('srcBase64', 'image/png', 'prompt')).rejects.toThrow('quota exceeded');
    });

    it('rethrows a generic error when the proxy fails without a JSON error body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('not json');
        },
      });

      await expect(editImageWithGemini('srcBase64', 'image/png', 'prompt')).rejects.toThrow('Gemini request failed.');
    });
  });

  describe('askRepoQuestion', () => {
    const fileTree = [{ path: 'src/index.ts', type: 'file' }];

    it('sends the reasoning model along with the image and question, returning the response text', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ text: 'This module handles routing.' }));

      const result = await askRepoQuestion('What does this do?', 'imgBase64', fileTree);

      expect(result).toBe('This module handles routing.');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe(AI_MODEL_DEFAULTS.reasoning);
      expect(body.contents.parts[0].inlineData.data).toBe('imgBase64');
      expect(body.contents.parts[1].text).toContain('What does this do?');
    });

    it('falls back to a default message when the proxy returns no text', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      const result = await askRepoQuestion('question', 'imgBase64', fileTree);

      expect(result).toBe("I couldn't generate an answer at this time.");
    });

    it('propagates errors from the proxy', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'bad request' }, false, 400));

      await expect(askRepoQuestion('question', 'imgBase64', fileTree)).rejects.toThrow('bad request');
    });
  });

  describe('sendAssistantChatMessage', () => {
    it('defaults to the reasoning model and includes full chat history in the request', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ text: 'assistant reply' }));

      const result = await sendAssistantChatMessage(
        [{ role: 'user', text: 'hi' }, { role: 'model', text: 'hello' }],
        'follow up',
        'You are a helpful assistant.'
      );

      expect(result.text).toBe('assistant reply');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe(AI_MODEL_DEFAULTS.reasoning);
      expect(body.contents).toHaveLength(3);
      expect(body.contents[2]).toEqual({ role: 'user', parts: [{ text: 'follow up' }] });
      expect(body.config.tools).toBeUndefined();
    });

    it('uses a caller-supplied model instead of the default', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ text: 'ok' }));

      await sendAssistantChatMessage([], 'hi', 'system prompt', 'gemini-3.1-pro-preview');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('gemini-3.1-pro-preview');
    });

    it('extracts and deduplicates citations when search grounding is enabled', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          text: 'grounded answer',
          candidates: [
            {
              groundingMetadata: {
                groundingChunks: [
                  { web: { uri: 'https://a.com', title: 'A' } },
                  { web: { uri: 'https://a.com', title: 'A duplicate' } },
                  { web: { uri: 'https://b.com', title: 'B' } },
                ],
              },
            },
          ],
        })
      );

      const result = await sendAssistantChatMessage([], 'hi', 'system', undefined, undefined, true);

      expect(result.citations).toHaveLength(2);
      expect(result.citations?.map((c) => c.uri)).toEqual(['https://a.com', 'https://b.com']);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.config.tools).toEqual([{ googleSearch: {} }]);
    });

    it('wraps proxy failures in a descriptive error', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'rate limited' }, false, 429));

      await expect(sendAssistantChatMessage([], 'hi', 'system')).rejects.toThrow('rate limited');
    });
  });

  describe('generateInfographic', () => {
    const fileTree = [{ path: 'src/index.ts', type: 'file' }];

    it('returns inline image data directly when the image model succeeds', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          candidates: [{ content: { parts: [{ inlineData: { data: 'imageData123' } }] } }],
        })
      );

      const result = await generateInfographic('my-repo', fileTree, 'Corporate Minimal');

      expect(result).toBe('imageData123');
      expect(generateAiVectorInfographic).not.toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe(AI_MODEL_DEFAULTS.image);
    });

    it('returns null when the image model succeeds but produces no inline data', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ candidates: [{ content: { parts: [] } }] }));

      const result = await generateInfographic('my-repo', fileTree, 'Corporate Minimal');

      expect(result).toBeNull();
      expect(generateAiVectorInfographic).not.toHaveBeenCalled();
    });

    it('falls back to the vector infographic engine when the image proxy call fails', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'model unavailable' }, false, 503));
      vi.mocked(generateAiVectorInfographic).mockResolvedValue('vectorFallbackBase64');

      const result = await generateInfographic('my-repo', fileTree, 'Corporate Minimal');

      expect(result).toBe('vectorFallbackBase64');
      expect(generateAiVectorInfographic).toHaveBeenCalledTimes(1);
    });

    it('rethrows when both the image proxy and the vector fallback fail', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ error: 'model unavailable' }, false, 503));
      vi.mocked(generateAiVectorInfographic).mockRejectedValue(new Error('vector engine down'));

      await expect(generateInfographic('my-repo', fileTree, 'Corporate Minimal')).rejects.toThrow('vector engine down');
    });
  });
});