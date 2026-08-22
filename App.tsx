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
import { PerformanceHud } from './components/PerformanceHud';
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
  Layers,
  ChevronDown
} from 'lucide-react';

import { useStudioStore } from './store';

export const App: React.FC = () => {
  const {
    currentView,
    currentTheme,
    activeRepoContext,
    repoHistory,
    articleHistory,
    integrationsSettings,
    setCurrentView,
    setCurrentTheme,
    setActiveRepoContext,
    addRepoHistory,
    addArticleHistory,
    setIntegrationsSettings,
    loadFromSession,
  } = useStudioStore();

  const initialSession = loadUserSession();
  const [showIntro, setShowIntro] = useState(
    initialSession ? !initialSession.introSeen : true
  );

  // Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  // Initialize and apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (newTheme: StudioTheme) => {
    setCurrentTheme(newTheme);
  };

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
    } else if (data?.selectedFilePath && activeRepoContext) {
      const updatedContext = {
        ...activeRepoContext,
        selectedFilePath: data.selectedFilePath
      };
      setActiveRepoContext(updatedContext);
    }
    setCurrentView(mode);
  };

  const handleAddRepoHistory = (item: RepoHistoryItem) => {
    addRepoHistory(item);
  };

  const handleAddArticleHistory = (item: ArticleHistoryItem) => {
    addArticleHistory(item);
  };

  const handleSessionReloaded = () => {
    loadFromSession();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-xl transition-all">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Left: Studio Branding & View Selector */}
          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            <button 
              onClick={() => {
                setCurrentView(ViewMode.HOME);
                setIsWorkspaceDropdownOpen(false);
              }}
              className="flex items-center gap-3 group transition-all hover:opacity-95 shrink-0"
              title="Remix A2A Studio Dashboard"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-base font-extrabold text-white tracking-tight font-sans">Remix A2A</span>
                  <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-[10px] font-mono font-bold text-violet-300 border border-violet-500/30">
                    A2A STUDIO
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">LINK2INK AI ARCHITECT</span>
                </div>
              </div>
            </button>

            {/* Main Navigation Bar */}
            <nav className="flex items-center gap-2 bg-slate-900/90 border border-white/10 p-2 rounded-xl">
              {/* Primary Elevated Link: Overview */}
              <button
                onClick={() => {
                  setCurrentView(ViewMode.HOME);
                  setIsWorkspaceDropdownOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  currentView === ViewMode.HOME
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md border border-violet-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <HomeIcon className="w-4 h-4 text-cyan-300" />
                <span>Overview</span>
              </button>

              <div className="h-4 w-px bg-white/10 my-auto mx-2" />

              {/* Studio Workspace Consolidated Dropdown */}
              <div className="relative">
                {(() => {
                  const workspaceTools = [
                    { id: ViewMode.CHANGE_STACK, label: 'Change Stack', icon: Layers, desc: 'Interactive commit & patch stack' },
                    { id: ViewMode.AI_ASSISTANT, label: 'AI Architect', icon: Bot, desc: 'Gemini reasoning & chat assistant' },
                    { id: ViewMode.REPO_ANALYZER, label: 'GitFlow', icon: GitBranch, desc: 'Repository structure & flow' },
                    { id: ViewMode.CODEMAP, label: 'Codemap', icon: Network, desc: 'Visual dependency graph' },
                    { id: ViewMode.PLAN_CREATOR, label: 'Plan Creator', icon: ClipboardList, desc: 'Action plan builder' },
                    { id: ViewMode.INTEGRATIONS, label: 'Integrations', icon: Terminal, desc: 'AutoFixAgent & CLI Terminal' },
                    { id: ViewMode.ARTICLE_INFOGRAPHIC, label: 'SiteSketch', icon: FileText, desc: 'Infographic & site generator' },
                    { id: ViewMode.A2UI_STUDIO, label: 'A2UI Studio', icon: Sparkles, desc: 'Adaptive AI component workbench' }
                  ];

                  const activeTool = workspaceTools.find(t => t.id === currentView);
                  const isWorkspaceActive = Boolean(activeTool);

                  return (
                    <>
                      <button
                        onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                          isWorkspaceActive
                            ? 'bg-violet-600/30 text-violet-200 border border-violet-500/50 shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-violet-400" />
                        <span>{activeTool ? activeTool.label : 'Studio Workspace'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isWorkspaceDropdownOpen ? 'rotate-180 text-violet-300' : 'text-slate-400'}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isWorkspaceDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 p-2 rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 space-y-2">
                          <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-white/5 flex items-center justify-between">
                            <span>Studio Workspace Modules</span>
                            <span className="text-violet-400 text-[9px]">{workspaceTools.length} Modules</span>
                          </div>
                          {workspaceTools.map((tool) => {
                            const IconComponent = tool.icon;
                            const isToolActive = currentView === tool.id;
                            return (
                              <button
                                key={tool.id}
                                onClick={() => {
                                  setCurrentView(tool.id);
                                  setIsWorkspaceDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-lg text-xs font-mono transition-all flex items-start gap-3 ${
                                  isToolActive
                                    ? 'bg-violet-600/30 text-violet-200 font-semibold border border-violet-500/30'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                <div className={`p-2 rounded-md shrink-0 ${isToolActive ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold truncate">{tool.label}</span>
                                    {isToolActive && <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-sans truncate mt-1">{tool.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </nav>
          </div>

          {/* Center: Global Repository Search & Quick Command Palette */}
          <div className="flex-1 max-w-xl hidden md:block">
            <GlobalRepoSearchBar 
              onNavigate={handleNavigate}
            />
          </div>

          {/* Right: Context Info, Workspace Session & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Active Repo Context Pill */}
            {activeRepoContext?.repoName ? (
              <button
                onClick={() => setShowSessionModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/40 text-xs font-mono text-slate-200 transition-all shadow-sm"
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

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Session Indicator */}
            <SessionIndicator 
              activeRepoContext={activeRepoContext}
              onOpenSessionModal={() => setShowSessionModal(true)}
            />

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

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

      <main className="flex-1 w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-8 py-8">
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

      {/* Floating Real-Time Performance & Web Worker HUD */}
      <PerformanceHud />

      <footer className="py-8 mt-auto border-t border-white/5">
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto text-center px-4 sm:px-8 lg:px-8">
          <p className="text-xs font-mono text-slate-500">
            <span className="text-violet-400">link2ink</span> &bull; Powered by Google Gemini 3.7 & 3.1 Suite
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
