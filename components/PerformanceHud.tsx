import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Maximize2, 
  Minimize2, 
  Play, 
  Gauge, 
  Layers, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react';

interface WebWorkerStatus {
  id: string;
  name: string;
  type: 'd3-force' | 'ast-parser' | 'graph-layout' | 'patch-compiler';
  status: 'idle' | 'busy' | 'syncing';
  tasksProcessed: number;
  lastActiveMs: number;
}

export const PerformanceHud: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fps, setFps] = useState(60);
  const [frameTimeMs, setFrameTimeMs] = useState(16.6);
  const [fpsHistory, setFpsHistory] = useState<number[]>(Array(24).fill(60));
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressProgress, setStressProgress] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<{ used: number; total: number } | null>(null);

  // Web Worker status states
  const [workers, setWorkers] = useState<WebWorkerStatus[]>([
    { id: 'ww-1', name: 'D3 Topological Force Worker', type: 'd3-force', status: 'idle', tasksProcessed: 1240, lastActiveMs: 4 },
    { id: 'ww-2', name: 'AST Codemap Parser Worker', type: 'ast-parser', status: 'idle', tasksProcessed: 890, lastActiveMs: 12 },
    { id: 'ww-3', name: 'Graph Layout Matrix Worker', type: 'graph-layout', status: 'idle', tasksProcessed: 450, lastActiveMs: 8 },
    { id: 'ww-4', name: 'Patch Diff Compiler Worker', type: 'patch-compiler', status: 'idle', tasksProcessed: 210, lastActiveMs: 15 }
  ]);

  // FPS calculation ref
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    let lastFpsUpdate = performance.now();

    const loop = (now: number) => {
      frameCountRef.current++;
      const delta = now - lastTimeRef.current;
      
      if (now - lastFpsUpdate >= 500) { // Update twice a second
        const currentFps = Math.min(60, Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdate)));
        const currentFrameTime = parseFloat((1000 / Math.max(1, currentFps)).toFixed(1));

        setFps(currentFps);
        setFrameTimeMs(currentFrameTime);
        setFpsHistory(prev => [...prev.slice(1), currentFps]);

        // Memory usage if supported by browser
        if ((performance as any).memory) {
          const mem = (performance as any).memory;
          setMemoryUsage({
            used: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
            total: Math.round(mem.jsHeapSizeLimit / (1024 * 1024))
          });
        } else {
          // Fallback simulation
          setMemoryUsage({ used: 42 + Math.floor(Math.random() * 8), total: 2048 });
        }

        frameCountRef.current = 0;
        lastFpsUpdate = now;
      }

      lastTimeRef.current = now;
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Simulate D3 Topology Stress Test
  const handleTriggerStressTest = () => {
    if (isStressTesting) return;

    setIsStressTesting(true);
    setStressProgress(0);

    // Set D3 worker to busy
    setWorkers(prev => prev.map(w => 
      w.type === 'd3-force' || w.type === 'graph-layout'
        ? { ...w, status: 'busy', tasksProcessed: w.tasksProcessed + 150 }
        : w
    ));

    // Simulate heavy calculation ticks over 3 seconds
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = Math.min(100, Math.round((step / 15) * 100));
      setStressProgress(progress);

      // Artificially simulate frame jitter during D3 force simulation recalculations
      const simulatedJitterFps = Math.max(24, Math.min(60, 60 - Math.floor(Math.sin(step) * 22)));
      setFps(simulatedJitterFps);
      setFpsHistory(prev => [...prev.slice(1), simulatedJitterFps]);

      if (step >= 15) {
        clearInterval(interval);
        setIsStressTesting(false);
        setWorkers(prev => prev.map(w => ({ ...w, status: 'idle' })));
      }
    }, 200);
  };

  // Color helper based on FPS
  const getFpsColor = (val: number) => {
    if (val >= 55) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    if (val >= 35) return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
  };

  const getFpsSparklineColor = (val: number) => {
    if (val >= 55) return '#10b981'; // emerald
    if (val >= 35) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  const activeWorkerCount = workers.filter(w => w.status === 'busy').length;

  return (
    <div className="fixed bottom-6 left-6 z-40 font-mono text-xs">
      {!isExpanded ? (
        /* Floating Compact HUD Pill */
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-white/15 backdrop-blur-xl shadow-2xl transition-all group hover:border-violet-500/50 hover:scale-[1.02]"
        >
          {/* FPS Badge */}
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-violet-400 group-hover:rotate-12 transition-transform" />
            <span className={`px-2 py-0.5 rounded-md font-bold border ${getFpsColor(fps)}`}>
              {fps} FPS
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Web Worker Status Indicator */}
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">
              Workers: <strong className="text-white">{activeWorkerCount > 0 ? `${activeWorkerCount} Active` : 'Idle (4)'}</strong>
            </span>
            {activeWorkerCount > 0 ? (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </div>

          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors ml-1" />
        </button>
      ) : (
        /* Expanded HUD Panel */
        <div className="w-80 md:w-96 rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {/* HUD Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">Performance & Worker HUD</h3>
                <p className="text-[10px] text-slate-400 font-sans">Real-time D3 topological telemetry</p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* FPS & Frame Latency Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Real-Time FPS</span>
                <Gauge className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold font-mono ${fps >= 55 ? 'text-emerald-400' : fps >= 35 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {fps}
                </span>
                <span className="text-[10px] text-slate-400">/ 60 hz</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Frame Latency</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">
                  {frameTimeMs}
                </span>
                <span className="text-[10px] text-slate-400">ms</span>
              </div>
            </div>
          </div>

          {/* Live FPS Sparkline Graph */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>FPS Render History (Last 24 ticks)</span>
              <span className="text-emerald-400 font-bold">Stable</span>
            </div>
            <div className="h-10 w-full flex items-end gap-1 pt-1">
              {fpsHistory.map((val, idx) => {
                const heightPct = Math.max(15, Math.min(100, (val / 60) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t transition-all duration-300"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: getFpsSparklineColor(val),
                      opacity: 0.8
                    }}
                    title={`${val} FPS`}
                  />
                );
              })}
            </div>
          </div>

          {/* Web Worker Threads */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Web Worker Threads</span>
              </div>
              <span className="text-[10px] text-slate-400">4 Threads Active</span>
            </div>

            <div className="space-y-1.5">
              {workers.map(w => (
                <div
                  key={w.id}
                  className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${w.status === 'busy' ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span className="text-slate-200 truncate">{w.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400 font-mono">
                    <span>{w.tasksProcessed} msg</span>
                    <span className={`px-1.5 py-0.5 rounded ${w.status === 'busy' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'bg-white/5 text-slate-400'}`}>
                      {w.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D3 Simulation Stress Test Control */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">D3 Topological Stress Test</span>
              {isStressTesting && (
                <span className="text-[10px] text-amber-400 font-mono font-bold animate-pulse">
                  Testing... {stressProgress}%
                </span>
              )}
            </div>

            <button
              onClick={handleTriggerStressTest}
              disabled={isStressTesting}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isStressTesting
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 cursor-not-allowed'
                  : 'bg-violet-600/20 hover:bg-violet-600/30 border-violet-500/40 text-violet-300 hover:text-white'
              }`}
            >
              {isStressTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating D3 Force Physics Burst...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Benchmark D3 Graph Workers</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
