/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Layers, 
  Network, 
  Zap, 
  Server, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Code2, 
  Copy, 
  Check, 
  Sliders, 
  BarChart3, 
  Terminal, 
  RefreshCw,
  Box,
  Flame,
  Radio,
  Share2,
  Database,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';
import { 
  PlanMilestone, 
  PlanTask, 
  MessageBrokerType, 
  WorkerNodeState, 
  ExecutionEventLog,
  TaskRuntimeStatus,
  DAGExecutionSnapshot,
  PersistenceEngineConfig
} from '../../types';
import { 
  analyzeParallelDistribution, 
  createWorkerPool, 
  generateOrchestrationSnippet 
} from '../../services/parallelDistributionEngine';
import {
  createDAGSnapshot,
  saveSnapshotToStorage,
  loadPersistenceConfig
} from '../../services/statePersistenceEngine';
import { PlanStatePersistencePanel } from './PlanStatePersistencePanel';

interface PlanParallelTaskDistributionProps {
  milestones: PlanMilestone[];
  onSelectTask?: (taskId: string) => void;
  onUpdateMilestones?: (newMilestones: PlanMilestone[]) => void;
}

export const PlanParallelTaskDistribution: React.FC<PlanParallelTaskDistributionProps> = ({
  milestones,
  onSelectTask
}) => {
  // 1. Compute DAG Partitioning & Concurrency Analysis
  const analysis = useMemo(() => {
    return analyzeParallelDistribution(milestones);
  }, [milestones]);

  // Flattened tasks lookup
  const taskMap = useMemo(() => {
    const map = new Map<string, PlanTask & { milestonePhase: number }>();
    milestones.forEach(m => {
      m.tasks.forEach(t => {
        map.set(t.id, { ...t, milestonePhase: m.phaseNumber });
      });
    });
    return map;
  }, [milestones]);

  const allTasks = useMemo(() => {
    return Array.from(taskMap.values());
  }, [taskMap]);

  // 2. Worker Pool & Broker Architecture State
  const [brokerType, setBrokerType] = useState<MessageBrokerType>('worker_pool');
  const [workerCount, setWorkerCount] = useState<number>(analysis.optimalWorkerCount || 4);
  const [dispatchStrategy, setDispatchStrategy] = useState<'work_stealing' | 'branch_affinity' | 'round_robin' | 'priority'>('work_stealing');
  
  // 3. Live Simulation Engine State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x, 4x
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [elapsedSimulationTimeMs, setElapsedSimulationTimeMs] = useState<number>(0);
  
  // Task Runtime Statuses (id -> status)
  const [taskStatuses, setTaskStatuses] = useState<Map<string, TaskRuntimeStatus>>(new Map());
  const [taskWorkerAssignments, setTaskWorkerAssignments] = useState<Map<string, string>>(new Map());
  const [workerPool, setWorkerPool] = useState<WorkerNodeState[]>(() => createWorkerPool(workerCount, brokerType));
  
  // Real-time Event Log Stream
  const [eventLogs, setEventLogs] = useState<ExecutionEventLog[]>([]);
  const [activeTab, setActiveTab] = useState<'topology' | 'workers' | 'gantt' | 'broker_logs' | 'state_persistence' | 'code'>('topology');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Persistence config cache
  const [persistenceConfig, setPersistenceConfig] = useState<PersistenceEngineConfig>(() => loadPersistenceConfig());

  // Snapshot Restoration Handler (Point-in-Time Recovery)
  const handleRestoreSnapshot = (snapshot: DAGExecutionSnapshot) => {
    setIsPlaying(false);

    // Restore task statuses
    const restoredStatuses = new Map<string, TaskRuntimeStatus>();
    allTasks.forEach(t => {
      restoredStatuses.set(t.id, snapshot.taskStatuses[t.id] || 'blocked');
    });

    // Restore worker assignments
    const restoredAssignments = new Map<string, string>();
    Object.entries(snapshot.taskWorkerAssignments || {}).forEach(([id, workerId]) => {
      restoredAssignments.set(id, workerId);
    });

    // Rehydrate workers into clean idle state
    const cleanWorkers = createWorkerPool(workerCount, brokerType);

    setTaskStatuses(restoredStatuses);
    setTaskWorkerAssignments(restoredAssignments);
    setWorkerPool(cleanWorkers);
    setElapsedSimulationTimeMs(snapshot.executionContext?.elapsedTimeMs || 0);

    const completedCount = snapshot.executionContext?.completedTaskIds?.length || 0;
    const restoreLog: ExecutionEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskId: 'restore',
      taskTitle: `Point-in-Time Restore: ${snapshot.checkpointName}`,
      workerId: 'state_store',
      workerName: snapshot.backend.toUpperCase(),
      eventType: 'barrier_synced',
      message: `State rehydrated from checkpoint ${snapshot.id}. Preserved ${completedCount}/${allTasks.length} completed task states. Re-evaluating uncommitted dependency boundaries.`
    };
    setEventLogs(prev => [restoreLog, ...prev]);
  };

  // Simulated Crash / Host Termination Handler
  const handleSimulateCrash = () => {
    setIsPlaying(false);

    // Mark running workers as offline
    setWorkerPool(current => current.map(w => {
      if (w.status === 'busy') {
        return { ...w, status: 'offline', progress: 0 };
      }
      return w;
    }));

    // Create a crash snapshot for auditing
    const crashSnapshot = createDAGSnapshot({
      checkpointName: `CRASH SNAPSHOT (Host Termination / Process Killed)`,
      triggerReason: 'crash_simulated',
      workflowId: 'wf_plan_master_v1',
      workflowTitle: 'Master Workflow DAG Execution',
      backend: persistenceConfig.backend,
      taskStatuses,
      taskWorkerAssignments,
      workerPool: workerPool.map(w => w.status === 'busy' ? { ...w, status: 'offline' } : w),
      milestones,
      elapsedTimeMs: elapsedSimulationTimeMs,
      isCrashPoint: true
    });
    saveSnapshotToStorage(crashSnapshot, persistenceConfig.maxRetainedSnapshots);

    const crashLog: ExecutionEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskId: 'crash',
      taskTitle: 'Host / Container Failure (SIGKILL / Network Partition)',
      workerId: 'cluster',
      workerName: 'FAILOVER-MONITOR',
      eventType: 'blocked',
      message: `Process crash detected! Checkpoint ${crashSnapshot.id} written to WAL state store. Use 'State Persistence & Snapshots' to resume without lost work.`
    };
    setEventLogs(prev => [crashLog, ...prev]);
  };

  // Recreate worker pool on count or broker change when reset
  useEffect(() => {
    if (!isPlaying && simulationStep === 0) {
      setWorkerPool(createWorkerPool(workerCount, brokerType));
    }
  }, [workerCount, brokerType, isPlaying, simulationStep]);

  // Initialize all tasks as 'blocked' or 'ready' (if zero dependencies)
  const resetSimulation = () => {
    setIsPlaying(false);
    setSimulationStep(0);
    setElapsedSimulationTimeMs(0);
    setEventLogs([]);

    const initialStatuses = new Map<string, TaskRuntimeStatus>();
    const initialAssignments = new Map<string, string>();

    allTasks.forEach(t => {
      const hasDeps = t.dependencies && t.dependencies.length > 0;
      initialStatuses.set(t.id, hasDeps ? 'blocked' : 'ready');
    });

    setTaskStatuses(initialStatuses);
    setTaskWorkerAssignments(initialAssignments);
    setWorkerPool(createWorkerPool(workerCount, brokerType));

    // Log initialization event
    const initLog: ExecutionEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskId: 'root',
      taskTitle: 'Workflow DAG Initialization',
      workerId: 'broker',
      workerName: brokerType.toUpperCase(),
      eventType: 'barrier_synced',
      message: `Partitioned DAG into ${analysis.branches.length} independent branches across ${workerCount} worker threads. Ready tasks enqueued.`
    };
    setEventLogs([initLog]);
  };

  useEffect(() => {
    resetSimulation();
  }, [milestones]);

  // Check if simulation is fully complete
  const isSimulationComplete = useMemo(() => {
    if (allTasks.length === 0) return false;
    return allTasks.every(t => taskStatuses.get(t.id) === 'completed');
  }, [allTasks, taskStatuses]);

  // Simulation Clock Tick Loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isSimulationComplete) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.max(50, 400 / playbackSpeed);

    timerRef.current = setInterval(() => {
      setSimulationStep(prev => prev + 1);
      setElapsedSimulationTimeMs(prev => prev + (intervalMs * playbackSpeed));

      setTaskStatuses(currentStatuses => {
        const nextStatuses = new Map(currentStatuses);
        const newLogs: ExecutionEventLog[] = [];

        setWorkerPool(currentWorkers => {
          const nextWorkers = currentWorkers.map(w => ({ ...w }));

          // 1. Advance in-progress worker tasks
          nextWorkers.forEach(worker => {
            if (worker.status === 'busy' && worker.currentTaskId) {
              const currentTaskId = worker.currentTaskId;
              const stepDelta = Math.min(100, worker.progress + (25 * playbackSpeed));

              if (stepDelta >= 100) {
                // Task is completed by this worker
                worker.status = 'idle';
                worker.currentTaskId = null;
                worker.progress = 0;
                worker.tasksCompleted += 1;
                worker.totalTimeSpentMs += 1200;

                nextStatuses.set(currentTaskId, 'completed');

                // Auto snapshot to persistent store if enabled
                if (persistenceConfig.autoSnapshotOnNodeComplete) {
                  try {
                    const autoSnap = createDAGSnapshot({
                      checkpointName: `Node [${currentTaskId}] Completed Checkpoint`,
                      triggerReason: 'node_completed',
                      workflowId: 'wf_plan_master_v1',
                      workflowTitle: 'Master Workflow DAG Execution',
                      backend: persistenceConfig.backend,
                      taskStatuses: nextStatuses,
                      taskWorkerAssignments,
                      workerPool: nextWorkers,
                      milestones,
                      elapsedTimeMs: elapsedSimulationTimeMs
                    });
                    saveSnapshotToStorage(autoSnap, persistenceConfig.maxRetainedSnapshots);
                  } catch (e) {
                    // Ignore transient storage errors during rapid simulation loop
                  }
                }

                const t = taskMap.get(currentTaskId);
                newLogs.push({
                  id: `log-${Date.now()}-${Math.random()}`,
                  timestamp: Date.now(),
                  taskId: currentTaskId,
                  taskTitle: t?.title || currentTaskId,
                  workerId: worker.id,
                  workerName: worker.name,
                  eventType: 'completed',
                  message: `Finished execution & acknowledged to broker in ${(worker.totalTimeSpentMs / 1000).toFixed(1)}s`,
                  brokerMeta: {
                    routingKey: `task.completed.${currentTaskId}`,
                    latencyMs: Math.round(15 + Math.random() * 20)
                  }
                });

                // Check downstream tasks whose dependencies are now all satisfied
                allTasks.forEach(otherTask => {
                  if (nextStatuses.get(otherTask.id) === 'blocked') {
                    const allDepsCompleted = (otherTask.dependencies || []).every(depId => 
                      nextStatuses.get(depId) === 'completed'
                    );

                    if (allDepsCompleted) {
                      nextStatuses.set(otherTask.id, 'ready');
                      newLogs.push({
                        id: `log-${Date.now()}-${Math.random()}`,
                        timestamp: Date.now(),
                        taskId: otherTask.id,
                        taskTitle: otherTask.title,
                        workerId: 'broker',
                        workerName: 'DAG-Scheduler',
                        eventType: 'ready',
                        message: `Dependencies resolved. Pushed to concurrent ready queue.`
                      });
                    }
                  }
                });

              } else {
                worker.progress = stepDelta;
              }
            }
          });

          // 2. Dispatch ready tasks to available idle workers
          const readyTaskIds = allTasks
            .map(t => t.id)
            .filter(id => nextStatuses.get(id) === 'ready');

          // Sort ready tasks by branch priority or action weight
          const sortedReadyTaskIds = [...readyTaskIds].sort((a, b) => {
            const isCritA = analysis.criticalPathTaskIds.includes(a);
            const isCritB = analysis.criticalPathTaskIds.includes(b);
            if (isCritA && !isCritB) return -1;
            if (!isCritA && isCritB) return 1;
            return 0;
          });

          sortedReadyTaskIds.forEach(taskId => {
            const idleWorker = nextWorkers.find(w => w.status === 'idle');
            if (idleWorker) {
              idleWorker.status = 'busy';
              idleWorker.currentTaskId = taskId;
              idleWorker.taskTitle = taskMap.get(taskId)?.title;
              idleWorker.progress = 10;

              nextStatuses.set(taskId, 'running');

              setTaskWorkerAssignments(prev => {
                const nextAssign = new Map(prev);
                nextAssign.set(taskId, idleWorker.id);
                return nextAssign;
              });

              const taskObj = taskMap.get(taskId);
              newLogs.push({
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                taskId,
                taskTitle: taskObj?.title || taskId,
                workerId: idleWorker.id,
                workerName: idleWorker.name,
                eventType: 'dispatched',
                message: `Dispatched to concurrent execution thread (${dispatchStrategy.replace('_', ' ')})`,
                brokerMeta: {
                  queue: `partition-${brokerType}`,
                  latencyMs: Math.round(5 + Math.random() * 10)
                }
              });
            }
          });

          return nextWorkers;
        });

        if (newLogs.length > 0) {
          setEventLogs(prev => [...newLogs.slice(-10), ...prev].slice(0, 50));
        }

        return nextStatuses;
      });

    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isSimulationComplete, playbackSpeed, allTasks, taskMap, analysis, dispatchStrategy, brokerType]);

  // Statistics
  const completedCount = allTasks.filter(t => taskStatuses.get(t.id) === 'completed').length;
  const runningCount = allTasks.filter(t => taskStatuses.get(t.id) === 'running').length;
  const readyCount = allTasks.filter(t => taskStatuses.get(t.id) === 'ready').length;
  const blockedCount = allTasks.filter(t => taskStatuses.get(t.id) === 'blocked').length;
  const overallProgress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  const currentBusyWorkers = workerPool.filter(w => w.status === 'busy').length;
  const workerUtilization = workerPool.length > 0 ? Math.round((currentBusyWorkers / workerPool.length) * 100) : 0;

  // Code Snippet Export
  const codeSnippet = useMemo(() => {
    return generateOrchestrationSnippet(brokerType, milestones, workerCount);
  }, [brokerType, milestones, workerCount]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. Header Overview & Metrics Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-indigo-500/30 to-violet-600/30 rounded-2xl border border-indigo-500/40 text-indigo-300 shadow-neon-violet">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-white font-sans tracking-tight">
                  Parallel Task Distribution & DAG Orchestrator
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  {analysis.theoreticalSpeedup}x Speedup
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Partitioning Directed Acyclic Graphs into non-interfering concurrent branches across worker pools & message brokers
              </p>
            </div>
          </div>

          {/* Quick Execution Status Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Workers:</span>
              </div>
              <span className="font-bold text-white">
                {currentBusyWorkers} / {workerPool.length} Active ({workerUtilization}%)
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2.5 text-xs font-mono">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">Parallel Est:</span>
              <span className="font-bold text-amber-300">
                {analysis.parallelDurationHours}h <span className="text-[10px] text-slate-500 font-normal">(vs {analysis.serialDurationHours}h serial)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Speedup and Concurrency Metrics KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Independent Branches</div>
            <div className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-400" />
              <span>{analysis.branches.length} Sub-DAGs</span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Concurrent Stages</div>
            <div className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{analysis.concurrentStages.length} Wave Layers</span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Max Concurrency</div>
            <div className="text-lg font-bold font-mono text-emerald-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>{Math.max(...analysis.concurrentStages.map(s => s.maxParallelism), 1)} Parallel Tasks</span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Amdahl Efficiency</div>
            <div className="text-lg font-bold font-mono text-amber-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>{analysis.concurrencyEfficiency}% Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Simulation Controls & Broker Architecture Configuration */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        
        {/* Play / Step / Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isSimulationComplete}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 disabled:opacity-40'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause Simulation' : isSimulationComplete ? 'Completed' : 'Simulate Concurrent Run'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            title="Reset DAG state & worker threads"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 text-[11px] font-mono">
            {([0.5, 1, 2, 4] as const).map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  playbackSpeed === speed
                    ? 'bg-violet-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Broker Type & Worker Count Configuration */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Broker Architecture */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Broker:</span>
            <select
              value={brokerType}
              onChange={(e) => setBrokerType(e.target.value as MessageBrokerType)}
              className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-violet-500"
            >
              <option value="worker_pool">🧵 In-Memory Thread Pool</option>
              <option value="rabbitmq">🐇 RabbitMQ (AMQP / Celery)</option>
              <option value="kafka">⚡ Apache Kafka (Partitions)</option>
              <option value="redis_bullmq">🔴 Redis Streams (BullMQ)</option>
              <option value="kubernetes_matrix">☸️ Kubernetes Job Matrix</option>
            </select>
          </div>

          {/* Worker Pool Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Worker Pool:</span>
            <select
              value={workerCount}
              onChange={(e) => setWorkerCount(parseInt(e.target.value, 10))}
              className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-violet-500"
            >
              <option value={2}>2 Workers</option>
              <option value={4}>4 Workers (Recommended)</option>
              <option value={8}>8 High-Throughput Workers</option>
              <option value={16}>16 Cloud Cluster Nodes</option>
            </select>
          </div>

          {/* Dispatch Policy */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Strategy:</span>
            <select
              value={dispatchStrategy}
              onChange={(e) => setDispatchStrategy(e.target.value as any)}
              className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-violet-500"
            >
              <option value="work_stealing">⚡ Fair Work-Stealing</option>
              <option value="branch_affinity">🎯 Branch Cache Locality</option>
              <option value="priority">🔥 Critical Path Priority</option>
              <option value="round_robin">🔄 Round-Robin</option>
            </select>
          </div>
        </div>

      </div>

      {/* 3. Real-Time Task State Queue Breakdown Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">Completed Tasks</div>
            <div className="text-lg font-bold text-white font-mono">{completedCount} / {allTasks.length}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">In-Flight (Executing)</div>
            <div className="text-lg font-bold text-white font-mono">{runningCount} active</div>
          </div>
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">Ready Queue (Unblocked)</div>
            <div className="text-lg font-bold text-white font-mono">{readyCount} queued</div>
          </div>
          <Radio className="w-5 h-5 text-amber-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Blocked (Prerequisites)</div>
            <div className="text-lg font-bold text-slate-300 font-mono">{blockedCount} waiting</div>
          </div>
          <Layers className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* 4. Tabbed Views: Topology Wave, Worker Threads, Concurrent Gantt, Logs, Code Snippet */}
      <div className="space-y-4">
        
        {/* Navigation Tabs */}
        <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-white/10">
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'topology' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>DAG Branch Partitions</span>
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'workers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Worker Node Fleet ({workerPool.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'gantt' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Concurrent Wave Stages</span>
            </button>

            <button
              onClick={() => setActiveTab('broker_logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'broker_logs' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Broker Stream Logs ({eventLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('state_persistence')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'state_persistence' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-300" />
              <span>State Persistence & Recovery</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'code' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Export Code Specs</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DAG BRANCH PARTITIONS & SUBGRAPHS */}
        {activeTab === 'topology' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-400" />
                <span>
                  <strong>Independent Subgraph Partitioning:</strong> Disjoint branches run simultaneously on isolated worker nodes without shared lock contention.
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Critical Path highlighted in Red
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.branches.map((branch, idx) => (
                <div 
                  key={branch.id}
                  className="glass-panel p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden"
                  style={{
                    borderColor: branch.isCriticalPath ? '#f43f5e' : `${branch.color}40`,
                    boxShadow: branch.isCriticalPath ? '0 0 15px rgba(244, 63, 94, 0.15)' : 'none'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: branch.color }} 
                      />
                      <h4 className="text-xs font-bold text-white font-mono truncate">
                        {branch.name}
                      </h4>
                    </div>

                    {branch.isCriticalPath && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-mono border border-rose-500/30 flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 text-rose-400" />
                        Critical Path
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded-xl border border-white/5">
                    <span>Tasks: <strong className="text-white">{branch.taskIds.length}</strong></span>
                    <span>Speedup: <strong className="text-emerald-300">{branch.speedupFactor}x</strong></span>
                    <span>Est: <strong className="text-amber-300">{branch.estimatedParallelHours}h</strong></span>
                  </div>

                  {/* Task list in branch */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {branch.taskIds.map(taskId => {
                      const task = taskMap.get(taskId);
                      if (!task) return null;
                      const status = taskStatuses.get(taskId) || 'blocked';
                      const isCritical = analysis.criticalPathTaskIds.includes(taskId);

                      return (
                        <div 
                          key={taskId}
                          onClick={() => onSelectTask?.(taskId)}
                          className={`p-2 rounded-xl border text-[11px] font-mono transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            status === 'completed' ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-400' :
                            status === 'running' ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm ring-1 ring-cyan-500' :
                            status === 'ready' ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' :
                            'bg-slate-900/60 border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                            {status === 'running' && <Activity className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />}
                            {status === 'ready' && <Radio className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />}
                            {status === 'blocked' && <Box className="w-3 h-3 text-slate-600 shrink-0" />}
                            <span className="truncate font-sans font-medium">{task.title}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isCritical && (
                              <span className="text-[9px] px-1 bg-rose-500/20 text-rose-300 rounded font-bold">
                                ⚡
                              </span>
                            )}
                            <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-black/40 text-slate-400">
                              {task.actionType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE WORKER THREAD POOL & FLEET STATUS */}
        {activeTab === 'workers' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {workerPool.map((worker, idx) => (
                <div 
                  key={worker.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                    worker.status === 'busy' 
                      ? 'border-cyan-500/40 bg-slate-900/90 shadow-lg shadow-cyan-500/10' 
                      : 'border-white/10 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: worker.color }}
                      />
                      <span className="text-xs font-bold font-mono text-white truncate max-w-[130px]">
                        {worker.name}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                      worker.status === 'busy'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}>
                      {worker.status}
                    </span>
                  </div>

                  {/* Current Active Task or Idle */}
                  <div className="min-h-[64px] bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col justify-center space-y-1">
                    {worker.status === 'busy' && worker.currentTaskId ? (
                      <>
                        <div className="text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                          <span className="uppercase tracking-wider">Executing Task</span>
                          <span>{worker.progress}%</span>
                        </div>
                        <p className="text-xs font-sans font-bold text-white truncate" title={worker.taskTitle}>
                          {worker.taskTitle || worker.currentTaskId}
                        </p>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-cyan-400 transition-all duration-200" 
                            style={{ width: `${worker.progress}%` }} 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-xs font-mono text-slate-500 italic">
                        Worker Thread Idle — Waiting for ready tasks...
                      </div>
                    )}
                  </div>

                  {/* Worker Stats */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                    <span>Completed: <strong className="text-emerald-300">{worker.tasksCompleted}</strong></span>
                    <span>Type: <strong className="text-violet-300">{worker.type}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CONCURRENT WAVE STAGES GANTT */}
        {activeTab === 'gantt' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Topological Wave Concurrency Stages
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Tasks partitioned into synchronous barrier stages; all tasks within the same stage execute simultaneously.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {analysis.concurrentStages.length} Stages
                </span>
              </div>

              <div className="space-y-3">
                {analysis.concurrentStages.map((stage, sIdx) => (
                  <div 
                    key={stage.stageIndex}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-violet-600 text-white font-mono text-xs font-bold">
                          Stage {stage.stageIndex + 1}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-300">
                          {stage.taskIds.length} Parallel Tasks ({stage.estimatedDurationHours}h estimated)
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        Barrier Sync at Stage Completion
                      </span>
                    </div>

                    {/* Stage tasks pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {stage.taskIds.map(taskId => {
                        const task = taskMap.get(taskId);
                        if (!task) return null;
                        const status = taskStatuses.get(taskId) || 'blocked';
                        const assignedWorkerId = taskWorkerAssignments.get(taskId);
                        const assignedWorker = workerPool.find(w => w.id === assignedWorkerId);

                        return (
                          <div 
                            key={taskId}
                            onClick={() => onSelectTask?.(taskId)}
                            className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                              status === 'completed' ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-300' :
                              status === 'running' ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-md ring-1 ring-cyan-400' :
                              status === 'ready' ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' :
                              'bg-slate-900/60 border-white/5 text-slate-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-white font-sans truncate text-[11px]">
                                {task.title}
                              </span>
                              <span className={`text-[8px] uppercase px-1 py-0.2 rounded shrink-0 font-mono ${
                                status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                                status === 'running' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' :
                                status === 'ready' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/5">
                              <span>{task.actionType.toUpperCase()}</span>
                              {assignedWorker ? (
                                <span className="text-cyan-300 font-bold">
                                  ⚡ {assignedWorker.name.split(' ')[0]}
                                </span>
                              ) : (
                                <span>{task.dependencies?.length || 0} deps</span>
                              )}
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
        )}

        {/* TAB 4: BROKER STREAM LOGS */}
        {activeTab === 'broker_logs' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/90 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-slate-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Asynchronous Message Broker Feed ({brokerType.toUpperCase()})</span>
                </div>
                <button 
                  onClick={() => setEventLogs([])}
                  className="hover:text-white text-[10px] text-slate-500"
                >
                  Clear Console
                </button>
              </div>

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {eventLogs.length > 0 ? (
                  eventLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] flex items-start gap-2.5 font-mono"
                    >
                      <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>

                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                        log.eventType === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.eventType === 'dispatched' ? 'bg-cyan-500/20 text-cyan-300' :
                        log.eventType === 'ready' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-violet-500/20 text-violet-300'
                      }`}>
                        {log.eventType}
                      </span>

                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white">[{log.workerName}] </span>
                        <span className="text-slate-300">{log.message}</span>
                        {log.brokerMeta?.routingKey && (
                          <span className="text-[10px] text-slate-500 ml-2">
                            (key: {log.brokerMeta.routingKey}, {log.brokerMeta.latencyMs}ms)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-600 italic">
                    Start simulation to observe asynchronous worker events and queue dispatches...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STATE PERSISTENCE & CRASH RECOVERY */}
        {activeTab === 'state_persistence' && (
          <PlanStatePersistencePanel
            milestones={milestones}
            taskStatuses={taskStatuses}
            taskWorkerAssignments={taskWorkerAssignments}
            workerPool={workerPool}
            elapsedSimulationTimeMs={elapsedSimulationTimeMs}
            isPlaying={isPlaying}
            onRestoreSnapshot={handleRestoreSnapshot}
            onSimulateCrash={handleSimulateCrash}
            onLogEvent={(log) => setEventLogs(prev => [log, ...prev])}
          />
        )}

        {/* TAB 6: EXPORT ORCHESTRATION CODE */}
        {activeTab === 'code' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    Production Orchestration Boilerplate ({brokerType.toUpperCase()})
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Ready-to-deploy worker pool dispatch script for non-blocking parallel DAG execution.
                  </p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/30"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Snippet'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{codeSnippet}</pre>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default PlanParallelTaskDistribution;
