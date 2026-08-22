/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GripHorizontal, 
  Plus, 
  Calendar, 
  Layers, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Target,
  Clock
} from 'lucide-react';
import { PlanMilestone, PlanTask } from '../../types';
import { PlanTaskCard } from './PlanTaskCard';

interface PlanMilestoneColumnProps {
  milestone: PlanMilestone;
  allMilestones: PlanMilestone[];
  isDraggingMilestone: boolean;
  isDragOverMilestone: boolean;
  draggingTaskId: string | null;
  dragOverTaskId: string | null;
  dropPosition: 'before' | 'after' | null;
  onToggleComplete: (milestoneId: string, taskId: string) => void;
  onEditTask: (milestoneId: string, task: PlanTask) => void;
  onDeleteTask: (milestoneId: string, taskId: string) => void;
  onDuplicateTask: (milestoneId: string, task: PlanTask) => void;
  onAddNewTask: (milestoneId: string) => void;
  onEditMilestone: (milestone: PlanMilestone) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  onDragStartMilestone: (e: React.DragEvent, milestoneId: string) => void;
  onDragOverMilestone: (e: React.DragEvent, milestoneId: string) => void;
  onDragLeaveMilestone: (e: React.DragEvent) => void;
  onDropMilestone: (e: React.DragEvent, milestoneId: string) => void;
  onDragStartTask: (e: React.DragEvent, milestoneId: string, taskId: string) => void;
  onDragOverTask: (e: React.DragEvent, milestoneId: string, taskId: string) => void;
  onDragLeaveTask: (e: React.DragEvent) => void;
  onDropTask: (e: React.DragEvent, milestoneId: string, taskId: string) => void;
  onDropOnMilestoneZone: (e: React.DragEvent, milestoneId: string) => void;
  onSelectDependency?: (taskId: string) => void;
  onHoverTask?: (taskId: string | null) => void;
  hoveredTaskId?: string | null;
  selectedTaskIdInGraph?: string | null;
}

export const PlanMilestoneColumn: React.FC<PlanMilestoneColumnProps> = ({
  milestone,
  allMilestones,
  isDraggingMilestone,
  isDragOverMilestone,
  draggingTaskId,
  dragOverTaskId,
  dropPosition,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onAddNewTask,
  onEditMilestone,
  onDeleteMilestone,
  onDragStartMilestone,
  onDragOverMilestone,
  onDragLeaveMilestone,
  onDropMilestone,
  onDragStartTask,
  onDragOverTask,
  onDragLeaveTask,
  onDropTask,
  onDropOnMilestoneZone,
  onSelectDependency,
  onHoverTask,
  hoveredTaskId,
  selectedTaskIdInGraph
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isColumnHovered, setIsColumnHovered] = useState(false);

  const completedCount = milestone.tasks.filter(t => t.completed).length;
  const totalTasks = milestone.tasks.length;
  const percentComplete = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Calculate total hours
  const totalHours = milestone.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return (
    <div
      onDragOver={(e) => onDragOverMilestone(e, milestone.id)}
      onDragLeave={onDragLeaveMilestone}
      onDrop={(e) => onDropMilestone(e, milestone.id)}
      onMouseEnter={() => setIsColumnHovered(true)}
      onMouseLeave={() => setIsColumnHovered(false)}
      className={`glass-panel rounded-3xl border transition-all duration-300 flex flex-col ${
        isDraggingMilestone
          ? 'opacity-30 border-violet-500 scale-95 shadow-2xl'
          : isDragOverMilestone
          ? 'border-violet-400 ring-2 ring-violet-500/60 bg-violet-950/20 shadow-2xl'
          : 'border-white/10 hover:border-white/20 bg-slate-950/40'
      }`}
    >
      {/* Milestone Header (Draggable for Phase Reordering) */}
      <div 
        draggable
        onDragStart={(e) => onDragStartMilestone(e, milestone.id)}
        className="p-4 sm:p-5 border-b border-white/5 bg-white/[0.02] rounded-t-3xl cursor-grab active:cursor-grabbing hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Phase Badge & Drag Indicator */}
          <div className="flex items-center gap-2.5">
            <div 
              className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
              title="Drag to rearrange phases"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>

            <span className="w-7 h-7 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center font-mono text-xs font-bold shadow-neon-violet">
              P{milestone.phaseNumber}
            </span>

            <div>
              <h3 className="text-sm font-bold text-white font-mono tracking-tight">
                {milestone.title}
              </h3>
              {milestone.focus && (
                <p className="text-[11px] text-slate-400 font-sans line-clamp-1">
                  {milestone.focus}
                </p>
              )}
            </div>
          </div>

          {/* Duration & Header Action Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-black/40 text-slate-300 border border-white/5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-violet-400" />
              <span>{milestone.estimatedDuration}</span>
            </span>

            {totalHours > 0 && (
              <span className="hidden sm:flex text-[10px] font-mono px-2 py-1 rounded-lg bg-black/40 text-slate-300 border border-white/5 items-center gap-1">
                <Clock className="w-3 h-3 text-fuchsia-400" />
                <span>{totalHours}h</span>
              </span>
            )}

            <button
              onClick={() => onEditMilestone(milestone)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Edit Phase Title & Duration"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {allMilestones.length > 1 && (
              <button
                onClick={() => onDeleteMilestone(milestone.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="Delete Phase"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? 'Expand Phase' : 'Collapse Phase'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Phase Progress Bar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Progress:</span>
            <strong className="text-white">{completedCount}/{totalTasks}</strong>
            <span className="text-slate-500">({percentComplete}%)</span>
          </div>

          <div className="w-28 sm:w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task List / Drop Zone */}
      {!isCollapsed && (
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => onDropOnMilestoneZone(e, milestone.id)}
          className="p-4 flex-1 flex flex-col gap-3 min-h-[140px]"
        >
          {milestone.tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl text-center space-y-2 bg-white/[0.01]">
              <Layers className="w-6 h-6 text-slate-600" />
              <p className="text-xs font-mono text-slate-400">No tasks in this phase</p>
              <p className="text-[10px] font-sans text-slate-500">
                Drag tasks here or click below to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestone.tasks.map((task) => {
                const isDependencyActive = hoveredTaskId 
                  ? (task.id === hoveredTaskId || task.dependencies?.includes(hoveredTaskId) || false)
                  : false;

                return (
                  <PlanTaskCard
                    key={task.id}
                    task={task}
                    milestoneId={milestone.id}
                    allMilestones={allMilestones}
                    isDragging={draggingTaskId === task.id}
                    dropPosition={dragOverTaskId === task.id ? dropPosition : null}
                    onToggleComplete={onToggleComplete}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onDuplicateTask={onDuplicateTask}
                    onDragStartTask={onDragStartTask}
                    onDragOverTask={onDragOverTask}
                    onDragLeaveTask={onDragLeaveTask}
                    onDropTask={onDropTask}
                    onSelectDependency={onSelectDependency}
                    onHoverTask={onHoverTask}
                    isSelectedInGraph={selectedTaskIdInGraph === task.id}
                    isDependencyActive={isDependencyActive}
                  />
                );
              })}
            </div>
          )}

          {/* Add Task Button */}
          <button
            onClick={() => onAddNewTask(milestone.id)}
            className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-white/10 hover:border-violet-500/50 hover:bg-violet-600/10 text-xs font-mono text-slate-400 hover:text-violet-300 transition-all flex items-center justify-center gap-2 group mt-1"
          >
            <Plus className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
            <span>Add Task to Phase {milestone.phaseNumber}</span>
          </button>
        </div>
      )}
    </div>
  );
};
