import { describe, it, expect } from 'vitest';
import nextConfig from './next.config';

describe('next.config.ts', () => {
  it('exports a headers() function', () => {
    expect(typeof nextConfig.headers).toBe('function');
  });

  it('applies a consistent set of security headers to every route', async () => {
    const headerGroups = await nextConfig.headers!();

    expect(headerGroups).toHaveLength(1);
    expect(headerGroups[0].source).toBe('/(.*)');

    const headerMap = Object.fromEntries(
      headerGroups[0].headers.map((h) => [h.key, h.value])
    );

    expect(headerMap).toEqual({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=63072000',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
  });

  it('sets an HSTS max-age of at least one year, in seconds', async () => {
    const headerGroups = await nextConfig.headers!();
    const hsts = headerGroups[0].headers.find((h) => h.key === 'Strict-Transport-Security');
    const maxAgeMatch = hsts?.value.match(/max-age=(\d+)/);

    expect(maxAgeMatch).not.toBeNull();
    const maxAgeSeconds = Number(maxAgeMatch![1]);
    expect(maxAgeSeconds).toBeGreaterThanOrEqual(60 * 60 * 24 * 365);
  });

  it('locks down camera, microphone, and geolocation permissions', async () => {
    const headerGroups = await nextConfig.headers!();
    const permissionsPolicy = headerGroups[0].headers.find((h) => h.key === 'Permissions-Policy')?.value;

    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('geolocation=()');
  });
});