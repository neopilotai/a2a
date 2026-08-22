/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Network, 
  Sparkles, 
  Link2, 
  Unlink, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Info, 
  Layers, 
  ArrowRight, 
  Plus, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Cpu,
  Flame
} from 'lucide-react';
import { PlanMilestone, PlanTask } from '../../types';
import { analyzeParallelDistribution } from '../../services/parallelDistributionEngine';

interface PlanDependencyGraphProps {
  milestones: PlanMilestone[];
  onUpdateMilestones: (newMilestones: PlanMilestone[]) => void;
  onSelectTask?: (taskId: string) => void;
}

export const PlanDependencyGraph: React.FC<PlanDependencyGraphProps> = ({
  milestones,
  onUpdateMilestones,
  onSelectTask
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSourceTaskId, setSelectedSourceTaskId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<{ source: string; target: string } | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [topoSortApplied, setTopoSortApplied] = useState(false);
  const [showParallelWaves, setShowParallelWaves] = useState(true);

  // Compute parallel wave stages & critical path
  const parallelAnalysis = useMemo(() => {
    return analyzeParallelDistribution(milestones);
  }, [milestones]);

  const criticalPathSet = useMemo(() => {
    return new Set(parallelAnalysis.criticalPathTaskIds);
  }, [parallelAnalysis]);

  const taskWaveMap = useMemo(() => {
    const map = new Map<string, number>();
    parallelAnalysis.concurrentStages.forEach(stage => {
      stage.taskIds.forEach(id => map.set(id, stage.stageIndex + 1));
    });
    return map;
  }, [parallelAnalysis]);

  // Flatten all tasks
  const allTasks = useMemo(() => {
    const tasks: (PlanTask & { milestoneId: string; phaseNumber: number; phaseTitle: string })[] = [];
    milestones.forEach(m => {
      m.tasks.forEach(t => {
        tasks.push({
          ...t,
          milestoneId: m.id,
          phaseNumber: m.phaseNumber,
          phaseTitle: m.title
        });
      });
    });
    return tasks;
  }, [milestones]);

  const taskMap = useMemo(() => {
    const map = new Map<string, PlanTask & { milestoneId: string; phaseNumber: number; phaseTitle: string }>();
    allTasks.forEach(t => map.set(t.id, t));
    return map;
  }, [allTasks]);

  // Extract all dependency links: source (prerequisite) -> target (dependent)
  const dependencyLinks = useMemo(() => {
    const links: { source: string; target: string; isCrossPhase: boolean }[] = [];
    allTasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          if (taskMap.has(depId)) {
            const sourceTask = taskMap.get(depId)!;
            links.push({
              source: depId,
              target: task.id,
              isCrossPhase: sourceTask.phaseNumber !== task.phaseNumber
            });
          }
        });
      }
    });
    return links;
  }, [allTasks, taskMap]);

  // Circular Dependency Detection (DFS)
  const circularDependencyCycle = useMemo(() => {
    const adj = new Map<string, string[]>();
    allTasks.forEach(t => adj.set(t.id, []));
    dependencyLinks.forEach(link => {
      if (adj.has(link.source)) {
        adj.get(link.source)!.push(link.target);
      }
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();
    let cycleNodes: string[] = [];

    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path, neighbor])) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          cycleNodes = [...path, neighbor];
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const task of allTasks) {
      if (!visited.has(task.id)) {
        if (dfs(task.id, [task.id])) {
          break;
        }
      }
    }

    return cycleNodes.length > 0 ? cycleNodes : null;
  }, [allTasks, dependencyLinks]);

  // Calculate layout coordinates for SVG lines
  const updateNodePositions = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions = new Map<string, { x: number; y: number; width: number; height: number }>();

    allTasks.forEach(task => {
      const el = document.getElementById(`dep-node-${task.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newPositions.set(task.id, {
          x: (rect.left - containerRect.left + containerRef.current!.scrollLeft) / zoomLevel,
          y: (rect.top - containerRect.top + containerRef.current!.scrollTop) / zoomLevel,
          width: rect.width / zoomLevel,
          height: rect.height / zoomLevel
        });
      }
    });

    setNodePositions(newPositions);
  };

  useEffect(() => {
    updateNodePositions();
    const handleResize = () => updateNodePositions();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(updateNodePositions, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [milestones, zoomLevel]);

  // Toggle or add dependency
  const handleConnectTasks = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const targetTask = taskMap.get(targetId);
    if (!targetTask) return;

    const currentDeps = targetTask.dependencies || [];
    const alreadyLinked = currentDeps.includes(sourceId);

    const updatedMilestones = milestones.map(m => ({
      ...m,
      tasks: m.tasks.map(t => {
        if (t.id === targetId) {
          const newDeps = alreadyLinked
            ? currentDeps.filter(d => d !== sourceId)
            : [...currentDeps, sourceId];
          return { ...t, dependencies: newDeps };
        }
        return t;
      })
    }));

    onUpdateMilestones(updatedMilestones);
    setSelectedSourceTaskId(null);
  };

  // Remove specific dependency link
  const handleRemoveLink = (sourceId: string, targetId: string) => {
    const updatedMilestones = milestones.map(m => ({
      ...m,
      tasks: m.tasks.map(t => {
        if (t.id === targetId && t.dependencies) {
          return {
            ...t,
            dependencies: t.dependencies.filter(d => d !== sourceId)
          };
        }
        return t;
      })
    }));
    onUpdateMilestones(updatedMilestones);
  };

  // Topological Auto-Sort
  const handleAutoTopologicalSort = () => {
    // Topo sort tasks according to dependency constraints
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    
    allTasks.forEach(t => {
      inDegree.set(t.id, 0);
      adj.set(t.id, []);
    });

    dependencyLinks.forEach(link => {
      if (adj.has(link.source) && inDegree.has(link.target)) {
        adj.get(link.source)!.push(link.target);
        inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1);
      }
    });

    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const sortedIds: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedIds.push(u);
      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        inDegree.set(v, (inDegree.get(v) || 1) - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    // Assign tasks into milestones preserving relative milestone counts
    if (sortedIds.length === allTasks.length) {
      let taskIndex = 0;
      const newMilestones = milestones.map(m => {
        const count = m.tasks.length;
        const assignedTaskIds = sortedIds.slice(taskIndex, taskIndex + count);
        taskIndex += count;
        const newTasks = assignedTaskIds.map(id => taskMap.get(id)!).filter(Boolean);
        return {
          ...m,
          tasks: newTasks
        };
      });

      onUpdateMilestones(newMilestones);
      setTopoSortApplied(true);
      setTimeout(() => setTopoSortApplied(false), 3000);
    }
  };

  // Auto-infer dependencies by action type and file path
  const handleAutoInferDependencies = () => {
    const fileToCreators = new Map<string, string>();
    
    // Pass 1: Find creators
    allTasks.forEach(t => {
      if (t.filePath && (t.actionType === 'create' || t.actionType === 'config')) {
        fileToCreators.set(t.filePath, t.id);
      }
    });

    // Pass 2: Link modifiers and testers to creators
    const updatedMilestones = milestones.map(m => ({
      ...m,
      tasks: m.tasks.map(t => {
        const newDeps = [...(t.dependencies || [])];
        if (t.filePath && fileToCreators.has(t.filePath)) {
          const creatorId = fileToCreators.get(t.filePath)!;
          if (creatorId !== t.id && !newDeps.includes(creatorId)) {
            newDeps.push(creatorId);
          }
        }
        return { ...t, dependencies: newDeps };
      })
    }));

    onUpdateMilestones(updatedMilestones);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-300">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Interactive Dependency Flow Map (DAG)</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                {dependencyLinks.length} Dependency Edges
              </span>
            </h3>
            <p className="text-[11px] font-sans text-slate-400">
              Click a task's connector port to link dependencies, or select a link to sever it.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedSourceTaskId && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-600/30 border border-violet-500/50 text-xs font-mono text-violet-200 animate-pulse">
              <span>Linking from: <strong>{taskMap.get(selectedSourceTaskId)?.title.slice(0, 20)}...</strong></span>
              <button
                onClick={() => setSelectedSourceTaskId(null)}
                className="text-violet-300 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={handleAutoInferDependencies}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            title="Auto-link tests and modifiers to their file creators"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Infer Links</span>
          </button>

          <button
            onClick={() => setShowParallelWaves(!showParallelWaves)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
              showParallelWaves 
                ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-200 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Highlight concurrent topological execution waves and critical paths"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Parallel Waves</span>
          </button>

          <button
            onClick={handleAutoTopologicalSort}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            title="Sort tasks strictly by prerequisite dependency order"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{topoSortApplied ? 'Sorted!' : 'Auto-Order by DAG'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Circular Dependency Warning Banner */}
      {circularDependencyCycle && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Circular Dependency Detected:</strong> A cyclical loop exists among tasks: {circularDependencyCycle.join(' ➔ ')}
            </span>
          </div>
          <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded text-rose-200">
            Fix by disconnecting one link
          </span>
        </div>
      )}

      {/* SVG & Node Graph Canvas Container */}
      <div 
        ref={containerRef}
        className="glass-panel rounded-3xl p-6 border border-white/10 overflow-x-auto min-h-[550px] relative bg-slate-950/60 select-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        {/* SVG Bezier Connection Layer */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-auto z-10"
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <defs>
            {/* Arrowhead marker */}
            <marker
              id="dep-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
            </marker>

            {/* Selected / Hovered Arrowhead */}
            <marker
              id="dep-arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
            </marker>
          </defs>

          {/* Render dependency lines */}
          {dependencyLinks.map((link, idx) => {
            const sourcePos = nodePositions.get(link.source);
            const targetPos = nodePositions.get(link.target);
            if (!sourcePos || !targetPos) return null;

            // Start from right center of source node, end at left center of target node
            const startX = (sourcePos.x + sourcePos.width) * zoomLevel;
            const startY = (sourcePos.y + sourcePos.height / 2) * zoomLevel;
            const endX = (targetPos.x) * zoomLevel;
            const endY = (targetPos.y + targetPos.height / 2) * zoomLevel;

            // Control points for smooth bezier
            const deltaX = Math.abs(endX - startX) * 0.5;
            const cp1X = startX + Math.max(deltaX, 40);
            const cp1Y = startY;
            const cp2X = endX - Math.max(deltaX, 40);
            const cp2Y = endY;

            const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
            
            const isHovered = hoveredLink?.source === link.source && hoveredLink?.target === link.target;
            const isRelatedToHoveredNode = hoveredTaskId === link.source || hoveredTaskId === link.target;

            return (
              <g 
                key={`${link.source}-${link.target}-${idx}`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredLink({ source: link.source, target: link.target })}
                onMouseLeave={() => setHoveredLink(null)}
                onClick={() => handleRemoveLink(link.source, link.target)}
              >
                {/* Thick invisible hover target */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14 * zoomLevel}
                />

                {/* Visible curved line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHovered || isRelatedToHoveredNode ? '#c084fc' : '#6366f1'}
                  strokeWidth={(isHovered ? 3.5 : isRelatedToHoveredNode ? 2.5 : 1.8) * zoomLevel}
                  strokeDasharray={link.isCrossPhase ? undefined : '4 3'}
                  markerEnd={isHovered || isRelatedToHoveredNode ? 'url(#dep-arrow-active)' : 'url(#dep-arrow)'}
                  className="transition-all duration-200"
                />

                {/* Remove indicator on hover */}
                {isHovered && (
                  <circle
                    cx={(startX + endX) / 2}
                    cy={(startY + endY) / 2}
                    r={9}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Phase Columns Grid */}
        <div 
          className="relative z-20 flex gap-8 items-start min-w-max pb-6"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {milestones.map((milestone) => (
            <div 
              key={milestone.id}
              className="w-[280px] shrink-0 glass-panel rounded-2xl border border-white/10 p-3 bg-slate-900/80 flex flex-col gap-3 shadow-xl"
            >
              {/* Phase Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-mono text-[10px] font-bold">
                    P{milestone.phaseNumber}
                  </span>
                  <h4 className="text-xs font-bold font-mono text-white truncate max-w-[170px]" title={milestone.title}>
                    {milestone.title}
                  </h4>
                </div>
                <span className="text-[9px] font-mono text-slate-400">
                  {milestone.tasks.length} tasks
                </span>
              </div>

              {/* Tasks in Phase */}
              <div className="space-y-2.5">
                {milestone.tasks.map((task) => {
                  const isSelectedAsSource = selectedSourceTaskId === task.id;
                  const isHovered = hoveredTaskId === task.id;
                  const isInCycle = circularDependencyCycle?.includes(task.id);
                  const hasUpstreamDeps = task.dependencies && task.dependencies.length > 0;

                  return (
                    <div
                      id={`dep-node-${task.id}`}
                      key={task.id}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                      onClick={() => onSelectTask?.(task.id)}
                      className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isInCycle
                          ? 'border-rose-500 bg-rose-950/40 ring-2 ring-rose-500/50'
                          : isSelectedAsSource
                          ? 'border-violet-400 bg-violet-950/40 ring-2 ring-violet-500/60 shadow-neon-violet'
                          : isHovered
                          ? 'border-indigo-400/80 bg-slate-800 shadow-lg'
                          : task.completed
                          ? 'border-emerald-500/30 bg-slate-950/40 opacity-80'
                          : 'border-white/10 bg-slate-950/80 hover:border-white/20'
                      }`}
                    >
                      {/* Left Target Connection Port (Input) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedSourceTaskId) {
                            handleConnectTasks(selectedSourceTaskId, task.id);
                          }
                        }}
                        className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-30 ${
                          selectedSourceTaskId && selectedSourceTaskId !== task.id
                            ? 'bg-violet-500 border-white text-white scale-110 shadow-neon-violet animate-pulse cursor-pointer'
                            : hasUpstreamDeps
                            ? 'bg-indigo-600 border-indigo-300 text-white cursor-pointer'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-white cursor-pointer'
                        }`}
                        title={
                          selectedSourceTaskId && selectedSourceTaskId !== task.id
                            ? `Click to make this task depend on "${taskMap.get(selectedSourceTaskId)?.title}"`
                            : 'Input Dependency Port'
                        }
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      {/* Card Content */}
                      <div className="space-y-1 pl-1 pr-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                              task.actionType === 'create' ? 'bg-emerald-500/20 text-emerald-300' :
                              task.actionType === 'modify' ? 'bg-sky-500/20 text-sky-300' :
                              task.actionType === 'delete' ? 'bg-rose-500/20 text-rose-300' :
                              task.actionType === 'test' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-300'
                            }`}>
                              {task.actionType}
                            </span>

                            {showParallelWaves && taskWaveMap.has(task.id) && (
                              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                                <Cpu className="w-2.5 h-2.5" />
                                Wave {taskWaveMap.get(task.id)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {showParallelWaves && criticalPathSet.has(task.id) && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold" title="Critical Path bottleneck">
                                ⚡ Crit
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-slate-500">
                              {task.id}
                            </span>
                          </div>
                        </div>

                        <h5 className={`text-xs font-bold font-sans line-clamp-2 ${
                          task.completed ? 'text-slate-400 line-through' : 'text-white'
                        }`}>
                          {task.title}
                        </h5>

                        {task.filePath && (
                          <p className="text-[10px] font-mono text-slate-400 truncate">
                            📄 {task.filePath}
                          </p>
                        )}
                      </div>

                      {/* Right Source Connection Port (Output) */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSourceTaskId(isSelectedAsSource ? null : task.id);
                        }}
                        className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-30 ${
                          isSelectedAsSource
                            ? 'bg-violet-500 border-white text-white scale-125 shadow-neon-violet animate-bounce'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-violet-600 hover:border-violet-300 hover:text-white cursor-pointer'
                        }`}
                        title="Click to drag or start a dependency link from this task"
                      >
                        <ArrowRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
