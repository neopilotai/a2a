/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ChangeStackPr, 
  PrDocstringItem, 
  PrUnitTestItem, 
  ActiveRepoContext, 
  RepoHistoryItem, 
  ViewMode 
} from '../types';
import { 
  getDefaultChangeStack, 
  loadStoredChangeStack, 
  saveStoredChangeStack 
} from '../services/changeStackService';
import { ChangeStackVisualizer } from './pr/ChangeStackVisualizer';
import { PrWalkthroughView } from './pr/PrWalkthroughView';
import { PreMergeChecklist } from './pr/PreMergeChecklist';
import { PrFinishingTouches } from './pr/PrFinishingTouches';
import { PrActionableComments } from './pr/PrActionableComments';
import { 
  ArrowLeft, 
  Layers, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  MessageSquareCode, 
  FileCode2, 
  GitPullRequest, 
  GitBranch, 
  CheckCircle2,
  RefreshCw,
  Zap,
  Terminal
} from 'lucide-react';

interface ChangeStackStudioProps {
  activeRepoContext: ActiveRepoContext | null;
  repoHistory?: RepoHistoryItem[];
  onNavigate: (mode: ViewMode, data?: any) => void;
  onBack: () => void;
}

export const ChangeStackStudio: React.FC<ChangeStackStudioProps> = ({
  activeRepoContext,
  repoHistory = [],
  onNavigate,
  onBack
}) => {
  // 1. Change Stack State
  const [stack, setStack] = useState<ChangeStackPr[]>(() => {
    return loadStoredChangeStack() || getDefaultChangeStack(activeRepoContext);
  });

  const [activePrId, setActivePrId] = useState<string>(() => {
    const current = stack.find(p => p.isCurrentActive) || stack[2] || stack[0];
    return current?.id || 'pr-103';
  });

  const activePr = stack.find(p => p.id === activePrId) || stack[0];

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'pre_merge' | 'finishing_touches' | 'comments'>('walkthrough');
  const [finishingSubTab, setFinishingSubTab] = useState<'docstrings' | 'ci_fix' | 'unit_tests'>('docstrings');

  // Persistence sync
  useEffect(() => {
    saveStoredChangeStack(stack);
  }, [stack]);

  // Update active PR in stack
  const updateActivePr = (updater: (prevPr: ChangeStackPr) => ChangeStackPr) => {
    setStack(prev => prev.map(p => (p.id === activePrId ? updater(p) : p)));
  };

  // Stack new dependent PR handler
  const handleNewStackedPr = () => {
    const newPrNumber = Math.max(...stack.map(s => s.number)) + 1;
    const newPr: ChangeStackPr = {
      id: `pr-${newPrNumber}`,
      number: newPrNumber,
      title: `feat(feature-${newPrNumber}): dependent architectural enhancement`,
      branch: `feat/dependent-enhancement-${newPrNumber}`,
      baseBranch: activePr.branch,
      description: `Stacked directly on top of PR #${activePr.number} (${activePr.branch}).`,
      author: 'dev-master',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
      status: 'draft',
      stackOrder: stack.length + 1,
      isCurrentActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commitsCount: 1,
      filesChanged: 2,
      additions: 84,
      deletions: 4,
      ciStatus: 'pending',
      ciChecks: [
        { id: `ci-${newPrNumber}-1`, name: 'TypeScript Compiler', category: 'typecheck', status: 'running', durationSeconds: 5 }
      ],
      reviewComments: [],
      fileDiffs: [],
      missingDocstrings: [],
      walkthrough: {
        highLevelSummary: `Newly created stacked PR #${newPrNumber} branching from #${activePr.number}.`,
        architecturalImpact: 'Builds upon current state without merge conflicts.',
        keyModulesAffected: ['services/authService.ts'],
        riskScore: 'Low',
        blastRadius: 'Local feature module',
        breakingChanges: false
      },
      commitHistory: [
        { hash: 'e89a12c', message: `feat: scaffold stacked feature branch ${newPrNumber}`, author: 'dev-master', timestamp: Date.now(), filesCount: 2 }
      ]
    };

    setStack(prev => [...prev.map(p => ({ ...p, isCurrentActive: false })), newPr]);
    setActivePrId(newPr.id);
  };

  // Handlers for Finishing Touches actions
  const handleApplyDocstrings = (updatedDocstrings: PrDocstringItem[]) => {
    updateActivePr(prev => ({
      ...prev,
      missingDocstrings: updatedDocstrings,
      commitHistory: [
        {
          hash: 'd89f10a',
          message: `docs: generate JSDoc/TSDoc docstrings for ${updatedDocstrings.length} symbols`,
          author: 'link2ink-bot',
          timestamp: Date.now(),
          filesCount: new Set(updatedDocstrings.map(d => d.filePath)).size
        },
        ...prev.commitHistory
      ]
    }));
  };

  const handleApplyCiFix = (fixedCheckId: string, patchCode: string) => {
    updateActivePr(prev => {
      const updatedChecks = prev.ciChecks.map(c => 
        c.id === fixedCheckId ? { ...c, status: 'passed' as const, errorMessage: undefined } : c
      );
      const allPassed = updatedChecks.every(c => c.status === 'passed');

      return {
        ...prev,
        ciChecks: updatedChecks,
        ciStatus: allPassed ? 'passed' : 'failed',
        status: allPassed && prev.status === 'failing_ci' ? 'needs_review' : prev.status,
        commitHistory: [
          {
            hash: 'c19e83b',
            message: 'fix(ci): resolve compilation error and verifyRole expiration checks',
            author: 'link2ink-ci-healer',
            timestamp: Date.now(),
            filesCount: 1
          },
          ...prev.commitHistory
        ]
      };
    });
  };

  const handleCommitUnitTestsToBranch = (testSuite: PrUnitTestItem) => {
    updateActivePr(prev => ({
      ...prev,
      generatedUnitTests: { ...testSuite, status: 'committed_to_branch' },
      commitsCount: prev.commitsCount + 1,
      commitHistory: [
        {
          hash: 't90a12f',
          message: `test(auth): add automated ${testSuite.framework} test suite (+${testSuite.coverageDelta}% coverage)`,
          author: 'dev-master',
          timestamp: Date.now(),
          filesCount: 1
        },
        ...prev.commitHistory
      ]
    }));
  };

  const handleCreatePrWithUnitTests = (testSuite: PrUnitTestItem) => {
    const newPrNumber = Math.max(...stack.map(s => s.number)) + 1;
    const testPr: ChangeStackPr = {
      id: `pr-${newPrNumber}`,
      number: newPrNumber,
      title: `test(auth): unit test suite for PR #${activePr.number}`,
      branch: `test/unit-tests-pr-${activePr.number}`,
      baseBranch: activePr.branch,
      description: `Stacked unit test suite covering ${testSuite.testNames.length} cases with ${testSuite.framework}.`,
      author: 'dev-master',
      status: 'approved',
      stackOrder: stack.length + 1,
      isCurrentActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commitsCount: 1,
      filesChanged: 1,
      additions: 68,
      deletions: 0,
      ciStatus: 'passed',
      ciChecks: [
        { id: `ci-${newPrNumber}-1`, name: 'Vitest Unit Tests', category: 'test', status: 'passed', durationSeconds: 14 }
      ],
      reviewComments: [],
      fileDiffs: [],
      missingDocstrings: [],
      walkthrough: {
        highLevelSummary: `Automated test suite stacked PR containing ${testSuite.testNames.length} unit tests.`,
        architecturalImpact: 'Improves total coverage delta by +24%.',
        keyModulesAffected: [testSuite.testFilePath],
        riskScore: 'Low',
        blastRadius: 'Test fixtures',
        breakingChanges: false
      },
      commitHistory: [
        { hash: '7fa019b', message: `test: add unit tests for ${testSuite.sourceFile}`, author: 'dev-master', timestamp: Date.now(), filesCount: 1 }
      ]
    };

    updateActivePr(prev => ({
      ...prev,
      generatedUnitTests: { ...testSuite, status: 'pr_created' }
    }));

    setStack(prev => [...prev.map(p => ({ ...p, isCurrentActive: false })), testPr]);
    setActivePrId(testPr.id);
  };

  // Handlers for Review Comments resolution
  const handlePushCommitFixToBranch = (commitMessage: string) => {
    updateActivePr(prev => ({
      ...prev,
      reviewComments: prev.reviewComments.map(c => ({ ...c, status: 'resolved' as const })),
      ciChecks: prev.ciChecks.map(c => ({ ...c, status: 'passed' as const, errorMessage: undefined })),
      ciStatus: 'passed',
      status: 'approved',
      commitsCount: prev.commitsCount + 1,
      commitHistory: [
        {
          hash: 'f91a02c',
          message: commitMessage,
          author: 'dev-master',
          timestamp: Date.now(),
          filesCount: 3
        },
        ...prev.commitHistory
      ]
    }));
  };

  const handleCreateNewPrWithFixes = (prTitle: string, prBranch: string) => {
    const newPrNumber = Math.max(...stack.map(s => s.number)) + 1;
    const fixPr: ChangeStackPr = {
      id: `pr-${newPrNumber}`,
      number: newPrNumber,
      title: prTitle,
      branch: prBranch,
      baseBranch: activePr.branch,
      description: `Dedicated fix PR resolving all review comments from PR #${activePr.number}.`,
      author: 'dev-master',
      status: 'approved',
      stackOrder: stack.length + 1,
      isCurrentActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commitsCount: 1,
      filesChanged: 3,
      additions: 38,
      deletions: 12,
      ciStatus: 'passed',
      ciChecks: [
        { id: `ci-${newPrNumber}-1`, name: 'TypeScript Strict', category: 'typecheck', status: 'passed', durationSeconds: 11 },
        { id: `ci-${newPrNumber}-2`, name: 'Vitest Unit Tests', category: 'test', status: 'passed', durationSeconds: 15 }
      ],
      reviewComments: [],
      fileDiffs: [],
      missingDocstrings: [],
      walkthrough: {
        highLevelSummary: `Remediation PR addressing review feedback from #${activePr.number}.`,
        architecturalImpact: 'Applies cryptographic expiration validation and memory leak cleanup.',
        keyModulesAffected: ['services/authService.ts', 'hooks/useRolePermissions.ts'],
        riskScore: 'Low',
        blastRadius: 'Security validation',
        breakingChanges: false
      },
      commitHistory: [
        { hash: 'a89c102', message: `fix(review): address review comments from PR #${activePr.number}`, author: 'dev-master', timestamp: Date.now(), filesCount: 3 }
      ]
    };

    updateActivePr(prev => ({
      ...prev,
      reviewComments: prev.reviewComments.map(c => ({ ...c, status: 'resolved' as const }))
    }));

    setStack(prev => [...prev.map(p => ({ ...p, isCurrentActive: false })), fixPr]);
    setActivePrId(fixPr.id);
  };

  const handleAutoFixAll = () => {
    // 1. Apply docstrings
    const docs = activePr.missingDocstrings.map(d => ({ ...d, applied: true }));
    // 2. Fix all CI checks
    const checks = activePr.ciChecks.map(c => ({ ...c, status: 'passed' as const, errorMessage: undefined }));
    // 3. Resolve all comments
    const comments = activePr.reviewComments.map(c => ({ ...c, status: 'resolved' as const }));

    updateActivePr(prev => ({
      ...prev,
      missingDocstrings: docs,
      ciChecks: checks,
      ciStatus: 'passed',
      reviewComments: comments,
      status: 'approved',
      commitHistory: [
        {
          hash: 'heal-99',
          message: 'chore(pr): auto-heal docstrings, CI compilation failures, and review comments',
          author: 'link2ink-architect',
          timestamp: Date.now(),
          filesCount: 4
        },
        ...prev.commitHistory
      ]
    }));
  };

  const unresolvedCommentsCount = activePr.reviewComments.filter(c => c.status === 'unresolved').length;
  const failingCiCount = activePr.ciChecks.filter(c => c.status === 'failed').length;

  return (
    <div className="w-full space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="relative space-y-8">
        
        {/* 1. TOP HEADER & WORKSPACE CONTEXT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm group"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-md">
                  <GitPullRequest className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-extrabold text-white font-sans tracking-tight">
                  PR & Change Stack Workspace
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-bold">
                  AI ARCHITECT v3.7
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Repository: <span className="text-cyan-300 font-mono font-semibold">{activeRepoContext?.repoName || 'google/link2ink-core'}</span> • Active Branch: <span className="text-violet-300 font-mono">{activePr.branch}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(ViewMode.CODEMAP)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect in Codemap</span>
            </button>

            <button
              onClick={() => onNavigate(ViewMode.INTEGRATIONS)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLI & Integrations</span>
            </button>
          </div>
        </div>

        {/* 2. CHANGE STACK VISUALIZER TIMELINE */}
        <ChangeStackVisualizer 
          stack={stack}
          activePrId={activePrId}
          onSelectPr={(prId) => setActivePrId(prId)}
          onNewStackedPr={handleNewStackedPr}
        />

        {/* 3. WORKSPACE TABS */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10 overflow-x-auto shadow-lg">
          {/* Tab 1: Walkthrough */}
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
              activeTab === 'walkthrough'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-300" />
            <span>PR Walkthrough</span>
          </button>

          {/* Tab 2: Pre-Merge Check */}
          <button
            onClick={() => setActiveTab('pre_merge')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
              activeTab === 'pre_merge'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Pre-Merge Check</span>
            {failingCiCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] animate-pulse">
                {failingCiCount}
              </span>
            )}
          </button>

          {/* Tab 3: Finishing Touches */}
          <button
            onClick={() => setActiveTab('finishing_touches')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
              activeTab === 'finishing_touches'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Finishing Touches</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
              Docstrings • CI • Tests
            </span>
          </button>

          {/* Tab 4: Actionable Comments */}
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
              activeTab === 'comments'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <MessageSquareCode className="w-4 h-4 text-amber-300" />
            <span>Actionable Comments</span>
            {unresolvedCommentsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                {unresolvedCommentsCount}
              </span>
            )}
          </button>
        </div>

        {/* 4. ACTIVE TAB CONTENT VIEW */}
        <div className="w-full">
          {activeTab === 'walkthrough' && (
            <PrWalkthroughView 
              pr={activePr}
              repoName={activeRepoContext?.repoName}
              onUpdateWalkthrough={(updated) => {
                updateActivePr(prev => ({
                  ...prev,
                  walkthrough: { ...prev.walkthrough, ...updated }
                }));
              }}
            />
          )}

          {activeTab === 'pre_merge' && (
            <PreMergeChecklist 
              pr={activePr}
              onNavigateToFinishing={(subTab) => {
                setFinishingSubTab(subTab);
                setActiveTab('finishing_touches');
              }}
              onNavigateToComments={() => {
                setActiveTab('comments');
              }}
              onAutoFixAll={handleAutoFixAll}
            />
          )}

          {activeTab === 'finishing_touches' && (
            <PrFinishingTouches 
              pr={activePr}
              subTab={finishingSubTab}
              onSelectSubTab={setFinishingSubTab}
              onApplyDocstrings={handleApplyDocstrings}
              onApplyCiFix={handleApplyCiFix}
              onCommitUnitTestsToBranch={handleCommitUnitTestsToBranch}
              onCreatePrWithUnitTests={handleCreatePrWithUnitTests}
            />
          )}

          {activeTab === 'comments' && (
            <PrActionableComments 
              pr={activePr}
              onPushCommitFixToBranch={handlePushCommitFixToBranch}
              onCreateNewPrWithFixes={handleCreateNewPrWithFixes}
            />
          )}
        </div>
      </div>
    </div>
  );
};
