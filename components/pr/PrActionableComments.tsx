/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChangeStackPr, 
  PrReviewComment, 
  PrCommentSeverity 
} from '../../types';
import { 
  MessageSquareCode, 
  Sparkles, 
  Send, 
  Bot, 
  GitCommit, 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Check, 
  ChevronRight,
  ShieldCheck,
  User,
  ArrowRight,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { 
  promptReviewCommentsWithAi, 
  resolveAllReviewCommentsWithAi 
} from '../../services/geminiService';

interface PrActionableCommentsProps {
  pr: ChangeStackPr;
  onPushCommitFixToBranch: (commitMessage: string) => void;
  onCreateNewPrWithFixes: (prTitle: string, prBranch: string) => void;
  onToggleCommentStatus?: (commentId: string) => void;
}

export const PrActionableComments: React.FC<PrActionableCommentsProps> = ({
  pr,
  onPushCommitFixToBranch,
  onCreateNewPrWithFixes,
  onToggleCommentStatus
}) => {
  const unresolvedComments = pr.reviewComments.filter(c => c.status === 'unresolved');
  
  // Prompt AI Agent State
  const [aiPromptQuery, setAiPromptQuery] = useState('');
  const [selectedAgentPersona, setSelectedAgentPersona] = useState<string>('Security & Architecture Sentinel AI');
  const [isQueryingAgent, setIsQueryingAgent] = useState(false);
  const [agentResponse, setAgentResponse] = useState<{
    agentName: string;
    response: string;
    keyTakeaways: string[];
  } | null>(null);

  // Fix Action Resolution State
  const [isResolving, setIsResolving] = useState(false);
  const [lastResolutionReport, setLastResolutionReport] = useState<{
    commitMessage: string;
    prTitle?: string;
    prBranch?: string;
    resolutionSummary: string;
    fixedFileCount: number;
    actionType: 'commit_to_branch' | 'create_new_pr';
  } | null>(null);

  const AGENT_PERSONAS = [
    { id: 'Security & Architecture Sentinel AI', label: 'Security Sentinel', icon: ShieldAlert, color: 'text-rose-400' },
    { id: 'Performance & Lifecycle Specialist AI', label: 'Performance Specialist', icon: Zap, color: 'text-amber-400' },
    { id: 'Staff Tech Lead Review Bot', label: 'Tech Lead Reviewer', icon: Bot, color: 'text-cyan-400' }
  ];

  const PRESET_QUERIES = [
    'Analyze security vulnerabilities across all comments',
    'Explain how to fix memory leaks without breaking contracts',
    'Draft a conversational reply to reviewers'
  ];

  const handlePromptAiAgent = async (queryText?: string) => {
    const textToSend = queryText || aiPromptQuery;
    if (!textToSend.trim()) return;

    setIsQueryingAgent(true);
    try {
      const res = await promptReviewCommentsWithAi(pr.reviewComments, textToSend, selectedAgentPersona);
      setAgentResponse(res);
    } catch (e) {
      console.error('Failed to prompt review comments AI agent', e);
    } finally {
      setIsQueryingAgent(false);
    }
  };

  const handleFixAllUnresolvedComments = async (actionType: 'commit_to_branch' | 'create_new_pr') => {
    setIsResolving(true);
    try {
      const res = await resolveAllReviewCommentsWithAi(pr.reviewComments, actionType);
      setLastResolutionReport({
        ...res,
        actionType
      });

      if (actionType === 'commit_to_branch') {
        onPushCommitFixToBranch(res.commitMessage);
      } else {
        onCreateNewPrWithFixes(res.prTitle || 'fix(review): resolve comments', res.prBranch || 'fix/pr-comments');
      }
    } catch (e) {
      console.error('Failed to resolve review comments', e);
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityBadge = (sev: PrCommentSeverity) => {
    switch (sev) {
      case 'critical':
      case 'security':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold uppercase">Critical / Security</span>;
      case 'performance':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">Performance</span>;
      case 'suggestion':
        return <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">Suggestion</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/30 text-[10px] font-mono font-bold uppercase">Style</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP ACTION BANNER: FIX ALL UNRESOLVED COMMENTS ON THIS PR  */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-violet-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                {unresolvedComments.length} Actionable Unresolved Comments
              </span>
              <span className="text-xs font-mono text-slate-400">
                • {pr.reviewComments.length} total posted
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-sans">
              Fix all unresolved comments on this PR
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              Automatically applies tested patches for token expiration checks, listener cleanup, and typing errors.
            </p>
          </div>

          {/* TWO PRIMARY PATHWAYS (Recommended & New PR) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Action 1: Push a commit to this branch (recommended) */}
            <button
              onClick={() => handleFixAllUnresolvedComments('commit_to_branch')}
              disabled={isResolving || unresolvedComments.length === 0}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 group"
            >
              <GitCommit className="w-4 h-4 text-emerald-200" />
              <span>Push a commit to this branch</span>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-extrabold text-emerald-100 uppercase">
                Recommended
              </span>
            </button>

            {/* Action 2: Create a new PR with the fixes */}
            <button
              onClick={() => handleFixAllUnresolvedComments('create_new_pr')}
              disabled={isResolving || unresolvedComments.length === 0}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <GitPullRequest className="w-4 h-4 text-cyan-300" />
              <span>Create a new PR with the fixes</span>
            </button>
          </div>
        </div>

        {/* Resolution Report confirmation */}
        {lastResolutionReport && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-200 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {lastResolutionReport.actionType === 'commit_to_branch'
                  ? 'Commit successfully pushed to branch:'
                  : 'New Fix PR created:'}
              </span>
            </div>
            <div className="text-white font-bold bg-slate-950/60 p-2 rounded border border-white/5">
              {lastResolutionReport.commitMessage}
            </div>
            <p className="text-[11px] text-slate-300 font-sans">
              {lastResolutionReport.resolutionSummary}
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PROMPT FOR ALL REVIEW COMMENTS WITH AI AGENTS              */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 md:p-6 rounded-2xl bg-slate-950/90 border border-white/10 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-mono">
                Prompt for all review comments with AI agents
              </h4>
              <p className="text-xs text-slate-400 font-sans">
                Interactively interrogate, analyze, or synthesize solutions across all posted comments
              </p>
            </div>
          </div>

          {/* Persona selector pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {AGENT_PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedAgentPersona(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                  selectedAgentPersona === p.id
                    ? 'bg-violet-600/30 text-violet-200 border-violet-500/50 font-bold'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preset query chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono">Suggested:</span>
          {PRESET_QUERIES.map((pq, i) => (
            <button
              key={i}
              onClick={() => {
                setAiPromptQuery(pq);
                handlePromptAiAgent(pq);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/20 hover:text-violet-200 text-slate-400 border border-white/5 text-xs font-sans transition-all"
            >
              {pq}
            </button>
          ))}
        </div>

        {/* Query Input Bar */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 focus-within:border-violet-500/50 rounded-xl p-1.5 transition-all">
          <input
            type="text"
            placeholder="Ask AI agent about review comments or request remediation..."
            value={aiPromptQuery}
            onChange={(e) => setAiPromptQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePromptAiAgent();
            }}
            className="flex-1 bg-transparent border-none text-xs text-white placeholder:text-slate-500 px-3 py-1.5 focus:outline-none"
          />
          <button
            onClick={() => handlePromptAiAgent()}
            disabled={isQueryingAgent || !aiPromptQuery.trim()}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isQueryingAgent ? 'animate-spin' : ''}`} />
            <span>{isQueryingAgent ? 'Reasoning...' : 'Prompt Agent'}</span>
          </button>
        </div>

        {/* AI Agent Analysis Response Box */}
        {agentResponse && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-950/40 via-slate-900/90 to-slate-950/90 border border-violet-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-violet-300">
                  {agentResponse.agentName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                Gemini 3.7 Flash Analysis
              </span>
            </div>

            <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
              {agentResponse.response}
            </div>

            {agentResponse.keyTakeaways && agentResponse.keyTakeaways.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Key Action Items:
                </span>
                <div className="space-y-1">
                  {agentResponse.keyTakeaways.map((k, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-sans text-slate-300">
                      <ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. POSTED REVIEW COMMENTS LIST                                */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareCode className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Actionable Review Comments ({pr.reviewComments.length} posted)
            </h4>
          </div>
        </div>

        <div className="space-y-3">
          {pr.reviewComments.map(comment => {
            const isResolved = comment.status === 'resolved';

            return (
              <div
                key={comment.id}
                className={`p-4 rounded-xl border transition-all shadow-lg ${
                  isResolved
                    ? 'bg-slate-950/40 border-white/5 opacity-60'
                    : 'bg-slate-950/90 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    {comment.authorAvatar ? (
                      <img src={comment.authorAvatar} alt={comment.author} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                        {comment.author[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{comment.author}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                          {comment.authorRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSeverityBadge(comment.severity)}
                    {isResolved ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        RESOLVED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                        UNRESOLVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment body */}
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-slate-400 font-mono">
                    in <span className="text-slate-200 font-bold">{comment.filePath}:{comment.lineNumber}</span>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {comment.body}
                  </p>

                  {/* Code snippet context */}
                  <pre className="p-3 rounded-lg bg-[#0d1117] border border-white/5 text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                    {comment.codeSnippet}
                  </pre>

                  {/* Suggested Patch Preview */}
                  {comment.suggestedPatch && (
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold">
                        <span>Suggested Patch:</span>
                        <span>{comment.suggestedPatch.description}</span>
                      </div>
                      <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre-wrap">
                        {comment.suggestedPatch.after}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
