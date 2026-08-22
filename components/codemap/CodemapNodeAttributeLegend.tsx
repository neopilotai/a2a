/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Boxes, 
  Cpu, 
  Zap, 
  Layers, 
  FileCode2, 
  Settings2, 
  FlaskConical, 
  Filter, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Compass, 
  ShieldCheck, 
  Info,
  SlidersHorizontal,
  Crosshair
} from 'lucide-react';
import { CodeEntityType, CodeMapNodeItem, ModuleCategory } from '../../types';

export interface EntityTypeConfig {
  id: CodeEntityType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ENTITY_TYPE_CONFIGS: Record<CodeEntityType, EntityTypeConfig> = {
  module: {
    id: 'module',
    label: 'Modules & Routers',
    shortLabel: 'Modules',
    description: 'Entrypoints, root servers, routers & architectural hubs',
    color: '#8b5cf6', // Violet
    borderColor: 'border-violet-500/40',
    bgColor: 'bg-violet-500/10',
    icon: Boxes,
  },
  class: {
    id: 'class',
    label: 'Classes & Services',
    shortLabel: 'Classes',
    description: 'Domain models, OOP classes, repositories & controllers',
    color: '#38bdf8', // Sky Blue
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10',
    icon: Cpu,
  },
  function: {
    id: 'function',
    label: 'Functions & Utils',
    shortLabel: 'Functions',
    description: 'Pure utility methods, hooks, handlers & middlewares',
    color: '#34d399', // Emerald
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    icon: Zap,
  },
  component: {
    id: 'component',
    label: 'UI Components',
    shortLabel: 'Components',
    description: 'React/Vue views, layouts, modals, widgets & UI units',
    color: '#f472b6', // Pink
    borderColor: 'border-pink-500/40',
    bgColor: 'bg-pink-500/10',
    icon: Layers,
  },
  interface: {
    id: 'interface',
    label: 'Interfaces & Types',
    shortLabel: 'Interfaces',
    description: 'TypeScript interfaces, types, schemas & DTO contracts',
    color: '#fbbf24', // Amber
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    icon: FileCode2,
  },
  config: {
    id: 'config',
    label: 'Configs & Manifests',
    shortLabel: 'Configs',
    description: 'Build configs, package manifests, Docker & env files',
    color: '#94a3b8', // Slate
    borderColor: 'border-slate-500/40',
    bgColor: 'bg-slate-500/10',
    icon: Settings2,
  },
  test: {
    id: 'test',
    label: 'Tests & Specs',
    shortLabel: 'Tests',
    description: 'Unit test suites, e2e specs, test fixtures & mocks',
    color: '#a78bfa', // Purple
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10',
    icon: FlaskConical,
  },
};

export const ALL_ENTITY_TYPES: CodeEntityType[] = [
  'module',
  'class',
  'function',
  'component',
  'interface',
  'config',
  'test',
];

interface CodemapNodeAttributeLegendProps {
  nodes: CodeMapNodeItem[];
  visibleEntityTypes: Record<CodeEntityType, boolean>;
  onToggleEntityType: (type: CodeEntityType) => void;
  onSetAllEntityTypes: (visible: boolean) => void;
  onIsolateEntityType: (type: CodeEntityType) => void;
  hoveredEntityType: CodeEntityType | null;
  onHoverEntityType: (type: CodeEntityType | null) => void;
  initialCollapsed?: boolean;
}

export const CodemapNodeAttributeLegend: React.FC<CodemapNodeAttributeLegendProps> = ({
  nodes,
  visibleEntityTypes,
  onToggleEntityType,
  onSetAllEntityTypes,
  onIsolateEntityType,
  hoveredEntityType,
  onHoverEntityType,
  initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapsed);
  const [showEncodingGlossary, setShowEncodingGlossary] = useState<boolean>(false);

  // Compute node count per entity type
  const entityCounts = React.useMemo(() => {
    const counts: Record<CodeEntityType, number> = {
      module: 0,
      class: 0,
      function: 0,
      component: 0,
      interface: 0,
      config: 0,
      test: 0,
    };
    nodes.forEach((n) => {
      const type = n.entityType || 'module';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const activeCount = ALL_ENTITY_TYPES.filter((t) => visibleEntityTypes[t]).length;
  const totalCount = ALL_ENTITY_TYPES.length;
  const visibleNodesCount = nodes.filter((n) => visibleEntityTypes[n.entityType || 'module']).length;

  return (
    <div className="absolute top-4 left-4 z-30 transition-all duration-300 max-w-[92vw] sm:max-w-md">
      
      {/* COLLAPSED PILL STATE */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="group flex items-center gap-2.5 px-3 py-2 bg-slate-950/90 hover:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl transition-all hover:border-violet-500/50 hover:shadow-neon-violet"
          title="Expand Node Attribute Legend & Entity Visibility Filter"
          id="codemap-legend-expand-btn"
        >
          <div className="p-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-white tracking-wide">Node Attributes</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
              {visibleNodesCount}/{nodes.length} Nodes
            </span>
          </div>

          <div className="flex items-center gap-1 ml-1 text-slate-400 group-hover:text-white transition-colors">
            <span className="text-[10px] font-mono hidden sm:inline">
              ({activeCount}/{totalCount} Active)
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </button>
      ) : (
        /* EXPANDED RICH CONTROL PANEL */
        <div className="bg-slate-950/95 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  Node Attribute Legend
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Interactive
                  </span>
                </h4>
                <p className="text-[10px] font-mono text-slate-400">
                  Toggle entity visibility & highlight dependencies
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse Legend"
                id="codemap-legend-collapse-btn"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Actions Bar */}
          <div className="px-3.5 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 text-[10px]">
              Displaying <strong className="text-white">{visibleNodesCount}</strong> of {nodes.length} nodes
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSetAllEntityTypes(true)}
                className="px-2 py-0.5 rounded text-[10px] text-violet-300 hover:text-white hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                title="Show all entity types"
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => onSetAllEntityTypes(false)}
                className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
                title="Hide all entity types"
              >
                None
              </button>
            </div>
          </div>

          {/* Interactive Entity Types Toggle List */}
          <div className="p-2.5 max-h-[310px] overflow-y-auto space-y-1.5 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {ALL_ENTITY_TYPES.map((type) => {
              const cfg = ENTITY_TYPE_CONFIGS[type];
              const isVisible = !!visibleEntityTypes[type];
              const count = entityCounts[type] || 0;
              const isHovered = hoveredEntityType === type;
              const IconComponent = cfg.icon;

              return (
                <div
                  key={type}
                  onMouseEnter={() => onHoverEntityType(type)}
                  onMouseLeave={() => onHoverEntityType(null)}
                  className={`pt-1.5 first:pt-0 rounded-xl transition-all px-2 py-1.5 flex items-center justify-between gap-2 group cursor-pointer ${
                    isHovered
                      ? 'bg-violet-500/15 ring-1 ring-violet-500/30'
                      : !isVisible
                      ? 'opacity-45 hover:opacity-75 bg-transparent'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => onToggleEntityType(type)}
                >
                  {/* Left: Checkbox + Icon Badge + Labels */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Custom Toggle Box */}
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        isVisible
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'border-white/20 bg-slate-900 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>

                    {/* Entity Color Icon */}
                    <div
                      className="p-1 rounded-lg shrink-0 border"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        borderColor: `${cfg.color}35`,
                        color: cfg.color,
                      }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>

                    {/* Label & Description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-semibold text-white truncate">
                          {cfg.label}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                      </div>
                      <p className="text-[9.5px] font-mono text-slate-400 truncate leading-tight">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Node Count & Solo Isolate Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                      {count}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onIsolateEntityType(type);
                      }}
                      className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[9px] font-mono text-violet-300 hover:text-white hover:bg-violet-600/30 border border-violet-500/20 transition-all flex items-center gap-0.5"
                      title={`Solo: show only ${cfg.shortLabel}`}
                    >
                      <Crosshair className="w-2.5 h-2.5" />
                      <span>Solo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collapsible Visual Encoding & Halo Semantics Guide */}
          <div className="border-t border-white/10 bg-slate-900/60 p-2.5">
            <button
              onClick={() => setShowEncodingGlossary(!showEncodingGlossary)}
              className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                <Info className="w-3 h-3 text-violet-400" />
                Visual Encoding Guide
              </span>
              {showEncodingGlossary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showEncodingGlossary && (
              <div className="mt-2.5 pt-2 border-t border-white/5 space-y-2 text-[10px] font-mono text-slate-400 animate-in fade-in duration-150">
                {/* Halos */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-amber-400 border-dashed shrink-0" />
                    <div>
                      <div className="text-amber-300 font-bold">Slop Hotspot</div>
                      <div className="text-[9px] text-slate-500">High complexity/risk</div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-violet-500/30 border border-violet-400 shadow-sm shrink-0" />
                    <div>
                      <div className="text-violet-300 font-bold">Critical Core</div>
                      <div className="text-[9px] text-slate-500">High connectivity node</div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-sky-400 bg-sky-500/20 shrink-0" />
                    <div>
                      <div className="text-sky-300 font-bold">AI Invariant</div>
                      <div className="text-[9px] text-slate-500">Semantic contract annotated</div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <span className="w-4 h-0.5 bg-white/40 block" />
                      <span className="w-4 h-0.5 border-t border-dashed border-violet-400 block" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-bold">Link Types</div>
                      <div className="text-[9px] text-slate-500">Solid: Dir / Dash: Cross-tier</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
