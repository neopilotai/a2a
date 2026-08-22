/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  FileCode2, 
  Zap, 
  CheckCircle2, 
  AlertOctagon,
  Layers,
  Copy,
  Check,
  Cpu
} from 'lucide-react';
import { CodeMapNodeItem, ModuleAnnotation, ViewMode } from '../../types';

interface CodemapAnnotationsProps {
  nodes: CodeMapNodeItem[];
  annotations: Record<string, ModuleAnnotation>;
  onSelectNode: (node: CodeMapNodeItem) => void;
  onNavigate: (mode: ViewMode, data?: any) => void;
  onGenerateAnnotations: () => void;
  isGenerating: boolean;
  repoName: string;
}

export const CodemapAnnotations: React.FC<CodemapAnnotationsProps> = ({
  nodes,
  annotations,
  onSelectNode,
  onNavigate,
  onGenerateAnnotations,
  isGenerating,
  repoName
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const annotatedList = React.useMemo(() => {
    return nodes
      .map(node => ({
        node,
        annotation: annotations[node.path] || node.annotation
      }))
      .filter(item => {
        const matchesSearch = !filterQuery || 
          item.node.path.toLowerCase().includes(filterQuery.toLowerCase()) ||
          item.annotation?.role.toLowerCase().includes(filterQuery.toLowerCase()) ||
          item.annotation?.intent.toLowerCase().includes(filterQuery.toLowerCase());
        
        const matchesRisk = riskFilter === 'all' || item.annotation?.slopRisk === riskFilter;

        return matchesSearch && matchesRisk;
      });
  }, [nodes, annotations, filterQuery, riskFilter]);

  const copyAnnotationPrompt = (ann: ModuleAnnotation) => {
    const promptText = `Grounding Context for ${ann.path}:
Role: ${ann.role}
Intent: ${ann.intent}
Contracts/Invariants:
${ann.contracts.map(c => `- ${c}`).join('\n')}
Side Effects:
${ann.sideEffects.map(s => `- ${s}`).join('\n')}
Slop Risk Factors: ${ann.slopRiskReason || 'None'}
Exports: ${ann.keyExports?.join(', ') || 'N/A'}`;

    navigator.clipboard.writeText(promptText);
    setCopiedPath(ann.path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-4 md:p-6 bg-slate-950/70 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                AI Semantic Annotations Registry
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Explicit contracts, invariants, and side-effects to anchor mental models and prevent vibeslop.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onGenerateAnnotations}
          disabled={isGenerating}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Analyzing Semantic Invariants...' : 'Annotate Visible Codebase with Gemini'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search annotated roles, contracts, intents..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Slop Risk:</span>
          {(['all', 'high', 'medium', 'low'] as const).map(rf => (
            <button
              key={rf}
              onClick={() => setRiskFilter(rf)}
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all capitalize ${
                riskFilter === rf
                  ? 'bg-sky-600/30 border-sky-400 text-sky-200 font-bold'
                  : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* Annotations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {annotatedList.map(({ node, annotation }) => {
          const isCopied = copiedPath === node.path;
          const slopRisk = annotation?.slopRisk || 'low';

          return (
            <div
              key={node.id}
              className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all gap-4"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-white truncate" title={node.path}>
                        {node.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5" title={node.path}>
                      {node.path}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      slopRisk === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : slopRisk === 'medium'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {slopRisk.toUpperCase()} SLOP RISK
                    </span>
                  </div>
                </div>

                {/* Role & Intent */}
                <div className="mt-3 space-y-2">
                  {annotation ? (
                    <>
                      <div className="inline-block px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-300 text-[11px] font-mono font-semibold">
                        Role: {annotation.role}
                      </div>
                      <p className="text-xs font-sans text-slate-300 leading-relaxed">
                        {annotation.intent}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-mono text-slate-500 italic">
                      Pending Gemini deep semantic annotation. Click button above to batch-generate contracts.
                    </p>
                  )}
                </div>

                {/* Behavioral Contracts / Invariants */}
                {annotation && annotation.contracts && annotation.contracts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">
                      Guaranteed Invariants & Contracts:
                    </span>
                    {annotation.contracts.map((c, i) => (
                      <div key={i} className="text-[11px] font-mono text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Side Effects & Slop Risk Note */}
                {annotation && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-2 text-[10px] font-mono">
                    {annotation.sideEffects?.map((se, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                        Side-Effect: {se}
                      </span>
                    ))}
                    {annotation.slopRiskReason && (
                      <div className="w-full text-amber-300/90 text-[11px] font-mono bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 mt-1">
                        ⚠️ Slop Caution: {annotation.slopRiskReason}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectNode(node)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors"
                >
                  Inspect in Graph
                </button>

                <div className="flex items-center gap-2">
                  {annotation && (
                    <button
                      onClick={() => copyAnnotationPrompt(annotation)}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy Context Prompt for LLM"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onNavigate(ViewMode.AI_ASSISTANT, {
                        initialPrompt: `Given the exact module boundaries and invariants for "${node.path}" (Role: ${annotation?.role || 'Module'}, Intent: ${annotation?.intent || 'Domain'}), explain how to safely enhance this module without introducing vibeslop or architectural regressions.`
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ground AI</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
