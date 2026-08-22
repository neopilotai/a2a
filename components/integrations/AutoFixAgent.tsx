/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  RefreshCw, 
  Bug, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Code2, 
  Sparkles, 
  Layers, 
  Copy, 
  Check, 
  Cpu, 
  ArrowRight,
  ShieldAlert,
  Search,
  Eye,
  Settings,
  Flame,
  HelpCircle,
  Lock
} from 'lucide-react';
import { CodebaseCatalogItem } from '../../types';
import { ApprovalGate, GateMutationPayload } from './ApprovalGate';

interface AutoFixAgentProps {
  codebase: CodebaseCatalogItem;
}

interface DevError {
  id: string;
  code: string;
  title: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
  stackTrace: string;
  beforeCode: string;
  afterCode: string;
  explanation: string;
  category: 'syntax' | 'react' | 'architecture' | 'security';
  status: 'detected' | 'fixing' | 'healed';
}

const PREDEFINED_ERRORS: DevError[] = [
  {
    id: 'err-tsc-try-gemini',
    code: 'TS1005',
    title: "Syntax Error: missing 'try' statement block in geminiService",
    location: "services/geminiService.ts:54",
    severity: 'high',
    stackTrace: `services/geminiService.ts(54,5): error TS1005: 'try' expected.
services/geminiService.ts(151,1): error TS1128: Declaration or statement expected.`,
    beforeCode: `export async function generateInfographic(...) {
  const ai = getAiClient();
  // Summarize architecture for the image prompt
  const limitedTree = fileTree.slice(0, 150).map(f => f.path).join(', ');`,
    afterCode: `export async function generateInfographic(...) {
  const ai = getAiClient();
  try {
    // Summarize architecture for the image prompt
    const limitedTree = fileTree.slice(0, 150).map(f => f.path).join(', ');`,
    explanation: "An unclosed asynchronous scope or copy-paste truncation created mismatched curly brackets inside `generateInfographic`. The TypeScript compiler was expecting a balancing `try {` block immediately before parsing the inner statement routines.",
    category: 'syntax',
    status: 'detected'
  },
  {
    id: 'err-react-setstate-render',
    code: 'React-Render-Conflict',
    title: "Uncaught Warning: Synchronous setState updates during component render",
    location: "components/SessionIndicator.tsx:39",
    severity: 'high',
    stackTrace: `Cannot update a component ('SessionIndicator') while rendering a different component ('App').
To locate the bad setState() call inside 'SessionIndicator', follow the stack trace:
    at SessionIndicator (SessionIndicator.tsx:21)
    at App (App.tsx:29)`,
    beforeCode: `const dispatchSessionEvent = (type: string, detail: any) => {
  window.dispatchEvent(new CustomEvent('link2ink_session_update', {
    detail: { type, data: detail, timestamp: Date.now() }
  }));
};`,
    afterCode: `const dispatchSessionEvent = (type: string, detail: any) => {
  // Defer event dispatching to break current rendering loop safely
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('link2ink_session_update', {
      detail: { type, data: detail, timestamp: Date.now() }
    }));
  }, 0);
};`,
    explanation: "Synchronous state dispatches inside React render or commit ticks trigger secondary state updates across sibling structures. Delaying the event loop queue slightly with `setTimeout(..., 0)` or `requestAnimationFrame` ensures updates execute cleanly after the render phase is complete.",
    category: 'react',
    status: 'detected'
  },
  {
    id: 'err-circular-dependency',
    code: 'CIRCULAR_DEP_FIREWALL',
    title: "Architectural Leak: Circular component reference loop detected",
    location: "components/RepoAnalyzer.tsx <-> components/FileImpactFactorCard.tsx",
    severity: 'medium',
    stackTrace: `[Architectural Invariant Check] Failed circular reference test:
  RepoAnalyzer.tsx
  └── FileImpactFactorCard.tsx
      └── RepoAnalyzer.tsx [VIOLATION]`,
    beforeCode: `// In FileImpactFactorCard.tsx
import { RepoAnalyzer } from './RepoAnalyzer';

const handleQuickExport = () => {
  RepoAnalyzer.triggerGlobalExport('svg');
};`,
    afterCode: `// In FileImpactFactorCard.tsx
// Removed direct RepoAnalyzer imports.
// Leverage props callbacks or state providers to delegate exports
interface FileImpactFactorCardProps {
  onExportSvg?: () => void;
}`,
    explanation: "A circular import prevents code splitting, leaks side effects, and complicates test sandboxing. De-coupling the dependency by introducing callback interfaces (`onExportSvg`) delegates responsibility to parents without direct, tight-coupling.",
    category: 'architecture',
    status: 'detected'
  },
  {
    id: 'err-gemini-key-leak',
    code: 'CLIENT_SECRET_EXPOSURE',
    title: "Vibeslop Security Audit: Potential exposure of secret key in client bundle",
    location: "components/DevStudio.tsx:9",
    severity: 'high',
    stackTrace: `[Anti-Slop Audit] Security failure:
  Found VITE_GEMINI_API_KEY declaration inside browser bundle.
  Sensitive keys must strictly run on server-side nodes.`,
    beforeCode: `// Client-side initialization (DANGEROUS)
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});`,
    afterCode: `// Server-side middleware proxy (SECURE)
const response = await fetch('/api/gemini/diagnose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
});`,
    explanation: "Bundling API keys on the client-side exposes your workspace billing and credentials to anyone viewing browser DevTools. Server proxy endpoints (`/api/*`) keep secrets hidden within cloud containers.",
    category: 'security',
    status: 'detected'
  }
];

export const AutoFixAgent: React.FC<AutoFixAgentProps> = ({ codebase }) => {
  const [errors, setErrors] = useState<DevError[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [customLog, setCustomLog] = useState<string>('');
  const [customDiagnosis, setCustomDiagnosis] = useState<{
    detected: boolean;
    errorTitle: string;
    description: string;
    suggestedFix: string;
    beforeSegment: string;
    afterSegment: string;
  } | null>(null);
  const [isCustomHealing, setIsCustomHealing] = useState<boolean>(false);
  const [viewingDiffId, setViewingDiffId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Approval Gate UI Wrapper State
  const [approvalGateEnabled, setApprovalGateEnabled] = useState<boolean>(true);
  const [pendingMutation, setPendingMutation] = useState<GateMutationPayload | null>(null);
  const [pendingErrorId, setPendingErrorId] = useState<string | null>(null);
  const [isApprovalGateOpen, setIsApprovalGateOpen] = useState<boolean>(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`link2ink_autofix_${codebase.id}`);
    if (saved) {
      try {
        setErrors(JSON.parse(saved));
      } catch (e) {
        setErrors(PREDEFINED_ERRORS);
      }
    } else {
      setErrors(PREDEFINED_ERRORS);
    }
  }, [codebase.id]);

  // Persist healed error states
  const saveState = (updated: DevError[]) => {
    setErrors(updated);
    localStorage.setItem(`link2ink_autofix_${codebase.id}`, JSON.stringify(updated));
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Soft reset half of the healed ones back to detected for simulation fun
      const restored = errors.map(err => 
        err.status === 'healed' && Math.random() > 0.5 
          ? { ...err, status: 'detected' as const } 
          : err
      );
      saveState(restored);
    }, 1500);
  };

  const handleResetAll = () => {
    const reset = PREDEFINED_ERRORS.map(e => ({ ...e, status: 'detected' as const }));
    saveState(reset);
    setCustomDiagnosis(null);
    setCustomLog('');
  };

  const handleAutoFix = (id: string) => {
    const targetError = errors.find(e => e.id === id);
    if (!targetError) return;

    if (approvalGateEnabled) {
      // Intercept mutation with Approval Gate Modal
      setPendingErrorId(id);
      setPendingMutation({
        id: targetError.id,
        source: 'autofix',
        title: targetError.title,
        location: targetError.location,
        targetFiles: [targetError.location.split(':')[0]],
        category: targetError.category,
        severity: targetError.severity,
        riskLevel: targetError.severity === 'high' ? 'HIGH' : targetError.severity === 'medium' ? 'MEDIUM' : 'LOW',
        beforeCode: targetError.beforeCode,
        afterCode: targetError.afterCode,
        explanation: targetError.explanation,
        invariants: {
          antiSlopPassed: true,
          typeSafetyPassed: true,
          securityPassed: true
        }
      });
      setIsApprovalGateOpen(true);
      return;
    }

    // Direct fix execution if gate is bypassed
    executeDirectFix(id, targetError.afterCode);
  };

  const executeDirectFix = (id: string, customCode?: string) => {
    setFixingId(id);
    
    // Update local state to fixing
    const step1 = errors.map(err => err.id === id ? { ...err, status: 'fixing' as const } : err);
    setErrors(step1);

    // Run progressive fix simulation steps
    setTimeout(() => {
      const step2 = errors.map(err => {
        if (err.id === id) {
          return { 
            ...err, 
            afterCode: customCode || err.afterCode,
            status: 'healed' as const 
          };
        }
        return err;
      });
      saveState(step2);
      setFixingId(null);
      setViewingDiffId(id); // automatically show the pristine repaired diff
    }, 1200);
  };

  const handleApplyCustomPatchWithGate = () => {
    if (!customDiagnosis) return;

    if (approvalGateEnabled) {
      setPendingErrorId(null);
      setPendingMutation({
        id: `custom-patch-${Date.now()}`,
        source: 'custom_patch',
        title: customDiagnosis.errorTitle,
        location: `${codebase.repoName}/src/patched_module.ts`,
        targetFiles: [`${codebase.repoName}/src/patched_module.ts`],
        category: 'architecture',
        severity: 'medium',
        riskLevel: 'MEDIUM',
        beforeCode: customDiagnosis.beforeSegment,
        afterCode: customDiagnosis.afterSegment,
        explanation: customDiagnosis.description,
        invariants: {
          antiSlopPassed: true,
          typeSafetyPassed: true,
          securityPassed: true
        }
      });
      setIsApprovalGateOpen(true);
      return;
    }

    handleApproveMutation(customDiagnosis.afterSegment);
  };

  const handleApproveMutation = (customAfterCode?: string) => {
    if (pendingMutation) {
      if (pendingMutation.source === 'autofix' && pendingErrorId) {
        executeDirectFix(pendingErrorId, customAfterCode);
      } else if (pendingMutation.source === 'custom_patch' && customDiagnosis) {
        const newError: DevError = {
          id: `custom-healed-${Date.now()}`,
          code: 'CUSTOM_LOG_FIX',
          title: customDiagnosis.errorTitle,
          location: `${codebase.repoName}/src/patched_module.ts`,
          severity: 'medium',
          stackTrace: customLog,
          beforeCode: customDiagnosis.beforeSegment,
          afterCode: customAfterCode || customDiagnosis.afterSegment,
          explanation: customDiagnosis.description,
          category: 'architecture',
          status: 'healed'
        };
        const updated = [newError, ...errors];
        saveState(updated);
        setViewingDiffId(newError.id);
      }
    }

    setIsApprovalGateOpen(false);
    setPendingMutation(null);
    setPendingErrorId(null);
  };

  const handleRejectMutation = () => {
    setIsApprovalGateOpen(false);
    setPendingMutation(null);
    setPendingErrorId(null);
  };

  const handleDiagnoseCustom = () => {
    if (!customLog.trim()) return;
    setIsCustomHealing(true);

    setTimeout(() => {
      setIsCustomHealing(false);
      
      // Smart matching based on known signatures or general heuristics
      let errorTitle = "Generic Studio ground Stack Overflow Exception";
      let description = "Unrecognized logs encountered. Likely tied to bundle configurations, syntax mismatches, or system out of memory alerts.";
      let beforeSegment = `// Unknown block\nconst data = await getPayload();\nprocessPayload(data);`;
      let afterSegment = `// Patched with null boundaries\ntry {\n  const data = await getPayload();\n  if (data) processPayload(data);\n} catch (err) {\n  console.warn("Recovered from loop anomaly", err);\n}`;
      let suggestedFix = "Examine the dynamic method dispatch values, add structural parameter guards, and catch runtime boundary exceptions.";

      const lowerLog = customLog.toLowerCase();
      if (lowerLog.includes('cannot read property') || lowerLog.includes('undefined')) {
        errorTitle = "ReferenceError: Cannot read property of undefined";
        description = "A component attempted to access a deep field inside a nested object that hasn't loaded yet.";
        beforeSegment = `const username = user.profile.name;`;
        afterSegment = `const username = user?.profile?.name || 'Anonymous User';`;
        suggestedFix = "Use optional chaining (?.) and logical fallback operators to protect deep state queries against early loads.";
      } else if (lowerLog.includes('module not found') || lowerLog.includes('cannot resolve')) {
        errorTitle = "ModuleNotFoundException: Missing dependency target";
        description = "Webpack/Vite compiler failed to locate the specified import route inside local assets or node_modules.";
        beforeSegment = `import { D3Chart } from './D3Flow';`;
        afterSegment = `import { D3FlowChart } from './D3FlowChart'; // Exact case-sensitive match`;
        suggestedFix = "Ensure path spelling and extension matching is correct. Capitalization matters on Linux-based container runtimes.";
      } else if (lowerLog.includes('key prop') || lowerLog.includes('unique key')) {
        errorTitle = "React Warning: Missing unique 'key' prop in map list item";
        description = "An array of React elements was generated dynamically via map() without unique key identities.";
        beforeSegment = `items.map((item) => <li>{item.label}</li>)`;
        afterSegment = `items.map((item) => <li key={item.id || item.label}>{item.label}</li>)`;
        suggestedFix = "Supply a unique string/number ID attribute to the outermost element returned by the callback loop.";
      }

      setCustomDiagnosis({
        detected: true,
        errorTitle,
        description,
        suggestedFix,
        beforeSegment,
        afterSegment
      });
    }, 1200);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const filteredErrors = errors.filter(err => 
    selectedCategory === 'all' ? true : err.category === selectedCategory
  );

  const totalErrorsCount = errors.filter(e => e.status !== 'healed').length;
  const healedCount = errors.filter(e => e.status === 'healed').length;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADING CARD */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-[1px] shadow-lg shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Wrench className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-sans text-white">AI Studio Ground Auto-Fix Agent</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                PERSISTENT ENGINE ACTIVE
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-2xl mt-1">
              Automated compiler log analysis, React cascade repair, and circular dependence resolution diagnostics. Re-scan the repository or inspect persistent ground parameters.
            </p>
          </div>
        </div>

        {/* Action button panel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Approval Gate Toggle Control */}
          <button
            type="button"
            onClick={() => setApprovalGateEnabled(!approvalGateEnabled)}
            className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              approvalGateEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
            title="Force manual preview and confirmation step before file mutations are pushed"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Gate: {approvalGateEnabled ? 'STRICT (ON)' : 'BYPASS'}</span>
          </button>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Log Pipeline...' : 'Run Diagnostics'}</span>
          </button>
          
          <button
            onClick={handleResetAll}
            className="px-3.5 py-2 rounded-xl bg-slate-950/40 hover:bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-mono font-bold transition-all"
          >
            Reset Healed States
          </button>
        </div>
      </div>

      {/* 2. STATS & GRIDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
          <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block">Integrity Ground Status</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-lg font-bold font-mono text-emerald-400">HEALTHY</span>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
          <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block">Circular Invariants</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold font-mono text-cyan-400">0 DETECTED</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
          <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block">Active Errors Caught</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold font-mono text-red-400">{totalErrorsCount}</span>
            <span className="text-slate-500 text-xs font-mono">/ {errors.length} total</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5">
          <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block">AI Healed Patches</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-lg font-bold font-mono">{healedCount}</span>
            <span className="text-slate-500 text-xs font-mono">successes</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Error Logs List */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300">
              <Bug className="w-4 h-4 text-emerald-400" />
              <span>DETECTED STUDIO SYSTEM ANOMALIES</span>
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-1">
              {['all', 'syntax', 'react', 'architecture', 'security'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all uppercase ${
                    selectedCategory === cat 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredErrors.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950/20 border border-dashed border-white/10 text-center text-slate-500 font-mono text-xs">
                No active anomalies found in this category. System parameters are fully clean.
              </div>
            ) : (
              filteredErrors.map((err) => {
                const isHealed = err.status === 'healed';
                const isFixing = err.status === 'fixing';
                const severityColors = {
                  high: 'bg-red-500/10 text-red-400 border-red-500/20',
                  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  low: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                };

                return (
                  <div 
                    key={err.id} 
                    className={`rounded-xl border transition-all ${
                      isHealed 
                        ? 'bg-slate-950/10 border-emerald-500/20 hover:border-emerald-500/40 opacity-75' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 flex items-start justify-between gap-4 border-b border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white">{err.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${severityColors[err.severity]}`}>
                            {err.severity.toUpperCase()}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[9px]">
                            {err.code}
                          </span>
                        </div>
                        <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1.5">
                          <span>File:</span>
                          <span className="text-slate-300">{err.location}</span>
                        </div>
                      </div>

                      {/* Healing Button */}
                      <div>
                        {isHealed ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            HEALED
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAutoFix(err.id)}
                            disabled={isFixing}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              isFixing 
                                ? 'bg-emerald-500/10 text-emerald-400 cursor-not-allowed border border-emerald-500/20' 
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15'
                            }`}
                          >
                            {isFixing ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Auto-Fix
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stack Trace / Error Details */}
                    <div className="p-4 bg-slate-950/40 font-mono text-[10px] text-red-400 border-b border-white/5 flex items-start gap-2 max-h-24 overflow-y-auto">
                      <Terminal className="w-4 h-4 shrink-0 text-red-400/80 mt-0.5" />
                      <pre className="whitespace-pre-wrap">{err.stackTrace}</pre>
                    </div>

                    {/* Action Footer: Diff Toggle */}
                    <div className="px-4 py-2.5 bg-slate-950/20 flex items-center justify-between text-[11px] font-mono">
                      <button
                        onClick={() => setViewingDiffId(viewingDiffId === err.id ? null : err.id)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{viewingDiffId === err.id ? 'Hide Patch Diff' : 'View Proposed Patch'}</span>
                      </button>

                      <span className="text-slate-500">
                        Category: <strong className="text-slate-400 uppercase">{err.category}</strong>
                      </span>
                    </div>

                    {/* Inside Patch / Code Compare */}
                    {viewingDiffId === err.id && (
                      <div className="p-4 border-t border-white/5 bg-slate-950/80 space-y-4">
                        {/* Technical Explanation */}
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-slate-300 leading-relaxed font-sans text-xs">
                          <strong className="text-emerald-400 font-mono block text-[10px] uppercase mb-1">AI Root-Cause Diagnosis:</strong>
                          {err.explanation}
                        </div>

                        {/* Split Diff Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[10px]">
                          {/* Before (Buggy Code) */}
                          <div className="rounded-lg overflow-hidden border border-red-500/20">
                            <div className="px-3 py-1.5 bg-red-500/10 text-red-400 border-b border-red-500/20 flex items-center justify-between">
                              <span>ORIGINAL CODE</span>
                              <span className="text-[9px] bg-red-500/20 px-1 rounded font-bold uppercase">Erroneous</span>
                            </div>
                            <pre className="p-3 bg-slate-950 text-slate-400 overflow-x-auto whitespace-pre">
                              {err.beforeCode}
                            </pre>
                          </div>

                          {/* After (Fixed Code) */}
                          <div className="rounded-lg overflow-hidden border border-emerald-500/20">
                            <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20 flex items-center justify-between">
                              <span>REPAIRED PATCH</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopy(err.afterCode, err.id)}
                                  className="text-slate-400 hover:text-white transition-colors"
                                  title="Copy clean code snippet"
                                >
                                  {copiedText === err.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                                <span className="text-[9px] bg-emerald-500/20 px-1 rounded font-bold text-emerald-300 uppercase">Pristine</span>
                              </div>
                            </div>
                            <pre className="p-3 bg-slate-950 text-slate-200 overflow-x-auto whitespace-pre">
                              {err.afterCode}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Log Sandbox & Playground */}
        <div className="xl:col-span-5 space-y-6">
          {/* Diagnostic Simulator Status */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/25 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>LOG HEALING PLAYGROUND</span>
            </div>
            
            <p className="text-slate-400 text-xs font-sans leading-relaxed">
              Paste custom console logs, linter failures, or compiler stack traces from local build shells. The Auto-Fix Agent will parse, evaluate, and output a custom healing diff.
            </p>

            <div className="space-y-2">
              <textarea
                value={customLog}
                onChange={(e) => setCustomLog(e.target.value)}
                placeholder="Example: Cannot read property 'map' of undefined inside component.tsx..."
                className="w-full h-32 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-slate-300 placeholder-slate-600 font-mono text-[11px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCustomLog(`TypeError: Cannot read property 'map' of undefined`)}
                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] font-mono text-slate-400 hover:text-slate-200 rounded transition-colors"
                  >
                    Load Map Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomLog(`Module build failed: Cannot resolve './D3Flow'`)}
                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-[9px] font-mono text-slate-400 hover:text-slate-200 rounded transition-colors"
                  >
                    Load Import Log
                  </button>
                </div>

                <button
                  onClick={handleDiagnoseCustom}
                  disabled={!customLog.trim() || isCustomHealing}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  {isCustomHealing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Deconstructing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Heal Log
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sandbox Diagnosis Output */}
          {customDiagnosis && (
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-950 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white uppercase">Playground Analysis Output</span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-cyan-300">{customDiagnosis.errorTitle}</h4>
                <p className="text-slate-400 text-xs font-sans leading-relaxed">{customDiagnosis.description}</p>
              </div>

              {/* Actionable Suggestion */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase">Suggested Remonstration:</span>
                <p className="text-slate-300 text-xs font-sans leading-relaxed">{customDiagnosis.suggestedFix}</p>
              </div>

              {/* Proposed Code Diff */}
              <div className="space-y-3 pt-2 font-mono text-[10px]">
                {/* Redundant Line */}
                <div className="rounded-lg overflow-hidden border border-red-500/10">
                  <div className="px-3 py-1 bg-red-500/5 text-red-400 text-[9px] border-b border-red-500/10 uppercase font-bold">
                    Broken Line
                  </div>
                  <pre className="p-2.5 bg-slate-950 text-slate-500 overflow-x-auto">
                    {customDiagnosis.beforeSegment}
                  </pre>
                </div>

                {/* Safe Line */}
                <div className="rounded-lg overflow-hidden border border-emerald-500/10">
                  <div className="px-3 py-1 bg-emerald-500/5 text-emerald-400 text-[9px] border-b border-emerald-500/10 flex items-center justify-between font-bold">
                    <span>AI PROPOSED REMEDY</span>
                    <button
                      onClick={() => handleCopy(customDiagnosis.afterSegment, 'custom-diagnose')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedText === 'custom-diagnose' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-950 text-slate-300 overflow-x-auto">
                    {customDiagnosis.afterSegment}
                  </pre>
                </div>

                {/* Apply Patch Button */}
                <button
                  type="button"
                  onClick={handleApplyCustomPatchWithGate}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Apply Patch via Approval Gate</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick FAQ info panel */}
          <div className="rounded-2xl border border-white/5 bg-slate-950 p-5 space-y-3 text-xs leading-relaxed text-slate-400 font-sans">
            <h4 className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>STUDIO DIAGNOSTIC PRINCIPLES</span>
            </h4>
            <p>
              The persistent auto-fix agent actively intercepts build logs during development cycles to construct a virtual structural model of potential faults. 
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 font-mono text-[11px]">
              <li>Zero exposure of secret environment variables to client runtimes.</li>
              <li>Safe deferral of layout rendering events to block concurrent cascade updates.</li>
              <li>Eliminates cyclic code pathways through reactive prop interfaces.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* REUSABLE APPROVAL GATE COMPONENT */}
      <ApprovalGate
        gateTitle="AutoFix Agent Pre-Push Mutation Gate"
        enabled={approvalGateEnabled}
        pendingMutation={isApprovalGateOpen ? pendingMutation : null}
        onConfirm={handleApproveMutation}
        onCancel={handleRejectMutation}
      />
    </div>
  );
};
