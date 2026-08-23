import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../App', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-app' }, 'Mocked App'),
}));

import Page from './page';

describe('app/page.tsx', () => {
  it('renders the App component as the page content', () => {
    const html = renderToStaticMarkup(React.createElement(Page));

    expect(html).toContain('data-testid="mock-app"');
    expect(html).toContain('Mocked App');
  });

  it('is a simple wrapper with no additional markup around App', () => {
    const element = Page();
    expect(React.isValidElement(element)).toBe(true);
    // The element type should be the mocked App component itself.
    expect(typeof (element as React.ReactElement).type).toBe('function');
  });
});