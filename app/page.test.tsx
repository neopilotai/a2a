import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../App', () => ({
  default: () => <div data-testid="mock-app">Mock App</div>,
}));

import Page from './page';

describe('app/page.tsx', () => {
  it('renders the App component as the page root', () => {
    render(<Page />);
    expect(screen.getByTestId('mock-app')).toBeInTheDocument();
    expect(screen.getByText('Mock App')).toBeInTheDocument();
  });
});