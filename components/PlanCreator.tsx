/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ClipboardList, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  Calendar, 
  FileCode2, 
  HelpCircle,
  Cpu,
  Bot,
  Zap,
  Network,
  Kanban,
  ListOrdered,
  Plus,
  Undo2,
  SlidersHorizontal,
  Link2,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  PlanModelRequest, 
  ImplementationPlan, 
  PlanType, 
  PlanMilestone, 
  PlanTask, 
  RepoFileTree, 
  ViewMode 
} from '../types';
import { generateImplementationPlan } from '../services/geminiService';
import { loadUserSession, savePlanCreatorSettings } from '../services/storageService';
import { LoadingState } from './LoadingState';
import { PlanMilestoneColumn } from './plan/PlanMilestoneColumn';
import { PlanDependencyGraph } from './plan/PlanDependencyGraph';
import { PlanTaskModal } from './plan/PlanTaskModal';
import { PlanMilestoneModal } from './plan/PlanMilestoneModal';
import { PlanBoardDependencyConnectors, ConnectorDisplayMode } from './plan/PlanBoardDependencyConnectors';
import { PlanParallelTaskDistribution } from './plan/PlanParallelTaskDistribution';

interface PlanCreatorProps {
  initialRepoContext?: {
    repoName: string;
    fileTree: RepoFileTree[];
  } | null;
  onNavigate: (mode: ViewMode, data?: any) => void;
}

const PLAN_PRESETS: { label: string; request: Partial<PlanModelRequest> }[] = [
  {
    label: '⚡ Migrate to TypeScript Strict & Modular Architecture',
    request: {
      title: 'TypeScript Strict Mode & Layered Architecture Migration',
      goal: 'Eliminate any types, establish strict null checks, and decouple UI components from data-fetching services.',
      planType: 'refactoring',
      currentStack: 'JavaScript (ES6), React, Node.js',
      targetStack: 'TypeScript 5.x, React, Node.js with strict type safety',
      priority: 'maintainability',
      constraints: 'Zero runtime regressions, incremental migration per folder without breaking existing features.'
    }
  },
  {
    label: '🔒 Implement Firebase Auth & Role-Based Access Control',
    request: {
      title: 'Enterprise RBAC & Authentication Hardening',
      goal: 'Integrate multi-role permissions (Admin, Editor, Viewer), secure server-side tokens, and enforce Firestore security rules.',
      planType: 'security',
      currentStack: 'React, Express, Local State',
      targetStack: 'React, Firebase Auth, Firestore with Security Rules, Express API proxy',
      priority: 'reliability',
      constraints: 'Adhere to OWASP token hygiene and strict security rule validation.'
    }
  },
  {
    label: '🚀 Real-time Collaborative Engine Implementation',
    request: {
      title: 'Real-time Canvas & Live Multi-user Sync',
      goal: 'Build a low-latency collaborative synchronization layer using WebSockets and optimistic UI updates.',
      planType: 'feature',
      currentStack: 'React, Vite, Tailwind CSS',
      targetStack: 'React, WebSockets / Socket.io, Redis PubSub',
      priority: 'scalability',
      constraints: 'Maintain 60fps canvas performance and handle reconnect drops seamlessly.'
    }
  }
];

export const PlanCreator: React.FC<PlanCreatorProps> = ({ initialRepoContext, onNavigate }) => {
  const savedSettings = loadUserSession()?.planCreatorSettings;

  const [formData, setFormData] = useState<PlanModelRequest>(
    savedSettings?.formData || {
      title: initialRepoContext ? `Modernization Plan for ${initialRepoContext.repoName}` : 'Fullstack Architecture Modernization',
      goal: 'Refactor monolith services, improve automated test coverage, and optimize performance.',
      planType: 'refactoring',
      currentStack: 'React, TypeScript, Node.js, Express',
      targetStack: 'React, TypeScript, Modular API, Vite',
      priority: 'maintainability',
      constraints: 'Maintain backward compatibility, ensure zero downtime rollout.',
      repoContext: initialRepoContext?.repoName || '',
      fileTree: initialRepoContext?.fileTree || []
    }
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImplementationPlan | null>(savedSettings?.currentPlan || null);
  const [copied, setCopied] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number | 'all'>(
    savedSettings?.selectedPhaseFilter || 'all'
  );

  // View modes: 'board' (Kanban/Phases with drag-and-drop), 'graph' (DAG Dependency Map), 'distribution' (Parallel Worker Engine), 'timeline' (Sequence List)
  const [activePlanView, setActivePlanView] = useState<'board' | 'graph' | 'distribution' | 'timeline'>('board');

  // Drag and Drop State Management
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [sourceMilestoneId, setSourceMilestoneId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverMilestoneId, setDragOverMilestoneId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Milestone Drag & Drop Reordering
  const [draggingMilestoneId, setDraggingMilestoneId] = useState<string | null>(null);
  const [dragOverMilestoneColumnId, setDragOverMilestoneColumnId] = useState<string | null>(null);

  // Modals for Task & Milestone Editing
  const [editingTask, setEditingTask] = useState<{ milestoneId: string; task: PlanTask | null } | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<PlanMilestone | null>(null);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [selectedTaskIdInGraph, setSelectedTaskIdInGraph] = useState<string | null>(null);

  // Drag-and-Drop Dependency Connector Lines State
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [showDependencyConnectors, setShowDependencyConnectors] = useState(true);
  const [connectorDisplayMode, setConnectorDisplayMode] = useState<ConnectorDisplayMode>('all');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Compute dependency summary statistics
  const dependencyStats = useMemo(() => {
    if (!plan) return { totalLinks: 0, crossPhaseLinks: 0, invertedLinks: 0 };
    let totalLinks = 0;
    let crossPhaseLinks = 0;
    let invertedLinks = 0;

    const taskMap = new Map<string, { phase: number; index: number }>();
    let gIndex = 0;
    plan.milestones.forEach(m => {
      m.tasks.forEach(t => {
        taskMap.set(t.id, { phase: m.phaseNumber, index: gIndex });
        gIndex++;
      });
    });

    plan.milestones.forEach(m => {
      m.tasks.forEach(t => {
        if (t.dependencies) {
          t.dependencies.forEach(depId => {
            const dep = taskMap.get(depId);
            const curr = taskMap.get(t.id);
            if (dep && curr) {
              totalLinks++;
              if (dep.phase !== curr.phase) crossPhaseLinks++;
              if (dep.index > curr.index) invertedLinks++;
            }
          });
        }
      });
    });

    return { totalLinks, crossPhaseLinks, invertedLinks };
  }, [plan]);

  // Auto-save plan creator state
  useEffect(() => {
    savePlanCreatorSettings({
      formData,
      currentPlan: plan,
      selectedPhaseFilter
    });
  }, [formData, plan, selectedPhaseFilter]);

  const handleGenerate = async () => {
    if (!formData.title.trim() || !formData.goal.trim()) {
      setError('Please provide a title and target goal.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedPlan = await generateImplementationPlan({
        ...formData,
        fileTree: initialRepoContext?.fileTree || []
      });
      setPlan(generatedPlan);
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPreset = (preset: typeof PLAN_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      ...preset.request
    }));
  };

  const handleToggleTask = (milestoneId: string, taskId: string) => {
    if (!plan) return;

    setPlan(prevPlan => {
      if (!prevPlan) return null;
      return {
        ...prevPlan,
        milestones: prevPlan.milestones.map(m => {
          if (m.id !== milestoneId) return m;
          return {
            ...m,
            tasks: m.tasks.map(t => {
              if (t.id !== taskId) return t;
              return { ...t, completed: !t.completed };
            })
          };
        })
      };
    });
  };

  // Reset to original AI generated milestones
  const handleResetToOriginal = () => {
    if (!plan || !plan.originalMilestones) return;
    setPlan({
      ...plan,
      milestones: JSON.parse(JSON.stringify(plan.originalMilestones))
    });
  };

  // -------------------------------------------------------------
  // Drag and Drop: Task Drag Handlers
  // -------------------------------------------------------------
  const handleDragStartTask = (e: React.DragEvent, milestoneId: string, taskId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', milestoneId, taskId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
    setSourceMilestoneId(milestoneId);
  };

  const handleDragOverTask = (e: React.DragEvent, milestoneId: string, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingTaskId === taskId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    setDragOverTaskId(taskId);
    setDragOverMilestoneId(milestoneId);
    setDropPosition(position);
  };

  const handleDragLeaveTask = () => {
    // Only reset if leaving current element
  };

  const handleDropTask = (e: React.DragEvent, targetMilestoneId: string, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!plan || !draggingTaskId || !sourceMilestoneId) {
      resetDragState();
      return;
    }

    if (draggingTaskId === targetTaskId) {
      resetDragState();
      return;
    }

    // Find the task being dragged
    let draggedTask: PlanTask | null = null;
    const newMilestones = plan.milestones.map(m => {
      if (m.id === sourceMilestoneId) {
        const found = m.tasks.find(t => t.id === draggingTaskId);
        if (found) draggedTask = found;
        return {
          ...m,
          tasks: m.tasks.filter(t => t.id !== draggingTaskId)
        };
      }
      return m;
    });

    if (!draggedTask) {
      resetDragState();
      return;
    }

    // Insert task into target milestone
    const finalMilestones = newMilestones.map(m => {
      if (m.id === targetMilestoneId) {
        const targetIndex = m.tasks.findIndex(t => t.id === targetTaskId);
        const insertIndex = dropPosition === 'after' ? targetIndex + 1 : targetIndex;
        const updatedTasks = [...m.tasks];
        if (targetIndex === -1) {
          updatedTasks.push(draggedTask!);
        } else {
          updatedTasks.splice(Math.max(0, insertIndex), 0, draggedTask!);
        }
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });

    setPlan({
      ...plan,
      milestones: finalMilestones
    });

    resetDragState();
  };

  const handleDropOnMilestoneZone = (e: React.DragEvent, targetMilestoneId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!plan || !draggingTaskId || !sourceMilestoneId) {
      resetDragState();
      return;
    }

    if (sourceMilestoneId === targetMilestoneId) {
      resetDragState();
      return;
    }

    let draggedTask: PlanTask | null = null;
    const newMilestones = plan.milestones.map(m => {
      if (m.id === sourceMilestoneId) {
        const found = m.tasks.find(t => t.id === draggingTaskId);
        if (found) draggedTask = found;
        return {
          ...m,
          tasks: m.tasks.filter(t => t.id !== draggingTaskId)
        };
      }
      return m;
    });

    if (draggedTask) {
      const finalMilestones = newMilestones.map(m => {
        if (m.id === targetMilestoneId) {
          return {
            ...m,
            tasks: [...m.tasks, draggedTask!]
          };
        }
        return m;
      });

      setPlan({
        ...plan,
        milestones: finalMilestones
      });
    }

    resetDragState();
  };

  // -------------------------------------------------------------
  // Drag and Drop: Milestone Phase Reordering
  // -------------------------------------------------------------
  const handleDragStartMilestone = (e: React.DragEvent, milestoneId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'milestone', milestoneId }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingMilestoneId(milestoneId);
  };

  const handleDragOverMilestone = (e: React.DragEvent, milestoneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingMilestoneId && draggingMilestoneId !== milestoneId) {
      setDragOverMilestoneColumnId(milestoneId);
    }
  };

  const handleDragLeaveMilestone = () => {
    setDragOverMilestoneColumnId(null);
  };

  const handleDropMilestone = (e: React.DragEvent, targetMilestoneId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!plan || !draggingMilestoneId || draggingMilestoneId === targetMilestoneId) {
      resetDragState();
      return;
    }

    const currentMilestones = [...plan.milestones];
    const sourceIdx = currentMilestones.findIndex(m => m.id === draggingMilestoneId);
    const targetIdx = currentMilestones.findIndex(m => m.id === targetMilestoneId);

    if (sourceIdx === -1 || targetIdx === -1) {
      resetDragState();
      return;
    }

    const [moved] = currentMilestones.splice(sourceIdx, 1);
    currentMilestones.splice(targetIdx, 0, moved);

    // Re-index phase numbers sequentially
    const reindexed = currentMilestones.map((m, idx) => ({
      ...m,
      phaseNumber: idx + 1
    }));

    setPlan({
      ...plan,
      milestones: reindexed
    });

    resetDragState();
  };

  const resetDragState = () => {
    setDraggingTaskId(null);
    setSourceMilestoneId(null);
    setDragOverTaskId(null);
    setDragOverMilestoneId(null);
    setDropPosition(null);
    setDraggingMilestoneId(null);
    setDragOverMilestoneColumnId(null);
  };

  // -------------------------------------------------------------
  // Task & Milestone CRUD Operations
  // -------------------------------------------------------------
  const handleSaveTask = (targetMilestoneId: string, taskToSave: PlanTask) => {
    if (!plan) return;

    // Check if task exists in any milestone
    let isExisting = false;
    let originalMilestoneId = '';
    plan.milestones.forEach(m => {
      if (m.tasks.some(t => t.id === taskToSave.id)) {
        isExisting = true;
        originalMilestoneId = m.id;
      }
    });

    if (isExisting) {
      const updatedMilestones = plan.milestones.map(m => {
        // If moved to different milestone
        if (originalMilestoneId !== targetMilestoneId) {
          if (m.id === originalMilestoneId) {
            return { ...m, tasks: m.tasks.filter(t => t.id !== taskToSave.id) };
          }
          if (m.id === targetMilestoneId) {
            return { ...m, tasks: [...m.tasks, taskToSave] };
          }
          return m;
        }

        // Same milestone edit
        if (m.id === targetMilestoneId) {
          return {
            ...m,
            tasks: m.tasks.map(t => t.id === taskToSave.id ? taskToSave : t)
          };
        }
        return m;
      });

      setPlan({ ...plan, milestones: updatedMilestones });
    } else {
      // Add new task
      const updatedMilestones = plan.milestones.map(m => {
        if (m.id === targetMilestoneId) {
          return { ...m, tasks: [...m.tasks, taskToSave] };
        }
        return m;
      });
      setPlan({ ...plan, milestones: updatedMilestones });
    }
  };

  const handleDeleteTask = (milestoneId: string, taskId: string) => {
    if (!plan) return;

    // Remove task and clean up references in other tasks' dependencies
    const updatedMilestones = plan.milestones.map(m => ({
      ...m,
      tasks: m.tasks
        .filter(t => t.id !== taskId)
        .map(t => ({
          ...t,
          dependencies: t.dependencies?.filter(depId => depId !== taskId)
        }))
    }));

    setPlan({ ...plan, milestones: updatedMilestones });
  };

  const handleDuplicateTask = (milestoneId: string, taskToDup: PlanTask) => {
    if (!plan) return;

    const duplicated: PlanTask = {
      ...taskToDup,
      id: `task-${Date.now()}`,
      title: `${taskToDup.title} (Copy)`,
      completed: false
    };

    const updatedMilestones = plan.milestones.map(m => {
      if (m.id === milestoneId) {
        const index = m.tasks.findIndex(t => t.id === taskToDup.id);
        const newTasks = [...m.tasks];
        newTasks.splice(index + 1, 0, duplicated);
        return { ...m, tasks: newTasks };
      }
      return m;
    });

    setPlan({ ...plan, milestones: updatedMilestones });
  };

  const handleSaveMilestone = (milestoneToSave: PlanMilestone) => {
    if (!plan) return;

    const exists = plan.milestones.some(m => m.id === milestoneToSave.id);
    let updatedMilestones: PlanMilestone[];

    if (exists) {
      updatedMilestones = plan.milestones.map(m => 
        m.id === milestoneToSave.id ? milestoneToSave : m
      );
    } else {
      updatedMilestones = [...plan.milestones, milestoneToSave].map((m, idx) => ({
        ...m,
        phaseNumber: idx + 1
      }));
    }

    setPlan({ ...plan, milestones: updatedMilestones });
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!plan) return;
    if (plan.milestones.length <= 1) return;

    const updated = plan.milestones
      .filter(m => m.id !== milestoneId)
      .map((m, idx) => ({ ...m, phaseNumber: idx + 1 }));

    setPlan({ ...plan, milestones: updated });
  };

  // -------------------------------------------------------------
  // Markdown & Document Export
  // -------------------------------------------------------------
  const handleCopyMarkdown = () => {
    if (!plan) return;

    let md = `# 📋 ${plan.title}\n\n`;
    md += `**Plan Type**: ${plan.planType.toUpperCase()} | **Generated**: ${new Date(plan.createdAt).toLocaleDateString()}\n\n`;
    md += `## 1. Executive Summary\n${plan.executiveSummary}\n\n`;
    md += `## 2. Target Architecture\n${plan.targetArchitecture}\n\n`;
    
    if (plan.architectureDiagramAscii) {
      md += `\`\`\`text\n${plan.architectureDiagramAscii}\n\`\`\`\n\n`;
    }

    md += `## 3. Implementation Milestones & Task DAG\n`;
    plan.milestones.forEach(m => {
      md += `\n### Phase ${m.phaseNumber}: ${m.title} (${m.estimatedDuration})\n`;
      if (m.focus) md += `*Focus: ${m.focus}*\n\n`;
      m.tasks.forEach(t => {
        const depStr = t.dependencies && t.dependencies.length > 0 
          ? ` [Depends on: ${t.dependencies.join(', ')}]` 
          : '';
        md += `- [${t.completed ? 'x' : ' '}] **${t.title}** [${t.actionType.toUpperCase()}]${depStr}\n`;
        md += `  ${t.description}${t.filePath ? `\n  *File*: \`${t.filePath}\`` : ''}\n`;
      });
    });

    md += `\n## 4. Risk Assessment & Mitigations\n`;
    plan.riskAssessment.forEach(r => {
      md += `- **Risk (${r.impact.toUpperCase()})**: ${r.risk}\n  *Mitigation*: ${r.mitigation}\n`;
    });

    md += `\n## 5. Verification & Testing Checklist\n`;
    plan.verificationSteps.forEach(v => {
      md += `- [ ] ${v}\n`;
    });

    md += `\n## 6. Rollback Strategy\n${plan.rollbackStrategy}\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!plan) return;
    handleCopyMarkdown();
    const blob = new Blob([navigator.clipboard ? '' : ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `implementation-plan-${plan.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Progress metrics
  const totalTasks = plan ? plan.milestones.flatMap(m => m.tasks).length : 0;
  const completedTasks = plan ? plan.milestones.flatMap(m => m.tasks).filter(t => t.completed).length : 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered milestones
  const visibleMilestones = plan 
    ? (selectedPhaseFilter === 'all' 
        ? plan.milestones 
        : plan.milestones.filter(m => m.phaseNumber === selectedPhaseFilter))
    : [];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/20 rounded-2xl border border-violet-500/30 text-violet-300 shadow-neon-violet">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold text-white font-sans tracking-tight">
                Plan Creating Model
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono border border-violet-500/30">
                Visual Drag & Drop DAG
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Generate, visually rearrange tasks, and link dependencies across architectural milestones
            </p>
          </div>
        </div>

        {initialRepoContext?.repoName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-slate-300">
            <FileCode2 className="w-4 h-4 text-violet-400" />
            <span>Target Repo: <strong className="text-white">{initialRepoContext.repoName}</strong></span>
          </div>
        )}
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Quick Templates:
        </span>
        {PLAN_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleApplyPreset(preset)}
            className="text-xs font-mono px-3 py-1.5 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/5 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Column: Plan Configuration Form */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Plan Parameters
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Gemini 3.7 Flash</span>
          </div>

          <div className="space-y-3.5">
            {/* Title */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Plan Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Modernization & TypeScript Migration"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Plan Archetype */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Archetype</label>
              <select
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value as PlanType })}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              >
                <option value="refactoring">Refactoring & Tech Debt Reduction</option>
                <option value="feature">New Feature Implementation</option>
                <option value="migration">Framework / Stack Migration</option>
                <option value="performance">Performance & Latency Optimization</option>
                <option value="security">Security Hardening & RBAC</option>
                <option value="architecture">Architecture & Microservices Decoupling</option>
              </select>
            </div>

            {/* Target Goal */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Primary Objective / Goal</label>
              <textarea
                rows={3}
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="Describe what needs to be achieved in detail..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs font-sans text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
              />
            </div>

            {/* Stacks */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Current Stack</label>
                <input
                  type="text"
                  value={formData.currentStack}
                  onChange={(e) => setFormData({ ...formData, currentStack: e.target.value })}
                  placeholder="e.g. React, Express"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Target Stack</label>
                <input
                  type="text"
                  value={formData.targetStack}
                  onChange={(e) => setFormData({ ...formData, targetStack: e.target.value })}
                  placeholder="e.g. TypeScript, Vite"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Engineering Priority</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['maintainability', 'reliability', 'speed', 'scalability'] as const).map(pri => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: pri })}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-mono capitalize border transition-all ${
                      formData.priority === pri
                        ? 'bg-violet-600/30 border-violet-500/60 text-white font-bold'
                        : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>

            {/* Constraints */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Constraints & Rules (Optional)</label>
              <input
                type="text"
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                placeholder="e.g. Zero downtime, strictly typed interfaces"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? 'Synthesizing Architecture Plan...' : 'Generate Implementation Plan'}</span>
          </button>
        </div>

        {/* Right 2 Columns: Structured Implementation Plan Output & Drag-and-Drop Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {isGenerating ? (
            <div className="glass-panel rounded-3xl p-12 flex items-center justify-center min-h-[500px]">
              <LoadingState message="DECOMPOSING ARCHITECTURE INTO DRAGGABLE PHASES & DEPENDENCY DAG..." type="repo" />
            </div>
          ) : plan ? (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Progress & Quick Actions Bar */}
              <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-xs font-bold shadow-neon-violet">
                    {progressPercent}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      Task Progress: {completedTasks} / {totalTasks} Completed
                    </h4>
                    <div className="w-36 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {plan.originalMilestones && (
                    <button
                      onClick={handleResetToOriginal}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
                      title="Revert drag-and-drop rearrangements back to initial AI state"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Reset Order</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>

                  <button
                    onClick={() => onNavigate(ViewMode.AI_ASSISTANT, {
                      initialPrompt: `Review this implementation plan titled "${plan.title}":\n\n${plan.executiveSummary}\n\nLet's discuss the rearranged Phase roadmap and task dependencies.`
                    })}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/30"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Discuss in AI Chat</span>
                  </button>
                </div>
              </div>

              {/* View Switcher Tabs & Phase Filter */}
              <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
                {/* View Tabs */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActivePlanView('board')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activePlanView === 'board'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span>Roadmap Board</span>
                  </button>

                  <button
                    onClick={() => setActivePlanView('graph')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activePlanView === 'graph'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Dependency DAG</span>
                  </button>

                  <button
                    onClick={() => setActivePlanView('distribution')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activePlanView === 'distribution'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Parallel Distribution</span>
                  </button>

                  <button
                    onClick={() => setActivePlanView('timeline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                      activePlanView === 'timeline'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Sequential List</span>
                  </button>
                </div>

                {/* Quick Add Phase & Filter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreatingMilestone(true)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Phase</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <span className="text-[10px] text-slate-500 uppercase">Phase:</span>
                    <select
                      value={selectedPhaseFilter}
                      onChange={(e) => setSelectedPhaseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                      className="bg-black/50 border border-white/10 rounded-xl px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="all">All Phases ({plan.milestones.length})</option>
                      {plan.milestones.map(m => (
                        <option key={m.id} value={m.phaseNumber}>
                          Phase {m.phaseNumber}: {m.title.slice(0, 20)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* VIEW 1: ROADMAP / KANBAN BOARD (DRAG-AND-DROP REORDERING) */}
              {activePlanView === 'board' && (
                <div className="space-y-3">
                  {/* Drag and Drop instructions & Visual Connectors Toolbar */}
                  <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2 text-violet-300">
                      <Zap className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>
                        <strong>Drag & Drop Reordering:</strong> Move tasks vertically or across phases. Dependencies stay visually linked.
                      </span>
                    </div>

                    {/* Dependency Connector Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Toggle Lines Button */}
                      <button
                        onClick={() => setShowDependencyConnectors(!showDependencyConnectors)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                          showDependencyConnectors
                            ? 'bg-violet-600/30 border-violet-500/50 text-white shadow-sm'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                        title={showDependencyConnectors ? 'Hide visual dependency connector lines' : 'Show visual dependency connector lines'}
                      >
                        {showDependencyConnectors ? (
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>Dependency Lines</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] text-cyan-300">
                          {dependencyStats.totalLinks}
                        </span>
                      </button>

                      {/* Display Mode Selector */}
                      {showDependencyConnectors && (
                        <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-xl border border-white/10 text-[10px]">
                          {(['all', 'interactive', 'cross_phase', 'warnings'] as const).map(mode => (
                            <button
                              key={mode}
                              onClick={() => setConnectorDisplayMode(mode)}
                              className={`px-2 py-1 rounded-lg capitalize transition-all ${
                                connectorDisplayMode === mode
                                  ? 'bg-violet-600 text-white font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {mode === 'all' ? 'All Links' :
                               mode === 'interactive' ? 'Focus/Drag' :
                               mode === 'cross_phase' ? `Cross-Phase (${dependencyStats.crossPhaseLinks})` :
                               `Alerts (${dependencyStats.invertedLinks})`}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Inverted Dependency Alert Pill */}
                      {dependencyStats.invertedLinks > 0 && (
                        <div 
                          className="px-2 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] flex items-center gap-1 animate-pulse"
                          title={`${dependencyStats.invertedLinks} tasks are placed before their prerequisite task. Drag them into correct sequence.`}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>{dependencyStats.invertedLinks} Out-of-Order</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connectors Legend */}
                  {showDependencyConnectors && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-black/30 border border-white/5 rounded-xl text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Link2 className="w-3 h-3 text-slate-400" />
                        <span className="uppercase tracking-wider">Visual Dependency Key:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" />
                          <span>Prerequisite Flow</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" />
                          <span>Completed Prerequisite</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-sky-400 rounded-full animate-pulse" />
                          <span>Active / Dragging Flow</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 border-b border-dashed border-rose-500" />
                          <span className="text-rose-300">Out-of-Order Warning</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Milestone Grid with Connector Lines SVG Overlay */}
                  <div 
                    ref={boardContainerRef} 
                    className="relative min-h-[300px]"
                  >
                    {/* SVG Connector Lines Layer */}
                    <PlanBoardDependencyConnectors
                      containerRef={boardContainerRef}
                      milestones={visibleMilestones}
                      draggingTaskId={draggingTaskId}
                      dragOverTaskId={dragOverTaskId}
                      dropPosition={dropPosition}
                      hoveredTaskId={hoveredTaskId}
                      selectedTaskId={selectedTaskIdInGraph}
                      onSelectTask={(taskId) => {
                        setSelectedTaskIdInGraph(taskId);
                        const el = boardContainerRef.current?.querySelector(`[data-task-id="${taskId}"]`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                      showConnectors={showDependencyConnectors}
                      onToggleShowConnectors={setShowDependencyConnectors}
                      displayMode={connectorDisplayMode}
                      onDisplayModeChange={setConnectorDisplayMode}
                    />

                    {/* Milestone Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleMilestones.map((milestone) => (
                        <PlanMilestoneColumn
                          key={milestone.id}
                          milestone={milestone}
                          allMilestones={plan.milestones}
                          isDraggingMilestone={draggingMilestoneId === milestone.id}
                          isDragOverMilestone={dragOverMilestoneColumnId === milestone.id}
                          draggingTaskId={draggingTaskId}
                          dragOverTaskId={dragOverTaskId}
                          dropPosition={dropPosition}
                          onToggleComplete={handleToggleTask}
                          onEditTask={(milestoneId, task) => setEditingTask({ milestoneId, task })}
                          onDeleteTask={handleDeleteTask}
                          onDuplicateTask={handleDuplicateTask}
                          onAddNewTask={(milestoneId) => setEditingTask({ milestoneId, task: null })}
                          onEditMilestone={(m) => setEditingMilestone(m)}
                          onDeleteMilestone={handleDeleteMilestone}
                          onDragStartMilestone={handleDragStartMilestone}
                          onDragOverMilestone={handleDragOverMilestone}
                          onDragLeaveMilestone={handleDragLeaveMilestone}
                          onDropMilestone={handleDropMilestone}
                          onDragStartTask={handleDragStartTask}
                          onDragOverTask={handleDragOverTask}
                          onDragLeaveTask={handleDragLeaveTask}
                          onDropTask={handleDropTask}
                          onDropOnMilestoneZone={handleDropOnMilestoneZone}
                          onSelectDependency={(taskId) => {
                            setSelectedTaskIdInGraph(taskId);
                            const el = boardContainerRef.current?.querySelector(`[data-task-id="${taskId}"]`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                          }}
                          onHoverTask={setHoveredTaskId}
                          hoveredTaskId={hoveredTaskId}
                          selectedTaskIdInGraph={selectedTaskIdInGraph}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: INTERACTIVE DEPENDENCY FLOW GRAPH (DAG) */}
              {activePlanView === 'graph' && (
                <PlanDependencyGraph
                  milestones={plan.milestones}
                  onUpdateMilestones={(newMilestones) => {
                    setPlan({
                      ...plan,
                      milestones: newMilestones
                    });
                  }}
                  onSelectTask={(taskId) => setSelectedTaskIdInGraph(taskId)}
                />
              )}

              {/* VIEW 3: PARALLEL WORKER TASK DISTRIBUTION & SIMULATOR */}
              {activePlanView === 'distribution' && (
                <PlanParallelTaskDistribution
                  milestones={plan.milestones}
                  onSelectTask={(taskId) => setSelectedTaskIdInGraph(taskId)}
                  onUpdateMilestones={(newMilestones) => {
                    setPlan({
                      ...plan,
                      milestones: newMilestones
                    });
                  }}
                />
              )}

              {/* VIEW 4: SEQUENTIAL LIST TIMELINE VIEW */}
              {activePlanView === 'timeline' && (
                <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-violet-400" />
                      Sequential Execution Checklist
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {totalTasks} Actionable Steps
                    </span>
                  </div>

                  <div className="space-y-3">
                    {visibleMilestones.flatMap(m => 
                      m.tasks.map(task => ({ ...task, phaseNumber: m.phaseNumber, phaseTitle: m.title, milestoneId: m.id }))
                    ).map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.milestoneId, task.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          task.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-400'
                            : 'bg-slate-900/80 border-white/5 hover:border-violet-500/40 text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-violet-400 mt-0.5 shrink-0">
                          #{idx + 1}
                        </span>

                        <button className="mt-0.5 shrink-0 text-slate-400 hover:text-white">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold font-sans ${task.completed ? 'line-through' : 'text-white'}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/40 text-violet-300">
                                Phase {task.phaseNumber}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                                task.actionType === 'create' ? 'bg-emerald-500/20 text-emerald-300' :
                                task.actionType === 'modify' ? 'bg-sky-500/20 text-sky-300' :
                                task.actionType === 'delete' ? 'bg-rose-500/20 text-rose-300' :
                                task.actionType === 'test' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-300'
                              }`}>
                                {task.actionType}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            {task.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {task.filePath && (
                              <span className="text-[10px] font-mono text-violet-300 bg-violet-950/40 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                                📄 {task.filePath}
                              </span>
                            )}
                            {task.dependencies && task.dependencies.length > 0 && (
                              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Link2 className="w-3 h-3 text-indigo-400" />
                                <span>Depends on: {task.dependencies.join(', ')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Overview & Architecture */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">
                    Executive Strategy
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">{plan.title}</h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2">
                    {plan.executiveSummary}
                  </p>
                </div>

                {plan.architectureDiagramAscii && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-white/10 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre>{plan.architectureDiagramAscii}</pre>
                  </div>
                )}
              </div>

              {/* Risk Assessment & Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Box */}
                <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Risk Matrix & Mitigations
                  </h4>
                  <div className="space-y-2">
                    {plan.riskAssessment.map((risk, i) => (
                      <div key={i} className="text-xs bg-white/5 p-2.5 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-200 font-sans">{risk.risk}</strong>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                            {risk.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Steps */}
                <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Verification Checklist
                  </h4>
                  <div className="space-y-1.5">
                    {plan.verificationSteps.map((step, i) => (
                      <div key={i} className="text-xs font-mono text-slate-300 flex items-start gap-2 bg-white/5 p-2 rounded-xl">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[460px] border border-white/10">
              <ClipboardList className="w-12 h-12 text-slate-600 animate-pulse" />
              <div className="max-w-md space-y-1">
                <h3 className="text-sm font-bold text-white font-mono">Ready to Synthesize Your Plan</h3>
                <p className="text-xs text-slate-400 font-sans">
                  Configure your project scope or choose a quick template on the left, then click <strong>Generate Implementation Plan</strong> to start visually organizing tasks and dependencies.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Task Creation & Editing Modal */}
      {editingTask && (
        <PlanTaskModal
          isOpen={true}
          task={editingTask.task}
          milestoneId={editingTask.milestoneId}
          allMilestones={plan?.milestones || []}
          fileTree={initialRepoContext?.fileTree || []}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Milestone Editing / Creating Modal */}
      {(editingMilestone || isCreatingMilestone) && (
        <PlanMilestoneModal
          isOpen={true}
          milestone={editingMilestone}
          nextPhaseNumber={(plan?.milestones.length || 0) + 1}
          onSave={handleSaveMilestone}
          onClose={() => {
            setEditingMilestone(null);
            setIsCreatingMilestone(false);
          }}
        />
      )}

    </div>
  );
};

export default PlanCreator;
