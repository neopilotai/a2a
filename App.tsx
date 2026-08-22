/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import RepoAnalyzer from './components/RepoAnalyzer';
import ArticleToInfographic from './components/ArticleToInfographic';
import Home from './components/Home';
import IntroAnimation from './components/IntroAnimation';
import Codemap from './components/Codemap';
import AiAssistant from './components/AiAssistant';
import PlanCreator from './components/PlanCreator';
import { A2UIStudio } from './components/a2ui/A2UIStudio';
import { IntegrationsConsole } from './components/IntegrationsConsole';
import { ChangeStackStudio } from './components/ChangeStackStudio';
import SessionStatusModal from './components/SessionStatusModal';
import SessionIndicator from './components/SessionIndicator';
import { ThemeSelector } from './components/ThemeSelector';
import { GlobalRepoSearchBar } from './components/GlobalRepoSearchBar';
import { A2aCompanionHUD } from './components/a2a/A2aCompanionHUD';
import { 
  loadUserSession, 
  saveUserSession, 
  saveActiveRepoContext, 
  saveRepoHistory, 
  saveArticleHistory,
  saveIntegrationsSettings,
  subscribeToSessionUpdates
} from './services/storageService';
import { getStoredTheme, applyTheme } from './services/themeService';
import { ViewMode, RepoHistoryItem, ArticleHistoryItem, RepoFileTree, ActiveRepoContext, IntegrationsConsoleSettings, StudioTheme } from './types';
import { 
  Github, 
  PenTool, 
  GitBranch, 
  FileText, 
  Home as HomeIcon, 
  Network, 
  Bot, 
  ClipboardList,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Terminal,
  Layers
} from 'lucide-react';

export const App: React.FC = () => {
  // Initialize state from local storage session if available
  const initialSession = loadUserSession();

  const [currentView, setCurrentView] = useState<ViewMode>(
    initialSession?.currentView || ViewMode.HOME
  );
  const [showIntro, setShowIntro] = useState(
    initialSession ? !initialSession.introSeen : true
  );

  // Studio Theme State ('architect' | 'blueprint' | 'draft')
  const [currentTheme, setCurrentTheme] = useState<StudioTheme>(
    initialSession?.theme || getStoredTheme()
  );
  
  // Shared Active Codebase Context across tools
  const [activeRepoContext, setActiveRepoContext] = useState<ActiveRepoContext | null>(
    initialSession?.activeRepoContext || null
  );

  // Lifted History State for Persistence
  const [repoHistory, setRepoHistory] = useState<RepoHistoryItem[]>(
    initialSession?.repoHistory || []
  );
  const [articleHistory, setArticleHistory] = useState<ArticleHistoryItem[]>(
    initialSession?.articleHistory || []
  );
  const [integrationsSettings, setIntegrationsSettings] = useState<IntegrationsConsoleSettings | undefined>(
    initialSession?.integrationsSettings
  );

  // Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Initialize and apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (newTheme: StudioTheme) => {
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  // Auto-save whenever top-level persistent state changes
  useEffect(() => {
    saveUserSession({
      currentView,
      introSeen: true,
      theme: currentTheme,
      activeRepoContext,
      repoHistory,
      articleHistory,
      integrationsSettings
    });
  }, [currentView, currentTheme, activeRepoContext, repoHistory, articleHistory, integrationsSettings]);

  // Subscribe to external session updates (e.g. import or clear)
  useEffect(() => {
    const unsubscribe = subscribeToSessionUpdates((event) => {
      if (event.type === 'session_imported' || event.type === 'session_cleared') {
        const fresh = loadUserSession();
        setCurrentView(fresh?.currentView || ViewMode.HOME);
        setActiveRepoContext(fresh?.activeRepoContext || null);
        setRepoHistory(fresh?.repoHistory || []);
        setArticleHistory(fresh?.articleHistory || []);
      }
    });
    return unsubscribe;
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    saveUserSession({ introSeen: true });
  };

  const handleNavigate = (mode: ViewMode, data?: any) => {
    if (data?.repoName && data?.fileTree) {
      const newContext = {
        repoName: data.repoName,
        fileTree: data.fileTree,
        lastLoadedAt: Date.now(),
        selectedFilePath: data.selectedFilePath
      };
      setActiveRepoContext(newContext);
      saveActiveRepoContext(newContext);
    } else if (data?.selectedFilePath && activeRepoContext) {
      const updatedContext = {
        ...activeRepoContext,
        selectedFilePath: data.selectedFilePath
      };
      setActiveRepoContext(updatedContext);
      saveActiveRepoContext(updatedContext);
    }
    setCurrentView(mode);
  };

  const handleAddRepoHistory = (item: RepoHistoryItem) => {
    setRepoHistory(prev => {
      const updated = [item, ...prev];
      saveRepoHistory(updated);
      return updated;
    });
  };

  const handleAddArticleHistory = (item: ArticleHistoryItem) => {
    setArticleHistory(prev => {
      const updated = [item, ...prev];
      saveArticleHistory(updated);
      return updated;
    });
  };

  const handleSessionReloaded = () => {
    const fresh = loadUserSession();
    setCurrentView(fresh?.currentView || ViewMode.HOME);
    setActiveRepoContext(fresh?.activeRepoContext || null);
    setRepoHistory(fresh?.repoHistory || []);
    setArticleHistory(fresh?.articleHistory || []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-6">
          {/* Left: Studio Branding & View Selector */}
          <div className="flex items-center gap-3 lg:gap-6 shrink-0">
            <button 
              onClick={() => setCurrentView(ViewMode.HOME)}
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-90 shrink-0"
              title="Link2Ink Studio Dashboard"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-base font-extrabold text-white tracking-tight font-sans">Link2Ink</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-[10px] font-mono font-bold text-violet-300 border border-violet-500/30">
                    STUDIO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">AI ARCHITECT</span>
                </div>
              </div>
            </button>

            {/* Studio Navigation Quick Pills (Desktop) */}
            <nav className="hidden xl:flex items-center gap-1 bg-white/[0.03] border border-white/10 p-1 rounded-xl">
              {[
                { id: ViewMode.HOME, label: 'Overview', icon: HomeIcon },
                { id: ViewMode.CHANGE_STACK, label: 'Change Stack', icon: Layers },
                { id: ViewMode.CODEMAP, label: 'Codemap', icon: Network },
                { id: ViewMode.REPO_ANALYZER, label: 'Repo Analyzer', icon: GitBranch },
                { id: ViewMode.PLAN_CREATOR, label: 'Plan Creator', icon: ClipboardList },
                { id: ViewMode.AI_ASSISTANT, label: 'AI Architect', icon: Bot },
                { id: ViewMode.INTEGRATIONS, label: 'Integrations', icon: Terminal },
                { id: ViewMode.ARTICLE_INFOGRAPHIC, label: 'Infographics', icon: FileText },
                { id: ViewMode.A2UI_STUDIO, label: 'A2UI Studio', icon: Sparkles }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Center: Global Repository Search & Quick Command Palette */}
          <div className="flex-1 max-w-xl hidden md:block">
            <GlobalRepoSearchBar 
              activeRepoContext={activeRepoContext}
              onNavigate={handleNavigate}
              onSelectRepoForContext={(repoName, fileTree) => {
                const newContext = {
                  repoName,
                  fileTree,
                  lastLoadedAt: Date.now()
                };
                setActiveRepoContext(newContext);
                saveActiveRepoContext(newContext);
              }}
            />
          </div>

          {/* Right: Context Info, Workspace Session & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Active Repo Context Pill */}
            {activeRepoContext?.repoName ? (
              <button
                onClick={() => setShowSessionModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/40 text-xs font-mono text-slate-200 transition-all shadow-sm"
                title="Active Workspace Context (Click to manage session)"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400 text-[11px] hidden 2xl:inline">Workspace:</span>
                <span className="text-violet-300 font-bold truncate max-w-[110px] sm:max-w-[160px]">
                  {activeRepoContext.repoName}
                </span>
              </button>
            ) : null}

            {/* Studio Visual Theme Selector ('Architect' | 'Blueprint' | 'Draft') */}
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            {/* Session Indicator */}
            <SessionIndicator 
              activeRepoContext={activeRepoContext}
              onOpenSessionModal={() => setShowSessionModal(true)}
            />

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-white/[0.08] transition-all"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Navigation Tabs (Sticky bar visible on all non-home views) */}
        {currentView !== ViewMode.HOME && (
          <div className="w-full flex justify-center mb-6 animate-in fade-in slide-in-from-top-4 sticky top-24 z-40 px-2">
            <div className="glass-panel p-1 md:p-1.5 rounded-2xl md:rounded-full flex flex-wrap justify-center items-center gap-1 relative shadow-2xl border border-white/10 bg-slate-950/80 backdrop-blur-md max-w-full sm:max-w-fit overflow-x-auto">
              <button
                onClick={() => setCurrentView(ViewMode.HOME)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl md:rounded-full font-medium text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                title="Home"
              >
                <HomeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>

              <div className="hidden md:block w-px h-5 bg-white/10 my-auto mx-0.5" />

              {/* Change Stack Studio */}
              <button
                onClick={() => setCurrentView(ViewMode.CHANGE_STACK)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.CHANGE_STACK
                    ? 'text-violet-200 bg-violet-600/30 border border-violet-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4 text-violet-400" />
                <span>Change Stack</span>
              </button>

              {/* Codemap */}
              <button
                onClick={() => setCurrentView(ViewMode.CODEMAP)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.CODEMAP
                    ? 'text-indigo-200 bg-indigo-600/30 border border-indigo-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Network className="w-4 h-4 text-indigo-400" />
                <span>Codemap</span>
              </button>

              {/* AI Assistant */}
              <button
                onClick={() => setCurrentView(ViewMode.AI_ASSISTANT)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.AI_ASSISTANT
                    ? 'text-violet-200 bg-violet-600/30 border border-violet-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Bot className="w-4 h-4 text-violet-400" />
                <span>AI Assistant</span>
              </button>

              {/* Plan Creator */}
              <button
                onClick={() => setCurrentView(ViewMode.PLAN_CREATOR)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.PLAN_CREATOR
                    ? 'text-fuchsia-200 bg-fuchsia-600/30 border border-fuchsia-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-fuchsia-400" />
                <span>Plan Creator</span>
              </button>

              {/* Integrations Console */}
              <button
                onClick={() => setCurrentView(ViewMode.INTEGRATIONS)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.INTEGRATIONS
                    ? 'text-cyan-200 bg-cyan-600/30 border border-cyan-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Integrations</span>
              </button>

              {/* A2UI Studio */}
              <button
                onClick={() => setCurrentView(ViewMode.A2UI_STUDIO)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.A2UI_STUDIO
                    ? 'text-indigo-200 bg-indigo-600/30 border border-indigo-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>A2UI Studio</span>
              </button>

              <div className="hidden md:block w-px h-5 bg-white/10 my-auto mx-0.5" />

              {/* GitFlow Blueprint */}
              <button
                onClick={() => setCurrentView(ViewMode.REPO_ANALYZER)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.REPO_ANALYZER
                    ? 'text-sky-200 bg-sky-600/30 border border-sky-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <GitBranch className="w-4 h-4 text-sky-400" />
                <span>GitFlow</span>
              </button>

              {/* SiteSketch Infographics */}
              <button
                onClick={() => setCurrentView(ViewMode.ARTICLE_INFOGRAPHIC)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl md:rounded-full font-medium text-xs transition-all font-mono ${
                  currentView === ViewMode.ARTICLE_INFOGRAPHIC
                    ? 'text-emerald-200 bg-emerald-600/30 border border-emerald-500/50 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>SiteSketch</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 w-full">
          {currentView === ViewMode.HOME && (
            <Home 
              onNavigate={handleNavigate}
              activeRepoContext={activeRepoContext}
              repoHistory={repoHistory}
              onSelectRepoForContext={(repoName, fileTree) => setActiveRepoContext({ repoName, fileTree })}
            />
          )}

          {currentView === ViewMode.CHANGE_STACK && (
            <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
              <ChangeStackStudio 
                activeRepoContext={activeRepoContext}
                repoHistory={repoHistory}
                onNavigate={handleNavigate}
                onBack={() => setCurrentView(ViewMode.HOME)}
              />
            </div>
          )}

          {currentView === ViewMode.CODEMAP && (
            <Codemap 
              initialRepoContext={activeRepoContext}
              onNavigate={handleNavigate}
              onSelectRepoForContext={(repoName, fileTree) => setActiveRepoContext({ repoName, fileTree })}
            />
          )}

          {currentView === ViewMode.AI_ASSISTANT && (
            <AiAssistant 
              initialRepoContext={activeRepoContext}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === ViewMode.PLAN_CREATOR && (
            <PlanCreator 
              initialRepoContext={activeRepoContext}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === ViewMode.INTEGRATIONS && (
            <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
              <IntegrationsConsole 
                activeRepoContext={activeRepoContext}
                repoHistory={repoHistory}
                settings={integrationsSettings}
                onSaveSettings={(newSettings) => {
                  setIntegrationsSettings(newSettings);
                  saveIntegrationsSettings(newSettings);
                }}
                onNavigate={handleNavigate}
                onBack={() => setCurrentView(ViewMode.HOME)}
              />
            </div>
          )}

          {currentView === ViewMode.A2UI_STUDIO && (
            <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
              <A2UIStudio 
                activeRepoContext={activeRepoContext}
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {currentView === ViewMode.REPO_ANALYZER && (
            <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
              <RepoAnalyzer 
                onNavigate={handleNavigate} 
                history={repoHistory} 
                onAddToHistory={handleAddRepoHistory}
                onSelectRepoForContext={(repoName, fileTree) => {
                  const newContext = {
                    repoName,
                    fileTree,
                    lastLoadedAt: Date.now()
                  };
                  setActiveRepoContext(newContext);
                  saveActiveRepoContext(newContext);
                }}
              />
            </div>
          )}

          {currentView === ViewMode.ARTICLE_INFOGRAPHIC && (
            <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
              <ArticleToInfographic 
                history={articleHistory} 
                onAddToHistory={handleAddArticleHistory}
              />
            </div>
          )}
        </div>
      </main>

      {/* Session Storage & Backup Management Modal */}
      <SessionStatusModal 
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSessionReloaded={handleSessionReloaded}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Persistent a2a Adaptive Companion HUD */}
      <A2aCompanionHUD 
        currentView={currentView}
        onNavigate={handleNavigate}
        activeRepoContext={activeRepoContext}
      />

      <footer className="py-6 mt-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center px-4">
          <p className="text-xs font-mono text-slate-500">
            <span className="text-violet-400">link2ink</span> &bull; Powered by Google Gemini 3.7 & 3.1 Suite
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
