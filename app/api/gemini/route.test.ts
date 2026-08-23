import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

type RouteRequest = {
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
};

function makeRequest(body: unknown, headers: Record<string, string> = {}): RouteRequest {
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  const lowered: Record<string, string> = {};
  Object.entries(headers).forEach(([k, v]) => {
    lowered[k.toLowerCase()] = v;
  });
  return {
    headers: { get: (name: string) => lowered[name.toLowerCase()] ?? null },
    text: async () => rawBody,
  };
}

describe('app/api/gemini/route', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    mockGenerateContent.mockReset();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.A2A_REASONING_MODEL;
    delete process.env.A2A_IMAGE_MODEL;
    delete process.env.A2A_INFOGRAPHIC_MODEL;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  describe('GET', () => {
    it('reports configured=false and default models when no API key is set', async () => {
      const { GET } = await import('./route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.configured).toBe(false);
      expect(json.models).toEqual({
        reasoning: 'gemini-3.7-flash',
        image: 'gemini-3.1-flash-image',
        infographic: 'gemini-3.7-flash',
      });
    });

    it('reports configured=true when API_KEY is set', async () => {
      process.env.API_KEY = 'test-key';
      const { GET } = await import('./route');
      const res = await GET();
      const json = await res.json();
      expect(json.configured).toBe(true);
    });

    it('reports configured=true when only GEMINI_API_KEY is set', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      const { GET } = await import('./route');
      const res = await GET();
      const json = await res.json();
      expect(json.configured).toBe(true);
    });

    it('honors model overrides supplied via environment variables', async () => {
      process.env.A2A_REASONING_MODEL = 'custom-reasoning-model';
      const { GET } = await import('./route');
      const res = await GET();
      const json = await res.json();
      expect(json.models.reasoning).toBe('custom-reasoning-model');
      expect(json.models.image).toBe('gemini-3.1-flash-image');
    });
  });

  describe('POST', () => {
    it('rejects requests whose content-length header exceeds the size limit', async () => {
      const { POST } = await import('./route');
      const req = makeRequest({ contents: 'hi' }, { 'content-length': String(2_000_000) });
      const res = await POST(req as any);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toMatch(/too large/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('rejects requests whose actual body exceeds the size limit even without a content-length header', async () => {
      const { POST } = await import('./route');
      const hugeBody = JSON.stringify({ contents: 'x'.repeat(1_000_001) });
      const req = makeRequest(hugeBody);
      const res = await POST(req as any);
      expect(res.status).toBe(413);
    });

    it('rejects invalid JSON bodies', async () => {
      const { POST } = await import('./route');
      const req = makeRequest('{not valid json');
      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/valid JSON/i);
    });

    it('rejects requests with an unknown inference path', async () => {
      process.env.API_KEY = 'test-key';
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'not-a-real-path', contents: 'hello' });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid Gemini request/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('rejects requests with a model that is not allow-listed', async () => {
      process.env.API_KEY = 'test-key';
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', model: 'some-untrusted-model', contents: 'hello' });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it('rejects requests missing valid contents/prompt', async () => {
      process.env.API_KEY = 'test-key';
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning' });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it('rejects requests where contents is a plain object (only string/array are accepted)', async () => {
      process.env.API_KEY = 'test-key';
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', contents: { parts: [{ text: 'hi' }] } });
      const res = await POST(req as any);
      expect(res.status).toBe(400);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('accepts array-form contents', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({ text: 'ok', candidates: [] });
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', contents: [{ role: 'user', parts: [{ text: 'hi' }] }] });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
    });

    it('falls back to the "prompt" field when "contents" is absent', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({ text: 'ok', candidates: [] });
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', prompt: 'hello there' });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ contents: 'hello there' })
      );
    });

    it('defaults to the "reasoning" path and its default model when neither is specified', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({ text: 'ok', candidates: [] });
      const { POST } = await import('./route');
      const req = makeRequest({ contents: 'hello' });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-3.7-flash', contents: 'hello' })
      );
    });

    it('uses the requested model when it is allow-listed', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({ text: 'ok', candidates: [] });
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', model: 'gemini-3.1-pro-preview', contents: 'hello' });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-3.1-pro-preview' })
      );
    });

    it('returns 503 when no API key is configured', async () => {
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', contents: 'hello' });
      const res = await POST(req as any);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toMatch(/not configured/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('forwards a valid config object and returns the generated text and candidates', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({
        text: 'Hello world',
        candidates: [{ content: { parts: [{ text: 'Hello world' }] } }],
      });
      const { POST } = await import('./route');
      const req = makeRequest({
        path: 'reasoning',
        contents: 'hello',
        config: { responseMimeType: 'application/json' },
      });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.text).toBe('Hello world');
      expect(json.candidates).toHaveLength(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ config: { responseMimeType: 'application/json' } })
      );
    });

    it('ignores a config value that is an array instead of a plain object', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({ text: 'ok', candidates: [] });
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', contents: 'hello', config: ['not', 'an', 'object'] });
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ config: undefined })
      );
    });

    it('defaults text to an empty string when the SDK returns no text', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockResolvedValue({});
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', contents: 'hello' });
      const res = await POST(req as any);
      const json = await res.json();
      expect(json.text).toBe('');
      expect(json.candidates).toEqual([]);
    });

    it('returns a 500 error when the Gemini SDK throws', async () => {
      process.env.API_KEY = 'test-key';
      mockGenerateContent.mockRejectedValue(new Error('upstream failure'));
      const { POST } = await import('./route');
      const req = makeRequest({ path: 'reasoning', contents: 'hello' });
      const res = await POST(req as any);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toMatch(/Gemini request failed/i);
    });

    it('returns a 500 error when request.text() itself throws', async () => {
      const { POST } = await import('./route');
      const req: RouteRequest = {
        headers: { get: () => null },
        text: async () => {
          throw new Error('stream error');
        },
      };
      const res = await POST(req as any);
      expect(res.status).toBe(500);
    });
  });
});