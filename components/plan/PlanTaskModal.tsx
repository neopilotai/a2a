/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  FileCode2, 
  Link2, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  Sparkles
} from 'lucide-react';
import { PlanTask, PlanMilestone, RepoFileTree } from '../../types';

interface PlanTaskModalProps {
  isOpen: boolean;
  task: PlanTask | null;
  milestoneId: string;
  allMilestones: PlanMilestone[];
  fileTree?: RepoFileTree[];
  onSave: (milestoneId: string, task: PlanTask) => void;
  onClose: () => void;
}

export const PlanTaskModal: React.FC<PlanTaskModalProps> = ({
  isOpen,
  task,
  milestoneId,
  allMilestones,
  fileTree = [],
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<PlanTask>({
    id: `task-${Date.now()}`,
    title: '',
    description: '',
    filePath: '',
    actionType: 'modify',
    completed: false,
    dependencies: [],
    priority: 'medium',
    estimatedHours: 2
  });

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(milestoneId);
  const [fileFilter, setFileFilter] = useState('');
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        dependencies: task.dependencies || [],
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours || 2
      });
      setSelectedMilestoneId(milestoneId);
    } else {
      setFormData({
        id: `task-${Date.now()}`,
        title: '',
        description: '',
        filePath: '',
        actionType: 'modify',
        completed: false,
        dependencies: [],
        priority: 'medium',
        estimatedHours: 2
      });
      setSelectedMilestoneId(milestoneId);
    }
  }, [task, milestoneId, isOpen]);

  if (!isOpen) return null;

  // Filter repo files for autocomplete
  const filteredFiles = fileTree
    .filter(f => !fileFilter || f.path.toLowerCase().includes(fileFilter.toLowerCase()))
    .slice(0, 8);

  // Available tasks that can be set as dependencies (excluding this task itself)
  const availablePrerequisiteTasks = allMilestones.flatMap(m => 
    m.tasks
      .filter(t => t.id !== formData.id)
      .map(t => ({
        ...t,
        phaseNumber: m.phaseNumber,
        phaseTitle: m.title
      }))
  );

  const handleToggleDependency = (depId: string) => {
    const current = formData.dependencies || [];
    if (current.includes(depId)) {
      setFormData({
        ...formData,
        dependencies: current.filter(id => id !== depId)
      });
    } else {
      setFormData({
        ...formData,
        dependencies: [...current, depId]
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(selectedMilestoneId, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/20 shadow-2xl p-6 bg-slate-950/90 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/20 text-violet-300 rounded-2xl border border-violet-500/30">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {task ? 'Edit Architectural Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Configure execution parameters, target file paths, and upstream dependencies.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Phase Assignment & Action Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Assigned Phase
              </label>
              <select
                value={selectedMilestoneId}
                onChange={(e) => setSelectedMilestoneId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              >
                {allMilestones.map(m => (
                  <option key={m.id} value={m.id}>
                    Phase {m.phaseNumber}: {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Action Type
              </label>
              <select
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              >
                <option value="create">CREATE (New File/Module)</option>
                <option value="modify">MODIFY (Refactor/Edit Existing)</option>
                <option value="delete">DELETE (Deprecate/Clean up)</option>
                <option value="test">TEST (Unit/E2E/Integration)</option>
                <option value="config">CONFIG (Infrastructure/Settings)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implement strict auth middleware and JWT validator"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Technical Description & Steps
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the required refactoring, contracts, or logic..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-sans text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
            />
          </div>

          {/* File Path & Autocomplete */}
          <div className="relative">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Target File Path (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.filePath || ''}
                onChange={(e) => {
                  setFormData({ ...formData, filePath: e.target.value });
                  setFileFilter(e.target.value);
                  setShowFileSuggestions(true);
                }}
                onFocus={() => setShowFileSuggestions(true)}
                placeholder="e.g. src/services/authService.ts"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 pl-8"
              />
              <FileCode2 className="w-3.5 h-3.5 text-violet-400 absolute left-2.5 top-2.5" />
            </div>

            {/* File Tree Autocomplete Dropdown */}
            {showFileSuggestions && filteredFiles.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 z-30 max-h-36 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase">
                  Repository File Matches:
                </div>
                {filteredFiles.map((file, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, filePath: file.path });
                      setShowFileSuggestions(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-violet-600/20 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <FileCode2 className="w-3 h-3 text-violet-400 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority & Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Engineering Priority
              </label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              >
                <option value="critical">Critical (Blocker / Foundation)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low (Nice to have)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimatedHours || 2}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Upstream Dependencies Multiselect */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                Upstream Prerequisites (Must be completed before this task):
              </span>
              <span className="text-[10px] text-slate-500">
                {formData.dependencies?.length || 0} selected
              </span>
            </label>

            <div className="max-h-36 overflow-y-auto bg-slate-900/90 border border-white/10 rounded-xl p-2 space-y-1.5">
              {availablePrerequisiteTasks.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 p-2 text-center">
                  No other tasks available to depend on.
                </p>
              ) : (
                availablePrerequisiteTasks.map((t) => {
                  const isChecked = formData.dependencies?.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-sans cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDependency(t.id)}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className="font-semibold truncate">{t.title}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400 shrink-0">
                        Phase {t.phaseNumber}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{task ? 'Update Task' : 'Add Task'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
