/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { 
  UserSessionData, 
  ActiveRepoContext, 
  AiAssistantSettings, 
  PlanCreatorSettings, 
  CodemapSettings, 
  RepoAnalyzerSettings, 
  ArticleInfographicSettings,
  A2UISettings,
  IntegrationsConsoleSettings,
  RepoHistoryItem,
  ArticleHistoryItem,
  ViewMode,
  ChatMessage,
  ImplementationPlan
} from '../types';

const STORAGE_KEY_PREFIX = 'link2ink_studio_';
const SESSION_STORAGE_KEY = `${STORAGE_KEY_PREFIX}session_v1`;
const BACKUP_VERSION = 1;

/**
 * Helper to safely check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__link2ink_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('[StorageService] LocalStorage is unavailable or restricted in this environment.', e);
    return false;
  }
};

/**
 * Custom JSON Reviver to reconstitute Date objects
 */
const dateReviver = (key: string, value: any) => {
  const dateKeys = ['date', 'timestamp', 'createdAt', 'lastSavedAt', 'lastLoadedAt'];
  if (dateKeys.includes(key) && typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return value;
};

/**
 * Save complete or partial user session
 */
export const saveUserSession = (partialData: Partial<UserSessionData>): boolean => {
  if (!isLocalStorageAvailable()) return false;

  try {
    const existing = loadUserSession() || createInitialSession();
    
    // Prepare updated session
    const updated: UserSessionData = {
      ...existing,
      ...partialData,
      version: BACKUP_VERSION,
      lastSavedAt: Date.now()
    };

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    dispatchSessionEvent('session_saved', updated);
    return true;
  } catch (error) {
    console.error('[StorageService] Error saving user session:', error);
    return false;
  }
};

/**
 * Load complete user session
 */
export const loadUserSession = (): UserSessionData | null => {
  if (!isLocalStorageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: UserSessionData = JSON.parse(raw, dateReviver);

    // Rehydrate Dates if any are still plain strings
    if (parsed.repoHistory) {
      parsed.repoHistory = parsed.repoHistory.map(item => ({
        ...item,
        date: item.date instanceof Date ? item.date : new Date(item.date)
      }));
    }

    if (parsed.articleHistory) {
      parsed.articleHistory = parsed.articleHistory.map(item => ({
        ...item,
        date: item.date instanceof Date ? item.date : new Date(item.date)
      }));
    }

    if (parsed.aiAssistantSettings?.messages) {
      parsed.aiAssistantSettings.messages = parsed.aiAssistantSettings.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
      }));
    }

    if (parsed.planCreatorSettings?.currentPlan?.createdAt) {
      parsed.planCreatorSettings.currentPlan.createdAt = 
        parsed.planCreatorSettings.currentPlan.createdAt instanceof Date 
          ? parsed.planCreatorSettings.currentPlan.createdAt 
          : new Date(parsed.planCreatorSettings.currentPlan.createdAt);
    }

    return parsed;
  } catch (error) {
    console.error('[StorageService] Error parsing loaded user session:', error);
    return null;
  }
};

/**
 * Save Active Repository Context (Shared across all tools)
 */
export const saveActiveRepoContext = (context: ActiveRepoContext | null): boolean => {
  return saveUserSession({ activeRepoContext: context });
};

/**
 * Load Active Repository Context
 */
export const loadActiveRepoContext = (): ActiveRepoContext | null => {
  const session = loadUserSession();
  return session?.activeRepoContext || null;
};

/**
 * Save AI Assistant Tool Settings & Chat
 */
export const saveAiAssistantSettings = (settings: AiAssistantSettings): boolean => {
  return saveUserSession({ aiAssistantSettings: settings });
};

/**
 * Save Plan Creator Settings & Current Plan
 */
export const savePlanCreatorSettings = (settings: PlanCreatorSettings): boolean => {
  return saveUserSession({ planCreatorSettings: settings });
};

/**
 * Save Codemap Settings & Search State
 */
export const saveCodemapSettings = (settings: CodemapSettings): boolean => {
  return saveUserSession({ codemapSettings: settings });
};

/**
 * Save Repo Analyzer Form & Style Settings
 */
export const saveRepoAnalyzerSettings = (settings: RepoAnalyzerSettings): boolean => {
  return saveUserSession({ repoAnalyzerSettings: settings });
};

/**
 * Save Article Infographic Settings
 */
export const saveArticleInfographicSettings = (settings: ArticleInfographicSettings): boolean => {
  return saveUserSession({ articleInfographicSettings: settings });
};

export const saveA2UISettings = (settings: A2UISettings): boolean => {
  return saveUserSession({ a2uiSettings: settings });
};

export const saveIntegrationsSettings = (settings: IntegrationsConsoleSettings): boolean => {
  return saveUserSession({ integrationsSettings: settings });
};

/**
 * Save History Items
 */
export const saveRepoHistory = (history: RepoHistoryItem[]): boolean => {
  return saveUserSession({ repoHistory: history });
};

export const saveArticleHistory = (history: ArticleHistoryItem[]): boolean => {
  return saveUserSession({ articleHistory: history });
};

/**
 * Reset / Clear all stored Link2Ink session data
 */
export const clearAllSessionData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;

  try {
    // Remove main session key
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    
    // Clear any prefixed auxiliary items
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => window.localStorage.removeItem(k));

    dispatchSessionEvent('session_cleared', null);
    return true;
  } catch (error) {
    console.error('[StorageService] Error clearing session data:', error);
    return false;
  }
};

/**
 * Export current session as downloadable JSON string
 */
export const exportSessionAsJson = (): string => {
  const session = loadUserSession() || createInitialSession();
  return JSON.stringify(session, null, 2);
};

/**
 * Trigger browser download of session JSON file
 */
export const downloadSessionJsonFile = (customFilename?: string): { success: boolean; filename: string; sizeKb: string } => {
  try {
    const session = loadUserSession() || createInitialSession();
    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const sizeKb = (blob.size / 1024).toFixed(1);

    const safeRepoName = session.activeRepoContext?.repoName
      ? session.activeRepoContext.repoName.replace(/[^a-zA-Z0-9-_]/g, '_')
      : 'workspace';

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = customFilename || `link2ink-session-${safeRepoName}-${dateStr}.json`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename, sizeKb };
  } catch (error) {
    console.error('[StorageService] Error triggering download:', error);
    return { success: false, filename: '', sizeKb: '0' };
  }
};

/**
 * Get quick metrics and stats for session export
 */
export const getSessionExportStats = () => {
  const session = loadUserSession() || createInitialSession();
  const jsonStr = JSON.stringify(session);
  const sizeBytes = new Blob([jsonStr]).size;
  const sizeKb = (sizeBytes / 1024).toFixed(1);

  return {
    sizeKb,
    hasActiveRepo: !!session.activeRepoContext?.repoName,
    repoName: session.activeRepoContext?.repoName || null,
    fileCount: session.activeRepoContext?.fileTree?.length || 0,
    chatMessageCount: session.aiAssistantSettings?.messages?.length || 0,
    hasPlan: !!session.planCreatorSettings?.currentPlan,
    planMilestoneCount: session.planCreatorSettings?.currentPlan?.milestones?.length || 0,
    historyCount: (session.repoHistory?.length || 0) + (session.articleHistory?.length || 0),
    lastSavedAt: session.lastSavedAt
  };
};

/**
 * Import and restore session from JSON string
 */
export const importSessionFromJson = (jsonStr: string): { success: boolean; error?: string } => {
  try {
    const parsed = JSON.parse(jsonStr, dateReviver);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON session data format.' };
    }

    saveUserSession(parsed);
    dispatchSessionEvent('session_imported', parsed);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse JSON file.' };
  }
};

/**
 * Initial empty fallback session
 */
export const createInitialSession = (): UserSessionData => {
  return {
    version: BACKUP_VERSION,
    lastSavedAt: Date.now(),
    currentView: ViewMode.HOME,
    introSeen: false,
    activeRepoContext: null,
    repoHistory: [],
    articleHistory: []
  };
};

/**
 * Custom Browser Event Dispatcher for Cross-Component Sync
 */
const dispatchSessionEvent = (type: string, detail: any) => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('link2ink_session_update', {
          detail: { type, data: detail, timestamp: Date.now() }
        }));
      } catch (e) {
        // Ignore if CustomEvent is restricted
      }
    }, 0);
  }
};

/**
 * Listen for session updates
 */
export const subscribeToSessionUpdates = (callback: (event: { type: string; data: any }) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener('link2ink_session_update', handler);
  return () => {
    window.removeEventListener('link2ink_session_update', handler);
  };
};
