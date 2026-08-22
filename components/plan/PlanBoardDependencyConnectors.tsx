/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Link2, 
  ArrowRight, 
  Zap, 
  Eye, 
  EyeOff, 
  SlidersHorizontal,
  Info,
  ShieldAlert
} from 'lucide-react';
import { PlanMilestone, PlanTask } from '../../types';

export type ConnectorDisplayMode = 'all' | 'interactive' | 'cross_phase' | 'warnings';

export interface PlanBoardDependencyConnectorsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  milestones: PlanMilestone[];
  draggingTaskId: string | null;
  dragOverTaskId: string | null;
  dropPosition: 'before' | 'after' | null;
  hoveredTaskId: string | null;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  showConnectors?: boolean;
  onToggleShowConnectors?: (show: boolean) => void;
  displayMode?: ConnectorDisplayMode;
  onDisplayModeChange?: (mode: ConnectorDisplayMode) => void;
}

interface ConnectorLineData {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  sourceTask: PlanTask;
  targetTask: PlanTask;
  sourceMilestone: PlanMilestone;
  targetMilestone: PlanMilestone;
  sourcePhase: number;
  targetPhase: number;
  isCrossPhase: boolean;
  isCompleted: boolean;
  isInverted: boolean; // Out of order (prerequisite is placed after dependent task)
  pathD: string;
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  midPoint: { x: number; y: number };
  isHighlighted: boolean;
  isSourceActive: boolean;
  isTargetActive: boolean;
  isDragActive: boolean;
}

export const PlanBoardDependencyConnectors: React.FC<PlanBoardDependencyConnectorsProps> = ({
  containerRef,
  milestones,
  draggingTaskId,
  dragOverTaskId,
  dropPosition,
  hoveredTaskId,
  selectedTaskId,
  onSelectTask,
  showConnectors = true,
  onToggleShowConnectors,
  displayMode = 'all',
  onDisplayModeChange
}) => {
  const [connectors, setConnectors] = useState<ConnectorLineData[]>([]);
  const [hoveredConnectorId, setHoveredConnectorId] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Flatten tasks and build fast lookup maps
  const { allTasksMap, taskPhaseOrderMap } = useMemo(() => {
    const taskMap = new Map<string, { task: PlanTask; milestone: PlanMilestone; phaseIndex: number; taskIndex: number }>();
    const orderMap = new Map<string, number>();
    let globalIndex = 0;

    milestones.forEach((m, mIdx) => {
      m.tasks.forEach((t, tIdx) => {
        taskMap.set(t.id, {
          task: t,
          milestone: m,
          phaseIndex: mIdx,
          taskIndex: tIdx
        });
        orderMap.set(t.id, globalIndex);
        globalIndex++;
      });
    });

    return { allTasksMap: taskMap, taskPhaseOrderMap: orderMap };
  }, [milestones]);

  // Compute connector geometry based on current DOM element positions
  const computeConnectors = useCallback(() => {
    if (!containerRef.current || !showConnectors) {
      setConnectors([]);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Total scrollable bounds
    const width = container.scrollWidth || containerRect.width;
    const height = container.scrollHeight || containerRect.height;
    setSvgDimensions({ width, height });

    const computedLines: ConnectorLineData[] = [];

    // Iterate through all milestones and tasks to find dependencies
    milestones.forEach(milestone => {
      milestone.tasks.forEach(targetTask => {
        if (!targetTask.dependencies || targetTask.dependencies.length === 0) return;

        targetTask.dependencies.forEach(sourceTaskId => {
          const sourceInfo = allTasksMap.get(sourceTaskId);
          const targetInfo = allTasksMap.get(targetTask.id);

          if (!sourceInfo || !targetInfo) return;

          // Find DOM nodes for source and target task cards
          const sourceEl = container.querySelector(`[data-task-id="${sourceTaskId}"]`) as HTMLElement | null;
          const targetEl = container.querySelector(`[data-task-id="${targetTask.id}"]`) as HTMLElement | null;

          if (!sourceEl || !targetEl) return;

          const sourceRect = sourceEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          // Calculate coordinates relative to container (including container scroll)
          const scrollLeft = container.scrollLeft || 0;
          const scrollTop = container.scrollTop || 0;

          const srcX1 = sourceRect.left - containerRect.left + scrollLeft;
          const srcX2 = sourceRect.right - containerRect.left + scrollLeft;
          const srcYMid = sourceRect.top - containerRect.top + scrollTop + sourceRect.height / 2;
          const srcYTop = sourceRect.top - containerRect.top + scrollTop;
          const srcYBottom = sourceRect.bottom - containerRect.top + scrollTop;

          const tgtX1 = targetRect.left - containerRect.left + scrollLeft;
          const tgtX2 = targetRect.right - containerRect.left + scrollLeft;
          const tgtYMid = targetRect.top - containerRect.top + scrollTop + targetRect.height / 2;
          const tgtYTop = targetRect.top - containerRect.top + scrollTop;
          const tgtYBottom = targetRect.bottom - containerRect.top + scrollTop;

          // Check if sequence is inverted (source prerequisite placed after target dependent task)
          const sourceGlobalOrder = taskPhaseOrderMap.get(sourceTaskId) ?? 0;
          const targetGlobalOrder = taskPhaseOrderMap.get(targetTask.id) ?? 0;
          const isInverted = sourceGlobalOrder > targetGlobalOrder;
          const isCrossPhase = sourceInfo.milestone.phaseNumber !== targetInfo.milestone.phaseNumber;

          // Calculate start and end anchor points
          let startX: number, startY: number, endX: number, endY: number;
          let pathD = '';
          let midX = 0, midY = 0;

          const isLeftToRight = srcX2 < tgtX1 - 20;
          const isRightToLeft = srcX1 > tgtX2 + 20;
          const isSameColumn = Math.abs(srcX1 - tgtX1) < 60;

          if (isLeftToRight) {
            // Source is in left column, Target is in right column
            startX = srcX2;
            startY = srcYMid;
            endX = tgtX1;
            endY = tgtYMid;

            const dx = Math.max(endX - startX, 40);
            const cx1 = startX + dx * 0.45;
            const cy1 = startY;
            const cx2 = endX - dx * 0.45;
            const cy2 = endY;

            pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
          } else if (isRightToLeft) {
            // Source is in right column, Target is in left column (often cross-phase return or inverted)
            startX = srcX1;
            startY = srcYMid;
            endX = tgtX2;
            endY = tgtYMid;

            const dx = Math.max(startX - endX, 40);
            const cx1 = startX - dx * 0.45;
            const cy1 = startY + (endY > startY ? 20 : -20);
            const cx2 = endX + dx * 0.45;
            const cy2 = endY + (endY > startY ? -20 : 20);

            pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
          } else if (isSameColumn) {
            // Both tasks are in the same column
            if (srcYBottom <= tgtYTop + 10) {
              // Top-to-bottom standard downward dependency within same milestone
              startX = srcX2;
              startY = srcYMid;
              endX = tgtX2;
              endY = tgtYMid;

              const loopWidth = 28 + Math.min(Math.abs(endY - startY) * 0.1, 40);
              const cx1 = startX + loopWidth;
              const cy1 = startY + 10;
              const cx2 = endX + loopWidth;
              const cy2 = endY - 10;

              pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
              midX = startX + loopWidth * 0.85;
              midY = (startY + endY) / 2;
            } else {
              // Bottom-to-top inverted dependency within same milestone (Warning!)
              startX = srcX2;
              startY = srcYMid;
              endX = tgtX2;
              endY = tgtYMid;

              const loopWidth = 36 + Math.min(Math.abs(startY - endY) * 0.12, 50);
              const cx1 = startX + loopWidth;
              const cy1 = startY - 10;
              const cx2 = endX + loopWidth;
              const cy2 = endY + 10;

              pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
              midX = startX + loopWidth * 0.85;
              midY = (startY + endY) / 2;
            }
          } else {
            // General overlapping or staggered placement fallback
            startX = srcX2;
            startY = srcYMid;
            endX = tgtX1;
            endY = tgtYMid;
            
            const dx = Math.abs(endX - startX) || 40;
            const cx1 = startX + dx * 0.5;
            const cy1 = startY;
            const cx2 = endX - dx * 0.5;
            const cy2 = endY;

            pathD = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
          }

          const lineId = `${sourceTaskId}->${targetTask.id}`;
          const isSourceActive = hoveredTaskId === sourceTaskId || selectedTaskId === sourceTaskId;
          const isTargetActive = hoveredTaskId === targetTask.id || selectedTaskId === targetTask.id;
          const isDragActive = draggingTaskId === sourceTaskId || draggingTaskId === targetTask.id;
          const isHighlighted = isSourceActive || isTargetActive || isDragActive || hoveredConnectorId === lineId;

          computedLines.push({
            id: lineId,
            sourceTaskId,
            targetTaskId: targetTask.id,
            sourceTask: sourceInfo.task,
            targetTask: targetInfo.task,
            sourceMilestone: sourceInfo.milestone,
            targetMilestone: targetInfo.milestone,
            sourcePhase: sourceInfo.milestone.phaseNumber,
            targetPhase: targetInfo.milestone.phaseNumber,
            isCrossPhase,
            isCompleted: sourceInfo.task.completed,
            isInverted,
            pathD,
            sourcePoint: { x: startX, y: startY },
            targetPoint: { x: endX, y: endY },
            midPoint: { x: midX, y: midY },
            isHighlighted,
            isSourceActive,
            isTargetActive,
            isDragActive
          });
        });
      });
    });

    setConnectors(computedLines);
  }, [
    containerRef, 
    showConnectors, 
    milestones, 
    allTasksMap, 
    taskPhaseOrderMap, 
    hoveredTaskId, 
    selectedTaskId, 
    draggingTaskId, 
    hoveredConnectorId
  ]);

  // Trigger recalculation on DOM layout changes, resize, scroll, or drag
  useEffect(() => {
    const handleRecalculate = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        computeConnectors();
      });
    };

    handleRecalculate();

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(handleRecalculate);
    resizeObserver.observe(container);

    // Also observe all milestone cards
    const columns = container.querySelectorAll('.glass-panel');
    columns.forEach(col => resizeObserver.observe(col));

    window.addEventListener('resize', handleRecalculate);
    container.addEventListener('scroll', handleRecalculate, { passive: true });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleRecalculate);
      container.removeEventListener('scroll', handleRecalculate);
    };
  }, [computeConnectors, containerRef, draggingTaskId, dragOverTaskId, dropPosition]);

  // Filter connectors according to active display mode
  const visibleConnectors = useMemo(() => {
    if (!showConnectors) return [];

    return connectors.filter(c => {
      if (displayMode === 'interactive') {
        // In interactive mode, show lines if user is hovering/dragging or has selected a task/line
        const hasInteraction = hoveredTaskId !== null || draggingTaskId !== null || selectedTaskId !== null || hoveredConnectorId !== null;
        if (!hasInteraction) {
          // Subtle presence or empty
          return false;
        }
        return c.isHighlighted;
      }
      if (displayMode === 'cross_phase') {
        return c.isCrossPhase || c.isHighlighted;
      }
      if (displayMode === 'warnings') {
        return c.isInverted || c.isHighlighted;
      }
      return true;
    });
  }, [connectors, showConnectors, displayMode, hoveredTaskId, draggingTaskId, selectedTaskId, hoveredConnectorId]);

  const totalInvertedCount = useMemo(() => {
    return connectors.filter(c => c.isInverted).length;
  }, [connectors]);

  if (!showConnectors && connectors.length === 0) return null;

  return (
    <>
      {/* SVG Canvas Overlay */}
      <svg
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          width: Math.max(svgDimensions.width, 100),
          height: Math.max(svgDimensions.height, 100),
          overflow: 'visible'
        }}
      >
        <defs>
          {/* Linear Gradients */}
          {/* Normal Ready / Pending Flow */}
          <linearGradient id="dep-gradient-normal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
          </linearGradient>

          {/* Active / Dragging Flow Gradient */}
          <linearGradient id="dep-gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.95" />
          </linearGradient>

          {/* Completed Prerequisite Flow */}
          <linearGradient id="dep-gradient-completed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.75" />
          </linearGradient>

          {/* Inverted / Out of Order Warning Gradient */}
          <linearGradient id="dep-gradient-warning" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
          </linearGradient>

          {/* Arrowhead Markers */}
          <marker
            id="dep-arrow-normal"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" fillOpacity="0.8" />
          </marker>

          <marker
            id="dep-arrow-active"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
          </marker>

          <marker
            id="dep-arrow-completed"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" fillOpacity="0.8" />
          </marker>

          <marker
            id="dep-arrow-warning"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
          </marker>

          {/* Glow Filters */}
          <filter id="dep-glow-active" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="dep-glow-warning" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background connector paths & glows */}
        {visibleConnectors.map((connector) => {
          const { id, pathD, isHighlighted, isDragActive, isInverted, isCompleted } = connector;

          let strokeUrl = 'url(#dep-gradient-normal)';
          let markerEnd = 'url(#dep-arrow-normal)';
          let strokeWidth = 2;
          let strokeDasharray = undefined;

          if (isInverted) {
            strokeUrl = 'url(#dep-gradient-warning)';
            markerEnd = 'url(#dep-arrow-warning)';
            strokeWidth = isHighlighted || isDragActive ? 3.5 : 2.5;
            strokeDasharray = '6,4';
          } else if (isDragActive || isHighlighted) {
            strokeUrl = 'url(#dep-gradient-active)';
            markerEnd = 'url(#dep-arrow-active)';
            strokeWidth = 3.5;
            strokeDasharray = isDragActive ? '8,4' : undefined;
          } else if (isCompleted) {
            strokeUrl = 'url(#dep-gradient-completed)';
            markerEnd = 'url(#dep-arrow-completed)';
            strokeWidth = 2;
          }

          return (
            <g 
              key={id} 
              className="connector-group cursor-pointer pointer-events-auto transition-all"
              onMouseEnter={() => setHoveredConnectorId(id)}
              onMouseLeave={() => setHoveredConnectorId(null)}
              onClick={() => onSelectTask?.(connector.targetTaskId)}
            >
              {/* Wide transparent hitbox for easy hovering */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                strokeLinecap="round"
              />

              {/* Glowing underlay on active/highlight */}
              {(isHighlighted || isDragActive || isInverted) && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={isInverted ? '#f43f5e' : '#8b5cf6'}
                  strokeWidth={strokeWidth + 4}
                  strokeOpacity={isInverted ? 0.35 : 0.4}
                  filter={isInverted ? 'url(#dep-glow-warning)' : 'url(#dep-glow-active)'}
                />
              )}

              {/* Primary visible connector path */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeUrl}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                markerEnd={markerEnd}
                className={isDragActive ? 'animate-pulse' : undefined}
              />

              {/* Start and End Pin Dots */}
              <circle
                cx={connector.sourcePoint.x}
                cy={connector.sourcePoint.y}
                r={isHighlighted ? 4.5 : 3.5}
                fill={isInverted ? '#f43f5e' : isCompleted ? '#10b981' : '#8b5cf6'}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
              <circle
                cx={connector.targetPoint.x}
                cy={connector.targetPoint.y}
                r={isHighlighted ? 4.5 : 3.5}
                fill={isInverted ? '#f59e0b' : '#38bdf8'}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            </g>
          );
        })}

        {/* Midpoint Badges / Interactive Tags */}
        {visibleConnectors.map((connector) => {
          const { id, midPoint, isInverted, isHighlighted, isDragActive, sourceTask, targetTask, sourceMilestone, targetMilestone } = connector;

          // Only render midpoint badge if highlighted, dragging, inverted warning, or hovered
          if (!isHighlighted && !isDragActive && !isInverted && hoveredConnectorId !== id) {
            return null;
          }

          return (
            <foreignObject
              key={`badge-${id}`}
              x={midPoint.x - (isInverted ? 70 : 55)}
              y={midPoint.y - 14}
              width={isInverted ? 140 : 110}
              height={28}
              className="pointer-events-auto overflow-visible"
            >
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTask?.(targetTask.id);
                }}
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center justify-center gap-1 shadow-lg border cursor-pointer transition-all hover:scale-105 backdrop-blur-md ${
                  isInverted
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-rose-950/50'
                    : isDragActive || isHighlighted
                    ? 'bg-violet-950/90 text-cyan-300 border-violet-500/60 shadow-violet-950/50'
                    : 'bg-slate-950/90 text-slate-300 border-white/20'
                }`}
                title={`${sourceTask.title} ➔ ${targetTask.title}`}
              >
                {isInverted ? (
                  <>
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                    <span className="truncate">Order Alert: P{sourceMilestone.phaseNumber}➔P{targetMilestone.phaseNumber}</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                    <span className="truncate">P{sourceMilestone.phaseNumber} ➔ P{targetMilestone.phaseNumber}</span>
                  </>
                )}
              </div>
            </foreignObject>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip for Selected/Hovered Connector */}
      {hoveredConnectorId && (() => {
        const conn = connectors.find(c => c.id === hoveredConnectorId);
        if (!conn) return null;

        return (
          <div 
            className="fixed z-50 pointer-events-none p-3 rounded-2xl bg-slate-950/95 border border-white/20 text-xs font-mono shadow-2xl backdrop-blur-xl max-w-sm space-y-2"
            style={{
              left: Math.min(window.innerWidth - 320, Math.max(20, conn.midPoint.x - 100)),
              top: Math.max(60, conn.midPoint.y - 70)
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Link2 className="w-3 h-3 text-cyan-400" />
                <span>Task Dependency Link</span>
              </span>
              {conn.isInverted ? (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/40">
                  ⚠️ Out of Order
                </span>
              ) : conn.isCompleted ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Prerequisite Ready
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[9px] font-bold border border-violet-500/40">
                  Pending Prerequisite
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px] font-sans">
              <div className="text-slate-300">
                <strong className="text-violet-300 font-mono">1. Prerequisite:</strong> Phase {conn.sourceMilestone.phaseNumber} — {conn.sourceTask.title}
              </div>
              <div className="text-slate-300">
                <strong className="text-cyan-300 font-mono">2. Dependent:</strong> Phase {conn.targetMilestone.phaseNumber} — {conn.targetTask.title}
              </div>
            </div>

            {conn.isInverted && (
              <p className="text-[10px] text-rose-300 font-sans bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                ⚠️ Notice: The prerequisite task is placed after this task in the execution sequence. Consider dragging the prerequisite task before it.
              </p>
            )}
          </div>
        );
      })()}
    </>
  );
};
