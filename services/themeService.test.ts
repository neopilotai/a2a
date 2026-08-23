import { describe, it, expect, afterEach, vi } from 'vitest';
import { getStoredTheme } from './themeService';

const THEME_STORAGE_KEY = 'link2ink_studio_theme_v1';

describe('themeService', () => {
  describe('getStoredTheme', () => {
    afterEach(() => {
      window.localStorage.clear();
      vi.restoreAllMocks();
    });

    it('defaults to "architect" when nothing is stored', () => {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      expect(getStoredTheme()).toBe('architect');
    });

    it('returns the stored theme when it is a valid theme id', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'blueprint');
      expect(getStoredTheme()).toBe('blueprint');

      window.localStorage.setItem(THEME_STORAGE_KEY, 'draft');
      expect(getStoredTheme()).toBe('draft');
    });

    it('falls back to "architect" when the stored value is invalid', () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'not-a-real-theme');
      expect(getStoredTheme()).toBe('architect');
    });

    it('returns "architect" when window is undefined (SSR environment)', () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally deleting window to simulate SSR
      delete globalThis.window;

      try {
        expect(getStoredTheme()).toBe('architect');
      } finally {
        globalThis.window = originalWindow;
      }
    });

    it('returns "architect" when window.localStorage is not available', () => {
      const originalLocalStorage = window.localStorage;
      // @ts-expect-error - intentionally removing localStorage
      delete window.localStorage;

      try {
        expect(getStoredTheme()).toBe('architect');
      } finally {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        });
      }
    });

    it('falls back to "architect" if reading from localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(getStoredTheme()).toBe('architect');
    });
  });
});