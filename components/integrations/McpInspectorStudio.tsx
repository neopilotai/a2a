/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CodebaseCatalogItem, 
  McpToolDefinition 
} from '../../types';
import { 
  MCP_TOOLS_CATALOG, 
  executeMockMcpTool 
} from '../../services/integrationService';
import { 
  Zap, 
  Play, 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  RotateCcw,
  ArrowRight,
  Server
} from 'lucide-react';

interface McpInspectorStudioProps {
  codebase: CodebaseCatalogItem;
}

export const McpInspectorStudio: React.FC<McpInspectorStudioProps> = ({
  codebase
}) => {
  const [selectedToolName, setSelectedToolName] = useState<string>(MCP_TOOLS_CATALOG[0]?.name || '');
  const [activeClientTab, setActiveClientTab] = useState<'claude' | 'cursor'>('claude');
  const [customParams, setCustomParams] = useState<Record<string, any>>({
    repoName: codebase.repoName,
    depth: 4,
    strictMode: true,
    goal: 'Modernize State Layer & Audit Invariants'
  });
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedTool = MCP_TOOLS_CATALOG.find(t => t.name === selectedToolName) || MCP_TOOLS_CATALOG[0];

  const handleRunTool = () => {
    setIsExecuting(true);
    setExecutionResult(null);

    setTimeout(() => {
      const res = executeMockMcpTool(selectedTool.name, { ...customParams, repoName: codebase.repoName }, codebase);
      setExecutionResult(res);
      setIsExecuting(false);
    }, 200);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const claudeDesktopConfig = JSON.stringify({
    "mcpServers": {
      "link2ink": {
        "command": "npx",
        "args": ["-y", "link2ink", "mcp", "serve"],
        "env": {
          "TARGET_REPO": codebase.repoName
        }
      }
    }
  }, null, 2);

  const cursorMcpConfig = JSON.stringify({
    "mcpServers": {
      "link2ink-architecture": {
        "command": "npx",
        "args": ["link2ink", "mcp", "serve", "--repo", codebase.repoName]
      }
    }
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* 1. MCP SERVER TELEMETRY HEADER */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 md:p-5 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-violet-600 p-[1px] shadow-lg shadow-amber-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Server className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-sans text-white">
                Model Context Protocol (MCP) Server
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live / Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Protocol: JSON-RPC 2.0 • Transport: stdio / HTTP SSE • Tools: {MCP_TOOLS_CATALOG.length} Active
            </p>
          </div>
        </div>

        {/* Client Config Switcher Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveClientTab('claude')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeClientTab === 'claude' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Claude Desktop Config
            </button>
            <button
              type="button"
              onClick={() => setActiveClientTab('cursor')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeClientTab === 'cursor' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cursor MCP Config
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(activeClientTab === 'claude' ? claudeDesktopConfig : cursorMcpConfig, 'client-cfg')}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copiedKey === 'client-cfg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copy Config</span>
          </button>
        </div>
      </div>

      {/* 2. MCP TOOLS EXPLORER & LIVE RUNNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tool Selection List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Registered Tools
            </span>

            <div className="space-y-2">
              {MCP_TOOLS_CATALOG.map((tool) => {
                const isSelected = selectedTool.name === tool.name;
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => {
                      setSelectedToolName(tool.name);
                      setExecutionResult(null);
                    }}
                    className={`w-full p-3 rounded-xl text-left font-mono transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow-md'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-300">{tool.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Client Config Display */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">
                {activeClientTab === 'claude' ? 'claude_desktop_config.json' : '.cursor/mcp.json'}
              </span>
            </div>
            <pre className="p-3 rounded-xl bg-black/50 border border-white/5 text-slate-300 overflow-x-auto text-[11px]">
              <code>{activeClientTab === 'claude' ? claudeDesktopConfig : cursorMcpConfig}</code>
            </pre>
          </div>
        </div>

        {/* Right: Tool Parameters Form & Live Invocation Sandbox */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-white/15 bg-slate-950 shadow-2xl p-5 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-amber-300">{selectedTool.name}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTool.description}</p>
              </div>

              <button
                type="button"
                onClick={handleRunTool}
                disabled={isExecuting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40"
              >
                {isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Invoking...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Invoke MCP Tool</span>
                  </>
                )}
              </button>
            </div>

            {/* Parameter Fields */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Tool Parameters (JSON Schema):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTool.parameters.map((param) => (
                  <div key={param.name} className="space-y-1">
                    <label className="block text-xs text-slate-400 flex items-center justify-between">
                      <span className="font-bold text-slate-300">{param.name}</span>
                      <span className="text-[10px] text-slate-500">({param.type}{param.required ? ', required' : ''})</span>
                    </label>
                    <input
                      type="text"
                      value={customParams[param.name] ?? (param.name === 'repoName' ? codebase.repoName : '')}
                      onChange={(e) => setCustomParams({ ...customParams, [param.name]: e.target.value })}
                      placeholder={param.description}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Results Viewer */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  JSON-RPC 2.0 Response Payload
                </span>
                {executionResult && (
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(executionResult, null, 2), 'mcp-resp')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedKey === 'mcp-resp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy JSON</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#020617] border border-white/10 text-slate-300 text-xs max-h-64 overflow-y-auto leading-relaxed">
                {executionResult ? (
                  <pre className="whitespace-pre-wrap select-all">
                    <code>{JSON.stringify(executionResult, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="text-slate-500 text-center py-6">
                    Click "Invoke MCP Tool" to simulate live tool execution against {codebase.repoName}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
