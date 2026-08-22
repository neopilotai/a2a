import { create } from 'zustand';
import { 
  ActiveRepoContext, 
  IntegrationsConsoleSettings, 
  ViewMode, 
  RepoHistoryItem, 
  ArticleHistoryItem, 
  StudioTheme 
} from './types';
import { 
  loadUserSession, 
  saveUserSession, 
  saveActiveRepoContext, 
  saveIntegrationsSettings, 
  saveRepoHistory, 
  saveArticleHistory,
  subscribeToSessionUpdates
} from './services/storageService';
import { getStoredTheme, applyTheme } from './services/themeService';

interface StudioState {
  currentView: ViewMode;
  currentTheme: StudioTheme;
  activeRepoContext: ActiveRepoContext | null;
  repoHistory: RepoHistoryItem[];
  articleHistory: ArticleHistoryItem[];
  integrationsSettings: IntegrationsConsoleSettings | undefined;
  
  // Setters
  setCurrentView: (view: ViewMode) => void;
  setCurrentTheme: (theme: StudioTheme) => void;
  setActiveRepoContext: (context: ActiveRepoContext | null) => void;
  setRepoHistory: (history: RepoHistoryItem[]) => void;
  setArticleHistory: (history: ArticleHistoryItem[]) => void;
  setIntegrationsSettings: (settings: IntegrationsConsoleSettings | undefined) => void;
  
  // Actions
  addRepoHistory: (item: RepoHistoryItem) => void;
  addArticleHistory: (item: ArticleHistoryItem) => void;
  loadFromSession: () => void;
}

const getInitialState = () => {
  const session = loadUserSession();
  return {
    currentView: session?.currentView || ViewMode.HOME,
    currentTheme: session?.theme || getStoredTheme(),
    activeRepoContext: session?.activeRepoContext || null,
    repoHistory: session?.repoHistory || [],
    articleHistory: session?.articleHistory || [],
    integrationsSettings: session?.integrationsSettings,
  };
};

export const useStudioStore = create<StudioState>((set, get) => ({
  ...getInitialState(),

  setCurrentView: (currentView) => {
    set({ currentView });
    saveUserSession({ currentView });
  },

  setCurrentTheme: (currentTheme) => {
    set({ currentTheme });
    applyTheme(currentTheme);
    saveUserSession({ theme: currentTheme });
  },

  setActiveRepoContext: (activeRepoContext) => {
    set({ activeRepoContext });
    saveActiveRepoContext(activeRepoContext);
  },

  setRepoHistory: (repoHistory) => {
    set({ repoHistory });
    saveRepoHistory(repoHistory);
  },

  setArticleHistory: (articleHistory) => {
    set({ articleHistory });
    saveArticleHistory(articleHistory);
  },

  setIntegrationsSettings: (integrationsSettings) => {
    set({ integrationsSettings });
    if (integrationsSettings) {
      saveIntegrationsSettings(integrationsSettings);
    }
  },

  addRepoHistory: (item) => {
    const updated = [item, ...get().repoHistory];
    set({ repoHistory: updated });
    saveRepoHistory(updated);
  },

  addArticleHistory: (item) => {
    const updated = [item, ...get().articleHistory];
    set({ articleHistory: updated });
    saveArticleHistory(updated);
  },

  loadFromSession: () => {
    set(getInitialState());
  }
}));

// Synchronize state on session import or reset events
subscribeToSessionUpdates((event) => {
  if (event.type === 'session_imported' || event.type === 'session_cleared') {
    useStudioStore.getState().loadFromSession();
  }
});
