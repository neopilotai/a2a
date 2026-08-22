/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertOctagon, 
  FileText, 
  Trash2, 
  Download, 
  Upload, 
  ShieldCheck, 
  Key, 
  Flame, 
  HardDrive, 
  Activity, 
  Code2, 
  Copy, 
  Check, 
  Clock, 
  Layers, 
  ArrowRight,
  ExternalLink,
  Cpu,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';
import { 
  PlanMilestone, 
  PlanTask, 
  TaskRuntimeStatus, 
  WorkerNodeState, 
  DAGExecutionSnapshot, 
  StateStoreBackend, 
  PersistenceEngineConfig,
  ExecutionEventLog
} from '../../types';
import { 
  createDAGSnapshot, 
  loadPersistedSnapshots, 
  saveSnapshotToStorage, 
  deleteSnapshotFromStorage, 
  clearAllSnapshotsFromStorage, 
  loadPersistenceConfig, 
  savePersistenceConfig, 
  generatePersistenceAdapterCode, 
  DEFAULT_PERSISTENCE_CONFIG,
  calculateChecksum
} from '../../services/statePersistenceEngine';

interface PlanStatePersistencePanelProps {
  milestones: PlanMilestone[];
  taskStatuses: Map<string, TaskRuntimeStatus>;
  taskWorkerAssignments: Map<string, string>;
  workerPool: WorkerNodeState[];
  elapsedSimulationTimeMs: number;
  isPlaying: boolean;
  onRestoreSnapshot: (snapshot: DAGExecutionSnapshot) => void;
  onSimulateCrash: () => void;
  onLogEvent?: (log: ExecutionEventLog) => void;
}

export const PlanStatePersistencePanel: React.FC<PlanStatePersistencePanelProps> = ({
  milestones,
  taskStatuses,
  taskWorkerAssignments,
  workerPool,
  elapsedSimulationTimeMs,
  isPlaying,
  onRestoreSnapshot,
  onSimulateCrash,
  onLogEvent
}) => {
  // Config & Snapshots state
  const [config, setConfig] = useState<PersistenceEngineConfig>(() => loadPersistenceConfig());
  const [snapshots, setSnapshots] = useState<DAGExecutionSnapshot[]>(() => loadPersistedSnapshots());
  
  // Custom Checkpoint Name input
  const [customCheckpointName, setCustomCheckpointName] = useState<string>('');
  
  // Modal / Drawer state for inspecting snapshot JSON payload
  const [inspectingSnapshot, setInspectingSnapshot] = useState<DAGExecutionSnapshot | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'config' | 'schema'>('timeline');

  // Completed count calculation
  const completedCount = Array.from(taskStatuses.values()).filter(s => s === 'completed').length;
  const allTasksCount = milestones.reduce((acc, m) => acc + m.tasks.length, 0);

  // Sync config changes to storage
  const handleUpdateConfig = (newConfig: Partial<PersistenceEngineConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    savePersistenceConfig(updated);
  };

  // Create manual snapshot
  const handleCreateManualSnapshot = () => {
    const name = customCheckpointName.trim() || `Manual Checkpoint (${completedCount}/${allTasksCount} nodes)`;
    const snapshot = createDAGSnapshot({
      checkpointName: name,
      triggerReason: 'manual',
      workflowId: 'wf_plan_master_v1',
      workflowTitle: 'Master Workflow DAG Execution',
      backend: config.backend,
      taskStatuses,
      taskWorkerAssignments,
      workerPool,
      milestones,
      elapsedTimeMs: elapsedSimulationTimeMs
    });

    const updated = saveSnapshotToStorage(snapshot, config.maxRetainedSnapshots);
    setSnapshots(updated);
    setCustomCheckpointName('');

    onLogEvent?.({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskId: 'snapshot',
      taskTitle: name,
      workerId: 'state_store',
      workerName: config.backend.toUpperCase(),
      eventType: 'completed',
      message: `Persisted state snapshot ${snapshot.id} (${(snapshot.serializedSizeBytes / 1024).toFixed(1)} KB, checksum: ${snapshot.checksum})`
    });
  };

  // Restore snapshot handler
  const handleRestore = (snapshot: DAGExecutionSnapshot) => {
    onRestoreSnapshot(snapshot);
  };

  // Delete snapshot handler
  const handleDelete = (id: string) => {
    const updated = deleteSnapshotFromStorage(id);
    setSnapshots(updated);
  };

  // Export JSON snapshot bundle
  const handleDownloadSnapshot = (snapshot: DAGExecutionSnapshot) => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dag-snapshot-${snapshot.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON snapshot file
  const handleImportSnapshotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && parsed.taskStatuses && parsed.checksum) {
          const updated = saveSnapshotToStorage(parsed, config.maxRetainedSnapshots);
          setSnapshots(updated);
        } else {
          alert('Invalid snapshot file format.');
        }
      } catch (err) {
        alert('Failed to parse snapshot JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Generated Schema & DDL code
  const schemaCode = generatePersistenceAdapterCode(config.backend);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* Top Banner: Storage Backend Status & Quick Stats */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 text-cyan-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                State Persistence & Crash Recovery Layer
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30 font-bold">
                {config.backend.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] font-sans text-slate-400">
              Serializing execution context, task variables, and worker fleet states for point-in-time recovery.
            </p>
          </div>
        </div>

        {/* Action Buttons: Crash Simulation & Manual Checkpoint */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onSimulateCrash}
            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Inject simulated worker kill / host crash to test state recovery"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Simulate Crash</span>
          </button>

          <button
            onClick={handleCreateManualSnapshot}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Snapshot Now</span>
          </button>
        </div>
      </div>

      {/* Manual Checkpoint Input Field */}
      <div className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center gap-2">
        <Save className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input 
          type="text"
          value={customCheckpointName}
          onChange={(e) => setCustomCheckpointName(e.target.value)}
          placeholder="Checkpoint label (e.g. 'Post-Database Migration Barrier', 'Before Auth Stage')..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateManualSnapshot();
          }}
        />
        <button
          onClick={handleCreateManualSnapshot}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold transition-all"
        >
          Save Checkpoint
        </button>
      </div>

      {/* Sub-Navigation: Timeline Snapshots vs. Storage Config vs. DDL Schema */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'timeline' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Snapshot Timeline ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'config' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Storage & Durability Config</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'schema' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Database Adapter DDL</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono cursor-pointer transition-all flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportSnapshotFile} 
              className="hidden" 
            />
          </label>

          {snapshots.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all stored workflow snapshots?')) {
                  clearAllSnapshotsFromStorage();
                  setSnapshots([]);
                }
              }}
              className="text-slate-500 hover:text-rose-400 text-xs font-mono transition-all p-1"
              title="Clear all stored snapshots"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: TIMELINE OF SNAPSHOTS */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-3">
          {snapshots.length > 0 ? (
            <div className="space-y-2.5">
              {snapshots.map((snap, idx) => {
                const isLatest = idx === 0;
                const completedInSnap = snap.executionContext?.completedTaskIds?.length || 0;
                const totalInSnap = snap.executionContext?.totalTasks || allTasksCount;
                const progressPct = totalInSnap > 0 ? Math.round((completedInSnap / totalInSnap) * 100) : 0;

                return (
                  <div
                    key={snap.id}
                    className={`glass-panel p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      snap.isCrashPoint 
                        ? 'border-rose-500/40 bg-rose-950/20' 
                        : isLatest 
                        ? 'border-cyan-500/40 bg-slate-900/80 shadow-md shadow-cyan-500/10' 
                        : 'border-white/10 bg-black/40'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white font-mono truncate">
                          {snap.checkpointName}
                        </span>

                        {isLatest && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono border border-cyan-500/30">
                            Latest Checkpoint
                          </span>
                        )}

                        {snap.isCrashPoint && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-mono border border-rose-500/30 font-bold flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            Crash Point
                          </span>
                        )}

                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                          {snap.triggerReason.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 flex-wrap">
                        <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>Nodes: <strong className="text-emerald-300">{completedInSnap}/{totalInSnap} ({progressPct}%)</strong></span>
                        <span>•</span>
                        <span>Size: <strong>{(snap.serializedSizeBytes / 1024).toFixed(1)} KB</strong></span>
                        <span>•</span>
                        <span className="text-slate-500">Hash: {snap.checksum}</span>
                      </div>
                    </div>

                    {/* Snapshot Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setInspectingSnapshot(snap)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1"
                        title="Inspect serialized JSON context"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        title="Download JSON bundle"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRestore(snap)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md ${
                          snap.isCrashPoint
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        }`}
                        title="Resume workflow execution from this checkpoint"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resume from Checkpoint</span>
                      </button>

                      <button
                        onClick={() => handleDelete(snap.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-2">
              <Database className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400">
                No checkpoints stored yet. Run the simulation or click "Snapshot Now" to capture state.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: STORAGE & DURABILITY CONFIGURATION */}
      {activeSubTab === 'config' && (
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-violet-400" />
              Storage Engine & Persistence Policies
            </h4>
            <p className="text-[11px] font-sans text-slate-400">
              Configure write-ahead logging (WAL), automated checkpoint triggers, and storage backends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
            
            {/* Storage Backend */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <label className="text-slate-300 font-bold block">Persistence Store Backend</label>
              <select
                value={config.backend}
                onChange={(e) => handleUpdateConfig({ backend: e.target.value as StateStoreBackend })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-violet-500"
              >
                <option value="postgres_relational">🐘 PostgreSQL (Relational JSONB + WAL)</option>
                <option value="redis_kv">🔴 Redis KV & Streams (Atomic Checkpoints)</option>
                <option value="firestore_doc">🔥 Cloud Firestore (Document Snapshots)</option>
                <option value="sqlite_wal">🗄️ SQLite 3 (WAL Mode Embedded)</option>
                <option value="local_storage">💻 Browser LocalStorage / IndexedDB</option>
              </select>
            </div>

            {/* Durability Level */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <label className="text-slate-300 font-bold block">Durability & Consistency</label>
              <select
                value={config.durabilityLevel}
                onChange={(e) => handleUpdateConfig({ durabilityLevel: e.target.value as any })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-violet-500"
              >
                <option value="wal_fsync">🛡️ WAL FSYNC (Zero Data Loss on Crash)</option>
                <option value="exactly_once">🎯 Exactly-Once Transaction Boundary</option>
                <option value="at_least_once">⚡ At-Least-Once (High Throughput)</option>
              </select>
            </div>

            {/* Auto Snapshot On Node Complete */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-bold">Auto-Snapshot on Node Finish</div>
                <div className="text-[10px] text-slate-400">Capture state automatically when any sub-task completes</div>
              </div>
              <input
                type="checkbox"
                checked={config.autoSnapshotOnNodeComplete}
                onChange={(e) => handleUpdateConfig({ autoSnapshotOnNodeComplete: e.target.checked })}
                className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
              />
            </div>

            {/* Max Retained Snapshots */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span>Snapshot Retention Limit</span>
                <span className="text-violet-300">{config.maxRetainedSnapshots} Snapshots</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={config.maxRetainedSnapshots}
                onChange={(e) => handleUpdateConfig({ maxRetainedSnapshots: parseInt(e.target.value, 10) })}
                className="w-full accent-violet-600 cursor-pointer"
              />
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 3: DATABASE ADAPTER & DDL SCHEMA */}
      {activeSubTab === 'schema' && (
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                {config.backend.replace('_', ' ').toUpperCase()} Schema & Migration Adapter
              </h4>
              <p className="text-[11px] font-sans text-slate-400">
                Deployable persistence schema and atomic checkpoint function for the selected database.
              </p>
            </div>

            <button
              onClick={handleCopySchema}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/30"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy DDL'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 overflow-y-auto">
            <pre>{schemaCode}</pre>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT SERIALIZED SNAPSHOT CONTEXT */}
      {inspectingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-3xl border border-white/20 p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">
                    {inspectingSnapshot.checkpointName}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {inspectingSnapshot.id} • Hash: {inspectingSnapshot.checksum} • Size: {(inspectingSnapshot.serializedSizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingSnapshot(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Payload Tabs */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-xs">
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Global Variables & Context:</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 text-emerald-300 overflow-x-auto">
                  <pre>{JSON.stringify(inspectingSnapshot.executionContext.globalVariables, null, 2)}</pre>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Completed Task Outputs:</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 text-cyan-300 overflow-x-auto">
                  <pre>{JSON.stringify(inspectingSnapshot.executionContext.taskOutputs, null, 2)}</pre>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Full Checkpoint Snapshot JSON:</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 text-slate-300 overflow-x-auto max-h-48">
                  <pre>{JSON.stringify(inspectingSnapshot, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => handleDownloadSnapshot(inspectingSnapshot)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => {
                  handleRestore(inspectingSnapshot);
                  setInspectingSnapshot(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore & Resume From Here</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PlanStatePersistencePanel;
