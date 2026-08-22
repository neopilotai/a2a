/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { X, FileText, Sparkles } from 'lucide-react';
import { ReadmeGenerator } from './ReadmeGenerator';
import { RepoFileTree, ViewMode } from '../types';

interface ReadmeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  fileTree: RepoFileTree[];
  onNavigate?: (mode: ViewMode, data?: any) => void;
}

export const ReadmeGeneratorModal: React.FC<ReadmeGeneratorModalProps> = ({
  isOpen,
  onClose,
  repoName,
  fileTree,
  onNavigate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-white/15 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300">
              <FileText className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-sans">
                  Generate README & Architectural Specification
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono">
                  Gemini Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {repoName ? `Analyzing repository: ${repoName}` : 'Select a repository to generate documentation'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/60">
          <ReadmeGenerator
            repoName={repoName}
            fileTree={fileTree}
            onNavigate={onNavigate}
            standalone={false}
          />
        </div>
      </div>
    </div>
  );
};
