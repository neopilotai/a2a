import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans-mock' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono-mock' }),
}));

vi.mock('../index.css', () => ({}));

import RootLayout, { metadata, viewport } from './layout';

describe('app/layout.tsx', () => {
  describe('metadata', () => {
    it('sets the expected title and description', () => {
      expect(metadata.title).toBe('Link2Ink Studio');
      expect(metadata.description).toBe(
        'Visual workspace for turning repositories and ideas into actionable maps.'
      );
    });
  });

  describe('viewport', () => {
    it('configures a dark themed, device-width viewport', () => {
      expect(viewport.themeColor).toBe('#020617');
      expect(viewport.colorScheme).toBe('dark');
      expect(viewport.width).toBe('device-width');
      expect(viewport.initialScale).toBe(1);
    });
  });

  describe('RootLayout component', () => {
    it('renders an <html lang="en"> root with the dark background class', () => {
      const html = renderToStaticMarkup(
        React.createElement(RootLayout, { children: React.createElement('div', null, 'child content') })
      );

      expect(html).toContain('<html');
      expect(html).toContain('lang="en"');
      expect(html).toContain('bg-slate-950');
    });

    it('applies the Geist font variables to the <body>', () => {
      const html = renderToStaticMarkup(
        React.createElement(RootLayout, { children: React.createElement('span', null, 'x') })
      );

      expect(html).toContain('--font-geist-sans-mock');
      expect(html).toContain('--font-geist-mono-mock');
    });

    it('renders the provided children inside the body', () => {
      const html = renderToStaticMarkup(
        React.createElement(RootLayout, {
          children: React.createElement('div', { 'data-testid': 'child-marker' }, 'hello from child'),
        })
      );

      expect(html).toContain('hello from child');
      expect(html).toContain('data-testid="child-marker"');
    });
  });
});