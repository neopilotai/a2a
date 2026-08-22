/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  CodebaseCatalogItem, 
  CliCommandLog, 
  ViewMode 
} from '../../types';
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  ExternalLink, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Layers, 
  Network, 
  FileText, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { simulateCliExecution } from '../../services/integrationService';

interface CliConsoleTerminalProps {
  codebase: CodebaseCatalogItem;
  commandHistory: CliCommandLog[];
  onCommandExecuted: (log: CliCommandLog) => void;
  onClearHistory: () => void;
  onNavigate: (mode: ViewMode, data?: any) => void;
}

const PRESET_COMMANDS = [
  { cmd: 'a2a scan ./', label: 'scan', desc: 'AST Topological Health Check', icon: ShieldCheck, color: 'text-emerald-400' },
  { cmd: 'a2a codemap --topology', label: 'codemap', desc: 'D3 Vector Graph Construction', icon: Network, color: 'text-cyan-400' },
  { cmd: 'a2a vibe-lint --strict', label: 'vibe-lint', desc: 'Anti-Slop Radar Firewall', icon: Flame, color: 'text-rose-400' },
  { cmd: 'a2a plan "Modernize State Layer"', label: 'plan', desc: 'Synthesize Execution DAG', icon: FileText, color: 'text-fuchsia-400' },
  { cmd: 'a2a mcp serve --port 8080', label: 'mcp serve', desc: 'Start Claude/Cursor Protocol', icon: Zap, color: 'text-amber-400' },
  { cmd: 'a2a diff main..HEAD', label: 'diff', desc: 'Architecture Invariant Diff', icon: Layers, color: 'text-indigo-400' },
  { cmd: 'a2a export --all', label: 'export', desc: 'Export SVG, JSON & Packs', icon: Download, color: 'text-sky-400' },
  { cmd: 'a2a --help', label: 'help', desc: 'CLI Manual & Flags', icon: Terminal, color: 'text-slate-300' }
];

export const CliConsoleTerminal: React.FC<CliConsoleTerminalProps> = ({
  codebase,
  commandHistory,
  onCommandExecuted,
  onClearHistory,
  onNavigate
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new command
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandHistory, isExecuting]);

  // Initial welcome command if history is empty
  useEffect(() => {
    if (commandHistory.length === 0) {
      const welcome = simulateCliExecution('a2a --help', codebase);
      onCommandExecuted(welcome);
    }
  }, [codebase.id]);

  const handleRunCommand = (cmdToRun?: string) => {
    const command = (cmdToRun || currentInput).trim();
    if (!command || isExecuting) return;

    setIsExecuting(true);
    setCurrentInput('');
    setHistoryIndex(null);

    // Simulate async command execution
    setTimeout(() => {
      const result = simulateCliExecution(command, codebase);
      onCommandExecuted(result);
      setIsExecuting(false);
      inputRef.current?.focus();
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCurrentInput(commandHistory[nextIdx]?.command || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(null);
        setCurrentInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCurrentInput(commandHistory[nextIdx]?.command || '');
      }
    }
  };

  const copyLogText = (log: CliCommandLog) => {
    const raw = `$ ${log.command}\n` + log.stdout.map(stripAnsi).join('\n');
    navigator.clipboard.writeText(raw);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllTerminal = () => {
    const all = commandHistory.map(log => `$ ${log.command}\n` + log.stdout.map(stripAnsi).join('\n')).join('\n\n');
    navigator.clipboard.writeText(all);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadCliScript = () => {
    const script = `#!/usr/bin/env bash
# Link2Ink / A2A Developer CLI Runner for ${codebase.repoName}
# Target Stack: ${codebase.primaryLanguage} (${codebase.framework})

echo "⚡ Connecting to Link2Ink Studio Engine..."
npx link2ink scan ./ --repo="${codebase.repoName}"
npx link2ink vibe-lint --strict
npx link2ink codemap --open
`;
    const blob = new Blob([script], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a2a-run-${codebase.repoName.replace('/', '-')}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRcConfig = () => {
    const config = JSON.stringify({
      "$schema": "https://link2ink.studio/schemas/a2arc.v1.json",
      "version": "3.7.0",
      "targetRepo": codebase.repoName,
      "language": codebase.primaryLanguage,
      "framework": codebase.framework,
      "rules": {
        "maxDependencyDepth": 4,
        "antiSlopStrict": true,
        "preventCircularDependencies": true,
        "enforceTypeContracts": true
      },
      "mcp": {
        "enabled": true,
        "tools": ["codemap", "health_check", "plan_creator", "vibe_lint"]
      }
    }, null, 2);

    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.a2arc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP QUICK ACTION LAUNCHPAD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch:</span>
          </span>
          {PRESET_COMMANDS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.cmd}
                type="button"
                onClick={() => handleRunCommand(item.cmd)}
                disabled={isExecuting}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm group disabled:opacity-50"
                title={`${item.cmd} — ${item.desc}`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAllTerminal}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Copy entire terminal transcript"
          >
            {copiedId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copy All</span>
          </button>

          <button
            type="button"
            onClick={downloadRcConfig}
            className="px-2.5 py-1.5 rounded-lg bg-violet-950/40 hover:bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Download .a2arc configuration file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.a2arc</span>
          </button>

          <button
            type="button"
            onClick={downloadCliScript}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Download executable bash runner"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Runner .sh</span>
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
            title="Clear terminal logs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. THE TERMINAL WINDOW */}
      <div className="relative rounded-2xl border border-white/15 bg-[#030712] shadow-2xl overflow-hidden font-mono text-xs">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-slate-400 text-xs font-bold ml-2">
              a2a-cli session — {codebase.repoName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
              Interactive Shell (Active)
            </span>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="p-4 sm:p-6 space-y-6 max-h-[560px] overflow-y-auto cursor-text text-slate-200"
        >
          {commandHistory.map((log) => (
            <div key={log.id} className="space-y-2 group">
              {/* Command Prompt Line */}
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">link2ink@studio</span>
                  <span className="text-slate-600">:</span>
                  <span className="text-cyan-400 font-semibold">~/{codebase.repoName}</span>
                  <span className="text-slate-400 font-bold">$</span>
                  <span className="text-white font-bold">{log.command}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-slate-500">{log.durationMs}ms</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLogText(log);
                    }}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    title="Copy command output"
                  >
                    {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Formatted Output Lines */}
              <div className="pl-4 border-l-2 border-slate-800 space-y-0.5 leading-relaxed text-slate-300">
                {log.stdout.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">
                    {renderAnsiLine(line)}
                  </div>
                ))}
              </div>

              {/* Contextual Action Shortcuts from Command Output */}
              {log.category === 'codemap' && (
                <div className="pl-4 pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewMode.CODEMAP, { repoName: codebase.repoName, fileTree: codebase.sampleFileTree })}
                    className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Network className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Open Interactive Codemap Visualizer</span>
                  </button>
                </div>
              )}

              {log.category === 'plan' && (
                <div className="pl-4 pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(ViewMode.PLAN_CREATOR, { repoName: codebase.repoName, fileTree: codebase.sampleFileTree })}
                    className="px-3 py-1 rounded-lg bg-fuchsia-600/30 hover:bg-fuchsia-600/50 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-fuchsia-300" />
                    <span>Open in Plan Creator DAG Board</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Active Running State */}
          {isExecuting && (
            <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Executing AST topological operation...</span>
            </div>
          )}

          {/* Interactive Input Prompt */}
          <div className="flex items-center gap-2 pt-2 text-slate-300">
            <span className="text-emerald-400 font-bold shrink-0">link2ink@studio</span>
            <span className="text-slate-600 shrink-0">:</span>
            <span className="text-cyan-400 font-semibold shrink-0">~/{codebase.repoName}</span>
            <span className="text-slate-400 font-bold shrink-0">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type a2a command (e.g. a2a scan, a2a vibe-lint, a2a plan)..."
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-slate-600 text-xs focus:ring-0"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleRunCommand()}
              disabled={isExecuting || !currentInput.trim()}
              className="px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 disabled:opacity-30 transition-all shrink-0"
            >
              <Play className="w-3 h-3" />
              <span>Run</span>
            </button>
          </div>

          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};

// ANSI color escape sequence parser helper
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function renderAnsiLine(text: string): React.ReactNode {
  if (!text.includes('\x1b[')) {
    return text;
  }

  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentClass = 'text-slate-300';
  let isBold = false;
  let isUnderline = false;

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('\x1b[')) {
          const code = part.replace('\x1b[', '').replace('m', '');
          if (code === '0') {
            currentClass = 'text-slate-300';
            isBold = false;
            isUnderline = false;
          } else if (code === '1' || code === '1;37') {
            isBold = true;
          } else if (code === '4') {
            isUnderline = true;
          } else if (code === '36' || code === '1;36') {
            currentClass = 'text-cyan-400 font-semibold';
          } else if (code === '32' || code === '1;32') {
            currentClass = 'text-emerald-400 font-semibold';
          } else if (code === '33' || code === '1;33') {
            currentClass = 'text-amber-300 font-semibold';
          } else if (code === '35' || code === '1;35') {
            currentClass = 'text-fuchsia-400 font-semibold';
          } else if (code === '34' || code === '1;34') {
            currentClass = 'text-blue-400 font-semibold';
          } else if (code === '31' || code === '1;31') {
            currentClass = 'text-rose-400 font-semibold';
          } else if (code === '90') {
            currentClass = 'text-slate-400';
          }
          return null;
        }

        return (
          <span 
            key={index} 
            className={`${currentClass} ${isBold ? 'font-bold' : ''} ${isUnderline ? 'underline' : ''}`}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}
