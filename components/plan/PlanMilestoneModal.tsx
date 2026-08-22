/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Layers, Calendar, Target } from 'lucide-react';
import { PlanMilestone } from '../../types';

interface PlanMilestoneModalProps {
  isOpen: boolean;
  milestone: PlanMilestone | null;
  nextPhaseNumber: number;
  onSave: (milestone: PlanMilestone) => void;
  onClose: () => void;
}

export const PlanMilestoneModal: React.FC<PlanMilestoneModalProps> = ({
  isOpen,
  milestone,
  nextPhaseNumber,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('1-2 Days');
  const [focus, setFocus] = useState('');

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setEstimatedDuration(milestone.estimatedDuration);
      setFocus(milestone.focus || '');
    } else {
      setTitle(`Phase ${nextPhaseNumber}: Implementation`);
      setEstimatedDuration('2-3 Days');
      setFocus('');
    }
  }, [milestone, nextPhaseNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: milestone?.id || `milestone-${Date.now()}`,
      phaseNumber: milestone?.phaseNumber || nextPhaseNumber,
      title: title.trim(),
      estimatedDuration: estimatedDuration.trim() || '1-2 Days',
      focus: focus.trim(),
      tasks: milestone?.tasks || []
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/20 shadow-2xl p-6 bg-slate-950/90">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/20 text-violet-300 rounded-2xl border border-violet-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {milestone ? `Edit Phase ${milestone.phaseNumber}` : `Add Phase ${nextPhaseNumber}`}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Set milestone roadmap phase title, time estimate, and primary focus.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Phase Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit, Core Architecture & Abstraction"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Estimated Duration
            </label>
            <input
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="e.g. 1-2 Days or 1 Week"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Phase Focus & Deliverables
            </label>
            <textarea
              rows={2}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Describe the main milestone deliverable..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-sans text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
            />
          </div>

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
              <span>{milestone ? 'Update Phase' : 'Create Phase'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
