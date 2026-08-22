/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  GitMerge, 
  CheckCircle2, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  Cpu, 
  Layers, 
  FileCode2, 
  RefreshCw,
  Sliders,
  ChevronDown,
  Compass,
  Lightbulb,
  Maximize2,
  Minimize2,
  ListOrdered,
  ShieldAlert,
  HelpCircle,
  Activity,
  Terminal
} from 'lucide-react';
import { AssistantRole, ChatMessage, GeminiModelId, RepoFileTree, ViewMode } from '../types';
import { sendAssistantChatMessage } from '../services/geminiService';
import { loadUserSession, saveAiAssistantSettings } from '../services/storageService';
import { 
  AiCognitiveActions, 
  AiMasteryBanner, 
  AiPromptLaboratoryModal, 
  AiConceptualGlossaryModal,
  COGNITIVE_LENSES
} from './AiAssistantDiscoveryCues';

interface AiAssistantProps {
  initialRepoContext?: {
    repoName: string;
    fileTree: RepoFileTree[];
  } | null;
  onNavigate?: (mode: ViewMode, data?: any) => void;
}

export const ASSISTANT_ROLES: AssistantRole[] = [
  {
    id: 'architect',
    name: 'System Architect',
    icon: 'Layers',
    badge: 'Architecture',
    description: 'Expert in system decomposition, domain modeling, API design, and clean scalable patterns.',
    systemInstruction: `You are a Principal Software Architect. You provide high-level architectural guidance, evaluate module boundaries, design scalable system patterns, identify structural tech debt, and recommend clean abstractions. Maintain a clear, authoritative, yet collaborative engineering tone.`,
    suggestedPrompts: [
      'Analyze the high-level architecture and suggest modular boundaries',
      'How should I structure the state management and data access layers?',
      'Suggest an event-driven or decoupled pattern for cross-module communication',
      'What are the trade-offs of microservices vs modular monolith for this codebase?'
    ]
  },
  {
    id: 'security',
    name: 'Security & Auth Auditor',
    icon: 'ShieldCheck',
    badge: 'Security',
    description: 'Specialist in vulnerability mitigation, authentication flows, secrets hygiene, and OWASP compliance.',
    systemInstruction: `You are a Senior Security & Compliance Engineer. Audit code, identify vulnerability vectors (XSS, CSRF, Injection, IDOR, sensitive key exposure, insecure deserialization), verify authorization checks, and propose hardened defensive practices.`,
    suggestedPrompts: [
      'Audit common security vulnerabilities and attack surfaces in modern web apps',
      'How do I securely handle authentication tokens and refresh rotation?',
      'What best practices should be used to sanitize dynamic user input?',
      'Check for potential rate-limiting, CORS, and header hardening gaps'
    ]
  },
  {
    id: 'performance',
    name: 'Performance Engineer',
    icon: 'Zap',
    badge: 'Speed & Scale',
    description: 'Focuses on runtime latency, bundle footprint, rendering cycles, caching, and memory leaks.',
    systemInstruction: `You are a Staff Performance & Infrastructure Engineer. You diagnose latency bottlenecks, recommend intelligent caching (memoization, CDN, Redis), advise on database query indexing, analyze bundle trees, and optimize memory usage.`,
    suggestedPrompts: [
      'Suggest profiling and optimization strategies for client-side rendering',
      'How can I reduce bundle sizes and eliminate unused code dependencies?',
      'Recommend caching and invalidation strategies for high-frequency endpoints',
      'How do I detect and eliminate memory leaks in persistent event listeners?'
    ]
  },
  {
    id: 'refactor',
    name: 'Refactoring & Migration Specialist',
    icon: 'GitMerge',
    badge: 'Modernization',
    description: 'Expert in incremental migrations, breaking down monoliths, TypeScript typing, and tech debt removal.',
    systemInstruction: `You are a Principal Modernization & Refactoring Engineer. You design zero-downtime migration paths, convert legacy JavaScript to strictly typed TypeScript, extract tightly coupled components into reusable services, and establish comprehensive test safety nets.`,
    suggestedPrompts: [
      'Create a step-by-step migration plan for modernizing this codebase',
      'How can I safely refactor large legacy components without breaking features?',
      'Suggest clean TypeScript interface definitions and strict type safety improvements',
      'How do I implement the Strangler Fig pattern for incremental component replacement?'
    ]
  },
  {
    id: 'qa',
    name: 'Test & QA Strategist',
    icon: 'CheckCircle2',
    badge: 'Testing',
    description: 'Designs testing pyramids, edge-case coverage, integration assertions, and resilient test suites.',
    systemInstruction: `You are a Lead QA Automation Engineer and Testing Strategist. You help developers write robust unit, integration, and E2E tests, identify tricky edge-cases, mock external dependencies realistically, and maximize regression prevention with minimal maintenance overhead.`,
    suggestedPrompts: [
      'Draft a comprehensive unit and integration test plan for core services',
      'What edge cases and failure scenarios should be tested for user authentication?',
      'How do I mock external API network failures and race conditions effectively?',
      'Suggest automated regression tests to prevent breaking changes in production'
    ]
  }
];

const AVAILABLE_MODELS: { id: GeminiModelId; label: string; desc: string; tag: string }[] = [
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', desc: 'Fast, high-reasoning, ideal for architecture & coding', tag: 'Recommended' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', desc: 'Deep technical reasoning for complex systems', tag: 'Deep Reasoning' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', desc: 'Balanced intelligence for general coding tasks', tag: 'General' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', desc: 'Ultra-fast low-latency responses', tag: 'Fast' },
];

export const AiAssistant: React.FC<AiAssistantProps> = ({ initialRepoContext, onNavigate }) => {
  const savedSettings = loadUserSession()?.aiAssistantSettings;

  const initialRole = savedSettings?.selectedRoleId
    ? ASSISTANT_ROLES.find(r => r.id === savedSettings.selectedRoleId) || ASSISTANT_ROLES[0]
    : ASSISTANT_ROLES[0];

  const [selectedRole, setSelectedRole] = useState<AssistantRole>(initialRole);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(
    savedSettings?.selectedModel || 'gemini-3.7-flash'
  );
  const [includeCodebaseContext, setIncludeCodebaseContext] = useState(
    savedSettings?.includeCodebaseContext !== undefined ? savedSettings.includeCodebaseContext : true
  );
  const [customContext, setCustomContext] = useState(savedSettings?.customContext || '');
  const [showContextModal, setShowContextModal] = useState(false);
  const [showPromptLabModal, setShowPromptLabModal] = useState(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    savedSettings?.messages && savedSettings.messages.length > 0
      ? savedSettings.messages
      : [
          {
            id: 'welcome-msg',
            role: 'model',
            text: `Hello! I am **a2a** (Agent-to-Architecture Adaptive Assistant), operating in **${initialRole.name}** mode powered by **Gemini**. \n\nI continuously learn, sense codebase topology, and adapt non-linearly. Use the **Cognitive Lenses** below to simplify mental models or expand architectures, or ask me anything to get started!`,
            timestamp: new Date(),
            modelUsed: 'gemini-3.7-flash',
            roleId: initialRole.id
          }
        ]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Automatically persist settings and chat history
  useEffect(() => {
    saveAiAssistantSettings({
      selectedRoleId: selectedRole.id,
      selectedModel,
      includeCodebaseContext,
      customContext,
      messages
    });
  }, [selectedRole, selectedModel, includeCodebaseContext, customContext, messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Global keyboard shortcut to launch prompt laboratory (Cmd+K / Ctrl+K / Alt+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPromptLabModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRoleChange = (role: AssistantRole) => {
    setSelectedRole(role);
    setMessages(prev => [
      ...prev,
      {
        id: `role-switch-${Date.now()}`,
        role: 'system',
        text: `Switched active persona to **${role.name}** (${role.badge}).`,
        timestamp: new Date(),
        roleId: role.id
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date(),
      roleId: selectedRole.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build contextual string
      let contextStr = '';
      if (includeCodebaseContext && initialRepoContext?.fileTree) {
        contextStr += `Repository: ${initialRepoContext.repoName}\nFiles Sample:\n` + 
          initialRepoContext.fileTree.slice(0, 150).map(f => `- ${f.path}`).join('\n');
      }
      if (customContext.trim()) {
        contextStr += `\nAdditional Custom Context:\n${customContext.trim()}`;
      }

      // History payload for multi-turn
      const historyPayload = messages
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({
          role: m.role as 'user' | 'model',
          text: m.text
        }));

      const reply = await sendAssistantChatMessage(
        historyPayload,
        query,
        selectedRole.systemInstruction,
        selectedModel,
        contextStr || undefined
      );

      const botMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date(),
        modelUsed: selectedModel,
        roleId: selectedRole.id
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ **Error communicating with Gemini**: ${err.message || 'Please check your connection and try again.'}`,
          timestamp: new Date(),
          roleId: selectedRole.id
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm("Clear current conversation history?")) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          text: `Chat reset. I am your **${selectedRole.name}**. How can I help you today?`,
          timestamp: new Date(),
          modelUsed: selectedModel,
          roleId: selectedRole.id
        }
      ]);
    }
  };

  const handleExportChat = () => {
    const text = messages.map(m => {
      const speaker = m.role === 'user' ? '### User' : m.role === 'model' ? `### AI Assistant (${m.modelUsed || selectedModel})` : '### System';
      return `${speaker} [${new Date(m.timestamp).toLocaleTimeString()}]\n\n${m.text}\n\n---\n`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-assistant-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'architect': return <Layers className="w-4 h-4 text-violet-400" />;
      case 'security': return <ShieldCheck className="w-4 h-4 text-rose-400" />;
      case 'performance': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'refactor': return <GitMerge className="w-4 h-4 text-emerald-400" />;
      case 'qa': return <CheckCircle2 className="w-4 h-4 text-sky-400" />;
      default: return <Bot className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[640px] max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Left Sidebar: Roles, Models & Context Config */}
      <div className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0">
        
        {/* Persona Selector Card */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-400" />
              a2a Adaptive Persona
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {selectedRole.badge}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {ASSISTANT_ROLES.map(role => {
              const isActive = selectedRole.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 border ${
                    isActive
                      ? 'bg-violet-600/20 border-violet-500/40 text-white shadow-sm'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-violet-500/30 text-violet-200' : 'bg-slate-900 text-slate-400'}`}>
                    {getRoleIcon(role.id)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate flex items-center justify-between">
                      <span>{role.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{role.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model & Runtime Settings Card */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Gemini Engine
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono text-slate-400">Selected Model</label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as GeminiModelId)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500 appearance-none pr-8 cursor-pointer"
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.label} ({m.tag})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.desc}
            </p>
          </div>

          {/* Context Toggles */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                Repo Context
              </span>
              <button
                onClick={() => setIncludeCodebaseContext(!includeCodebaseContext)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  includeCodebaseContext ? 'bg-violet-600' : 'bg-slate-700'
                }`}
                title="Toggle repository context"
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  includeCodebaseContext ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {initialRepoContext?.repoName ? (
              <p className="text-[10px] font-mono text-slate-400 truncate">
                Attached: <span className="text-violet-300">{initialRepoContext.repoName}</span> ({initialRepoContext.fileTree?.length || 0} files)
              </p>
            ) : (
              <p className="text-[10px] font-mono text-slate-500">
                No repository attached yet. Analyze a repo in GitFlow to auto-attach.
              </p>
            )}

            <button
              onClick={() => setShowContextModal(true)}
              className="w-full text-xs font-mono text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5 transition-colors mt-1"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{customContext ? 'Edit Custom Context' : '+ Add Code Context'}</span>
            </button>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="glass-panel p-3 rounded-2xl flex items-center justify-between text-xs font-mono text-slate-400">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 hover:text-rose-300 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Export conversation as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={() => onNavigate && onNavigate(ViewMode.PLAN_CREATOR)}
            className="flex items-center gap-1.5 text-violet-300 hover:text-violet-200 transition-colors p-1.5 rounded-lg hover:bg-violet-500/10"
            title="Create structured implementation plan"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-3xl overflow-hidden min-w-0 border border-white/10 shadow-2xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-slate-950/70 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
              {getRoleIcon(selectedRole.id)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                  <span className="text-violet-400 font-mono font-extrabold">a2a</span>
                  <span className="text-slate-400">•</span>
                  <span>{selectedRole.name}</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                  {selectedModel}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Adaptive Core
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                {selectedRole.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptLabModal(true)}
              className="text-xs font-mono px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 text-violet-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              title="Open Gemini Prompt Laboratory & Discovery Sandbox (Cmd+K)"
            >
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden md:inline">Prompt Lab</span>
              <kbd className="hidden lg:inline text-[9px] px-1 py-0.2 bg-black/40 rounded border border-white/10 text-slate-400">⌘K</kbd>
            </button>

            <button
              onClick={() => handleSendMessage("Give me an executive summary of this project and key recommendations.")}
              disabled={isLoading}
              className="text-xs font-mono px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors hidden sm:flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto-Summary</span>
            </button>
          </div>
        </div>

        {/* Dynamic Evolving Cues & Mastery Banner */}
        <AiMasteryBanner
          selectedRole={selectedRole}
          selectedModel={selectedModel}
          onOpenPromptLab={() => setShowPromptLabModal(true)}
          onOpenGlossary={() => setShowGlossaryModal(true)}
        />

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950/40">
          {messages.map((msg) => {
            if (msg.role === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2 animate-in fade-in">
                  <div className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    {getRoleIcon(msg.roleId || selectedRole.id)}
                  </div>
                )}

                <div
                  className={`relative group max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-violet-600/30 text-violet-50 border border-violet-500/40 rounded-tr-sm shadow-md'
                      : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-sm shadow-lg'
                  }`}
                >
                  {/* Top Metadata Header */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/5 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-300">
                        {isUser ? 'You' : `${selectedRole.name}`}
                      </span>
                      {!isUser && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-white/5 rounded border border-white/10 text-violet-300">
                          {msg.modelUsed || selectedModel}
                        </span>
                      )}
                      {includeCodebaseContext && initialRepoContext?.repoName && !isUser && (
                        <span className="text-[9px] text-slate-500 hidden md:inline">
                          • {initialRepoContext.repoName} context
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-sans select-text">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-slate-950/80 text-violet-300 px-1.5 py-0.5 rounded font-mono text-[12px] border border-white/5" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-[12px] overflow-x-auto my-2 text-slate-200">
                              <code {...props}>{children}</code>
                            </pre>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Dynamic Cognitive Action Chips on Assistant Responses */}
                  {!isUser && msg.id !== 'welcome-msg' && (
                    <AiCognitiveActions
                      onApplyLens={(lensPrompt) => handleSendMessage(lensPrompt)}
                      onOpenPlanCreator={() => onNavigate && onNavigate(ViewMode.PLAN_CREATOR)}
                      isLoading={isLoading}
                      messageId={msg.id}
                    />
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 mt-1 text-slate-300 font-mono text-xs font-bold">
                    U
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-1">
                <RefreshCw className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl rounded-tl-sm border border-white/10 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-mono text-slate-400">Gemini is reasoning & synthesizing response...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Suggested Prompts & Quick Discovery Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-white/5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setShowPromptLabModal(true)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/40 transition-all whitespace-nowrap shrink-0 flex items-center gap-1 font-bold shadow-sm"
          >
            <Compass className="w-3 h-3 text-amber-300" />
            <span>Prompt Lab (⌘K)</span>
          </button>

          <div className="w-px h-4 bg-white/10 shrink-0" />

          {selectedRole.suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-2.5 h-2.5 text-violet-400" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-3 glass-panel p-2 rounded-2xl border border-white/10 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all bg-black/40"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${selectedRole.name} anything about your architecture, code, or design patterns... (Enter to send, Shift+Enter for new line)`}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-slate-100 placeholder:text-slate-500 focus:ring-0 text-sm font-sans resize-none py-1.5 px-2.5 leading-relaxed"
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all shadow-lg shadow-violet-600/30 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Prompt Laboratory & Discovery Sandbox Modal */}
      <AiPromptLaboratoryModal
        isOpen={showPromptLabModal}
        onClose={() => setShowPromptLabModal(false)}
        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        selectedRole={selectedRole}
      />

      {/* Conceptual Philosophy & Trust Glossary Modal */}
      <AiConceptualGlossaryModal
        isOpen={showGlossaryModal}
        onClose={() => setShowGlossaryModal(false)}
      />

      {/* Custom Context Modal */}
      {showContextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-400" />
                Custom Code / Architecture Context
              </h3>
              <button
                onClick={() => setShowContextModal(false)}
                className="text-slate-400 hover:text-white text-sm font-mono"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste specific code snippets, database schemas, or architectural constraints you want the AI Assistant to consider during this conversation.
            </p>
            <textarea
              rows={6}
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="e.g. Database schema, API specification, or architectural rules..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setCustomContext('');
                  setShowContextModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={() => setShowContextModal(false)}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-md"
              >
                Apply Context
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
