/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Layers, 
  ArrowRight, 
  FileCode2, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Boxes, 
  Database, 
  Server, 
  Compass,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { CodeMapNodeItem, ArchitectureTier, ModuleCategory } from '../../types';

interface CodemapSchematicProps {
  nodes: CodeMapNodeItem[];
  selectedNode: CodeMapNodeItem | null;
  onSelectNode: (node: CodeMapNodeItem) => void;
  categoryColors: Record<ModuleCategory, { bg: string; text: string; hex: string; border: string }>;
  tierColors: Record<ArchitectureTier, { hex: string; label: string }>;
}

const TIER_DEFINITIONS: {
  id: ArchitectureTier;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: 'entrypoint',
    title: 'Tier 1: Entrypoints & Boot',
    subtitle: 'App root, client index, server initialization & lifecycle',
    icon: Compass,
    accentColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30'
  },
  {
    id: 'routing_api',
    title: 'Tier 2: Routing & Controllers',
    subtitle: 'API endpoints, route handlers, middleware & event bus',
    icon: Server,
    accentColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30'
  },
  {
    id: 'core_domain',
    title: 'Tier 3: Core Domain & Services',
    subtitle: 'Business logic, engine rules, algorithms & orchestrators',
    icon: Cpu,
    accentColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30'
  },
  {
    id: 'data_state',
    title: 'Tier 4: State, Models & DB',
    subtitle: 'Schemas, repositories, caching, global state stores',
    icon: Database,
    accentColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'infra_config',
    title: 'Tier 5: Infra, Config & Utilities',
    subtitle: 'Build tooling, env setup, shared helper functions',
    icon: Boxes,
    accentColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30'
  },
  {
    id: 'testing_qa',
    title: 'Tier 6: Verification & QA',
    subtitle: 'Unit tests, integration suites, e2e test harnesses',
    icon: CheckCircle2,
    accentColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  }
];

export const CodemapSchematic: React.FC<CodemapSchematicProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  categoryColors
}) => {
  // Group nodes by tier
  const tierGroups = React.useMemo(() => {
    const map: Record<ArchitectureTier, CodeMapNodeItem[]> = {
      entrypoint: [],
      routing_api: [],
      core_domain: [],
      data_state: [],
      infra_config: [],
      testing_qa: []
    };

    nodes.forEach(node => {
      if (map[node.tier]) {
        map[node.tier].push(node);
      } else {
        map.infra_config.push(node);
      }
    });

    return map;
  }, [nodes]);

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-950/70 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in duration-300">
      {/* Tier Explanation Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2 font-mono">
            <Layers className="w-4 h-4 text-indigo-400" />
            Structured Architecture Flow Schematic
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Strict left-to-right layer separation to maintain mental model clarity and eliminate vibeslop.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-emerald-400 font-bold">{nodes.filter(n => !!n.annotation).length}</span>
          <span>/ {nodes.length} AI-Annotated Modules</span>
        </div>
      </div>

      {/* Grid of Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TIER_DEFINITIONS.map(tierDef => {
          const tierNodes = tierGroups[tierDef.id] || [];
          const Icon = tierDef.icon;

          return (
            <div 
              key={tierDef.id}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${tierDef.bgColor} ${tierDef.borderColor} relative`}
            >
              {/* Tier Header */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-black/40 ${tierDef.accentColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-white">
                        {tierDef.title}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 line-clamp-1">
                        {tierDef.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/50 text-slate-300">
                    {tierNodes.length}
                  </span>
                </div>

                {/* Node List within Tier */}
                <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {tierNodes.length > 0 ? (
                    tierNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      const hasAnnotation = !!node.annotation;
                      const slopRisk = node.annotation?.slopRisk;

                      return (
                        <div
                          key={node.id}
                          onClick={() => onSelectNode(node)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg ring-1 ring-indigo-400'
                              : 'bg-black/40 hover:bg-black/60 border-white/5 hover:border-white/20 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs font-mono font-bold truncate text-white" title={node.path}>
                                  {node.label}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                                {node.path}
                              </p>
                            </div>

                            {/* Risk & Annotation Badges */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {hasAnnotation && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono border border-sky-500/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>AI Spec</span>
                                </span>
                              )}
                              {slopRisk === 'high' ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/30 flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                  <span>Slop Hotspot</span>
                                </span>
                              ) : slopRisk === 'low' ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30">
                                  Pure
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Quick intent preview if annotated */}
                          {node.annotation?.intent && (
                            <p className="text-[10px] font-sans text-slate-400 mt-2 line-clamp-2 bg-white/5 p-1.5 rounded-lg border border-white/5">
                              {node.annotation.intent}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs font-mono text-slate-600">
                      No files classified in this tier.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
