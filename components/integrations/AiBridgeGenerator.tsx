/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CodebaseCatalogItem 
} from '../../types';
import { 
  generateCustomIntegrationCode 
} from '../../services/geminiService';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Zap, 
  RotateCcw, 
  Lightbulb
} from 'lucide-react';

interface AiBridgeGeneratorProps {
  codebase: CodebaseCatalogItem;
}

const EXAMPLE_PROMPTS = [
  'Generate a custom VS Code snippet to lint architectural circular imports in this repo',
  'Create a custom MCP server tool to extract database models and relations for Claude',
  'Write a pre-commit Python script that ensures all API endpoints have type contracts',
  'Generate a specialized Cursor Composer prompt for refactoring React state to Zustand'
];

export const AiBridgeGenerator: React.FC<AiBridgeGeneratorProps> = ({ codebase }) => {
  const [promptInput, setPromptInput] = useState('');
  const [category, setCategory] = useState<'cli' | 'ide' | 'vibe' | 'mcp' | 'custom'>('ide');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    filename: string;
    language: string;
    code: string;
    explanation: string;
    setupInstructions: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (textToUse?: string) => {
    const prompt = (textToUse || promptInput).trim();
    if (!prompt || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await generateCustomIntegrationCode(
        codebase.repoName,
        `${codebase.primaryLanguage} with ${codebase.framework}`,
        category,
        prompt
      );
      setResult(res);
    } catch (err) {
      console.error('Failed to generate integration:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* 1. HERO & PROMPT INPUT */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-[1px] shadow-lg shadow-violet-950/40 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold font-sans text-white">
              AI Integration Bridge Generator (Gemini 2.5)
            </h3>
            <p className="text-slate-400 text-xs">
              Synthesize custom, bespoke IDE plugins, MCP handlers, or CLI automation scripts for <span className="text-cyan-300 font-bold">{codebase.repoName}</span>.
            </p>
          </div>
        </div>

        {/* Integration Category Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-slate-400 mr-1">Target Category:</span>
          {(['ide', 'cli', 'mcp', 'vibe', 'custom'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                category === cat
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <div className="relative">
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={`Describe your custom integration requirement for ${codebase.displayName} (e.g. "Create a pre-commit hook to block circular imports and format with biome")...`}
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-white/15 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-fuchsia-500 text-xs leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Try:</span>
              <button
                type="button"
                onClick={() => {
                  setPromptInput(EXAMPLE_PROMPTS[0]);
                  handleGenerate(EXAMPLE_PROMPTS[0]);
                }}
                className="text-cyan-400 hover:underline truncate max-w-xs"
              >
                {EXAMPLE_PROMPTS[0]}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !promptInput.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-violet-950/50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Bridge...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate Integration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. GENERATED OUTPUT VIEWER */}
      {result && (
        <div className="rounded-2xl border border-white/15 bg-slate-950 shadow-2xl overflow-hidden space-y-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <FileCode2 className="w-4 h-4 text-fuchsia-400" />
              <div>
                <span className="font-bold text-white text-xs">{result.title}</span>
                <span className="text-[11px] text-slate-400 ml-2">File: {result.filename}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/50 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Code</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-900/40 border-b border-white/5 text-slate-300">
            <p className="text-xs">{result.explanation}</p>
          </div>

          <div className="p-5 max-h-[480px] overflow-y-auto bg-[#020617] text-slate-200 leading-relaxed">
            <pre className="whitespace-pre-wrap select-all selection:bg-fuchsia-500/30">
              <code>{result.code}</code>
            </pre>
          </div>

          {result.setupInstructions?.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                Setup Instructions:
              </span>
              <div className="space-y-1">
                {result.setupInstructions.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
