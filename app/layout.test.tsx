import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout, { metadata, viewport } from './layout';

describe('app/layout.tsx', () => {
  it('exports page metadata used for SEO / browser tab title', () => {
    expect(metadata.title).toBe('Link2Ink Studio');
    expect(metadata.description).toBe(
      'Visual workspace for turning repositories and ideas into actionable maps.'
    );
  });

  it('exports a dark-themed viewport configuration', () => {
    expect(viewport).toEqual({
      themeColor: '#020617',
      colorScheme: 'dark',
      width: 'device-width',
      initialScale: 1,
    });
  });

  it('renders an <html> document shell with the geist font variables and dark background', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );

    expect(html).toContain('lang="en"');
    expect(html).toContain('bg-slate-950');
    expect(html).toContain('--font-geist-sans');
    expect(html).toContain('--font-geist-mono');
  });

  it('renders its children inside the document body', () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main data-testid="app-root">hello world</main>
      </RootLayout>
    );

    expect(html).toContain('hello world');
    expect(html).toContain('data-testid="app-root"');
  });
});