/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChangeStackPr, 
  PrDocstringItem, 
  PrCiCheck, 
  PrUnitTestItem 
} from '../../types';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  TestTube2, 
  GitPullRequest, 
  GitCommit, 
  Check, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  Copy, 
  Code2,
  Cpu
} from 'lucide-react';
import { 
  generateDocstringsWithAi, 
  generateCiFixWithAi, 
  generateUnitTestsWithAi 
} from '../../services/geminiService';

interface PrFinishingTouchesProps {
  pr: ChangeStackPr;
  subTab: 'docstrings' | 'ci_fix' | 'unit_tests';
  onSelectSubTab: (subTab: 'docstrings' | 'ci_fix' | 'unit_tests') => void;
  onApplyDocstrings: (updatedDocstrings: PrDocstringItem[]) => void;
  onApplyCiFix: (fixedCheckId: string, patchCode: string) => void;
  onCommitUnitTestsToBranch: (testSuite: PrUnitTestItem) => void;
  onCreatePrWithUnitTests: (testSuite: PrUnitTestItem) => void;
}

export const PrFinishingTouches: React.FC<PrFinishingTouchesProps> = ({
  pr,
  subTab,
  onSelectSubTab,
  onApplyDocstrings,
  onApplyCiFix,
  onCommitUnitTestsToBranch,
  onCreatePrWithUnitTests
}) => {
  // Docstrings state
  const [docstrings, setDocstrings] = useState<PrDocstringItem[]>(pr.missingDocstrings);
  const [isGeneratingDocstrings, setIsGeneratingDocstrings] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // CI Fix state
  const failingCiChecks = pr.ciChecks.filter(c => c.status === 'failed');
  const [selectedCiCheckId, setSelectedCiCheckId] = useState<string>(failingCiChecks[0]?.id || pr.ciChecks[0]?.id || '');
  const selectedCiCheck = pr.ciChecks.find(c => c.id === selectedCiCheckId) || failingCiChecks[0] || pr.ciChecks[0];
  const [isGeneratingCiFix, setIsGeneratingCiFix] = useState(false);
  const [ciFixResult, setCiFixResult] = useState<{ explanation: string; patchCode: string; fileToModify: string } | null>(
    selectedCiCheck?.aiSuggestedFix || null
  );

  // Unit Test state
  const [testFramework, setTestFramework] = useState<'vitest' | 'jest' | 'pytest'>('vitest');
  const [unitTestSuite, setUnitTestSuite] = useState<PrUnitTestItem>(
    pr.generatedUnitTests || {
      id: `test-suite-${pr.number}`,
      sourceFile: pr.fileDiffs[0]?.path || 'services/authService.ts',
      testFilePath: `${pr.fileDiffs[0]?.path || 'services/authService'}.test.ts`,
      framework: 'vitest',
      testNames: [
        'verifyRole() - authorizes matching roles',
        'verifyRole() - rejects expired token claims with 401',
        'resolveInheritedPermissions() - traverses multi-level DAGs without cycles'
      ],
      testCode: `import { describe, it, expect } from 'vitest';\nimport { verifyRole, resolveInheritedPermissions } from './authService';\n\ndescribe('authService - Architectural Unit Tests', () => {\n  it('verifies valid token claims', () => {\n    expect(true).toBe(true);\n  });\n});`,
      coverageDelta: 24,
      status: 'draft'
    }
  );
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);

  // Handlers
  const handleGenerateAllDocstrings = async () => {
    setIsGeneratingDocstrings(true);
    try {
      const generated = await generateDocstringsWithAi(docstrings);
      setDocstrings(generated);
      onApplyDocstrings(generated);
    } catch (e) {
      console.error('Failed to generate docstrings', e);
    } finally {
      setIsGeneratingDocstrings(false);
    }
  };

  const handleCopyDocstring = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const handleGenerateCiFix = async () => {
    if (!selectedCiCheck) return;
    setIsGeneratingCiFix(true);
    try {
      const fix = await generateCiFixWithAi(selectedCiCheck);
      setCiFixResult(fix);
    } catch (e) {
      console.error('Failed to generate CI fix', e);
    } finally {
      setIsGeneratingCiFix(false);
    }
  };

  const handleApplyCiFixAndRerun = () => {
    if (!selectedCiCheck || !ciFixResult) return;
    onApplyCiFix(selectedCiCheck.id, ciFixResult.patchCode);
  };

  const handleGenerateUnitTests = async () => {
    setIsGeneratingTests(true);
    try {
      const targetFile = pr.fileDiffs[0]?.path || 'services/authService.ts';
      const sampleSnippet = pr.fileDiffs[0]?.diffHunks[0]?.lines.map(l => l.content).join('\n') || '';
      const result = await generateUnitTestsWithAi(targetFile, sampleSnippet, testFramework);
      const updatedSuite: PrUnitTestItem = {
        id: `test-suite-${pr.number}-${Date.now()}`,
        sourceFile: targetFile,
        testFilePath: targetFile.replace(/\.tsx?$/, '.test.ts'),
        framework: testFramework,
        testCode: result.testCode,
        testNames: result.testNames,
        coverageDelta: result.coverageDelta,
        status: 'draft'
      };
      setUnitTestSuite(updatedSuite);
    } catch (e) {
      console.error('Failed to generate unit tests', e);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-Tab Navigation Header */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 max-w-fit">
        <button
          onClick={() => onSelectSubTab('docstrings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            subTab === 'docstrings'
              ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Generate Docstrings</span>
          {docstrings.filter(d => !d.applied).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 text-[10px]">
              {docstrings.filter(d => !d.applied).length}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectSubTab('ci_fix')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            subTab === 'ci_fix'
              ? 'bg-rose-600/30 text-rose-200 border border-rose-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Terminal className="w-4 h-4 text-rose-400" />
          <span>Fix Failing CI Check</span>
          {failingCiChecks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 text-[10px]">
              {failingCiChecks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectSubTab('unit_tests')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            subTab === 'unit_tests'
              ? 'bg-violet-600/30 text-violet-200 border border-violet-500/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <TestTube2 className="w-4 h-4 text-violet-400" />
          <span>Generate Unit Tests</span>
          <span className="px-1.5 py-0.2 rounded-full bg-violet-500/30 text-violet-200 text-[10px]">
            +24% Cov
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SUB-TAB: GENERATE DOCSTRINGS                               */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'docstrings' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  TSDoc & JSDoc Automated Documentation Engine
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Automatically synthesizes typed documentation, parameter descriptions, exceptions, and usage examples.
              </p>
            </div>

            <button
              onClick={handleGenerateAllDocstrings}
              disabled={isGeneratingDocstrings}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingDocstrings ? 'animate-spin' : ''}`} />
              <span>{isGeneratingDocstrings ? 'Synthesizing Docstrings...' : 'Generate All Docstrings'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {docstrings.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                      {item.symbolKind}
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      {item.symbolName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      in {item.filePath}:{item.lineNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.applied && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        APPLIED
                      </span>
                    )}
                    {item.generatedDocstring && (
                      <button
                        onClick={() => handleCopyDocstring(item.id, item.generatedDocstring!)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors text-[10px] font-mono flex items-center gap-1"
                        title="Copy docstring snippet"
                      >
                        {copiedDocId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDocId === item.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Original Code Snippet */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 font-mono text-xs text-slate-400">
                  <code>{item.codeSnippet}</code>
                </div>

                {/* Generated Docstring Preview */}
                {item.generatedDocstring && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Generated TSDoc:
                    </span>
                    <pre className="p-3 rounded-lg bg-[#0d1117] border border-cyan-500/20 text-xs font-mono text-cyan-200/90 whitespace-pre-wrap overflow-x-auto">
                      {item.generatedDocstring}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB-TAB: FIX FAILING CI CHECK                              */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'ci_fix' && (
        <div className="space-y-5">
          {/* CI Checks Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {pr.ciChecks.map(check => {
              const isSelected = check.id === selectedCiCheck?.id;
              const isFailed = check.status === 'failed';
              return (
                <button
                  key={check.id}
                  onClick={() => {
                    setSelectedCiCheckId(check.id);
                    setCiFixResult(check.aiSuggestedFix || null);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-2 ${
                    isSelected
                      ? isFailed
                        ? 'bg-rose-950/80 text-rose-200 border-rose-500 shadow-md ring-1 ring-rose-500/40'
                        : 'bg-slate-900 text-white border-violet-500 ring-1 ring-violet-500/40'
                      : isFailed
                      ? 'bg-rose-950/30 text-rose-300 border-rose-500/30 hover:bg-rose-900/40'
                      : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-slate-200'
                  }`}
                >
                  {isFailed ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{check.name}</span>
                  <span className="text-[10px] opacity-75">({check.durationSeconds}s)</span>
                </button>
              );
            })}
          </div>

          {/* Active CI Check Diagnostic Card */}
          {selectedCiCheck && (
            <div className="p-5 md:p-6 rounded-2xl bg-slate-950/90 border border-white/10 space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">
                      {selectedCiCheck.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedCiCheck.status === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedCiCheck.status}
                    </span>
                  </div>
                  {selectedCiCheck.errorMessage && (
                    <p className="text-xs text-rose-300 font-mono mt-1">
                      {selectedCiCheck.errorMessage}
                    </p>
                  )}
                </div>

                {selectedCiCheck.status === 'failed' && (
                  <button
                    onClick={handleGenerateCiFix}
                    disabled={isGeneratingCiFix}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingCiFix ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingCiFix ? 'Analyzing Root Cause...' : 'Diagnose & Generate Fix'}</span>
                  </button>
                )}
              </div>

              {/* Raw Failure Log */}
              {selectedCiCheck.failureLog && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                    <Terminal className="w-3 h-3" />
                    <span>CI Pipeline Console Output:</span>
                  </span>
                  <pre className="p-3.5 rounded-xl bg-[#080b11] border border-rose-500/20 text-xs font-mono text-rose-300/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {selectedCiCheck.failureLog}
                  </pre>
                </div>
              )}

              {/* AI Healing Solution */}
              {ciFixResult && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                        AI Root Cause Remediation Patch
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Target: {ciFixResult.fileToModify}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-sans">
                    {ciFixResult.explanation}
                  </p>

                  <pre className="p-3 rounded-lg bg-[#0d1117] border border-emerald-500/20 text-xs font-mono text-emerald-300 whitespace-pre-wrap overflow-x-auto">
                    {ciFixResult.patchCode}
                  </pre>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApplyCiFixAndRerun}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply CI Fix & Rerun Pipeline</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SUB-TAB: GENERATE UNIT TESTS                               */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'unit_tests' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TestTube2 className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Automated Unit Test Synthesizer
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                Generates robust regression tests covering boundary values, error exceptions, and mock dependencies.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Framework Selector */}
              <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1 text-xs font-mono">
                {(['vitest', 'jest', 'pytest'] as const).map(fw => (
                  <button
                    key={fw}
                    onClick={() => setTestFramework(fw)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      testFramework === fw ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fw}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateUnitTests}
                disabled={isGeneratingTests}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingTests ? 'animate-spin' : ''}`} />
                <span>{isGeneratingTests ? 'Synthesizing Tests...' : 'Generate Test Suite'}</span>
              </button>
            </div>
          </div>

          {/* Test Suite Card */}
          <div className="p-5 md:p-6 rounded-2xl bg-slate-950/90 border border-white/10 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {unitTestSuite.testFilePath}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-bold">
                    {unitTestSuite.framework.toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Target: {unitTestSuite.sourceFile} • Coverage improvement: +{unitTestSuite.coverageDelta}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                {unitTestSuite.status === 'committed_to_branch' && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    COMMITTED TO BRANCH
                  </span>
                )}
                {unitTestSuite.status === 'pr_created' && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                    <GitPullRequest className="w-3.5 h-3.5" />
                    PR CREATED
                  </span>
                )}
              </div>
            </div>

            {/* Test Names List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Synthesized Test Specifications ({unitTestSuite.testNames.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unitTestSuite.testNames.map((tName, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-900/60 border border-white/5 text-xs font-mono text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{tName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Code Box */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">
                Runnable Test Code:
              </span>
              <pre className="p-4 rounded-xl bg-[#0d1117] border border-violet-500/20 text-xs font-mono text-slate-200 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
                {unitTestSuite.testCode}
              </pre>
            </div>

            {/* ACTION BUTTONS (As explicitly specified by the user) */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-end gap-3">
              {/* Option A: Commit unit tests in branch */}
              <button
                onClick={() => onCommitUnitTestsToBranch(unitTestSuite)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <GitCommit className="w-4 h-4 text-emerald-400" />
                <span>Commit unit tests in branch</span>
              </button>

              {/* Option B: Create PR with unit tests */}
              <button
                onClick={() => onCreatePrWithUnitTests(unitTestSuite)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <GitPullRequest className="w-4 h-4 text-cyan-300" />
                <span>Create PR with unit tests</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
