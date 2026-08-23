// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: { generateContent: generateContentMock },
    })),
  };
});

import { GET, POST } from './route';

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  const lowered: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    lowered[key.toLowerCase()] = value;
  });
  return {
    headers: { get: (key: string) => lowered[key.toLowerCase()] ?? null },
    text: async () => body,
  } as unknown as Request;
}

describe('app/api/gemini/route', () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('GET', () => {
    it('reports configured: false and the default model set when no API key is present', async () => {
      vi.stubEnv('API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', '');

      const response = await GET();
      const json = await response.json();

      expect(json.configured).toBe(false);
      expect(json.models).toEqual({
        reasoning: 'gemini-3.7-flash',
        image: 'gemini-3.1-flash-image',
        infographic: 'gemini-3.7-flash',
      });
    });

    it('reports configured: true when API_KEY is set', async () => {
      vi.stubEnv('API_KEY', 'test-key');

      const response = await GET();
      const json = await response.json();

      expect(json.configured).toBe(true);
    });

    it('reports configured: true when only GEMINI_API_KEY is set', async () => {
      vi.stubEnv('API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', 'fallback-key');

      const response = await GET();
      const json = await response.json();

      expect(json.configured).toBe(true);
    });
  });

  describe('POST', () => {
    beforeEach(() => {
      vi.stubEnv('API_KEY', 'test-key');
    });

    it('rejects requests declaring a content-length above the size limit', async () => {
      const request = makeRequest('{}', { 'content-length': String(2_000_000) });
      const response = await POST(request);

      expect(response.status).toBe(413);
      expect((await response.json()).error).toBe('Request is too large.');
      expect(generateContentMock).not.toHaveBeenCalled();
    });

    it('rejects requests whose actual body exceeds the size limit even without a content-length header', async () => {
      const oversizedContents = 'a'.repeat(1_000_001);
      const request = makeRequest(JSON.stringify({ contents: oversizedContents }));
      const response = await POST(request);

      expect(response.status).toBe(413);
      expect((await response.json()).error).toBe('Request is too large.');
    });

    it('rejects malformed JSON bodies', async () => {
      const request = makeRequest('{not valid json');
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe('Request body must be valid JSON.');
    });

    it('rejects an unknown inference path', async () => {
      const request = makeRequest(JSON.stringify({ path: 'not-a-real-path', contents: 'hi' }));
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe('Invalid Gemini request.');
    });

    it('rejects a model that is not in the allow-list', async () => {
      const request = makeRequest(JSON.stringify({ model: 'some-untrusted-model', contents: 'hi' }));
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('rejects requests with neither contents nor prompt', async () => {
      const request = makeRequest(JSON.stringify({ path: 'reasoning' }));
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('accepts "prompt" as a fallback for "contents"', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'ok', candidates: [] });
      const request = makeRequest(JSON.stringify({ prompt: 'hello there' }));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ contents: 'hello there' })
      );
    });

    it('defaults to the "reasoning" path and its default model when neither is specified', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'ok', candidates: [] });
      const request = makeRequest(JSON.stringify({ contents: 'hello' }));
      await POST(request);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-3.7-flash', contents: 'hello' })
      );
    });

    it('accepts an explicit, allow-listed model override', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'ok', candidates: [] });
      const request = makeRequest(JSON.stringify({ model: 'gemini-3.1-pro-preview', contents: 'hello' }));
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-3.1-pro-preview' })
      );
    });

    it('accepts array contents (multi-turn conversations)', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'ok', candidates: [] });
      const contents = [{ role: 'user', parts: [{ text: 'hi' }] }];
      const request = makeRequest(JSON.stringify({ contents }));
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('forwards a plain object config but ignores an array config', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'ok', candidates: [] });
      const request = makeRequest(JSON.stringify({ contents: 'hi', config: ['not', 'an', 'object'] }));
      await POST(request);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ config: undefined })
      );
    });

    it('passes through a valid plain-object config', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'ok', candidates: [] });
      const request = makeRequest(JSON.stringify({ contents: 'hi', config: { temperature: 0.2 } }));
      await POST(request);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ config: { temperature: 0.2 } })
      );
    });

    it('returns 503 when no API key is configured', async () => {
      vi.stubEnv('API_KEY', '');
      vi.stubEnv('GEMINI_API_KEY', '');

      const request = makeRequest(JSON.stringify({ contents: 'hi' }));
      const response = await POST(request);

      expect(response.status).toBe(503);
      expect((await response.json()).error).toBe('Gemini API key is not configured.');
      expect(generateContentMock).not.toHaveBeenCalled();
    });

    it('returns the generated text and candidates on success', async () => {
      generateContentMock.mockResolvedValueOnce({
        text: 'Hello from Gemini',
        candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
      });

      const request = makeRequest(JSON.stringify({ contents: 'hi' }));
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.text).toBe('Hello from Gemini');
      expect(json.candidates).toEqual([{ content: { parts: [{ text: 'Hello from Gemini' }] } }]);
    });

    it('defaults text and candidates to empty values when absent from the SDK response', async () => {
      generateContentMock.mockResolvedValueOnce({});

      const request = makeRequest(JSON.stringify({ contents: 'hi' }));
      const response = await POST(request);
      const json = await response.json();

      expect(json.text).toBe('');
      expect(json.candidates).toEqual([]);
    });

    it('returns a 500 error when the Gemini SDK call throws', async () => {
      generateContentMock.mockRejectedValueOnce(new Error('upstream failure'));

      const request = makeRequest(JSON.stringify({ contents: 'hi' }));
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Gemini request failed.');
    });
  });
});