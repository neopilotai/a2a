import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isLocalStorageAvailable } from './storageService';

describe('storageService', () => {
  describe('isLocalStorageAvailable', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns true when window and a functioning localStorage are present', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('returns false when window is undefined (SSR environment)', () => {
      const originalWindow = globalThis.window;
      // Simulate a server-side rendering environment where `window` does not exist.
      // @ts-expect-error - intentionally deleting window to simulate SSR
      delete globalThis.window;

      try {
        expect(isLocalStorageAvailable()).toBe(false);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    it('returns false when window.localStorage is not available', () => {
      const originalLocalStorage = window.localStorage;
      // @ts-expect-error - intentionally removing localStorage to simulate a restricted browser
      delete window.localStorage;

      try {
        expect(isLocalStorageAvailable()).toBe(false);
      } finally {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        });
      }
    });

    it('returns false when localStorage throws (e.g. quota exceeded or privacy mode)', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      expect(isLocalStorageAvailable()).toBe(false);
      setItemSpy.mockRestore();
    });

    it('cleans up its probe key after a successful check', () => {
      const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');
      isLocalStorageAvailable();
      expect(removeItemSpy).toHaveBeenCalledWith('__link2ink_test__');
    });
  });
});