/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CodebaseCatalogItem, 
  IdeType, 
  IdeConfigFile 
} from '../../types';
import { 
  generateIdeConfigs 
} from '../../services/integrationService';
import { 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Terminal, 
  BookOpen, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  FolderCode
} from 'lucide-react';

interface IdeExtensionsHubProps {
  codebase: CodebaseCatalogItem;
  selectedIde: IdeType;
  onSelectIde: (ide: IdeType) => void;
}

const IDE_OPTIONS: { id: IdeType; name: string; icon: string; badge: string; desc: string }[] = [
  { id: 'cursor', name: 'Cursor AI', icon: '⚡', badge: 'Rules & MDC', desc: 'Custom .cursorrules & architectural guardrails for Cursor Composer' },
  { id: 'vscode', name: 'VS Code', icon: '🟦', badge: 'Tasks & Config', desc: 'Automated tasks.json, settings.json, and extension recommendations' },
  { id: 'jetbrains', name: 'JetBrains', icon: '🧠', badge: 'IDEA & WebStorm', desc: 'External tool runners for IntelliJ IDEA, WebStorm, and PyCharm' },
  { id: 'zed', name: 'Zed Editor', icon: '⚡', badge: 'Zed Slash Tools', desc: 'High-performance Zed editor language server & formatting setup' },
  { id: 'neovim', name: 'Neovim', icon: '🟩', badge: 'Lua & Lazy.nvim', desc: 'Custom Lua toggleterm keymaps (<leader>as, <leader>ac) for terminal mastery' },
  { id: 'windsurf', name: 'Windsurf', icon: '🌊', badge: 'Cascade Flow', desc: 'Context rules and memory anchors for Windsurf Cascade' }
];

export const IdeExtensionsHub: React.FC<IdeExtensionsHubProps> = ({
  codebase,
  selectedIde,
  onSelectIde
}) => {
  const configs = generateIdeConfigs(selectedIde, codebase);
  const [activeFileId, setActiveFileId] = useState<string>(configs[0]?.id || '');
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);

  const activeConfig = configs.find(c => c.id === activeFileId) || configs[0];

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFileId(id);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  const handleDownload = (file: IdeConfigFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click;
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    configs.forEach(file => {
      handleDownload(file);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. IDE SELECTOR GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {IDE_OPTIONS.map((ide) => {
          const isSelected = selectedIde === ide.id;
          return (
            <button
              key={ide.id}
              type="button"
              onClick={() => {
                onSelectIde(ide.id);
                const nextConfigs = generateIdeConfigs(ide.id, codebase);
                if (nextConfigs[0]) setActiveFileId(nextConfigs[0].id);
              }}
              className={`p-3 rounded-2xl text-left transition-all border font-mono flex flex-col justify-between gap-2 group ${
                isSelected
                  ? 'bg-gradient-to-b from-violet-600/30 to-indigo-600/20 border-violet-500 shadow-lg shadow-violet-950/40 text-white'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{ide.icon}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isSelected ? 'bg-violet-500/30 text-violet-200 border border-violet-400/40' : 'bg-white/5 text-slate-400'
                }`}>
                  {ide.badge}
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                  {ide.name}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {ide.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. MAIN CONFIGURATION WORKSPACE */}
      {activeConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: File Tabs & Features */}
          <div className="lg:col-span-4 space-y-4">
            {/* File List */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderCode className="w-3.5 h-3.5 text-cyan-400" />
                  Generated Config Files
                </span>
                <span className="text-[11px] font-mono text-slate-500">{configs.length} files</span>
              </div>

              <div className="space-y-1.5">
                {configs.map((file) => {
                  const isActive = file.id === activeConfig.id;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setActiveFileId(file.id)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-mono transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-violet-600/30 border border-violet-500/50 text-white font-bold'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode2 className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                        <span className="truncate">{file.filename}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 uppercase">{file.language}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Config Highlights & Features Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Active Invariants
              </span>
              <div className="space-y-1.5">
                {activeConfig.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-mono text-slate-400">Target File Path:</div>
                <code className="block px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-cyan-300 text-xs font-mono truncate">
                  {activeConfig.destinationPath}
                </code>
              </div>
            </div>

            {/* Step-by-Step Setup Guide */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl space-y-2.5 text-xs font-mono text-slate-300">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Quick Install Steps
              </span>
              <ol className="space-y-2 list-decimal list-inside text-slate-300 leading-relaxed">
                <li>Copy the generated configuration content on the right.</li>
                <li>Place it at <code className="text-cyan-300">{activeConfig.destinationPath}</code> in your repository root.</li>
                <li>Restart or reload your {selectedIde.toUpperCase()} editor window to apply rules instantly.</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Code Editor / Viewer */}
          <div className="lg:col-span-8 space-y-3">
            <div className="rounded-2xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden font-mono text-xs">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-white text-xs">{activeConfig.filename}</span>
                    <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">{activeConfig.title}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(activeConfig.content, activeConfig.id)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copiedFileId === activeConfig.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(activeConfig)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code Viewer Body */}
              <div className="p-4 sm:p-5 max-h-[540px] overflow-y-auto bg-[#020617] text-slate-300 leading-relaxed font-mono">
                <pre className="whitespace-pre-wrap select-all selection:bg-violet-500/30">
                  <code>{activeConfig.content}</code>
                </pre>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
                <span>Grounded with: {codebase.repoName} ({codebase.primaryLanguage})</span>
                <span>Language: {activeConfig.language.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
