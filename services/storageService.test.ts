import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isLocalStorageAvailable } from './storageService';

/**
 * These tests target the SSR-safety guard added to `isLocalStorageAvailable`:
 *   if (typeof window === 'undefined' || !window.localStorage) return false;
 */
describe('isLocalStorageAvailable', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  it('returns false when `window` is undefined (server-side rendering)', () => {
    delete (globalThis as any).window;

    expect(isLocalStorageAvailable()).toBe(false);
  });

  it('returns false when `window` exists but has no localStorage property', () => {
    (globalThis as any).window = {};

    expect(isLocalStorageAvailable()).toBe(false);
  });

  it('returns true when localStorage is present and functional', () => {
    const store = new Map<string, string>();
    (globalThis as any).window = {
      localStorage: {
        setItem: (k: string, v: string) => store.set(k, v),
        getItem: (k: string) => store.get(k) ?? null,
        removeItem: (k: string) => store.delete(k),
      },
    };

    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('returns false and warns when localStorage throws (e.g. restricted/private mode)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (globalThis as any).window = {
      localStorage: {
        setItem: () => {
          throw new Error('SecurityError: storage restricted');
        },
        getItem: () => null,
        removeItem: () => {},
      },
    };

    expect(isLocalStorageAvailable()).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('cleans up the probe key it writes when storage is available', () => {
    const store = new Map<string, string>();
    const removeItemSpy = vi.fn((k: string) => store.delete(k));
    (globalThis as any).window = {
      localStorage: {
        setItem: (k: string, v: string) => store.set(k, v),
        getItem: (k: string) => store.get(k) ?? null,
        removeItem: removeItemSpy,
      },
    };

    isLocalStorageAvailable();

    expect(removeItemSpy).toHaveBeenCalledWith('__link2ink_test__');
    expect(store.has('__link2ink_test__')).toBe(false);
  });
});