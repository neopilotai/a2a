/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CodebaseCatalogItem, 
  VibePlatformType, 
  VibePromptPack 
} from '../../types';
import { 
  generateVibePromptPacks 
} from '../../services/integrationService';
import { 
  Sparkles, 
  Zap, 
  Heart, 
  Terminal, 
  Layers, 
  Cpu, 
  Flame, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  ShieldCheck, 
  Network, 
  FileCode2, 
  CheckCircle2,
  Share2
} from 'lucide-react';

interface VibePlatformsDeckProps {
  codebase: CodebaseCatalogItem;
  selectedPlatform: VibePlatformType;
  onSelectPlatform: (platform: VibePlatformType) => void;
  vibeOptions: {
    includeFileTree: boolean;
    includeAntiSlop: boolean;
    includeContracts: boolean;
    includeDagFlow: boolean;
    tokenBudget: 'compact' | 'standard' | 'maximum';
  };
  onUpdateOptions: (options: any) => void;
}

export const VibePlatformsDeck: React.FC<VibePlatformsDeckProps> = ({
  codebase,
  selectedPlatform,
  onSelectPlatform,
  vibeOptions,
  onUpdateOptions
}) => {
  const packs = generateVibePromptPacks(codebase, vibeOptions);
  const activePack = packs.find(p => p.platform === selectedPlatform) || packs[0];

  const [activeTab, setActiveTab] = useState<'prompt' | 'system' | 'guardrails'>('prompt');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPack = () => {
    const markdown = `# ${activePack.platformName} Prompt Context Pack for ${codebase.repoName}
Stack: ${codebase.primaryLanguage} | ${codebase.framework}
Estimated Tokens: ~${activePack.estimatedTokens}

## System Instruction
\`\`\`
${activePack.systemInstruction}
\`\`\`

## Recommended Guardrails
${activePack.guardrails.map(g => `- ${g}`).join('\n')}

## User Prompt Pack
\`\`\`
${activePack.promptText}
\`\`\`
`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-pack-${activePack.platform}-${codebase.repoName.replace('/', '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPlatformIcon = (platform: VibePlatformType) => {
    switch (platform) {
      case 'v0': return <Sparkles className="w-4 h-4 text-cyan-300" />;
      case 'bolt_new': return <Zap className="w-4 h-4 text-amber-300" />;
      case 'lovable': return <Heart className="w-4 h-4 text-rose-300" />;
      case 'cursor_composer': return <Terminal className="w-4 h-4 text-blue-300" />;
      case 'chatgpt_canvas': return <Layers className="w-4 h-4 text-emerald-300" />;
      case 'claude_artifacts': return <Cpu className="w-4 h-4 text-violet-300" />;
      case 'replit': return <Flame className="w-4 h-4 text-orange-300" />;
      default: return <Sparkles className="w-4 h-4 text-cyan-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP CUSTOMIZER BAR */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Vibe Prompt Context Customizer
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-slate-400">Token Budget:</span>
            {(['compact', 'standard', 'maximum'] as const).map((budget) => (
              <button
                key={budget}
                type="button"
                onClick={() => onUpdateOptions({ ...vibeOptions, tokenBudget: budget })}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                  vibeOptions.tokenBudget === budget
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {budget}
              </button>
            ))}
          </div>
        </div>

        {/* Checkbox Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={vibeOptions.includeFileTree}
              onChange={(e) => onUpdateOptions({ ...vibeOptions, includeFileTree: e.target.checked })}
              className="rounded bg-slate-800 border-white/20 text-violet-600 focus:ring-0"
            />
            <span>Include AST Tree</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={vibeOptions.includeAntiSlop}
              onChange={(e) => onUpdateOptions({ ...vibeOptions, includeAntiSlop: e.target.checked })}
              className="rounded bg-slate-800 border-white/20 text-violet-600 focus:ring-0"
            />
            <span>Anti-Slop Radar</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={vibeOptions.includeContracts}
              onChange={(e) => onUpdateOptions({ ...vibeOptions, includeContracts: e.target.checked })}
              className="rounded bg-slate-800 border-white/20 text-violet-600 focus:ring-0"
            />
            <span>Type Contracts</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={vibeOptions.includeDagFlow}
              onChange={(e) => onUpdateOptions({ ...vibeOptions, includeDagFlow: e.target.checked })}
              className="rounded bg-slate-800 border-white/20 text-violet-600 focus:ring-0"
            />
            <span>DAG Data Flow</span>
          </label>
        </div>
      </div>

      {/* 2. PLATFORM CARDS SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {packs.map((pack) => {
          const isSelected = selectedPlatform === pack.platform;
          return (
            <button
              key={pack.platform}
              type="button"
              onClick={() => onSelectPlatform(pack.platform)}
              className={`p-3 rounded-2xl text-left transition-all border font-mono flex flex-col justify-between gap-2 group ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/60 via-slate-900 to-slate-950 border-cyan-500 shadow-lg shadow-cyan-950/40 text-white'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                {getPlatformIcon(pack.platform)}
                <span className="text-[10px] text-cyan-400 font-semibold">
                  ~{pack.estimatedTokens} tkn
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                  {pack.platformName}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {pack.tagline}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE PROMPT PACK INSPECTOR */}
      {activePack && (
        <div className="rounded-2xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden font-mono text-xs space-y-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              {getPlatformIcon(activePack.platform)}
              <div>
                <span className="font-bold text-white text-xs">{activePack.platformName} Prompt Pack</span>
                <span className="text-[11px] text-slate-400 ml-2">Recommended: {activePack.recommendedModel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'prompt' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'system' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  System
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guardrails')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'guardrails' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Guardrails
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(
                  activeTab === 'prompt' ? activePack.promptText : activeTab === 'system' ? activePack.systemInstruction : activePack.guardrails.join('\n'),
                  activeTab
                )}
                className="px-3 py-1.5 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                {copiedKey === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy {activeTab.toUpperCase()}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPack}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Download prompt pack as markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .md</span>
              </button>
            </div>
          </div>

          {/* Content Viewer */}
          <div className="p-4 sm:p-6 max-h-[500px] overflow-y-auto bg-[#020617] text-slate-200 leading-relaxed font-mono">
            {activeTab === 'prompt' && (
              <pre className="whitespace-pre-wrap select-all selection:bg-cyan-500/30">
                <code>{activePack.promptText}</code>
              </pre>
            )}

            {activeTab === 'system' && (
              <div className="space-y-3">
                <div className="text-slate-400 text-xs">Recommended System Instruction for {activePack.platformName}:</div>
                <pre className="p-4 rounded-xl bg-slate-900 border border-white/10 whitespace-pre-wrap select-all selection:bg-violet-500/30">
                  <code>{activePack.systemInstruction}</code>
                </pre>
              </div>
            )}

            {activeTab === 'guardrails' && (
              <div className="space-y-2.5">
                <div className="text-slate-400 text-xs">Architectural Guardrails Injected into this Pack:</div>
                <div className="space-y-2">
                  {activePack.guardrails.map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-start gap-2.5 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
            <span>Target: {codebase.repoName} ({codebase.framework})</span>
            <span className="text-cyan-400 font-bold">Estimated Tokens: ~{activePack.estimatedTokens}</span>
          </div>
        </div>
      )}
    </div>
  );
};
