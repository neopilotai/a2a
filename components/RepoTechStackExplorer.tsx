/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { 
  RepoTechStackOverview, 
  FolderTechSummary, 
  FolderTreeNode, 
  DetectedTech 
} from '../types';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  Cpu, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight, 
  Code2, 
  Compass, 
  Boxes, 
  Workflow, 
  Terminal,
  Grid,
  ListTree
} from 'lucide-react';

interface RepoTechStackExplorerProps {
  techOverview: RepoTechStackOverview;
  repoName: string;
  onSelectFolder?: (folderPath: string) => void;
  onFocusNodeInGraph?: (nodeNameOrPath: string) => void;
}

export const RepoTechStackExplorer: React.FC<RepoTechStackExplorerProps> = ({
  techOverview,
  repoName,
  onSelectFolder,
  onFocusNodeInGraph
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Filtered folders for grid view
  const filteredFolders = useMemo(() => {
    return techOverview.folders.filter(f => {
      const matchesSearch = f.folderPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.folderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.primaryTech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.architecturalRole.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTech = selectedTechFilter === 'all' || 
        f.primaryTech.id === selectedTechFilter ||
        f.secondaryTechs.some(st => st.id === selectedTechFilter);

      return matchesSearch && matchesTech;
    });
  }, [techOverview.folders, searchQuery, selectedTechFilter]);

  return (
    <div className="space-y-4">
      {/* Top Architecture & Tech Stack Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950 border border-white/10 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Main Title & Stack Role */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white font-mono tracking-wide">
                  AUTOMATED ARCHITECTURE & TECH STACK OVERVIEW
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  {techOverview.stackSummaryLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Each repository folder has been analyzed to identify primary frameworks, languages, and architectural subsystems.
              </p>
            </div>
          </div>

          {/* Global Tech Stack Badges */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
            <span className="text-[11px] font-mono text-slate-500 mr-1">Primary Stack:</span>
            {techOverview.globalTechs.map(tech => (
              <span
                key={tech.id}
                style={{
                  backgroundColor: tech.bgColor,
                  borderColor: tech.borderColor,
                  color: tech.color
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold shadow-sm"
              >
                <span>{tech.icon}</span>
                <span>{tech.badgeLabel}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Global Language Distribution Breakdown */}
        {techOverview.stats.languageBreakdown.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                Language Composition
              </span>
              <span>{techOverview.stats.totalFiles} files across {techOverview.stats.totalFolders} folders</span>
            </div>
            
            {/* Multi-segment language bar */}
            <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden flex shadow-inner border border-white/5">
              {techOverview.stats.languageBreakdown.map((lang) => (
                <div
                  key={lang.name}
                  style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                  className="h-full transition-all hover:opacity-80"
                  title={`${lang.name}: ${lang.count} files (${lang.percentage}%)`}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {techOverview.stats.languageBreakdown.slice(0, 6).map((lang) => (
                <div key={lang.name} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                  <span className="text-slate-300 font-medium">{lang.name}</span>
                  <span className="text-slate-500 text-[10px]">({lang.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Folder Explorer Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search folders or tech..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Quick Tech Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTechFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all whitespace-nowrap ${
                selectedTechFilter === 'all'
                  ? 'bg-white/15 text-white font-bold border border-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              All Tech ({techOverview.folders.length})
            </button>
            {techOverview.globalTechs.map(tech => (
              <button
                key={tech.id}
                onClick={() => setSelectedTechFilter(selectedTechFilter === tech.id ? 'all' : tech.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all whitespace-nowrap ${
                  selectedTechFilter === tech.id
                    ? 'font-bold border shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                style={
                  selectedTechFilter === tech.id
                    ? { backgroundColor: tech.bgColor, borderColor: tech.borderColor, color: tech.color }
                    : {}
                }
              >
                <span>{tech.icon}</span>
                <span>{tech.badgeLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle: Grid Cards vs Hierarchical Tree */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950/80 rounded-lg border border-white/10 shrink-0 self-end sm:self-auto font-mono text-xs">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
              viewMode === 'grid'
                ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Card Grid View"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Folder Cards</span>
          </button>

          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
              viewMode === 'tree'
                ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Directory Tree View"
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Tree View</span>
          </button>
        </div>
      </div>

      {/* FOLDER CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFolders.map((folder) => {
            const isRoot = folder.folderPath === '/' || folder.folderPath === 'root';
            return (
              <div
                key={folder.folderPath}
                className="group relative bg-slate-900/70 hover:bg-slate-900/90 rounded-xl border border-white/10 hover:border-violet-500/40 transition-all p-3.5 flex flex-col justify-between gap-3 shadow-md hover:shadow-lg backdrop-blur-sm"
              >
                {/* Header: Folder icon, path, and Primary Tech Stack Badge */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                        {isRoot ? <Workflow className="w-4 h-4 text-violet-400" /> : <Folder className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-bold text-white group-hover:text-violet-300 transition-colors truncate block">
                          {isRoot ? `/${repoName} (root)` : `${folder.folderPath}/`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          {folder.architecturalRole}
                        </span>
                      </div>
                    </div>

                    {/* Primary Tech Stack Badge */}
                    <span
                      style={{
                        backgroundColor: folder.primaryTech.bgColor,
                        borderColor: folder.primaryTech.borderColor,
                        color: folder.primaryTech.color
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold shrink-0 shadow-sm"
                    >
                      <span>{folder.primaryTech.icon}</span>
                      <span>{folder.primaryTech.badgeLabel}</span>
                    </span>
                  </div>

                  {/* Secondary Tech Badges */}
                  {folder.secondaryTechs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {folder.secondaryTechs.map(st => (
                        <span
                          key={st.id}
                          style={{
                            backgroundColor: st.bgColor,
                            borderColor: st.borderColor,
                            color: st.color
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                        >
                          {st.icon} {st.badgeLabel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sample files list preview */}
                {folder.sampleFiles.length > 0 && (
                  <div className="bg-slate-950/60 rounded-lg p-2 border border-white/5 space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block">
                      Sample Files ({folder.totalFiles} total):
                    </span>
                    <div className="space-y-0.5">
                      {folder.sampleFiles.map(file => (
                        <div key={file} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 truncate">
                          <FileCode className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: Languages bar & Quick Action */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  {/* Mini language badge */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    {folder.languages.slice(0, 2).map(l => (
                      <span key={l.name} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <span>{l.name}</span>
                      </span>
                    ))}
                  </div>

                  {/* Focus in graph button */}
                  {onFocusNodeInGraph && (
                    <button
                      onClick={() => onFocusNodeInGraph(folder.folderName)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded border border-white/10 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      title={`Focus ${folder.folderName} modules in graph`}
                    >
                      <Compass className="w-3 h-3 text-violet-400" />
                      <span>Focus Graph</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredFolders.length === 0 && (
            <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-white/5 font-mono text-xs text-slate-400">
              No folders matched the selected filters.
            </div>
          )}
        </div>
      )}

      {/* DIRECTORY HIERARCHY TREE VIEW */}
      {viewMode === 'tree' && (
        <div className="bg-slate-900/70 rounded-xl border border-white/10 p-4 font-mono text-xs shadow-md backdrop-blur-sm">
          <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between pb-2 border-b border-white/5">
            <span>Repository Directory Tree & Primary Tech Stack Mapping</span>
            <span className="text-[10px] text-slate-500">Click folders to expand/collapse</span>
          </div>

          <FolderTreeNodeRenderer
            node={techOverview.folderTree}
            expandedPaths={expandedPaths}
            onToggleExpand={toggleExpand}
            onFocusNodeInGraph={onFocusNodeInGraph}
          />
        </div>
      )}
    </div>
  );
};

// Recursive Folder Tree Node component
const FolderTreeNodeRenderer: React.FC<{
  node: FolderTreeNode;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onFocusNodeInGraph?: (nodeNameOrPath: string) => void;
}> = ({ node, expandedPaths, onToggleExpand, onFocusNodeInGraph }) => {
  const isExpanded = expandedPaths.has(node.path);
  const hasChildren = node.subFolders.length > 0;
  const isRoot = node.path === '';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-white/5 group transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.path)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-transform"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          <span className="text-amber-400">
            {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          </span>

          <span className="text-slate-200 font-bold group-hover:text-violet-300 transition-colors truncate">
            {isRoot ? 'root/' : `${node.name}/`}
          </span>

          <span className="text-slate-500 text-[10px] hidden md:inline">
            ({node.totalFilesCount} {node.totalFilesCount === 1 ? 'file' : 'files'})
          </span>

          <span className="text-slate-400 text-[10px] hidden lg:inline truncate max-w-[180px]">
            • {node.architecturalRole}
          </span>
        </div>

        {/* Primary Tech Stack Badge in Tree */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{
              backgroundColor: node.primaryTech.bgColor,
              borderColor: node.primaryTech.borderColor,
              color: node.primaryTech.color
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono font-bold shadow-sm"
          >
            <span>{node.primaryTech.icon}</span>
            <span>{node.primaryTech.badgeLabel}</span>
          </span>

          {onFocusNodeInGraph && (
            <button
              onClick={() => onFocusNodeInGraph(node.name)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all text-[10px]"
              title={`Focus ${node.name} in graph`}
            >
              <Compass className="w-3 h-3 text-violet-400" />
            </button>
          )}
        </div>
      </div>

      {/* Render subfolders recursively if expanded */}
      {isExpanded && hasChildren && (
        <div className="pl-5 border-l border-white/5 space-y-1 ml-2">
          {node.subFolders.map(sub => (
            <FolderTreeNodeRenderer
              key={sub.path}
              node={sub}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onFocusNodeInGraph={onFocusNodeInGraph}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RepoTechStackExplorer;
