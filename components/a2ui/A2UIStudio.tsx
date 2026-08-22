/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  A2UISchema, 
  A2UIPlatform, 
  A2UIActionEvent, 
  ViewMode, 
  ActiveRepoContext,
  A2UISettings
} from '../../types';
import { A2UINativeRenderer } from './A2UINativeRenderer';
import { A2UI_TEMPLATES, A2UITemplateMetadata } from './A2UITemplateCatalog';
import { generateA2UISchemaFromPrompt } from '../../services/geminiService';
import { loadUserSession, saveA2UISettings } from '../../services/storageService';
import { 
  Sparkles, 
  Laptop, 
  Smartphone, 
  Monitor, 
  Code, 
  Eye, 
  Layers, 
  Play, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  ShieldCheck, 
  Radio, 
  Sliders, 
  Database, 
  Cpu, 
  GitMerge, 
  ShieldAlert, 
  CheckCircle2, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Trash2,
  Flame,
  FileCode2,
  SmartphoneNfc
} from 'lucide-react';

interface A2UIStudioProps {
  activeRepoContext?: ActiveRepoContext | null;
  onNavigate?: (mode: ViewMode, data?: any) => void;
}

export const A2UIStudio: React.FC<A2UIStudioProps> = ({
  activeRepoContext,
  onNavigate
}) => {
  // Load saved session or fallback to first template
  const savedSession = useMemo(() => loadUserSession()?.a2uiSettings, []);

  const [activeTemplate, setActiveTemplate] = useState<A2UITemplateMetadata>(
    A2UI_TEMPLATES.find(t => t.id === savedSession?.activeTemplateId) || A2UI_TEMPLATES[0]
  );
  const [activePlatform, setActivePlatform] = useState<A2UIPlatform>(
    savedSession?.activePlatform || 'web'
  );
  const [activeTab, setActiveTab] = useState<'canvas' | 'spec_schema' | 'agent_chat' | 'export' | 'library'>(
    savedSession?.activeTab || 'canvas'
  );

  // Active Schema under inspection (can be modified by prompt or editor)
  const [activeSchema, setActiveSchema] = useState<A2UISchema>(
    activeTemplate.schema
  );

  // Schema Editor state
  const [editorText, setEditorText] = useState<string>(
    JSON.stringify(activeTemplate.schema, null, 2)
  );
  const [editorError, setEditorError] = useState<string | null>(null);

  // Live Agent Generative Prompt
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationSuccessNotice, setGenerationSuccessNotice] = useState<string | null>(null);

  // Live 2-Way Protocol Event Stream Log
  const [eventLogs, setEventLogs] = useState<A2UIActionEvent[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Synchronize editor text when active template or schema changes
  useEffect(() => {
    setEditorText(JSON.stringify(activeSchema, null, 2));
    setEditorError(null);
  }, [activeSchema]);

  // Auto-save A2UI settings
  useEffect(() => {
    saveA2UISettings({
      activeTemplateId: activeTemplate.id,
      activePlatform,
      activeTab
    });
  }, [activeTemplate.id, activePlatform, activeTab]);

  // Handle Event from Native Renderer
  const handleActionEvent = (event: A2UIActionEvent) => {
    setEventLogs(prev => [event, ...prev.slice(0, 19)]);
  };

  // Switch Template
  const handleSelectTemplate = (template: A2UITemplateMetadata) => {
    setActiveTemplate(template);
    setActiveSchema(template.schema);
    setEventLogs([]);
  };

  // AI Prompt Schema Generator
  const handleGenerateAiSchema = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationSuccessNotice(null);

    try {
      const context = activeRepoContext 
        ? `Codebase: ${activeRepoContext.repoName}, Files: ${activeRepoContext.fileTree.length} files.`
        : undefined;
      
      const newSchema = await generateA2UISchemaFromPrompt(aiPrompt, context, activePlatform);
      setActiveSchema(newSchema);
      setGenerationSuccessNotice(`Agent successfully synthesized "${newSchema.title}"!`);
      setTimeout(() => setGenerationSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to generate A2UI schema:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Editor JSON updates
  const handleEditorChange = (newText: string) => {
    setEditorText(newText);
    try {
      const parsed = JSON.parse(newText);
      if (parsed && parsed.root && parsed.title) {
        setActiveSchema(parsed);
        setEditorError(null);
      } else {
        setEditorError('Schema must include a valid "root" component and "title".');
      }
    } catch (err: any) {
      setEditorError(err.message || 'Invalid JSON syntax');
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Pre-configured Prompt Suggestions
  const promptSuggestions = [
    'Kubernetes Canary Traffic Governor & Autoscaler',
    'Zero-Downtime Database Schema Migration Wizard',
    'Vulnerability Remediation & Secret Rotation Dashboard',
    'AI Prompt Benchmark & Hyperparameter Fine-Tuner',
    'Incident Response Postmortem Timeline & Triage',
    'Microservice Circuit Breaker & Fallback Controller'
  ];

  return (
    <div className="w-full space-y-8 pb-16 animate-in fade-in duration-500">
      {/* Header & Protocol Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  A2UI Protocol Studio
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v1.0 Standard
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Protocol for Agent-Driven Interfaces • Native Multi-Platform Rendering without Arbitrary Code Execution
              </p>
            </div>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'canvas' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Canvas</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'library' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Template Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('spec_schema')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'spec_schema' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Schema & JSON Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'export' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export & Spec Docs</span>
          </button>
        </div>
      </div>

      {/* AI Generative UI Prompt Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Generate UI with Agent</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Model: <span className="text-indigo-300 font-semibold">gemini-3.7-flash</span> • Declarative Engine
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiSchema()}
            placeholder="Describe any agent interface (e.g., 'API Rate Limit Controller with live burst sliders and CORS whitelist tags')..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            onClick={handleGenerateAiSchema}
            disabled={isGenerating || !aiPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold font-mono text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all min-w-[170px]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate A2UI</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] text-slate-500 font-mono">Suggestions:</span>
          {promptSuggestions.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => {
                setAiPrompt(prompt);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:border-indigo-500/30 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {generationSuccessNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{generationSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* MAIN TAB 1: INTERACTIVE MULTI-PLATFORM CANVAS */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Viewport Canvas (7 or 8 columns) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Viewport Platform Toolbar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 font-semibold">Render Target:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setActivePlatform('web')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
                      activePlatform === 'web' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Web Fluid</span>
                  </button>
                  <button
                    onClick={() => setActivePlatform('mobile_ios')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
                      activePlatform === 'mobile_ios' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>iOS Frame</span>
                  </button>
                  <button
                    onClick={() => setActivePlatform('mobile_android')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
                      activePlatform === 'mobile_android' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SmartphoneNfc className="w-3.5 h-3.5" />
                    <span>Android</span>
                  </button>
                  <button
                    onClick={() => setActivePlatform('desktop_macos')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
                      activePlatform === 'desktop_macos' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>macOS App</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Zero-Eval Sandbox
                </span>
              </div>
            </div>

            {/* Simulated Frame Canvas Container */}
            <div className="w-full flex justify-center items-start min-h-[560px] p-4 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md overflow-x-auto">
              {/* iOS Mobile Simulator Frame */}
              {activePlatform === 'mobile_ios' && (
                <div className="w-[390px] min-h-[680px] bg-slate-900 rounded-[44px] border-[6px] border-slate-700 shadow-2xl p-4 relative flex flex-col justify-between">
                  {/* Dynamic Island Notch */}
                  <div className="w-28 h-5 bg-black rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
                    <span className="w-2 h-2 rounded-full bg-indigo-500/50" />
                  </div>
                  {/* Native Render Root */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <A2UINativeRenderer
                      schema={activeSchema}
                      platform={activePlatform}
                      onActionEvent={handleActionEvent}
                    />
                  </div>
                  {/* Home Bar Indicator */}
                  <div className="w-32 h-1 bg-white/30 rounded-full mx-auto mt-3" />
                </div>
              )}

              {/* Android Material 3 Frame */}
              {activePlatform === 'mobile_android' && (
                <div className="w-[380px] min-h-[660px] bg-slate-900 rounded-[32px] border-[5px] border-slate-800 shadow-2xl p-4 relative flex flex-col justify-between">
                  {/* Hole punch camera */}
                  <div className="w-3 h-3 bg-black rounded-full mx-auto mb-3 ring-1 ring-slate-700" />
                  <div className="flex-1 overflow-y-auto pr-1">
                    <A2UINativeRenderer
                      schema={activeSchema}
                      platform={activePlatform}
                      onActionEvent={handleActionEvent}
                    />
                  </div>
                  <div className="w-20 h-1 bg-white/20 rounded-full mx-auto mt-2" />
                </div>
              )}

              {/* macOS Window Frame */}
              {activePlatform === 'desktop_macos' && (
                <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
                  {/* Window Titlebar */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-semibold">{activeSchema.title}</span>
                    <div className="w-10" />
                  </div>
                  <div className="p-4 overflow-y-auto">
                    <A2UINativeRenderer
                      schema={activeSchema}
                      platform={activePlatform}
                      onActionEvent={handleActionEvent}
                    />
                  </div>
                </div>
              )}

              {/* Web Responsive Fluid */}
              {activePlatform === 'web' && (
                <div className="w-full">
                  <A2UINativeRenderer
                    schema={activeSchema}
                    platform={activePlatform}
                    onActionEvent={handleActionEvent}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Real-time 2-Way Protocol Event Stream & Schema Telemetry (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live 2-Way Agent Event Stream */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Agent Action Stream
                  </h3>
                </div>
                {eventLogs.length > 0 && (
                  <button
                    onClick={() => setEventLogs([])}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Live 2-way event dispatches from native client back to agent:
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {eventLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs font-mono text-slate-500">
                    Interact with sliders, toggles, or buttons above to view structured agent payloads.
                  </div>
                ) : (
                  eventLogs.map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/20 font-mono text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-indigo-400">
                        <span className="font-bold">[{ev.type.toUpperCase()}]</span>
                        <span className="text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Target Component:</span> {ev.componentId}
                      </div>
                      {ev.actionId && (
                        <div className="text-emerald-400">
                          <span className="text-slate-500">Action ID:</span> {ev.actionId}
                        </div>
                      )}
                      {ev.payload && Object.keys(ev.payload).length > 0 && (
                        <pre className="text-slate-400 text-[9px] bg-black/50 p-1.5 rounded overflow-x-auto">
                          {JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Protocol Invariant Verification */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Protocol Invariants</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Zero Arbitrary JS:</strong> Pure declarative component trees without eval or script injection risks.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Native Client Hydration:</strong> Renders via React / React Native / Flutter / SwiftUI native components.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>2-Way Action Bindings:</strong> User inputs stream structured action payloads to backend agents.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TAB 2: TEMPLATE CATALOG */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Declarative Agent UI Template Catalog</h2>
              <p className="text-xs text-slate-400">Pre-built industry-standard agent-driven interface blueprints.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {A2UI_TEMPLATES.map((tmpl) => {
              const isSelected = activeTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    handleSelectTemplate(tmpl);
                    setActiveTab('canvas');
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-300">
                        {tmpl.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{tmpl.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{tmpl.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-indigo-400">
                    <span>Load Schema Blueprint</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN TAB 3: SCHEMA SPEC & CODE EDITOR */}
      {activeTab === 'spec_schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Declarative A2UI JSON Schema</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(editorText, 'json')}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy JSON</span>
                </button>
              </div>
            </div>

            {editorError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs font-mono text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editorError}</span>
              </div>
            )}

            <textarea
              value={editorText}
              onChange={(e) => handleEditorChange(e.target.value)}
              rows={24}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs font-mono text-indigo-200 leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Protocol Primitive Reference</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-300 font-mono">
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <div className="text-indigo-300 font-bold">Layout Primitives</div>
                  <div className="text-[11px] text-slate-400">container, grid, stack, card, banner, section_header, divider</div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <div className="text-emerald-300 font-bold">Interactive Inputs</div>
                  <div className="text-[11px] text-slate-400">slider, toggle, button, action_button, text_input, select</div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <div className="text-sky-300 font-bold">Visualizers & Engineering</div>
                  <div className="text-[11px] text-slate-400">kpi_grid, metric, data_table, timeline, code_diff, terminal_logs, checklist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TAB 4: EXPORT & PROTOCOL SPECIFICATION */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              <span>Multi-Platform Code & Specification Export</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Export this A2UI specification for seamless multi-platform consumption across Web (React), Mobile (React Native / Flutter / SwiftUI), and Desktop clients.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">TypeScript Types</span>
                  <button
                    onClick={() => handleCopy(`export interface A2UISchema { ... }`, 'ts_types')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Strictly typed discriminated unions and action definitions for TypeScript clients.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">React Native Mapping</span>
                  <button
                    onClick={() => handleCopy(`// React Native A2UI Native Renderer\nimport { View, Text, Switch, Slider } from 'react-native';`, 'rn')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Native iOS and Android component bindings for React Native client apps.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">SwiftUI / Flutter Spec</span>
                  <button
                    onClick={() => handleCopy(`// SwiftUI Native View Mapping\nstruct A2UIRootView: View { ... }`, 'swift')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Direct mapping specs for native mobile declarative frameworks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
