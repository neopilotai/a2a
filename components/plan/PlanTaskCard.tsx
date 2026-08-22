/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GripVertical, 
  CheckCircle2, 
  Circle, 
  FileCode2, 
  Link2, 
  Trash2, 
  Edit3, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { PlanTask, PlanMilestone } from '../../types';

interface PlanTaskCardProps {
  task: PlanTask;
  milestoneId: string;
  allMilestones: PlanMilestone[];
  isDragging: boolean;
  dropPosition?: 'before' | 'after' | null;
  onToggleComplete: (milestoneId: string, taskId: string) => void;
  onEditTask: (milestoneId: string, task: PlanTask) => void;
  onDeleteTask: (milestoneId: string, taskId: string) => void;
  onDuplicateTask: (milestoneId: string, task: PlanTask) => void;
  onMoveTaskUp?: (milestoneId: string, taskId: string) => void;
  onMoveTaskDown?: (milestoneId: string, taskId: string) => void;
  onDragStartTask: (e: React.DragEvent, milestoneId: string, taskId: string) => void;
  onDragOverTask: (e: React.DragEvent, milestoneId: string, taskId: string) => void;
  onDragLeaveTask: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, milestoneId: string, taskId: string) => void;
  onSelectDependency?: (taskId: string) => void;
  onHoverTask?: (taskId: string | null) => void;
  isSelectedInGraph?: boolean;
  isDependencyActive?: boolean;
}

const ACTION_TYPE_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  create: { label: 'CREATE', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  modify: { label: 'MODIFY', bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/40' },
  delete: { label: 'DELETE', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  test: { label: 'TEST', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  config: { label: 'CONFIG', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' }
};

const PRIORITY_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-rose-400', dot: 'bg-rose-500' },
  high: { label: 'High', color: 'text-amber-400', dot: 'bg-amber-500' },
  medium: { label: 'Med', color: 'text-sky-400', dot: 'bg-sky-500' },
  low: { label: 'Low', color: 'text-slate-400', dot: 'bg-slate-500' }
};

export const PlanTaskCard: React.FC<PlanTaskCardProps> = ({
  task,
  milestoneId,
  allMilestones,
  isDragging,
  dropPosition,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onMoveTaskUp,
  onMoveTaskDown,
  onDragStartTask,
  onDragOverTask,
  onDragLeaveTask,
  onDropTask,
  onSelectDependency,
  onHoverTask,
  isSelectedInGraph = false,
  isDependencyActive = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Map all task IDs to task titles for dependencies display
  const allTasksMap = React.useMemo(() => {
    const map = new Map<string, { title: string; phase: number }>();
    allMilestones.forEach(m => {
      m.tasks.forEach(t => {
        map.set(t.id, { title: t.title, phase: m.phaseNumber });
      });
    });
    return map;
  }, [allMilestones]);

  // Compute downstream dependents (tasks that depend on this task)
  const downstreamDependents = React.useMemo(() => {
    const dependents: { id: string; title: string }[] = [];
    allMilestones.forEach(m => {
      m.tasks.forEach(t => {
        if (t.dependencies?.includes(task.id)) {
          dependents.push({ id: t.id, title: t.title });
        }
      });
    });
    return dependents;
  }, [allMilestones, task.id]);

  const hasDependencies = Boolean(task.dependencies && task.dependencies.length > 0);
  const hasDependents = downstreamDependents.length > 0;

  const actionStyle = ACTION_TYPE_STYLES[task.actionType] || ACTION_TYPE_STYLES.modify;
  const priorityStyle = PRIORITY_STYLES[task.priority || 'medium'] || PRIORITY_STYLES.medium;

  return (
    <div
      data-task-id={task.id}
      data-milestone-id={milestoneId}
      className="relative transition-all duration-150"
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverTask?.(task.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverTask?.(null);
      }}
      onDragOver={(e) => onDragOverTask(e, milestoneId, task.id)}
      onDragLeave={onDragLeaveTask}
      onDrop={(e) => onDropTask(e, milestoneId, task.id)}
    >
      {/* Drop Before Indicator Line */}
      {dropPosition === 'before' && (
        <div className="absolute -top-1.5 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full z-20 shadow-neon-violet animate-pulse" />
      )}

      {/* Visual Dependency Pin - Left (Incoming prerequisite link) */}
      {hasDependencies && (
        <div 
          className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-950 border border-indigo-400/80 flex items-center justify-center z-20 shadow-sm transition-all duration-200"
          title={`Has ${task.dependencies?.length} prerequisite dependency links`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping opacity-60" />
        </div>
      )}

      {/* Visual Dependency Pin - Right (Outgoing dependent link) */}
      {hasDependents && (
        <div 
          className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-950 border border-cyan-400/80 flex items-center justify-center z-20 shadow-sm transition-all duration-200"
          title={`Blocks ${downstreamDependents.length} downstream tasks`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-60" />
        </div>
      )}

      <div
        draggable
        onDragStart={(e) => onDragStartTask(e, milestoneId, task.id)}
        className={`group p-3.5 rounded-2xl border transition-all duration-200 select-none ${
          isDragging
            ? 'opacity-30 scale-95 border-violet-500 bg-violet-950/40 rotate-1 shadow-2xl'
            : isSelectedInGraph || isDependencyActive
            ? 'border-violet-400 bg-violet-950/30 ring-2 ring-violet-500/50 shadow-lg'
            : task.completed
            ? 'bg-slate-950/50 border-emerald-500/30 opacity-75'
            : 'bg-slate-900/90 hover:bg-slate-900 border-white/10 hover:border-violet-500/40 hover:shadow-xl'
        }`}
      >
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Drag Handle & Checkbox */}
          <div className="flex items-center gap-2">
            <div 
              className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
              title="Drag to reorder or move across phases"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <button
              onClick={() => onToggleComplete(milestoneId, task.id)}
              className="text-slate-400 hover:text-white transition-colors"
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 hover:text-violet-400" />
              )}
            </button>

            {/* Action Type Badge */}
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}>
              {actionStyle.label}
            </span>
          </div>

          {/* Priority, Duration & Quick Actions */}
          <div className="flex items-center gap-1.5">
            {task.priority && (
              <span className={`text-[10px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 ${priorityStyle.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                <span>{priorityStyle.label}</span>
              </span>
            )}

            {task.estimatedHours && (
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40">
                <Clock className="w-2.5 h-2.5 text-violet-400" />
                <span>{task.estimatedHours}h</span>
              </span>
            )}

            {/* Hover Actions Bar */}
            <div className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0 group-hover:opacity-100'}`}>
              <button
                onClick={() => onEditTask(milestoneId, task)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Edit Task Details & Dependencies"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDuplicateTask(milestoneId, task)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Duplicate Task"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDeleteTask(milestoneId, task.id)}
                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="pl-6 space-y-1.5">
          <h4 className={`text-xs font-bold font-sans leading-snug ${
            task.completed ? 'text-slate-400 line-through' : 'text-white'
          }`}>
            {task.title}
          </h4>

          {task.description && (
            <p className={`text-[11px] font-sans leading-relaxed ${
              task.completed ? 'text-slate-500' : 'text-slate-300'
            }`}>
              {task.description}
            </p>
          )}

          {/* File Path Pill */}
          {task.filePath && (
            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-violet-300 bg-violet-950/40 border border-violet-500/20 px-2 py-0.5 rounded-lg max-w-full truncate">
              <FileCode2 className="w-3 h-3 text-violet-400 shrink-0" />
              <span className="truncate">{task.filePath}</span>
            </div>
          )}

          {/* Dependencies Section */}
          {(task.dependencies && task.dependencies.length > 0 || downstreamDependents.length > 0) && (
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
              {/* Upstream dependencies */}
              {task.dependencies && task.dependencies.map(depId => {
                const depInfo = allTasksMap.get(depId);
                return (
                  <button
                    key={depId}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDependency?.(depId);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-300 hover:bg-indigo-500/20 transition-all max-w-[200px]"
                    title={`Depends on: ${depInfo?.title || depId}`}
                  >
                    <Link2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      P{depInfo?.phase || '?'}: {depInfo?.title || depId}
                    </span>
                  </button>
                );
              })}

              {/* Downstream blocked count */}
              {downstreamDependents.length > 0 && (
                <span 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/30 text-[9px] font-mono text-fuchsia-300"
                  title={`Blocks: ${downstreamDependents.map(d => d.title).join(', ')}`}
                >
                  <ArrowRight className="w-2.5 h-2.5 text-fuchsia-400" />
                  <span>Blocks {downstreamDependents.length}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drop After Indicator Line */}
      {dropPosition === 'after' && (
        <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full z-20 shadow-neon-violet animate-pulse" />
      )}
    </div>
  );
};
