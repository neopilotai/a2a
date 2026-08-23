import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewMode } from './types';

// -- Component mocks -------------------------------------------------------
// App.tsx wires together a large number of feature components. For this
// smoke test we replace each of them with a minimal stand-in so we can
// exercise App.tsx's own client-side logic (view routing, intro overlay,
// workspace dropdown) in isolation, per the 'use client' change made to
// this file.
vi.mock('./components/RepoAnalyzer', () => ({ default: () => <div data-testid="view-repo-analyzer" /> }));
vi.mock('./components/ArticleToInfographic', () => ({ default: () => <div data-testid="view-article-infographic" /> }));
vi.mock('./components/Home', () => ({ default: () => <div data-testid="view-home" /> }));
vi.mock('./components/IntroAnimation', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="intro-animation">
      <button onClick={onComplete}>finish-intro</button>
    </div>
  ),
}));
vi.mock('./components/Codemap', () => ({ default: () => <div data-testid="view-codemap" /> }));
vi.mock('./components/AiAssistant', () => ({ default: () => <div data-testid="view-ai-assistant" /> }));
vi.mock('./components/PlanCreator', () => ({ default: () => <div data-testid="view-plan-creator" /> }));
vi.mock('./components/a2ui/A2UIStudio', () => ({ A2UIStudio: () => <div data-testid="view-a2ui-studio" /> }));
vi.mock('./components/IntegrationsConsole', () => ({ IntegrationsConsole: () => <div data-testid="view-integrations" /> }));
vi.mock('./components/ChangeStackStudio', () => ({ ChangeStackStudio: () => <div data-testid="view-change-stack" /> }));
vi.mock('./components/SessionStatusModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="session-status-modal">
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
}));
vi.mock('./components/SessionIndicator', () => ({ default: () => <div data-testid="session-indicator" /> }));
vi.mock('./components/ThemeSelector', () => ({ ThemeSelector: () => <div data-testid="theme-selector" /> }));
vi.mock('./components/GlobalRepoSearchBar', () => ({ GlobalRepoSearchBar: () => <div data-testid="global-search" /> }));
vi.mock('./components/a2a/A2aCompanionHUD', () => ({ A2aCompanionHUD: () => <div data-testid="a2a-hud" /> }));
vi.mock('./components/PerformanceHud', () => ({ PerformanceHud: () => <div data-testid="performance-hud" /> }));

const saveUserSessionMock = vi.fn();
vi.mock('./services/storageService', () => ({
  loadUserSession: vi.fn(() => null),
  saveUserSession: (...args: unknown[]) => saveUserSessionMock(...args),
  saveActiveRepoContext: vi.fn(),
  saveRepoHistory: vi.fn(),
  saveArticleHistory: vi.fn(),
  saveIntegrationsSettings: vi.fn(),
  subscribeToSessionUpdates: vi.fn(() => () => {}),
}));

vi.mock('./services/themeService', () => ({
  getStoredTheme: vi.fn(() => 'architect'),
  applyTheme: vi.fn(),
}));

const setCurrentViewMock = vi.fn();
const baseStoreState = {
  currentView: ViewMode.HOME,
  currentTheme: 'architect',
  activeRepoContext: null,
  repoHistory: [],
  articleHistory: [],
  integrationsSettings: undefined,
  setCurrentView: setCurrentViewMock,
  setCurrentTheme: vi.fn(),
  setActiveRepoContext: vi.fn(),
  addRepoHistory: vi.fn(),
  addArticleHistory: vi.fn(),
  setIntegrationsSettings: vi.fn(),
  loadFromSession: vi.fn(),
};

let storeState = { ...baseStoreState };

vi.mock('./store', () => ({
  useStudioStore: () => storeState,
}));

import App from './App';
import { loadUserSession } from './services/storageService';

describe('App', () => {
  beforeEach(() => {
    storeState = { ...baseStoreState, setCurrentView: setCurrentViewMock };
    setCurrentViewMock.mockClear();
    saveUserSessionMock.mockClear();
    vi.mocked(loadUserSession).mockReturnValue(null);
  });

  it('renders the studio header branding and main navigation', () => {
    render(<App />);
    expect(screen.getByText('Remix A2A')).toBeInTheDocument();
    expect(screen.getByText('A2A STUDIO')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders the Home view by default', () => {
    render(<App />);
    expect(screen.getByTestId('view-home')).toBeInTheDocument();
  });

  it('renders the AI Assistant view when currentView is AI_ASSISTANT', () => {
    storeState = { ...baseStoreState, currentView: ViewMode.AI_ASSISTANT };
    render(<App />);
    expect(screen.getByTestId('view-ai-assistant')).toBeInTheDocument();
    expect(screen.queryByTestId('view-home')).not.toBeInTheDocument();
  });

  it('renders the Change Stack view when currentView is CHANGE_STACK', () => {
    storeState = { ...baseStoreState, currentView: ViewMode.CHANGE_STACK };
    render(<App />);
    expect(screen.getByTestId('view-change-stack')).toBeInTheDocument();
  });

  it('calls setCurrentView with HOME when the Overview nav button is clicked', () => {
    storeState = { ...baseStoreState, currentView: ViewMode.CODEMAP };
    render(<App />);
    fireEvent.click(screen.getByText('Overview'));
    expect(setCurrentViewMock).toHaveBeenCalledWith(ViewMode.HOME);
  });

  it('shows the intro animation on first load when there is no saved session', () => {
    render(<App />);
    expect(screen.getByTestId('intro-animation')).toBeInTheDocument();
  });

  it('does not show the intro animation when the saved session already saw it', () => {
    vi.mocked(loadUserSession).mockReturnValue({
      version: 1,
      lastSavedAt: Date.now(),
      currentView: ViewMode.HOME,
      introSeen: true,
      activeRepoContext: null,
      repoHistory: [],
      articleHistory: [],
    } as any);

    render(<App />);
    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();
  });

  it('dismisses the intro animation and persists introSeen when completed', () => {
    render(<App />);
    expect(screen.getByTestId('intro-animation')).toBeInTheDocument();

    fireEvent.click(screen.getByText('finish-intro'));

    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();
    expect(saveUserSessionMock).toHaveBeenCalledWith({ introSeen: true });
  });

  it('opens the Studio Workspace dropdown and lists the workspace tools', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Studio Workspace'));

    expect(screen.getByText('Change Stack')).toBeInTheDocument();
    expect(screen.getByText('AI Architect')).toBeInTheDocument();
    expect(screen.getByText('GitFlow')).toBeInTheDocument();
  });

  it('switches to the Codemap view when the Codemap workspace item is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Studio Workspace'));
    fireEvent.click(screen.getByText('Codemap'));

    expect(setCurrentViewMock).toHaveBeenCalledWith(ViewMode.CODEMAP);
  });
});