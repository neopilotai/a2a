import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStoredTheme } from './themeService';

/**
 * These tests target the SSR-safety guard added to `getStoredTheme`:
 *   if (typeof window === 'undefined' || !window.localStorage) return 'architect';
 */
describe('getStoredTheme', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  it('returns the "architect" default when `window` is undefined (server-side rendering)', () => {
    delete (globalThis as any).window;

    expect(getStoredTheme()).toBe('architect');
  });

  it('returns the "architect" default when `window` exists but has no localStorage', () => {
    (globalThis as any).window = {};

    expect(getStoredTheme()).toBe('architect');
  });

  it('returns the persisted theme when a valid value is stored', () => {
    (globalThis as any).window = {
      localStorage: {
        getItem: () => 'blueprint',
      },
    };

    expect(getStoredTheme()).toBe('blueprint');
  });

  it('falls back to "architect" when the stored value is not a recognized theme', () => {
    (globalThis as any).window = {
      localStorage: {
        getItem: () => 'not-a-real-theme',
      },
    };

    expect(getStoredTheme()).toBe('architect');
  });

  it('falls back to "architect" and warns when reading localStorage throws', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (globalThis as any).window = {
      localStorage: {
        getItem: () => {
          throw new Error('restricted');
        },
      },
    };

    expect(getStoredTheme()).toBe('architect');
    expect(warnSpy).toHaveBeenCalled();
  });
});