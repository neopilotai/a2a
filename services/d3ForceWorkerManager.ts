/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FORCE_WORKER_SCRIPT, WorkerNode, WorkerLink, WorkerClusterCenter } from '../workers/forceSimulationWorker';

export interface ForceWorkerConfig {
  nodes: WorkerNode[];
  links: WorkerLink[];
  width: number;
  height: number;
  layoutAlgorithm?: string;
  clusterCenters?: Record<string, WorkerClusterCenter> | null;
  onTick?: (nodes: { id: string; x: number; y: number; vx: number; vy: number; fx?: number | null; fy?: number | null }[], alpha: number) => void;
  onEnd?: (nodes: { id: string; x: number; y: number; vx: number; vy: number; fx?: number | null; fy?: number | null }[]) => void;
}

export class D3ForceWorkerManager {
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  constructor() {
    this.createWorker();
  }

  private createWorker() {
    try {
      const blob = new Blob([FORCE_WORKER_SCRIPT], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerUrl);
    } catch (err) {
      console.warn('Failed to spawn Blob Web Worker for force simulation:', err);
      this.worker = null;
    }
  }

  public init(config: ForceWorkerConfig) {
    if (!this.worker || this.isDestroyed) return;

    this.worker.postMessage({
      type: 'init',
      nodes: config.nodes,
      links: config.links,
      width: config.width,
      height: config.height,
      layoutAlgorithm: config.layoutAlgorithm || 'force',
      clusterCenters: config.clusterCenters || null
    });

    this.worker.onmessage = (e) => {
      if (this.isDestroyed) return;

      const { type, nodes, alpha } = e.data;
      if (type === 'tick') {
        if (config.onTick) {
          config.onTick(nodes, alpha);
        }
        // Loop simulation ticks asynchronously via worker
        if (alpha > 0.001) {
          this.scheduleNextStep();
        }
      } else if (type === 'end') {
        if (config.onEnd) {
          config.onEnd(nodes);
        }
      }
    };
  }

  private scheduleNextStep() {
    if (this.animFrameId) return;
    this.animFrameId = requestAnimationFrame(() => {
      this.animFrameId = null;
      if (this.worker && !this.isDestroyed) {
        this.worker.postMessage({ type: 'step', count: 2 });
      }
    });
  }

  public handleDrag(id: string, fx: number | null, fy: number | null, alpha = 0.3) {
    if (!this.worker || this.isDestroyed) return;
    this.worker.postMessage({
      type: 'drag',
      id,
      fx,
      fy,
      alpha
    });
  }

  public reheat(alpha = 0.3) {
    if (!this.worker || this.isDestroyed) return;
    this.worker.postMessage({
      type: 'heat',
      alpha
    });
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.worker && !this.isDestroyed) {
      this.worker.postMessage({ type: 'stop' });
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = null;
    }
  }
}
