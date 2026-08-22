/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ActiveRepoContext, 
  RepoHistoryItem, 
  RepoFileTree,
  IntegrationsConsoleSettings, 
  IntegrationConsoleTab, 
  IdeType, 
  VibePlatformType, 
  CodebaseCatalogItem, 
  CliCommandLog, 
  ViewMode 
} from '../types';
import { 
  getUnifiedCodebaseCatalog,
  FLAGSHIP_CODEBASES
} from '../services/integrationService';
import { 
  IntegrationsCodebaseSelector 
} from './integrations/IntegrationsCodebaseSelector';
import { 
  CliConsoleTerminal 
} from './integrations/CliConsoleTerminal';
import { 
  IdeExtensionsHub 
} from './integrations/IdeExtensionsHub';
import { 
  VibePlatformsDeck 
} from './integrations/VibePlatformsDeck';
import { 
  McpInspectorStudio 
} from './integrations/McpInspectorStudio';
import { 
  CicdFirewallHub 
} from './integrations/CicdFirewallHub';
import { 
  AiBridgeGenerator 
} from './integrations/AiBridgeGenerator';
import { 
  AutoFixAgent 
} from './integrations/AutoFixAgent';
import { 
  ArrowLeft, 
  Terminal, 
  Code2, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Bot, 
  Layers, 
  Network, 
  FileText, 
  Sliders, 
  Download, 
  ExternalLink,
  Cpu,
  Wrench
} from 'lucide-react';

import { useStudioStore } from '../store';

interface IntegrationsConsoleProps {
  onNavigate: (mode: ViewMode, data?: any) => void;
  onBack: () => void;
}

export const IntegrationsConsole: React.FC<IntegrationsConsoleProps> = ({
  onNavigate,
  onBack
}) => {
  const { 
    activeRepoContext, 
    repoHistory, 
    integrationsSettings: settings, 
    setIntegrationsSettings 
  } = useStudioStore();

  const [customCodebases, setCustomCodebases] = useState<CodebaseCatalogItem[]>([]);
  
  // Build unified codebase catalog
  const catalog = useMemo(() => {
    return getUnifiedCodebaseCatalog(activeRepoContext, repoHistory, customCodebases);
  }, [activeRepoContext, repoHistory, customCodebases]);

  // Active Codebase
  const [selectedCodebaseId, setSelectedCodebaseId] = useState<string>(
    settings?.activeCodebaseId || catalog[0]?.id || 'workspace-active'
  );

  const selectedCodebase = useMemo(() => {
    return catalog.find(c => c.id === selectedCodebaseId) || catalog[0] || FLAGSHIP_CODEBASES[0];
  }, [catalog, selectedCodebaseId]);

  // Tab State
  const [activeTab, setActiveTab] = useState<IntegrationConsoleTab>(
    settings?.activeTab || 'auto_fix'
  );

  // Sub-feature states
  const [selectedIde, setSelectedIde] = useState<IdeType>(
    settings?.selectedIde || 'cursor'
  );

  const [selectedPlatform, setSelectedPlatform] = useState<VibePlatformType>(
    settings?.selectedPlatform || 'v0'
  );

  const [vibeOptions, setVibeOptions] = useState({
    includeFileTree: settings?.vibeOptions?.includeFileTree ?? true,
    includeAntiSlop: settings?.vibeOptions?.includeAntiSlop ?? true,
    includeContracts: settings?.vibeOptions?.includeContracts ?? true,
    includeDagFlow: settings?.vibeOptions?.includeDagFlow ?? true,
    tokenBudget: settings?.vibeOptions?.tokenBudget || 'standard'
  });

  const [commandHistory, setCommandHistory] = useState<CliCommandLog[]>(
    settings?.commandHistory || []
  );

  // Sync to persistence when state changes
  useEffect(() => {
    setIntegrationsSettings({
      activeTab,
      activeCodebaseId: selectedCodebase.id,
      selectedIde,
      selectedPlatform,
      vibeOptions,
      commandHistory
    });
  }, [activeTab, selectedCodebase.id, selectedIde, selectedPlatform, vibeOptions, commandHistory]);

  const handleAddCustomCodebase = (repoName: string, fileTree: RepoFileTree[]) => {
    const isPython = fileTree.some(f => f.path.endsWith('.py'));
    const isGo = fileTree.some(f => f.path.endsWith('.go'));
    const isRust = fileTree.some(f => f.path.endsWith('.rs'));

    let lang = 'TypeScript';
    let framework = 'React / Node.js';
    if (isPython) { lang = 'Python'; framework = 'FastAPI / Django'; }
    else if (isGo) { lang = 'Go'; framework = 'Gin / Standard Library'; }
    else if (isRust) { lang = 'Rust'; framework = 'Actix / Axum'; }

    const newCodebase: CodebaseCatalogItem = {
      id: `custom-${repoName.replace('/', '-')}`,
      repoName,
      displayName: repoName,
      description: `Custom connected repository with ${fileTree.length} indexed files.`,
      primaryLanguage: lang,
      framework,
      category: 'custom',
      sampleFileTree: fileTree,
      tags: ['custom', lang.toLowerCase(), 'connected']
    };

    setCustomCodebases(prev => [newCodebase, ...prev]);
    setSelectedCodebaseId(newCodebase.id);
  };

  const handleCommandExecuted = (log: CliCommandLog) => {
    setCommandHistory(prev => [...prev.slice(-30), log]);
  };

  const handleClearHistory = () => {
    setCommandHistory([]);
  };

  const TAB_DEFINITIONS: { id: IntegrationConsoleTab; label: string; icon: React.FC<any>; badge?: string }[] = [
    { id: 'auto_fix', label: 'AI Auto-Fix Agent', icon: Wrench, badge: 'Smart Doctor' },
    { id: 'cli', label: 'CLI Terminal', icon: Terminal, badge: '$ a2a' },
    { id: 'ide', label: 'IDE Extensions', icon: Code2, badge: 'Cursor / VS Code' },
    { id: 'vibe', label: 'Vibe Platforms', icon: Sparkles, badge: 'v0 / Bolt / Lovable' },
    { id: 'mcp', label: 'MCP Protocol', icon: Zap, badge: 'Claude / Cursor' },
    { id: 'cicd', label: 'CI/CD Firewall', icon: ShieldCheck, badge: 'GitHub Actions' },
    { id: 'ai_bridge', label: 'AI Bridge', icon: Bot, badge: 'Gemini 2.5' }
  ];

  return (
    <div className="w-full space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="relative space-y-8">
        {/* 1. TOP NAVIGATION & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm group"
              title="Return to previous view"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-md">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-tight">
                  Integrations Console
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                  v3.7.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Unified architectural bridge across CLI, IDE extensions, Vibe platforms, MCP servers & CI firewalls.
              </p>
            </div>
          </div>

          {/* Quick Cross-Tool Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(ViewMode.CODEMAP, { repoName: selectedCodebase.repoName, fileTree: selectedCodebase.sampleFileTree })}
              className="px-3 py-2 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Explore topological codemap for this repository"
            >
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span>Interactive Codemap</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate(ViewMode.PLAN_CREATOR, { repoName: selectedCodebase.repoName, fileTree: selectedCodebase.sampleFileTree })}
              className="px-3 py-2 rounded-xl bg-fuchsia-950/50 hover:bg-fuchsia-900/50 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Plan Creator DAG for this repository"
            >
              <FileText className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Plan Creator DAG</span>
            </button>
          </div>
        </div>

        {/* 2. REPOSITORY & CODEBASE SELECTOR */}
        <IntegrationsCodebaseSelector
          catalog={catalog}
          selectedCodebase={selectedCodebase}
          onSelectCodebase={(codebase) => setSelectedCodebaseId(codebase.id)}
          onAddCustomCodebase={handleAddCustomCodebase}
        />

        {/* 3. TABS SWITCHER */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
          {TAB_DEFINITIONS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-950/50 border border-white/20'
                    : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isActive ? 'bg-black/30 text-cyan-200' : 'bg-white/5 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. ACTIVE TAB PANEL CONTENT */}
        <div className="pt-2">
          {activeTab === 'cli' && (
            <CliConsoleTerminal
              codebase={selectedCodebase}
              commandHistory={commandHistory}
              onCommandExecuted={handleCommandExecuted}
              onClearHistory={handleClearHistory}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'ide' && (
            <IdeExtensionsHub
              codebase={selectedCodebase}
              selectedIde={selectedIde}
              onSelectIde={setSelectedIde}
            />
          )}

          {activeTab === 'vibe' && (
            <VibePlatformsDeck
              codebase={selectedCodebase}
              selectedPlatform={selectedPlatform}
              onSelectPlatform={setSelectedPlatform}
              vibeOptions={vibeOptions}
              onUpdateOptions={setVibeOptions}
            />
          )}

          {activeTab === 'mcp' && (
            <McpInspectorStudio
              codebase={selectedCodebase}
            />
          )}

          {activeTab === 'cicd' && (
            <CicdFirewallHub
              codebase={selectedCodebase}
            />
          )}

          {activeTab === 'ai_bridge' && (
            <AiBridgeGenerator
              codebase={selectedCodebase}
            />
          )}

          {activeTab === 'auto_fix' && (
            <AutoFixAgent
              codebase={selectedCodebase}
            />
          )}
        </div>
      </div>
    </div>
  );
};
