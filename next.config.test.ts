import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

describe('next.config.ts', () => {
  it('exposes an async headers() function', () => {
    expect(typeof nextConfig.headers).toBe('function');
  });

  it('applies a consistent set of security headers to every route', async () => {
    const rules = await nextConfig.headers!();

    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe('/(.*)');

    const headerMap = Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));

    expect(headerMap['X-Content-Type-Options']).toBe('nosniff');
    expect(headerMap['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headerMap['Strict-Transport-Security']).toBe('max-age=63072000');
    expect(headerMap['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
  });

  it('does not disable HSTS or content sniffing protection accidentally', async () => {
    const rules = await nextConfig.headers!();
    const keys = rules[0].headers.map((h) => h.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Strict-Transport-Security',
        'Permissions-Policy',
      ])
    );
  });
});