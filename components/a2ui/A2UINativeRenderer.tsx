/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  A2UISchema, 
  A2UIComponent, 
  A2UIAction, 
  A2UIActionEvent, 
  A2UIPlatform,
  A2UIStyleOverrides
} from '../../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Zap, 
  Sliders, 
  Play, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  HardDrive, 
  Cpu, 
  Activity, 
  Database, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  FileCode, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Lock,
  Radio,
  Calendar,
  Tag,
  Clock,
  ListTodo
} from 'lucide-react';

interface A2UINativeRendererProps {
  schema: A2UISchema;
  platform?: A2UIPlatform;
  onActionEvent?: (event: A2UIActionEvent) => void;
  className?: string;
  isInteractive?: boolean;
}

export const A2UINativeRenderer: React.FC<A2UINativeRendererProps> = ({
  schema,
  platform = 'web',
  onActionEvent,
  className = '',
  isInteractive = true
}) => {
  // Local state container initialized from schema
  const [componentState, setComponentState] = useState<Record<string, any>>(
    schema.initialState || {}
  );

  // Active confirmation modal state
  const [activeConfirmation, setActiveConfirmation] = useState<{
    action: A2UIAction;
    componentId: string;
  } | null>(null);

  // Synchronize state when schema changes
  useEffect(() => {
    if (schema.initialState) {
      setComponentState(schema.initialState);
    }
  }, [schema.id, schema.initialState]);

  // Handler for state mutations
  const updateState = useCallback((key: string, value: any) => {
    setComponentState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handler for component action dispatches
  const handleAction = useCallback((action: A2UIAction, componentId: string, directPayload?: any) => {
    if (!isInteractive) return;

    // Check if action requires user confirmation first
    if (action.confirmation && !activeConfirmation) {
      setActiveConfirmation({ action, componentId });
      return;
    }

    // Execute state modifications if declared
    if (action.type === 'update_state' && action.stateKey) {
      const val = action.stateValue !== undefined ? action.stateValue : directPayload;
      updateState(action.stateKey, val);
    } else if (action.type === 'reset_state') {
      setComponentState(schema.initialState || {});
    } else if (action.type === 'copy_to_clipboard' && action.payload?.text) {
      navigator.clipboard?.writeText(action.payload.text);
    }

    // Dispatch event to parent listener (e.g. Agent runtime)
    const event: A2UIActionEvent = {
      actionId: action.actionId,
      type: action.type,
      componentId,
      timestamp: Date.now(),
      payload: { ...action.payload, ...(directPayload !== undefined ? { directValue: directPayload } : {}) },
      stateSnapshot: componentState
    };

    onActionEvent?.(event);
    setActiveConfirmation(null);
  }, [isInteractive, activeConfirmation, componentState, onActionEvent, schema.initialState, updateState]);

  // Evaluates conditional visibility (e.g. "$state.activeTab === 'metrics'")
  const evaluateCondition = useCallback((condition?: string): boolean => {
    if (!condition) return true;
    try {
      if (condition.startsWith('$state.')) {
        const parts = condition.slice(7).split('===');
        if (parts.length === 2) {
          const key = parts[0].trim();
          const targetVal = parts[1].trim().replace(/['"]/g, '');
          return String(componentState[key]) === targetVal;
        }
        const notParts = condition.slice(7).split('!==');
        if (notParts.length === 2) {
          const key = notParts[0].trim();
          const targetVal = notParts[1].trim().replace(/['"]/g, '');
          return String(componentState[key]) !== targetVal;
        }
        const key = condition.slice(7).trim();
        return !!componentState[key];
      }
      return true;
    } catch {
      return true;
    }
  }, [componentState]);

  // Style builder for native layout styling
  const resolveStyles = (style?: A2UIStyleOverrides): string => {
    if (!style) return '';
    const classes: string[] = [];

    // Padding
    if (style.padding === 'xs') classes.push('p-2');
    else if (style.padding === 'sm') classes.push('p-3');
    else if (style.padding === 'md') classes.push('p-4');
    else if (style.padding === 'lg') classes.push('p-6');
    else if (style.padding === 'xl') classes.push('p-8');

    // Gap
    if (style.gap === 'xs') classes.push('gap-2');
    else if (style.gap === 'sm') classes.push('gap-3');
    else if (style.gap === 'md') classes.push('gap-4');
    else if (style.gap === 'lg') classes.push('gap-6');

    // Align & Justify
    if (style.align === 'center') classes.push('items-center');
    else if (style.align === 'start') classes.push('items-start');
    else if (style.align === 'end') classes.push('items-end');
    else if (style.align === 'stretch') classes.push('items-stretch');

    if (style.justify === 'between') classes.push('justify-between');
    else if (style.justify === 'center') classes.push('justify-center');
    else if (style.justify === 'end') classes.push('justify-end');

    // Background & Borders
    if (style.bgVariant === 'surface') classes.push('bg-slate-900/90 border border-white/10');
    else if (style.bgVariant === 'subtle') classes.push('bg-slate-950/60 border border-white/5');
    else if (style.bgVariant === 'elevated') classes.push('bg-slate-800/90 border border-white/15 shadow-xl');
    else if (style.bgVariant === 'glass') classes.push('bg-slate-950/40 backdrop-blur-md border border-white/10');
    else if (style.bgVariant === 'highlight') classes.push('bg-indigo-950/30 border border-indigo-500/30');

    // Rounded
    if (style.rounded === 'sm') classes.push('rounded-md');
    else if (style.rounded === 'md') classes.push('rounded-lg');
    else if (style.rounded === 'lg') classes.push('rounded-xl');
    else if (style.rounded === 'xl') classes.push('rounded-2xl');
    else if (style.rounded === 'full') classes.push('rounded-full');

    return classes.join(' ');
  };

  // -------------------------------------------------------------
  // Recursive Component Renderer
  // -------------------------------------------------------------
  const renderNode = (node: A2UIComponent): React.ReactNode => {
    if (!evaluateCondition(node.condition)) return null;

    const props = node.props || {};
    const styleClass = resolveStyles(node.style);

    switch (node.type) {
      // ---------------- Containers & Layouts ----------------
      case 'container':
        return (
          <div key={node.id} className={`w-full flex flex-col ${styleClass}`}>
            {Array.isArray(node.children) && node.children.map(child => renderNode(child))}
          </div>
        );

      case 'card':
        return (
          <div key={node.id} className={`w-full rounded-xl border border-white/10 bg-slate-900/60 p-4 transition-all hover:border-white/20 ${styleClass}`}>
            {props.title && (
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  {props.icon === 'Sliders' && <Sliders className="w-4 h-4 text-indigo-400" />}
                  {props.icon === 'HardDrive' && <HardDrive className="w-4 h-4 text-sky-400" />}
                  {props.icon === 'ShieldCheck' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                  {props.icon === 'Zap' && <Zap className="w-4 h-4 text-amber-400" />}
                  <h4 className="text-sm font-semibold text-slate-100">{props.title}</h4>
                </div>
                {props.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {props.badge}
                  </span>
                )}
              </div>
            )}
            <div className="space-y-3">
              {Array.isArray(node.children) && node.children.map(child => renderNode(child))}
            </div>
          </div>
        );

      case 'grid': {
        const cols = props.columns || node.style?.columns || 2;
        const gridColsClass = cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2';
        return (
          <div key={node.id} className={`grid ${gridColsClass} ${styleClass}`}>
            {Array.isArray(node.children) && node.children.map(child => renderNode(child))}
          </div>
        );
      }

      case 'stack': {
        const isRow = node.style?.direction === 'row';
        return (
          <div key={node.id} className={`flex ${isRow ? 'flex-row' : 'flex-col'} ${styleClass}`}>
            {Array.isArray(node.children) && node.children.map(child => renderNode(child))}
          </div>
        );
      }

      case 'banner': {
        const status = props.status || 'info';
        const bg = status === 'healthy' || status === 'resolved' 
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          : status === 'warning'
          ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          : status === 'danger'
          ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300';

        return (
          <div key={node.id} className={`w-full p-4 rounded-xl border flex items-start justify-between gap-3 ${bg} ${styleClass}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-black/30 mt-0.5">
                {status === 'healthy' || status === 'resolved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : status === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{props.title}</h3>
                {props.subtitle && <p className="text-xs text-slate-300 mt-0.5">{props.subtitle}</p>}
              </div>
            </div>
            {props.tag && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/10 text-white">
                {props.tag}
              </span>
            )}
          </div>
        );
      }

      case 'section_header':
        return (
          <div key={node.id} className={`w-full flex items-start justify-between pb-2 border-b border-white/10 ${styleClass}`}>
            <div>
              <h3 className="text-base font-bold text-white">{props.title}</h3>
              {props.description && <p className="text-xs text-slate-400 mt-0.5">{props.description}</p>}
            </div>
            {props.badgeText && (
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {props.badgeText}
              </span>
            )}
          </div>
        );

      case 'divider':
        return <hr key={node.id} className="border-t border-white/10 my-2" />;

      // ---------------- Interactive Controls & Inputs ----------------
      case 'slider': {
        const val = componentState[props.valueKey] !== undefined ? componentState[props.valueKey] : props.min || 0;
        return (
          <div key={node.id} className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-medium">{props.label}</label>
              <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {val}{props.unit || ''}
              </span>
            </div>
            <input
              type="range"
              min={props.min || 0}
              max={props.max || 100}
              step={props.step || 1}
              value={val}
              disabled={!isInteractive}
              onChange={(e) => {
                const newVal = Number(e.target.value);
                updateState(props.valueKey, newVal);
                if (node.action) handleAction(node.action, node.id, newVal);
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{props.min || 0}{props.unit || ''}</span>
              <span>{props.max || 100}{props.unit || ''}</span>
            </div>
          </div>
        );
      }

      case 'toggle': {
        const checked = !!componentState[props.valueKey];
        return (
          <div key={node.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">{props.label}</span>
              {props.description && <span className="text-[10px] text-slate-400">{props.description}</span>}
            </div>
            <button
              type="button"
              disabled={!isInteractive}
              onClick={() => {
                const nextChecked = !checked;
                updateState(props.valueKey, nextChecked);
                if (node.action) handleAction(node.action, node.id, nextChecked);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                checked ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        );
      }

      case 'action_button':
      case 'button': {
        const isPrimary = props.variant === 'primary';
        const isDanger = props.variant === 'danger';
        const isSecondary = props.variant === 'secondary';
        const isGhost = props.variant === 'ghost';

        const btnClass = isPrimary
          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
          : isDanger
          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
          : isSecondary
          ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
          : 'hover:bg-white/5 text-slate-400 hover:text-white';

        return (
          <button
            key={node.id}
            disabled={!isInteractive}
            onClick={() => {
              if (node.action) handleAction(node.action, node.id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${btnClass} ${styleClass}`}
          >
            {props.icon === 'Zap' && <Zap className="w-3.5 h-3.5" />}
            {props.icon === 'Play' && <Play className="w-3.5 h-3.5 fill-current" />}
            {props.icon === 'CheckCircle2' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {props.icon === 'ShieldAlert' && <ShieldAlert className="w-3.5 h-3.5" />}
            {props.icon === 'Sparkles' && <Sparkles className="w-3.5 h-3.5" />}
            {props.icon === 'Copy' && <Copy className="w-3.5 h-3.5" />}
            <span>{props.label || 'Action'}</span>
          </button>
        );
      }

      // ---------------- Metrics & Visualizations ----------------
      case 'kpi_grid':
        return (
          <div key={node.id} className={`grid grid-cols-2 md:grid-cols-${props.columns || 4} gap-3 ${styleClass}`}>
            {(props.items || []).map((kpi: any) => (
              <div key={kpi.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-slate-400">{kpi.label}</span>
                <div className="my-1">
                  <span className="text-lg font-bold font-mono text-white">{kpi.value}</span>
                </div>
                {(kpi.change || kpi.subtext) && (
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    {kpi.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                    {kpi.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-sky-400" />}
                    <span className={kpi.status === 'good' ? 'text-emerald-400' : kpi.status === 'danger' ? 'text-rose-400' : 'text-slate-400'}>
                      {kpi.change || kpi.subtext}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'metric': {
        const isSuccess = props.variant === 'success';
        const isDanger = props.variant === 'danger';
        const isWarning = props.variant === 'warning';
        const isHighlight = props.variant === 'highlight';

        const colorClass = isSuccess ? 'text-emerald-400' : isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : isHighlight ? 'text-indigo-400' : 'text-white';

        return (
          <div key={node.id} className={`p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between ${styleClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{props.label}</span>
              {props.badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                  {props.badge}
                </span>
              )}
            </div>
            <div className={`text-xl font-bold font-mono my-1 ${colorClass}`}>
              {props.value}
            </div>
            {props.subtext && (
              <span className="text-[10px] text-slate-500">{props.subtext}</span>
            )}
          </div>
        );
      }

      case 'data_table':
        return (
          <div key={node.id} className="w-full overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-white/10">
                <tr>
                  {(props.headers || []).map((h: string, idx: number) => (
                    <th key={idx} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {(props.rows || []).map((row: any[], rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2">
                        {typeof cell === 'object' && cell?.type === 'badge' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cell.variant === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                            cell.variant === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                            cell.variant === 'danger' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-slate-300'
                          }`}>
                            {cell.label}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // ---------------- Engineering & AI Primitives ----------------
      case 'code_diff':
        return (
          <div key={node.id} className="w-full rounded-xl border border-white/10 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 text-slate-300">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white">{props.title || 'Diff View'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-400 uppercase">
                {props.language || 'diff'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="p-3 bg-rose-950/10">
                <div className="text-[10px] font-bold text-rose-400 uppercase mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{props.leftTitle || 'Before'}</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                  <code>{props.codeBefore}</code>
                </pre>
              </div>
              <div className="p-3 bg-emerald-950/10">
                <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{props.rightTitle || 'After'}</span>
                </div>
                <pre className="text-emerald-200 overflow-x-auto text-[11px] leading-relaxed">
                  <code>{props.codeAfter}</code>
                </pre>
              </div>
            </div>
          </div>
        );

      case 'terminal_logs':
        return (
          <div key={node.id} className="w-full rounded-xl border border-white/10 bg-black/80 p-3 font-mono text-[11px] text-slate-300">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>{props.title || 'Live Log Stream'}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-1 overflow-x-auto">
              {(props.logs || []).map((log: string, lIdx: number) => (
                <div key={lIdx} className="text-slate-400 hover:text-white transition-colors">
                  {log}
                </div>
              ))}
            </div>
          </div>
        );

      case 'wizard_stepper':
        return (
          <div key={node.id} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/10 overflow-x-auto">
            {(props.steps || []).map((step: any, idx: number) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              return (
                <div key={step.id} className="flex items-center gap-2 min-w-max">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    isCompleted ? 'bg-emerald-600 text-white' : isActive ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50' : 'bg-white/10 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-white font-bold' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                  {idx < (props.steps.length - 1) && (
                    <div className="w-6 h-0.5 bg-white/10 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'checklist':
        return (
          <div key={node.id} className="w-full space-y-2 p-3 rounded-xl bg-white/5 border border-white/5">
            {props.title && (
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                <span>{props.title}</span>
              </h4>
            )}
            <div className="space-y-1.5">
              {(props.items || []).map((item: any) => (
                <div key={item.id} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center ${item.checked ? 'bg-emerald-600 text-white' : 'border border-slate-600'}`}>
                    {item.checked && <Check className="w-3 h-3" />}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div key={node.id} className="w-full space-y-3 p-4 rounded-xl bg-slate-900/60 border border-white/10">
            {props.title && <h4 className="text-xs font-bold text-slate-200">{props.title}</h4>}
            <div className="relative pl-4 space-y-4 border-l border-white/10">
              {(props.events || []).map((ev: any, idx: number) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 ${
                    ev.status === 'success' ? 'bg-emerald-500' : ev.status === 'warning' ? 'bg-amber-500' : ev.status === 'danger' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`} />
                  <div className="text-[10px] font-mono text-slate-400">{ev.time}</div>
                  <div className="text-xs font-semibold text-white mt-0.5">{ev.title}</div>
                  {ev.description && <div className="text-xs text-slate-300 mt-0.5">{ev.description}</div>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'decision_matrix':
        return (
          <div key={node.id} className="w-full space-y-2 p-3 rounded-xl bg-white/5 border border-white/5">
            {props.title && <h4 className="text-xs font-bold text-white">{props.title}</h4>}
            <div className="divide-y divide-white/5">
              {(props.items || []).map((item: any, idx: number) => (
                <div key={idx} className="py-2 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    {item.description && <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.status?.toUpperCase() || 'PASS'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={node.id} className="text-xs text-slate-400 font-mono p-2 border border-dashed border-white/10 rounded">
            [A2UI Primitive: {node.type}]
          </div>
        );
    }
  };

  return (
    <div className={`a2ui-root-canvas w-full relative ${className}`}>
      {/* Top Protocol Status Bar */}
      <div className="flex items-center justify-between mb-3 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/5 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-bold">{schema.title}</span>
          <span className="text-slate-500">({schema.version})</span>
        </div>
        {schema.agentMetadata && (
          <div className="flex items-center gap-2 text-indigo-300">
            <span>Agent: {schema.agentMetadata.agentName}</span>
            <span>•</span>
            <span>{schema.agentMetadata.model}</span>
          </div>
        )}
      </div>

      {/* Primary Component Tree */}
      <div className="space-y-4">
        {renderNode(schema.root)}
      </div>

      {/* Modal Confirmation Dialog Gate */}
      {activeConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${
                activeConfirmation.action.confirmation?.severity === 'danger'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                {activeConfirmation.action.confirmation?.severity === 'danger' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeConfirmation.action.confirmation?.title || 'Confirm Action'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeConfirmation.action.confirmation?.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 font-mono text-xs">
              <button
                onClick={() => setActiveConfirmation(null)}
                className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {activeConfirmation.action.confirmation?.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const conf = activeConfirmation;
                  setActiveConfirmation(null);
                  handleAction({ ...conf.action, confirmation: undefined }, conf.componentId);
                }}
                className={`px-4 py-1.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                  activeConfirmation.action.confirmation?.severity === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {activeConfirmation.action.confirmation?.confirmLabel || 'Execute Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
