/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudioTheme } from '../types';

export interface ThemeInfo {
  id: StudioTheme;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  iconName: 'sparkles' | 'blueprint' | 'pencil';
  preview: {
    bg: string;
    panel: string;
    border: string;
    accent: string;
    text: string;
  };
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const THEME_CONFIGS: Record<StudioTheme, ThemeInfo> = {
  architect: {
    id: 'architect',
    name: 'Architect',
    shortLabel: 'Dark',
    tagline: 'Cybernetic Deep Dark',
    description: 'Deep slate canvas with violet & emerald neon accents, atmospheric glows, and cyber-technical precision.',
    iconName: 'sparkles',
    preview: {
      bg: '#020617',
      panel: '#0f172a',
      border: 'rgba(255, 255, 255, 0.1)',
      accent: '#8b5cf6',
      text: '#f8fafc',
    },
    accentColor: '#8b5cf6',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
    badgeBorder: 'border-violet-500/30',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    shortLabel: 'CAD',
    tagline: 'High-Contrast Blue & White',
    description: 'Classic architectural cyanotype & CAD drafting aesthetic with deep navy canvas, crisp cyan grid, and sharp white elements.',
    iconName: 'blueprint',
    preview: {
      bg: '#03132e',
      panel: '#07214d',
      border: '#38bdf8',
      accent: '#00f0ff',
      text: '#ffffff',
    },
    accentColor: '#00f0ff',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-400/40',
  },
  draft: {
    id: 'draft',
    name: 'Draft',
    shortLabel: 'Draft',
    tagline: 'Minimalist Grayscale',
    description: 'Clean monochrome drafting aesthetic with neutral charcoal surfaces, crisp zinc contours, and high-contrast typography.',
    iconName: 'pencil',
    preview: {
      bg: '#09090b',
      panel: '#18181b',
      border: '#3f3f46',
      accent: '#f4f4f5',
      text: '#ffffff',
    },
    accentColor: '#ffffff',
    badgeBg: 'bg-zinc-700/40',
    badgeText: 'text-zinc-200',
    badgeBorder: 'border-zinc-500/40',
  },
};

const THEME_STORAGE_KEY = 'link2ink_studio_theme_v1';

/**
 * Get stored theme from localStorage or default to 'architect'
 */
export const getStoredTheme = (): StudioTheme => {
  if (typeof window === 'undefined' || !window.localStorage) return 'architect';

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as StudioTheme;
    if (stored && (stored === 'architect' || stored === 'blueprint' || stored === 'draft')) {
      return stored;
    }
  } catch (e) {
    console.warn('[ThemeService] LocalStorage error reading theme:', e);
  }
  return 'architect';
};

/**
 * Persist selected theme and apply it to documentElement
 */
export const applyTheme = (theme: StudioTheme): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // Set data-theme attribute on root and body
  root.setAttribute('data-theme', theme);
  body.setAttribute('data-theme', theme);

  // Remove old theme classes and add current theme class
  root.classList.remove('theme-architect', 'theme-blueprint', 'theme-draft');
  root.classList.add(`theme-${theme}`);
  body.classList.remove('theme-architect', 'theme-blueprint', 'theme-draft');
  body.classList.add(`theme-${theme}`);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    // Dispatch custom event for synchronized components
    window.dispatchEvent(new CustomEvent('studio_theme_changed', { detail: { theme } }));
  } catch (e) {
    console.warn('[ThemeService] LocalStorage error saving theme:', e);
  }
};
