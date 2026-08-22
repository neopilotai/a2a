/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CodebaseCatalogItem 
} from '../../types';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  GitBranch, 
  Flame, 
  CheckCircle2, 
  FileCode2, 
  Sparkles,
  Zap
} from 'lucide-react';

interface CicdFirewallHubProps {
  codebase: CodebaseCatalogItem;
}

export const CicdFirewallHub: React.FC<CicdFirewallHubProps> = ({ codebase }) => {
  const [activeTab, setActiveTab] = useState<'github_actions' | 'git_hook' | 'npm_script'>('github_actions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const githubActionsYaml = `name: Link2Ink Architectural Firewall & Anti-Slop CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  architecture-check:
    name: Validate Architectural Invariants & Circular Dependencies
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Link2Ink Architectural Health Check
        run: npx link2ink scan ./ --strict --max-circular=0 --target="${codebase.repoName}"

      - name: Run Anti-Slop Vibeslop Radar
        run: npx link2ink vibe-lint --strict --max-slop-score=15

      - name: Verify Architecture Graph Integrity
        run: npx link2ink codemap --verify-invariants
`;

  const prePushHook = `#!/usr/bin/env bash
# .husky/pre-push or .git/hooks/pre-push
# Link2Ink Architecture Firewall Guard for ${codebase.repoName}

echo "🛡️  Running Link2Ink Pre-Push Architecture Audit..."
npx link2ink scan ./ --strict
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Architectural invariant check failed. Fix circular dependencies before pushing."
  exit 1
fi

echo "✓ Architecture verified clean. Pushing commits..."
exit 0
`;

  const npmScript = `{
  "scripts": {
    "arch:scan": "npx link2ink scan ./",
    "arch:vibe-check": "npx link2ink vibe-lint --strict",
    "arch:codemap": "npx link2ink codemap --open",
    "arch:mcp": "npx link2ink mcp serve"
  }
}`;

  const getActiveContent = () => {
    switch (activeTab) {
      case 'github_actions': return { title: '.github/workflows/architecture-firewall.yml', content: githubActionsYaml, lang: 'yaml' };
      case 'git_hook': return { title: '.husky/pre-push (or .git/hooks/pre-push)', content: prePushHook, lang: 'bash' };
      case 'npm_script': return { title: 'package.json (scripts section)', content: npmScript, lang: 'json' };
    }
  };

  const current = getActiveContent();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'github_actions' ? 'architecture-firewall.yml' : activeTab === 'git_hook' ? 'pre-push' : 'package.json';
    const blob = new Blob([current.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* 1. HEADER HERO */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[1px] shadow-lg shadow-emerald-950/40 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold font-sans text-white">
              CI/CD Architecture Firewall & Pre-Commit Hooks
            </h3>
            <p className="text-slate-400 text-xs">
              Automated build breakers to prevent architectural drift, circular dependencies, and AI slop in CI pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(current.content, activeTab)}
            className="px-3.5 py-2 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/50 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copiedKey === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Snippet</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* 2. TAB SWITCHER & VIEWER */}
      <div className="rounded-2xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('github_actions')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'github_actions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              GitHub Actions Workflow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('git_hook')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'git_hook' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Git Pre-Push Hook
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('npm_script')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'npm_script' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              package.json Scripts
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">{current.title}</span>
        </div>

        <div className="p-5 max-h-[500px] overflow-y-auto bg-[#020617] text-slate-200 leading-relaxed">
          <pre className="whitespace-pre-wrap select-all selection:bg-emerald-500/30">
            <code>{current.content}</code>
          </pre>
        </div>

        <div className="px-4 py-2.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span>Enforces strict health score &gt;= 90% and zero circular dependency chains</span>
          <span>Target: {codebase.repoName}</span>
        </div>
      </div>
    </div>
  );
};
