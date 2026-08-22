/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  GitCommit, 
  Sparkles, 
  Activity, 
  HelpCircle,
  Eye,
  Minimize2,
  Maximize2,
  Database,
  Server,
  Layout,
  Cpu,
  Wrench,
  FileCode,
  ShieldAlert,
  FolderRoot
} from 'lucide-react';

export interface LegendItem {
  id: string;
  name: string;
  category: string;
  color: string;
  hex: string;
  border: string;
  glow: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  examples: string;
  groupIndex?: number;
}

export interface ConnectorItem {
  id: string;
  name: string;
  style: 'solid' | 'dashed' | 'thick' | 'gradient';
  color: string;
  strokeWidth: number;
  dashArray?: string;
  weightLabel: string;
  description: string;
  sourceTarget: string;
}

export const NODE_LEGEND_ITEMS: LegendItem[] = [
  {
    id: 'root',
    name: 'Root / Workspace Core',
    category: 'Core',
    color: 'bg-violet-500',
    hex: '#8b5cf6',
    border: 'border-violet-400',
    glow: 'rgba(139, 92, 246, 0.4)',
    icon: FolderRoot,
    description: 'Central entry point, workspace manifest, and root project orchestrator.',
    examples: 'App.tsx, main.tsx, index.ts, package.json',
    groupIndex: 0,
  },
  {
    id: 'ui',
    name: 'UI / Frontend Views',
    category: 'Presentation',
    color: 'bg-sky-400',
    hex: '#38bdf8',
    border: 'border-sky-400',
    glow: 'rgba(56, 189, 248, 0.4)',
    icon: Layout,
    description: 'Visual components, responsive pages, screen layouts, styles, and templates.',
    examples: 'components/, views/, pages/, *.tsx, *.vue',
    groupIndex: 1,
  },
  {
    id: 'api',
    name: 'API / Routing Handlers',
    category: 'Gateway',
    color: 'bg-emerald-400',
    hex: '#34d399',
    border: 'border-emerald-400',
    glow: 'rgba(52, 211, 153, 0.4)',
    icon: Server,
    description: 'REST/GraphQL routing controllers, HTTP endpoint handlers, and middleware.',
    examples: 'routes/, controllers/, api/, server.ts',
    groupIndex: 2,
  },
  {
    id: 'services',
    name: 'Services & Logic',
    category: 'Domain Logic',
    color: 'bg-amber-400',
    hex: '#fbbf24',
    border: 'border-amber-400',
    glow: 'rgba(251, 191, 36, 0.4)',
    icon: Cpu,
    description: 'Business workflows, domain rules, state managers, hooks, and external clients.',
    examples: 'services/, managers/, store/, usecases/',
    groupIndex: 3,
  },
  {
    id: 'data',
    name: 'Data & Persistence',
    category: 'Storage',
    color: 'bg-pink-400',
    hex: '#f472b6',
    border: 'border-pink-400',
    glow: 'rgba(244, 114, 182, 0.4)',
    icon: Database,
    description: 'Database models, ORM schemas, migration scripts, and entity repositories.',
    examples: 'models/, schemas/, prisma/, drizzle/, db/',
    groupIndex: 4,
  },
  {
    id: 'utils',
    name: 'Utils & Helpers',
    category: 'Shared Utility',
    color: 'bg-purple-400',
    hex: '#a78bfa',
    border: 'border-purple-400',
    glow: 'rgba(167, 139, 250, 0.4)',
    icon: Wrench,
    description: 'Shared utility functions, formatting algorithms, validators, and math tools.',
    examples: 'utils/, helpers/, lib/, validators/',
    groupIndex: 5,
  },
  {
    id: 'config',
    name: 'Config & Type Systems',
    category: 'Configuration',
    color: 'bg-teal-400',
    hex: '#2dd4bf',
    border: 'border-teal-400',
    glow: 'rgba(45, 212, 191, 0.4)',
    icon: FileCode,
    description: 'TypeScript interfaces, constants, environment settings, and build flags.',
    examples: 'types.ts, config.json, .env.example, constants/',
    groupIndex: 6,
  },
  {
    id: 'auth',
    name: 'Auth & Security / Gates',
    category: 'Security',
    color: 'bg-rose-400',
    hex: '#f87171',
    border: 'border-rose-400',
    glow: 'rgba(248, 113, 113, 0.4)',
    icon: ShieldAlert,
    description: 'Authentication boundaries, JWT tokens, RBAC roles, and error handlers.',
    examples: 'auth/, security/, guard/, errorBoundary/',
    groupIndex: 7,
  }
];

export const CONNECTOR_LEGEND_ITEMS: ConnectorItem[] = [
  {
    id: 'trace-critical',
    name: 'Focus Mode: Critical Architectural Paths',
    style: 'thick',
    color: '#ff007a',
    strokeWidth: 4.8,
    dashArray: '8,4',
    weightLabel: 'Critical High-Traffic Hub (Neon Rose)',
    description: 'Distinctly color-coded pulsing connection leading to high-traffic core hubs and heavily depended-upon architectural files.',
    sourceTarget: 'Focal Module ──▶ High-Traffic Hubs (3+ Callers)'
  },
  {
    id: 'trace-incoming',
    name: 'Dependency Trace: Incoming Callers',
    style: 'thick',
    color: '#00f0ff',
    strokeWidth: 3.5,
    dashArray: '6,3',
    weightLabel: 'High-Contrast Trace (Cyan)',
    description: 'Illuminates all upstream components that invoke or depend upon the hovered or focused node.',
    sourceTarget: 'Caller Modules ──▶ Focal Node'
  },
  {
    id: 'trace-outgoing',
    name: 'Dependency Trace: Outgoing Deps',
    style: 'thick',
    color: '#ff9f1c',
    strokeWidth: 3.5,
    dashArray: '6,3',
    weightLabel: 'High-Contrast Trace (Amber)',
    description: 'Illuminates downstream dependencies, services, models, and stores called by the hovered or focused node.',
    sourceTarget: 'Focal Node ──▶ Target Dependencies'
  },
  {
    id: 'structural',
    name: 'Structural Hierarchy',
    style: 'solid',
    color: '#64748b',
    strokeWidth: 1.5,
    weightLabel: 'Thin (Value: 1)',
    description: 'Connects the workspace root to primary architectural categories and top-level modules.',
    sourceTarget: 'Root → Category / Top-level File'
  },
  {
    id: 'dispatch',
    name: 'Action Dispatch / State Flow',
    style: 'solid',
    color: '#38bdf8',
    strokeWidth: 2.5,
    weightLabel: 'Medium (Value: 2)',
    description: 'User-triggered actions and UI events invoking business logic or async data services.',
    sourceTarget: 'UI Component → Logic Service'
  },
  {
    id: 'gateway',
    name: 'API Gateway Routing',
    style: 'solid',
    color: '#34d399',
    strokeWidth: 2.5,
    weightLabel: 'Medium (Value: 2)',
    description: 'Inbound HTTP/gRPC requests routed from API controllers to domain services.',
    sourceTarget: 'API Route → Service Handler'
  },
  {
    id: 'persistence',
    name: 'Database Persistence Pipeline',
    style: 'thick',
    color: '#f472b6',
    strokeWidth: 4,
    weightLabel: 'Thick (Value: 3)',
    description: 'High-gravity data pipelines, ORM schema queries, mutations, and database transactions.',
    sourceTarget: 'Logic Service → Database Model'
  },
  {
    id: 'utility',
    name: 'Utility Dependency',
    style: 'dashed',
    color: '#a78bfa',
    strokeWidth: 1.5,
    dashArray: '4,4',
    weightLabel: 'Dashed (Value: 1)',
    description: 'Lightweight references to pure helper functions, formatters, and mathematical utilities.',
    sourceTarget: 'Service / UI → Utility Function'
  }
];

interface VisualLegendProps {
  onHighlightGroup?: (groupIndex: number | null) => void;
  activeGroupHighlight?: number | null;
  className?: string;
  defaultExpanded?: boolean;
}

export const VisualLegend: React.FC<VisualLegendProps> = ({
  onHighlightGroup,
  activeGroupHighlight = null,
  className = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'nodes' | 'connectors' | 'interactions'>('nodes');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  const handleGroupClick = (groupIndex?: number) => {
    if (groupIndex === undefined || !onHighlightGroup) return;
    if (activeGroupHighlight === groupIndex) {
      onHighlightGroup(null);
    } else {
      onHighlightGroup(groupIndex);
    }
  };

  return (
    <div 
      id="gitflow-visual-legend-container"
      className={`transition-all duration-300 z-30 ${className}`}
    >
      {/* Collapsed State: Sleek Pill Trigger */}
      {!isExpanded ? (
        <button
          onClick={handleToggle}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white shadow-xl backdrop-blur-md transition-all group font-mono text-xs"
          title="Open Visual Architecture Legend"
          id="gitflow-legend-toggle-open-btn"
          aria-expanded={false}
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 relative" />
          </div>
          <span className="font-semibold tracking-wide">Visual Legend</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 font-mono">
            8 Layers • 5 Connectors
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-400 transition-transform" />
        </button>
      ) : (
        /* Expanded State: Interactive Glass Panel */
        <div className="w-[320px] sm:w-[380px] md:w-[440px] max-h-[520px] flex flex-col glass-panel rounded-2xl border border-white/15 shadow-2xl bg-slate-950/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/60 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  Visual Blueprint Legend
                </h4>
                <p className="text-[10px] font-mono text-slate-400">
                  Node hierarchy & connector taxonomy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggle}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Collapse Legend"
                id="gitflow-legend-toggle-close-btn"
                aria-expanded={true}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-3 pt-2 pb-1 border-b border-white/5 flex items-center gap-1.5 bg-slate-950/40 font-mono text-[11px]">
            <button
              onClick={() => setActiveTab('nodes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'nodes'
                  ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5 text-violet-400" />
              <span>Node Layers ({NODE_LEGEND_ITEMS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('connectors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'connectors'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Connectors ({CONNECTOR_LEGEND_ITEMS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('interactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'interactions'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Controls</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-3.5 overflow-y-auto space-y-3 max-h-[380px] custom-scrollbar text-slate-200">
            
            {/* TAB 1: NODE LAYERS */}
            {activeTab === 'nodes' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pb-1">
                  <span>LAYER & COLOR</span>
                  <span>CLICK TO HIGHLIGHT</span>
                </div>

                {NODE_LEGEND_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isHighlighted = activeGroupHighlight === item.groupIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleGroupClick(item.groupIndex)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isHighlighted
                          ? 'bg-violet-500/15 border-violet-400 shadow-md ring-1 ring-violet-500/40'
                          : 'bg-slate-900/50 hover:bg-slate-900 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Node Color Swatch */}
                        <div 
                          className="w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 shadow-sm border border-slate-950"
                          style={{
                            backgroundColor: item.hex,
                            boxShadow: `0 0 10px ${item.glow}`
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-white font-mono truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5 shrink-0">
                              {item.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 mt-1 font-sans leading-relaxed">
                            {item.description}
                          </p>

                          <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center gap-1 truncate">
                            <span className="text-slate-500">Pattern:</span>
                            <span className="text-slate-300 truncate">{item.examples}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: CONNECTOR TYPES */}
            {activeTab === 'connectors' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                <div className="text-[10px] font-mono text-slate-400 px-1 pb-1">
                  EDGE WEIGHT & DATA TRANSMISSION TYPES
                </div>

                {CONNECTOR_LEGEND_ITEMS.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {conn.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-sky-300 border border-white/5 font-semibold">
                        {conn.weightLabel}
                      </span>
                    </div>

                    {/* Visual Line Sample */}
                    <div className="py-2 px-3 my-1.5 bg-slate-950/80 rounded-lg border border-white/5 flex items-center justify-between gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                      
                      <div className="flex-1 h-3 flex items-center">
                        <svg className="w-full h-3 overflow-visible">
                          <line
                            x1="0"
                            y1="6"
                            x2="100%"
                            y2="6"
                            stroke={conn.color}
                            strokeWidth={conn.strokeWidth}
                            strokeDasharray={conn.dashArray || 'none'}
                            strokeOpacity={0.85}
                          />
                        </svg>
                      </div>

                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: conn.color }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {conn.description}
                    </p>

                    <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <span className="text-slate-500">Flow:</span>
                      <span className="text-slate-300 font-semibold">{conn.sourceTarget}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: CONTROLS & SHORTCUTS */}
            {activeTab === 'interactions' && (
              <div className="space-y-3 animate-in fade-in duration-200 text-xs font-mono">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
                  <div className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-3.5 h-3.5" /> D3 Navigation Guide
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans">
                    <li className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-bold">Scroll Wheel / Pinch:</span>
                      <span>Zoom in and out (15% to 600%)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-bold">Click + Drag Canvas:</span>
                      <span>Pan across entire architecture workspace</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-bold">Drag Node:</span>
                      <span>Pin or reposition nodes with live D3 physics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-bold">Click Node:</span>
                      <span>Inspect file category, path, and connections</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-bold">Reset View:</span>
                      <span>Instantly re-center canvas and reset scale to 100%</span>
                    </li>
                  </ul>
                </div>

                <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 text-[11px] text-violet-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Use legend category rows to quickly highlight node groups across the graph.</span>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 border-t border-white/10 bg-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              GitFlow D3 Engine v2.4
            </span>
            <button
              onClick={handleToggle}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Minimize
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default VisualLegend;
