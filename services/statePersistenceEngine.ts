/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  PlanMilestone, 
  PlanTask, 
  TaskRuntimeStatus, 
  WorkerNodeState, 
  DAGExecutionSnapshot, 
  DAGExecutionContext, 
  StateStoreBackend, 
  PersistenceEngineConfig,
  ExecutionEventLog
} from '../types';

const STORAGE_KEY = 'workflow_dag_snapshots_v1';
const CONFIG_KEY = 'workflow_dag_persistence_config_v1';

export const DEFAULT_PERSISTENCE_CONFIG: PersistenceEngineConfig = {
  backend: 'postgres_relational',
  autoSnapshotOnNodeComplete: true,
  autoSnapshotIntervalMs: 5000,
  walSyncEnabled: true,
  maxRetainedSnapshots: 15,
  durabilityLevel: 'wal_fsync'
};

/**
 * Calculates simple deterministic checksum for data integrity verification
 */
export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `crc32-${hex.toUpperCase()}`;
}

/**
 * Creates a complete state snapshot from the current execution context
 */
export function createDAGSnapshot(params: {
  checkpointName: string;
  triggerReason: DAGExecutionSnapshot['triggerReason'];
  workflowId: string;
  workflowTitle: string;
  backend: StateStoreBackend;
  taskStatuses: Map<string, TaskRuntimeStatus>;
  taskWorkerAssignments: Map<string, string>;
  workerPool: WorkerNodeState[];
  milestones: PlanMilestone[];
  elapsedTimeMs: number;
  globalVariables?: Record<string, any>;
  isCrashPoint?: boolean;
}): DAGExecutionSnapshot {
  const {
    checkpointName,
    triggerReason,
    workflowId,
    workflowTitle,
    backend,
    taskStatuses,
    taskWorkerAssignments,
    workerPool,
    milestones,
    elapsedTimeMs,
    globalVariables = {},
    isCrashPoint = false
  } = params;

  const allTasks: PlanTask[] = [];
  milestones.forEach(m => m.tasks.forEach(t => allTasks.push(t)));

  const taskStatusesObj: Record<string, TaskRuntimeStatus> = {};
  const taskWorkerAssignmentsObj: Record<string, string> = {};
  const taskOutputsObj: DAGExecutionContext['taskOutputs'] = {};

  const completedTaskIds: string[] = [];
  const pendingTaskIds: string[] = [];
  const runningTaskIds: string[] = [];

  allTasks.forEach(task => {
    const status = taskStatuses.get(task.id) || 'blocked';
    taskStatusesObj[task.id] = status;

    const assignedWorkerId = taskWorkerAssignments.get(task.id);
    if (assignedWorkerId) {
      taskWorkerAssignmentsObj[task.id] = assignedWorkerId;
    }

    if (status === 'completed') {
      completedTaskIds.push(task.id);
      taskOutputsObj[task.id] = {
        status: 'completed',
        resultSummary: `Executed ${task.actionType.toUpperCase()} on target "${task.filePath || 'repo'}" successfully.`,
        outputPayload: {
          exitCode: 0,
          artifactRef: `art-${task.id.toLowerCase()}-v1`,
          checksum: calculateChecksum(task.title + task.id)
        },
        completedAt: Date.now(),
        durationMs: (task.estimatedHours || 1) * 3600000,
        workerId: assignedWorkerId
      };
    } else if (status === 'running') {
      runningTaskIds.push(task.id);
      taskOutputsObj[task.id] = {
        status: 'running',
        resultSummary: `In-progress on worker ${assignedWorkerId || 'pool'}`,
        workerId: assignedWorkerId
      };
    } else {
      pendingTaskIds.push(task.id);
      taskOutputsObj[task.id] = {
        status
      };
    }
  });

  const executionContext: DAGExecutionContext = {
    workflowId,
    workflowTitle,
    globalVariables: {
      ...globalVariables,
      _dag_engine_version: '2.4.0',
      _snapshot_created_at: new Date().toISOString(),
      _total_milestones: milestones.length
    },
    taskOutputs: taskOutputsObj,
    completedTaskIds,
    pendingTaskIds,
    runningTaskIds,
    currentStageIndex: Math.floor(completedTaskIds.length / Math.max(1, Math.ceil(allTasks.length / 4))),
    elapsedTimeMs,
    totalTasks: allTasks.length
  };

  const snapshotId = `chk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  const rawPayloadForSize = JSON.stringify({
    snapshotId,
    checkpointName,
    taskStatusesObj,
    executionContext,
    workerPool
  });

  const checksum = calculateChecksum(rawPayloadForSize);
  const serializedSizeBytes = new TextEncoder().encode(rawPayloadForSize).length;

  return {
    id: snapshotId,
    checkpointName,
    timestamp: Date.now(),
    triggerReason,
    workflowId,
    backend,
    taskStatuses: taskStatusesObj,
    taskWorkerAssignments: taskWorkerAssignmentsObj,
    workerStates: workerPool.map(w => ({ ...w })),
    executionContext,
    checksum,
    serializedSizeBytes,
    isCrashPoint
  };
}

/**
 * Loads all persistent snapshots stored in browser storage
 */
export function loadPersistedSnapshots(): DAGExecutionSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse persisted DAG snapshots:', e);
    return [];
  }
}

/**
 * Saves a snapshot to local persistence with max retention pruning
 */
export function saveSnapshotToStorage(
  snapshot: DAGExecutionSnapshot, 
  maxRetention = 15
): DAGExecutionSnapshot[] {
  const existing = loadPersistedSnapshots();
  const updated = [snapshot, ...existing.filter(s => s.id !== snapshot.id)].slice(0, maxRetention);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save DAG snapshot to localStorage:', e);
  }
  return updated;
}

/**
 * Deletes a snapshot by ID
 */
export function deleteSnapshotFromStorage(snapshotId: string): DAGExecutionSnapshot[] {
  const existing = loadPersistedSnapshots();
  const updated = existing.filter(s => s.id !== snapshotId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete snapshot:', e);
  }
  return updated;
}

/**
 * Clear all snapshots
 */
export function clearAllSnapshotsFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear snapshots:', e);
  }
}

/**
 * Persistence configuration load/save
 */
export function loadPersistenceConfig(): PersistenceEngineConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_PERSISTENCE_CONFIG;
    return { ...DEFAULT_PERSISTENCE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PERSISTENCE_CONFIG;
  }
}

export function savePersistenceConfig(config: PersistenceEngineConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
}

/**
 * Generates ready-to-use persistence backend schemas, DDL, and transactional adapters
 */
export function generatePersistenceAdapterCode(
  backend: StateStoreBackend,
  snapshot?: DAGExecutionSnapshot
): string {
  if (backend === 'postgres_relational') {
    return `-- =================================================================
-- 🐘 PostgreSQL / Relational State Persistence & WAL Recovery Schema
-- =================================================================

-- 1. Workflow Execution Master Records Table
CREATE TABLE IF NOT EXISTS dag_workflow_executions (
    workflow_id VARCHAR(64) PRIMARY KEY,
    workflow_title VARCHAR(255) NOT NULL,
    current_status VARCHAR(32) NOT NULL DEFAULT 'running',
    total_nodes INT NOT NULL,
    completed_nodes INT NOT NULL DEFAULT 0,
    elapsed_time_ms BIGINT NOT NULL DEFAULT 0,
    global_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DAG Snapshot Checkpoints Table (Point-in-Time Recovery)
CREATE TABLE IF NOT EXISTS dag_execution_snapshots (
    snapshot_id VARCHAR(64) PRIMARY KEY,
    workflow_id VARCHAR(64) REFERENCES dag_workflow_executions(workflow_id) ON DELETE CASCADE,
    checkpoint_name VARCHAR(255) NOT NULL,
    trigger_reason VARCHAR(32) NOT NULL,
    task_statuses JSONB NOT NULL,
    task_outputs JSONB NOT NULL,
    worker_fleet_state JSONB NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    serialized_size_bytes INT NOT NULL,
    is_crash_point BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dag_snapshots_wf ON dag_execution_snapshots (workflow_id, created_at DESC);

-- 3. Atomic WAL Checkpoint Transaction Handler
CREATE OR REPLACE FUNCTION save_dag_checkpoint(
    p_workflow_id VARCHAR,
    p_checkpoint_name VARCHAR,
    p_trigger_reason VARCHAR,
    p_statuses JSONB,
    p_outputs JSONB,
    p_workers JSONB,
    p_checksum VARCHAR,
    p_size INT,
    p_is_crash BOOLEAN
) RETURNS VARCHAR AS $$
DECLARE
    v_snapshot_id VARCHAR := 'chk_' || encode(gen_random_bytes(6), 'hex');
BEGIN
    INSERT INTO dag_execution_snapshots (
        snapshot_id, workflow_id, checkpoint_name, trigger_reason,
        task_statuses, task_outputs, worker_fleet_state,
        checksum, serialized_size_bytes, is_crash_point
    ) VALUES (
        v_snapshot_id, p_workflow_id, p_checkpoint_name, p_trigger_reason,
        p_statuses, p_outputs, p_workers,
        p_checksum, p_size, p_is_crash
    );

    UPDATE dag_workflow_executions
    SET updated_at = NOW()
    WHERE workflow_id = p_workflow_id;

    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;`;
  }

  if (backend === 'redis_kv') {
    return `// =================================================================
// 🔴 Redis Key-Value & Stream WAL State Persistence Adapter
// =================================================================
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class RedisDAGStateStore {
  // Save atomic point-in-time snapshot with TTL caching
  static async saveSnapshot(snapshot: any, ttlSeconds = 86400 * 7) {
    const key = \`dag:snapshot:\${snapshot.workflowId}:\${snapshot.id}\`;
    const latestKey = \`dag:latest:\${snapshot.workflowId}\`;

    const pipeline = redis.pipeline();
    // Store JSON serialized snapshot
    pipeline.set(key, JSON.stringify(snapshot), 'EX', ttlSeconds);
    // Point latest checkpoint pointer
    pipeline.set(latestKey, snapshot.id);
    // Append to append-only WAL stream
    pipeline.xadd(
      \`dag:wal:\${snapshot.workflowId}\`,
      '*',
      'event', snapshot.triggerReason,
      'snapshotId', snapshot.id,
      'checksum', snapshot.checksum,
      'completedCount', snapshot.executionContext.completedTaskIds.length
    );

    await pipeline.exec();
    console.log(\`[Redis StateStore] Persisted snapshot \${snapshot.id} (\${snapshot.serializedSizeBytes} bytes)\`);
  }

  // Resume workflow from the latest clean checkpoint
  static async resumeFromLatest(workflowId: string) {
    const latestSnapshotId = await redis.get(\`dag:latest:\${workflowId}\`);
    if (!latestSnapshotId) throw new Error(\`No checkpoint found for workflow \${workflowId}\`);

    const raw = await redis.get(\`dag:snapshot:\${workflowId}:\${latestSnapshotId}\`);
    const snapshot = JSON.parse(raw!);
    console.log(\`[Redis StateStore] Resumed DAG from checkpoint: \${snapshot.checkpointName}\`);
    return snapshot;
  }
}`;
  }

  if (backend === 'firestore_doc') {
    return `// =================================================================
// 🔥 Google Cloud Firestore Document State Persistence Adapter
// =================================================================
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit } from 'firebase/firestore';

export async function persistDAGSnapshotToFirestore(db: any, snapshot: any) {
  const snapshotDocRef = doc(db, 'dag_workflows', snapshot.workflowId, 'snapshots', snapshot.id);
  const masterDocRef = doc(db, 'dag_workflows', snapshot.workflowId);

  await setDoc(snapshotDocRef, {
    ...snapshot,
    savedAt: new Date()
  });

  await setDoc(masterDocRef, {
    lastCheckpointId: snapshot.id,
    lastCheckpointName: snapshot.checkpointName,
    totalTasks: snapshot.executionContext.totalTasks,
    completedTasksCount: snapshot.executionContext.completedTaskIds.length,
    updatedAt: new Date()
  }, { merge: true });

  console.log(\`[Firestore] Snapshot \${snapshot.id} written successfully.\`);
}

export async function recoverLatestFirestoreSnapshot(db: any, workflowId: string) {
  const masterDoc = await getDoc(doc(db, 'dag_workflows', workflowId));
  if (!masterDoc.exists()) return null;
  const lastId = masterDoc.data()?.lastCheckpointId;
  const snapDoc = await getDoc(doc(db, 'dag_workflows', workflowId, 'snapshots', lastId));
  return snapDoc.exists() ? snapDoc.data() : null;
}`;
  }

  // SQLite WAL Default
  return `-- =================================================================
-- 🗄️ SQLite 3 WAL Mode Embedded State Persistence Script
-- =================================================================
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workflow_snapshots (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    checkpoint_name TEXT NOT NULL,
    trigger_reason TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    checksum TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    is_crash_point INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_time ON workflow_snapshots(workflow_id, created_at DESC);

-- Query to recover latest non-corrupted checkpoint after process termination:
SELECT payload_json 
FROM workflow_snapshots 
WHERE workflow_id = 'wf_plan_core' AND is_crash_point = 0
ORDER BY created_at DESC 
LIMIT 1;`;
}
