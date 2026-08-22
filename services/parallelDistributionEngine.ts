/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  PlanMilestone, 
  PlanTask, 
  ParallelDistributionAnalysis, 
  ParallelBranchPartition, 
  ConcurrentStageWave,
  MessageBrokerType,
  WorkerNodeState,
  ExecutionEventLog
} from '../types';

const BRANCH_PALETTE = [
  { color: '#8b5cf6', name: 'Alpha Core Branch', light: '#ddd6fe' },
  { color: '#06b6d4', name: 'Beta Service Branch', light: '#cffafe' },
  { color: '#10b981', name: 'Gamma Data Branch', light: '#d1fae5' },
  { color: '#f59e0b', name: 'Delta Integration Branch', light: '#fef3c7' },
  { color: '#ec4899', name: 'Epsilon Verification Branch', light: '#fce7f3' },
  { color: '#3b82f6', name: 'Zeta Client Branch', light: '#dbeafe' },
];

/**
 * Analyzes a collection of plan milestones / tasks and extracts full DAG parallel distribution metrics.
 */
export function analyzeParallelDistribution(milestones: PlanMilestone[]): ParallelDistributionAnalysis {
  const allTasks: PlanTask[] = [];
  milestones.forEach(m => {
    m.tasks.forEach(t => allTasks.push(t));
  });

  if (allTasks.length === 0) {
    return {
      concurrentStages: [],
      branches: [],
      totalTasks: 0,
      criticalPathTaskIds: [],
      serialDurationHours: 0,
      parallelDurationHours: 0,
      theoreticalSpeedup: 1,
      concurrencyEfficiency: 1,
      optimalWorkerCount: 1
    };
  }

  const taskMap = new Map<string, PlanTask>();
  allTasks.forEach(t => taskMap.set(t.id, t));

  // Build adjacency maps
  const inEdges = new Map<string, string[]>(); // target -> [sources] (dependencies)
  const outEdges = new Map<string, string[]>(); // source -> [targets] (dependents)

  allTasks.forEach(t => {
    inEdges.set(t.id, [...(t.dependencies || []).filter(depId => taskMap.has(depId))]);
    outEdges.set(t.id, []);
  });

  allTasks.forEach(t => {
    const deps = inEdges.get(t.id) || [];
    deps.forEach(depId => {
      outEdges.get(depId)?.push(t.id);
    });
  });

  // 1. Calculate topological depth / level (Wave decomposition)
  const depthMap = new Map<string, number>();
  const calculateDepth = (taskId: string, visited = new Set<string>()): number => {
    if (depthMap.has(taskId)) return depthMap.get(taskId)!;
    if (visited.has(taskId)) return 0; // Avoid cycles
    visited.add(taskId);

    const deps = inEdges.get(taskId) || [];
    if (deps.length === 0) {
      depthMap.set(taskId, 0);
      return 0;
    }

    let maxParentDepth = 0;
    for (const depId of deps) {
      const d = calculateDepth(depId, new Set(visited));
      if (d + 1 > maxParentDepth) {
        maxParentDepth = d + 1;
      }
    }

    depthMap.set(taskId, maxParentDepth);
    return maxParentDepth;
  };

  allTasks.forEach(t => calculateDepth(t.id));

  // Group into concurrent stage waves
  const stageMap = new Map<number, string[]>();
  let maxStage = 0;
  depthMap.forEach((stage, taskId) => {
    if (!stageMap.has(stage)) stageMap.set(stage, []);
    stageMap.get(stage)!.push(taskId);
    if (stage > maxStage) maxStage = stage;
  });

  const concurrentStages: ConcurrentStageWave[] = [];
  for (let i = 0; i <= maxStage; i++) {
    const taskIds = stageMap.get(i) || [];
    if (taskIds.length > 0) {
      const stageDuration = taskIds.reduce((max, id) => {
        const h = taskMap.get(id)?.estimatedHours || 2;
        return Math.max(max, h);
      }, 0);

      concurrentStages.push({
        stageIndex: i,
        taskIds,
        maxParallelism: taskIds.length,
        estimatedDurationHours: stageDuration
      });
    }
  }

  // 2. Identify Disjoint / Independent Branch Partitions
  // Connect components via undirected connectivity graph ignoring edge directions
  const visitedForBranches = new Set<string>();
  const branchPartitions: ParallelBranchPartition[] = [];
  let branchCounter = 0;

  // Connected components / branch clustering
  allTasks.forEach(rootTask => {
    if (visitedForBranches.has(rootTask.id)) return;

    const componentTaskIds: string[] = [];
    const queue = [rootTask.id];
    visitedForBranches.add(rootTask.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      componentTaskIds.push(curr);

      const neighbors = [
        ...(inEdges.get(curr) || []),
        ...(outEdges.get(curr) || [])
      ];

      for (const n of neighbors) {
        if (!visitedForBranches.has(n)) {
          visitedForBranches.add(n);
          queue.push(n);
        }
      }
    }

    // Determine entry and exit tasks for this branch
    const entryTaskIds = componentTaskIds.filter(id => (inEdges.get(id) || []).length === 0);
    const exitTaskIds = componentTaskIds.filter(id => (outEdges.get(id) || []).length === 0);

    const serialHours = componentTaskIds.reduce((sum, id) => sum + (taskMap.get(id)?.estimatedHours || 2), 0);
    
    // Sub-stage duration for branch
    const branchDepths = componentTaskIds.map(id => depthMap.get(id) || 0);
    const uniqueDepths = new Set(branchDepths);
    const parallelHours = Math.max(1, Math.round(serialHours / Math.max(1, uniqueDepths.size) * 10) / 10);

    const palette = BRANCH_PALETTE[branchCounter % BRANCH_PALETTE.length];
    branchCounter++;

    branchPartitions.push({
      id: `branch-${branchCounter}`,
      name: `${palette.name} (${componentTaskIds.length} tasks)`,
      taskIds: componentTaskIds,
      entryTaskIds,
      exitTaskIds,
      concurrencyLevel: Math.max(1, Math.floor(componentTaskIds.length / Math.max(1, uniqueDepths.size))),
      estimatedSerialHours: serialHours,
      estimatedParallelHours: parallelHours,
      speedupFactor: Math.round((serialHours / parallelHours) * 10) / 10,
      color: palette.color,
      isCriticalPath: false
    });
  });

  // If there is only 1 massive connected component, partition by root entry branches
  let finalBranches = branchPartitions;
  if (branchPartitions.length === 1 && allTasks.length > 3) {
    const entryTasks = allTasks.filter(t => (inEdges.get(t.id) || []).length === 0);
    if (entryTasks.length > 1) {
      finalBranches = [];
      entryTasks.forEach((entry, idx) => {
        // Collect descendants
        const descendants = new Set<string>([entry.id]);
        const q = [entry.id];
        while (q.length > 0) {
          const curr = q.shift()!;
          const children = outEdges.get(curr) || [];
          children.forEach(c => {
            if (!descendants.has(c)) {
              descendants.add(c);
              q.push(c);
            }
          });
        }

        const taskIds = Array.from(descendants);
        const serialHours = taskIds.reduce((sum, id) => sum + (taskMap.get(id)?.estimatedHours || 2), 0);
        const palette = BRANCH_PALETTE[idx % BRANCH_PALETTE.length];

        finalBranches.push({
          id: `branch-part-${idx + 1}`,
          name: `Pipeline Branch ${idx + 1}: ${entry.title.slice(0, 24)}...`,
          taskIds,
          entryTaskIds: [entry.id],
          exitTaskIds: taskIds.filter(id => (outEdges.get(id) || []).length === 0),
          concurrencyLevel: Math.max(1, Math.ceil(taskIds.length / 2)),
          estimatedSerialHours: serialHours,
          estimatedParallelHours: Math.max(1, Math.round((serialHours / 2.2) * 10) / 10),
          speedupFactor: 2.2,
          color: palette.color,
          isCriticalPath: false
        });
      });
    }
  }

  // 3. Compute Critical Path (Longest Path in DAG)
  const memoLongest = new Map<string, { path: string[]; duration: number }>();

  const findLongestPath = (taskId: string): { path: string[]; duration: number } => {
    if (memoLongest.has(taskId)) return memoLongest.get(taskId)!;

    const currentDuration = taskMap.get(taskId)?.estimatedHours || 2;
    const children = outEdges.get(taskId) || [];

    if (children.length === 0) {
      const res = { path: [taskId], duration: currentDuration };
      memoLongest.set(taskId, res);
      return res;
    }

    let maxChildPath: string[] = [];
    let maxChildDuration = 0;

    for (const childId of children) {
      const childRes = findLongestPath(childId);
      if (childRes.duration > maxChildDuration) {
        maxChildDuration = childRes.duration;
        maxChildPath = childRes.path;
      }
    }

    const result = {
      path: [taskId, ...maxChildPath],
      duration: currentDuration + maxChildDuration
    };
    memoLongest.set(taskId, result);
    return result;
  };

  const rootTasks = allTasks.filter(t => (inEdges.get(t.id) || []).length === 0);
  let globalCriticalPath: string[] = [];
  let maxPathDuration = 0;

  rootTasks.forEach(root => {
    const res = findLongestPath(root.id);
    if (res.duration > maxPathDuration) {
      maxPathDuration = res.duration;
      globalCriticalPath = res.path;
    }
  });

  // Mark critical path on branches
  const criticalSet = new Set(globalCriticalPath);
  finalBranches.forEach(b => {
    const hasCritical = b.taskIds.some(id => criticalSet.has(id));
    b.isCriticalPath = hasCritical;
  });

  // Overall timing metrics
  const totalSerialHours = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 2), 0);
  const maxConcurrency = Math.max(...concurrentStages.map(s => s.maxParallelism), 1);
  const optimalWorkerCount = Math.min(8, Math.max(2, Math.min(maxConcurrency, Math.ceil(allTasks.length / 3))));

  // Critical path duration acts as the lower bound of parallel execution
  const parallelDurationHours = Math.max(maxPathDuration, Math.round((totalSerialHours / optimalWorkerCount) * 1.25 * 10) / 10);
  const theoreticalSpeedup = totalSerialHours > 0 && parallelDurationHours > 0 
    ? Math.round((totalSerialHours / parallelDurationHours) * 10) / 10 
    : 1;

  const concurrencyEfficiency = totalSerialHours > 0 
    ? Math.min(100, Math.round((totalSerialHours / (parallelDurationHours * optimalWorkerCount)) * 100))
    : 100;

  return {
    concurrentStages,
    branches: finalBranches,
    totalTasks: allTasks.length,
    criticalPathTaskIds: globalCriticalPath,
    serialDurationHours: totalSerialHours,
    parallelDurationHours,
    theoreticalSpeedup: Math.max(1, theoreticalSpeedup),
    concurrencyEfficiency: Math.max(10, concurrencyEfficiency),
    optimalWorkerCount
  };
}

/**
 * Initializes a pool of worker nodes
 */
export function createWorkerPool(count: number, brokerType: MessageBrokerType): WorkerNodeState[] {
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#6366f1'];
  const pool: WorkerNodeState[] = [];

  for (let i = 1; i <= count; i++) {
    let name = `Worker-${i}`;
    let type: WorkerNodeState['type'] = 'thread';

    if (brokerType === 'rabbitmq') {
      name = `AMQP-Consumer-${i} [queue:task.events]`;
      type = 'process';
    } else if (brokerType === 'kafka') {
      name = `Kafka-Consumer-${i} [partition:p${(i - 1) % 4}]`;
      type = 'node';
    } else if (brokerType === 'kubernetes_matrix') {
      name = `k8s-pod-job-${i}`;
      type = 'container';
    } else if (brokerType === 'redis_bullmq') {
      name = `BullMQ-Worker-${i}`;
      type = 'process';
    }

    pool.push({
      id: `worker-${i}`,
      name,
      type,
      status: 'idle',
      currentTaskId: null,
      taskTitle: undefined,
      progress: 0,
      tasksCompleted: 0,
      totalTimeSpentMs: 0,
      color: colors[(i - 1) % colors.length]
    });
  }

  return pool;
}

/**
 * Generates ready-to-use production orchestration boilerplate
 */
export function generateOrchestrationSnippet(
  broker: MessageBrokerType, 
  milestones: PlanMilestone[], 
  workerCount: number
): string {
  const allTasks: PlanTask[] = [];
  milestones.forEach(m => m.tasks.forEach(t => allTasks.push(t)));

  if (broker === 'rabbitmq') {
    return `// =================================================================
// 🐇 RabbitMQ + Celery/AMQP Parallel Task Distribution Engine
// =================================================================
import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'workflow.dag.topic';
const TASK_QUEUE = 'tasks.parallel.workqueue';

export async function bootstrapRabbitMQWorkerPool(workerCount = ${workerCount}) {
  const conn = await amqplib.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();

  // Assert direct exchange and fair-dispatch prefetch
  await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  await ch.assertQueue(TASK_QUEUE, { durable: true, maxPriority: 10 });
  await ch.prefetch(1); // Fair distribution across parallel consumers

  console.log(\`[RabbitMQ] Spawned \${workerCount} parallel consumers on \${TASK_QUEUE}\`);

  // DAG Task Dependency Matrix (${allTasks.length} Partitioned Nodes)
  const taskGraph = ${JSON.stringify(
    allTasks.slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      dependencies: t.dependencies || [],
      action: t.actionType
    })),
    null,
    2
  )};

  // Worker Consumer Loop
  ch.consume(TASK_QUEUE, async (msg) => {
    if (!msg) return;
    const taskPayload = JSON.parse(msg.content.toString());
    console.log(\`[Worker Thread \${process.pid}] Processing Task: \${taskPayload.title}\`);
    
    // Simulate non-blocking async work
    await new Promise(r => setTimeout(r, 1200));
    ch.ack(msg);
  });
}`;
  }

  if (broker === 'kafka') {
    return `// =================================================================
// ⚡ Apache Kafka Partitioned Topic DAG Stream Processor
// =================================================================
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'workflow-dag-engine',
  brokers: ['localhost:9092']
});

const TOPIC = 'workflow.dag.partitions';

export async function runKafkaParallelConsumers(concurrency = ${workerCount}) {
  const consumer = kafka.consumer({ groupId: 'dag-worker-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  console.log(\`[Kafka] Consumer group connected with \${concurrency} partition lanes\`);

  await consumer.run({
    partitionsConsumedConcurrently: concurrency,
    eachMessage: async ({ topic, partition, message }) => {
      const task = JSON.parse(message.value?.toString() || '{}');
      console.log(\`[Partition \${partition}] Executing Task '\${task.title}'\`);
      // Resolve downstream dependencies and trigger subsequent stage events
    }
  });
}`;
  }

  if (broker === 'kubernetes_matrix') {
    return `# =================================================================
# ☸️ Kubernetes Parallel Job Matrix DAG Manifest
# =================================================================
apiVersion: batch/v1
kind: Job
metadata:
  name: workflow-dag-parallel-executor
spec:
  parallelism: ${workerCount}
  completions: ${allTasks.length}
  backoffLimit: 3
  template:
    spec:
      containers:
      - name: dag-worker
        image: node:20-alpine
        command: ["node", "dist/worker.cjs"]
        env:
        - name: PARALLEL_WORKERS
          value: "${workerCount}"
        - name: DAG_STAGE_WAVE
          value: "auto"
        resources:
          limits:
            cpu: "1000m"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
      restartPolicy: OnFailure`;
  }

  // In-Memory Worker Pool default
  return `// =================================================================
// 🧵 Node.js Worker Pool (p-limit & Worker Threads) DAG Dispatcher
// =================================================================
import pLimit from 'p-limit';
import { Worker } from 'worker_threads';

export async function executeParallelDAG(taskGraph, maxConcurrency = ${workerCount}) {
  const limit = pLimit(maxConcurrency);
  const completedTaskIds = new Set();
  const activePromises = new Map();

  async function runTask(task) {
    // 1. Wait for all prerequisite dependencies to complete concurrently
    if (task.dependencies && task.dependencies.length > 0) {
      await Promise.all(
        task.dependencies.map(depId => activePromises.get(depId))
      );
    }

    // 2. Dispatch task onto thread pool queue
    return limit(async () => {
      console.log(\`⚡ [Thread Pool] Starting: \${task.title}\`);
      const start = Date.now();
      // Execute task action...
      completedTaskIds.add(task.id);
      return { taskId: task.id, durationMs: Date.now() - start };
    });
  }

  for (const task of taskGraph) {
    activePromises.set(task.id, runTask(task));
  }

  return Promise.all(Array.from(activePromises.values()));
}`;
}
