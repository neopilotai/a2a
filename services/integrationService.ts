/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  RepoFileTree, 
  CodebaseCatalogItem, 
  ActiveRepoContext, 
  RepoHistoryItem, 
  IdeType, 
  IdeConfigFile, 
  VibePlatformType, 
  VibePromptPack, 
  McpToolDefinition, 
  CliCommandLog 
} from '../types';

export const FLAGSHIP_CODEBASES: CodebaseCatalogItem[] = [
  {
    id: 'flagship-nextjs',
    repoName: 'vercel/next.js',
    displayName: 'Next.js (App Router)',
    category: 'flagship',
    description: 'The React Framework for the Web with Server Actions, Turbopack, and hybrid SSR.',
    primaryLanguage: 'TypeScript',
    framework: 'Next.js 15 / React 19',
    badgeColor: 'from-slate-700 to-slate-900 border-slate-600',
    starsCount: '128k',
    tags: ['Fullstack', 'App Router', 'Server Components', 'SSR', 'Edge'],
    sampleFileTree: [
      { path: 'package.json', type: 'file' },
      { path: 'next.config.ts', type: 'file' },
      { path: 'tsconfig.json', type: 'file' },
      { path: 'app/layout.tsx', type: 'file' },
      { path: 'app/page.tsx', type: 'file' },
      { path: 'app/api/auth/[...nextauth]/route.ts', type: 'file' },
      { path: 'app/api/projects/route.ts', type: 'file' },
      { path: 'app/dashboard/page.tsx', type: 'file' },
      { path: 'app/dashboard/loading.tsx', type: 'file' },
      { path: 'components/ui/button.tsx', type: 'file' },
      { path: 'components/ui/dialog.tsx', type: 'file' },
      { path: 'components/navbar.tsx', type: 'file' },
      { path: 'lib/db.ts', type: 'file' },
      { path: 'lib/auth.ts', type: 'file' },
      { path: 'lib/utils.ts', type: 'file' },
      { path: 'middleware.ts', type: 'file' },
      { path: 'styles/globals.css', type: 'file' },
      { path: 'tests/e2e/auth.spec.ts', type: 'file' }
    ]
  },
  {
    id: 'flagship-react',
    repoName: 'facebook/react',
    displayName: 'React Core Engine',
    category: 'flagship',
    description: 'The library for web and native user interfaces with Fiber reconciler and hooks core.',
    primaryLanguage: 'JavaScript / Flow',
    framework: 'React Core',
    badgeColor: 'from-cyan-950 to-blue-950 border-cyan-500/40',
    starsCount: '230k',
    tags: ['Reconciler', 'Fiber', 'Hooks', 'Concurrent Mode', 'Virtual DOM'],
    sampleFileTree: [
      { path: 'packages/react/src/React.js', type: 'file' },
      { path: 'packages/react/src/ReactHooks.js', type: 'file' },
      { path: 'packages/react-reconciler/src/ReactFiberWorkLoop.js', type: 'file' },
      { path: 'packages/react-reconciler/src/ReactFiberBeginWork.js', type: 'file' },
      { path: 'packages/react-reconciler/src/ReactFiberCommitWork.js', type: 'file' },
      { path: 'packages/react-dom/src/client/ReactDOMRoot.js', type: 'file' },
      { path: 'packages/scheduler/src/Scheduler.js', type: 'file' },
      { path: 'packages/shared/ReactSymbols.js', type: 'file' }
    ]
  },
  {
    id: 'flagship-fastapi',
    repoName: 'fastapi/fastapi',
    displayName: 'FastAPI Microservices',
    category: 'flagship',
    description: 'High performance, easy to learn, fast to code, ready for production Python async framework.',
    primaryLanguage: 'Python',
    framework: 'FastAPI / Pydantic v2',
    badgeColor: 'from-emerald-950 to-teal-950 border-emerald-500/40',
    starsCount: '81k',
    tags: ['Python', 'AsyncIO', 'Pydantic', 'OpenAPI', 'REST', 'OAuth2'],
    sampleFileTree: [
      { path: 'pyproject.toml', type: 'file' },
      { path: 'app/main.py', type: 'file' },
      { path: 'app/core/config.py', type: 'file' },
      { path: 'app/core/security.py', type: 'file' },
      { path: 'app/api/v1/api.py', type: 'file' },
      { path: 'app/api/v1/endpoints/users.py', type: 'file' },
      { path: 'app/api/v1/endpoints/auth.py', type: 'file' },
      { path: 'app/models/user.py', type: 'file' },
      { path: 'app/schemas/user.py', type: 'file' },
      { path: 'app/db/session.py', type: 'file' },
      { path: 'app/db/base.py', type: 'file' },
      { path: 'alembic/env.py', type: 'file' },
      { path: 'tests/test_main.py', type: 'file' }
    ]
  },
  {
    id: 'flagship-tailwind',
    repoName: 'tailwindlabs/tailwindcss',
    displayName: 'Tailwind CSS v4 (Oxide)',
    category: 'flagship',
    description: 'A utility-first CSS framework packed with classes built on a lightning-fast Rust Oxide compiler.',
    primaryLanguage: 'Rust / TypeScript',
    framework: 'Tailwind v4 / Lightning CSS',
    badgeColor: 'from-sky-950 to-indigo-950 border-sky-500/40',
    starsCount: '85k',
    tags: ['CSS', 'Compiler', 'Rust', 'Oxide', 'Design System', 'Vite Plugin'],
    sampleFileTree: [
      { path: 'crates/oxide/src/lib.rs', type: 'file' },
      { path: 'crates/oxide/src/scanner.rs', type: 'file' },
      { path: 'packages/tailwindcss/src/index.ts', type: 'file' },
      { path: 'packages/tailwindcss/src/theme.ts', type: 'file' },
      { path: 'packages/tailwindcss/src/ast.ts', type: 'file' },
      { path: 'packages/@tailwindcss-vite/src/index.ts', type: 'file' }
    ]
  },
  {
    id: 'flagship-langchain',
    repoName: 'langchain-ai/langchain',
    displayName: 'LangChain Agentic Swarm',
    category: 'flagship',
    description: 'Building context-aware reasoning applications with agents, memory, tools, and vector stores.',
    primaryLanguage: 'Python / TypeScript',
    framework: 'LangChain / LangGraph',
    badgeColor: 'from-amber-950 to-orange-950 border-amber-500/40',
    starsCount: '102k',
    tags: ['AI Agents', 'LLM', 'RAG', 'VectorDB', 'LangGraph', 'Tools'],
    sampleFileTree: [
      { path: 'libs/core/langchain_core/prompts/chat.py', type: 'file' },
      { path: 'libs/core/langchain_core/runnables/base.py', type: 'file' },
      { path: 'libs/core/langchain_core/messages/ai.py', type: 'file' },
      { path: 'libs/langchain/langchain/agents/agent.py', type: 'file' },
      { path: 'libs/langchain/langchain/chains/retrieval.py', type: 'file' },
      { path: 'libs/community/langchain_community/vectorstores/pgvector.py', type: 'file' },
      { path: 'libs/langgraph/langgraph/graph/state.py', type: 'file' }
    ]
  },
  {
    id: 'flagship-shadcn',
    repoName: 'shadcn-ui/ui',
    displayName: 'shadcn/ui Design System',
    category: 'flagship',
    description: 'Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable.',
    primaryLanguage: 'TypeScript',
    framework: 'Radix UI / Tailwind CSS',
    badgeColor: 'from-slate-900 to-zinc-950 border-zinc-700',
    starsCount: '78k',
    tags: ['Components', 'Radix', 'Accessibility', 'CLI Generator', 'React'],
    sampleFileTree: [
      { path: 'packages/cli/src/index.ts', type: 'file' },
      { path: 'packages/cli/src/commands/add.ts', type: 'file' },
      { path: 'apps/www/components/ui/button.tsx', type: 'file' },
      { path: 'apps/www/components/ui/card.tsx', type: 'file' },
      { path: 'apps/www/components/ui/tabs.tsx', type: 'file' },
      { path: 'apps/www/components/ui/command.tsx', type: 'file' },
      { path: 'apps/www/components/ui/dropdown-menu.tsx', type: 'file' }
    ]
  },
  {
    id: 'flagship-express',
    repoName: 'expressjs/express',
    displayName: 'Express.js Enterprise',
    category: 'flagship',
    description: 'Fast, unopinionated, minimalist web framework for Node.js REST APIs and microservices.',
    primaryLanguage: 'JavaScript',
    framework: 'Express 5.0',
    badgeColor: 'from-violet-950 to-slate-950 border-violet-500/40',
    starsCount: '65k',
    tags: ['Node.js', 'REST', 'Middleware', 'Router', 'Microservices'],
    sampleFileTree: [
      { path: 'lib/express.js', type: 'file' },
      { path: 'lib/application.js', type: 'file' },
      { path: 'lib/router/index.js', type: 'file' },
      { path: 'lib/router/route.js', type: 'file' },
      { path: 'lib/router/layer.js', type: 'file' },
      { path: 'lib/middleware/init.js', type: 'file' },
      { path: 'lib/response.js', type: 'file' },
      { path: 'lib/request.js', type: 'file' }
    ]
  },
  {
    id: 'flagship-supabase',
    repoName: 'supabase/supabase',
    displayName: 'Supabase Postgres Cloud',
    category: 'flagship',
    description: 'The open source Firebase alternative with Postgres database, Authentication, instant APIs, Realtime.',
    primaryLanguage: 'TypeScript / Go / SQL',
    framework: 'Supabase / PostgreSQL / PostgREST',
    badgeColor: 'from-emerald-950 to-green-950 border-emerald-500/40',
    starsCount: '75k',
    tags: ['PostgreSQL', 'Auth', 'Realtime', 'Storage', 'Edge Functions'],
    sampleFileTree: [
      { path: 'apps/studio/pages/project/[ref]/editor.tsx', type: 'file' },
      { path: 'apps/studio/lib/api.ts', type: 'file' },
      { path: 'packages/gotrue/src/GoTrueClient.ts', type: 'file' },
      { path: 'packages/postgrest-js/src/PostgrestClient.ts', type: 'file' },
      { path: 'packages/realtime-js/src/RealtimeClient.ts', type: 'file' },
      { path: 'supabase/migrations/20260101_init.sql', type: 'file' }
    ]
  }
];

export function getUnifiedCodebaseCatalog(
  activeRepoContext: ActiveRepoContext | null,
  repoHistory: RepoHistoryItem[] = [],
  customCodebases: CodebaseCatalogItem[] = []
): CodebaseCatalogItem[] {
  const result: CodebaseCatalogItem[] = [];

  // 1. Active Workspace Repo
  if (activeRepoContext && activeRepoContext.repoName) {
    result.push({
      id: 'active-workspace',
      repoName: activeRepoContext.repoName,
      displayName: `Active: ${activeRepoContext.repoName}`,
      category: 'workspace',
      description: 'Currently loaded in Link2Ink / A2A Studio active workspace memory.',
      primaryLanguage: detectDominantLanguage(activeRepoContext.fileTree),
      framework: detectFrameworkHint(activeRepoContext.fileTree),
      badgeColor: 'from-violet-950 via-indigo-950 to-cyan-950 border-violet-500',
      sampleFileTree: activeRepoContext.fileTree,
      tags: ['Workspace Active', 'Live Synchronized', 'In-Memory']
    });
  }

  // 2. Custom User-Added Codebases
  customCodebases.forEach(custom => {
    if (!result.some(r => r.repoName.toLowerCase() === custom.repoName.toLowerCase())) {
      result.push(custom);
    }
  });

  // 3. History Repositories
  repoHistory.forEach((hist, idx) => {
    if (activeRepoContext?.repoName === hist.repoName) return; // avoid duplicate
    result.push({
      id: `history-${hist.id || idx}`,
      repoName: hist.repoName,
      displayName: hist.repoName,
      category: 'history',
      description: `Previously analyzed in session on ${new Date(hist.date).toLocaleDateString()}.`,
      primaryLanguage: 'TypeScript / Polyglot',
      framework: hist.is3D ? '3D Isometric Flow' : hist.style || 'Architecture Graph',
      badgeColor: 'from-slate-900 to-slate-950 border-slate-700',
      sampleFileTree: [
        { path: 'package.json', type: 'file' },
        { path: 'src/index.ts', type: 'file' },
        { path: 'src/components/App.tsx', type: 'file' },
        { path: 'src/lib/api.ts', type: 'file' }
      ],
      tags: ['History', 'Saved Analysis']
    });
  });

  // 4. Flagship Catalog Presets
  FLAGSHIP_CODEBASES.forEach(flagship => {
    if (!result.some(r => r.repoName.toLowerCase() === flagship.repoName.toLowerCase())) {
      result.push(flagship);
    }
  });

  return result;
}

function detectDominantLanguage(fileTree: RepoFileTree[]): string {
  if (!fileTree || fileTree.length === 0) return 'TypeScript';
  const counts: Record<string, number> = {};
  fileTree.forEach(f => {
    const p = f.path.toLowerCase();
    if (p.endsWith('.ts') || p.endsWith('.tsx')) counts['TypeScript'] = (counts['TypeScript'] || 0) + 1;
    else if (p.endsWith('.js') || p.endsWith('.jsx')) counts['JavaScript'] = (counts['JavaScript'] || 0) + 1;
    else if (p.endsWith('.py')) counts['Python'] = (counts['Python'] || 0) + 1;
    else if (p.endsWith('.rs')) counts['Rust'] = (counts['Rust'] || 0) + 1;
    else if (p.endsWith('.go')) counts['Go'] = (counts['Go'] || 0) + 1;
    else if (p.endsWith('.java') || p.endsWith('.kt')) counts['Java/Kotlin'] = (counts['Java/Kotlin'] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : 'TypeScript';
}

function detectFrameworkHint(fileTree: RepoFileTree[]): string {
  if (!fileTree) return 'Modern Web Architecture';
  const paths = fileTree.map(f => f.path.toLowerCase()).join(' ');
  if (paths.includes('next.config') || paths.includes('app/page.')) return 'Next.js 15 (App Router)';
  if (paths.includes('vite.config')) return 'Vite + React 19';
  if (paths.includes('fastapi') || (paths.includes('main.py') && paths.includes('schemas'))) return 'FastAPI';
  if (paths.includes('cargo.toml')) return 'Rust Cargo Workspace';
  if (paths.includes('go.mod')) return 'Go Microservices';
  if (paths.includes('express')) return 'Express / Node.js';
  return 'Full-Stack Architecture';
}

// -------------------------------------------------------------
// CLI SIMULATION ENGINE & PRESET RESPONSES
// -------------------------------------------------------------

export function simulateCliExecution(command: string, codebase: CodebaseCatalogItem): CliCommandLog {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();
  const startTime = Date.now();
  const durationMs = Math.floor(Math.random() * 250) + 120;

  const repo = codebase.repoName;
  const lang = codebase.primaryLanguage;
  const framework = codebase.framework;
  const fileCount = codebase.sampleFileTree.length || 24;

  let stdout: string[] = [];
  let category: CliCommandLog['category'] = 'help';

  if (lower.startsWith('a2a scan') || lower.startsWith('npx a2a scan') || lower.startsWith('link2ink scan')) {
    category = 'scan';
    stdout = [
      `\x1b[36m[a2a-cli v3.7.0]\x1b[0m Scanning repository: \x1b[1;35m${repo}\x1b[0m`,
      `\x1b[90m→ Detected Language: \x1b[32m${lang}\x1b[0m | Framework: \x1b[33m${framework}\x1b[0m`,
      `\x1b[90m→ Scanned \x1b[1m${fileCount * 8 + 42}\x1b[0m source files across \x1b[1m${Math.max(4, Math.floor(fileCount / 2))}\x1b[0m architectural layers.`,
      ``,
      `\x1b[1;32m✓ AST Topological Analysis Complete\x1b[0m (in ${durationMs}ms)`,
      `  ├── Entrypoints:      ${Math.max(1, Math.floor(fileCount / 5))} modules`,
      `  ├── Core Domain:      ${Math.max(3, Math.floor(fileCount / 2))} modules`,
      `  ├── Data / State:     ${Math.max(2, Math.floor(fileCount / 3))} modules`,
      `  └── Infra / Utils:    ${Math.max(2, Math.floor(fileCount / 4))} modules`,
      ``,
      `\x1b[1;34m[Health Grade]\x1b[0m Grade: \x1b[1;32mA (94/100)\x1b[0m | Vibeslop Risk: \x1b[32mLow (8%)\x1b[0m`,
      `\x1b[90mTo inspect visual graph: Run \x1b[36ma2a codemap --open\x1b[0m or view in Link2Ink Studio.`
    ];
  } else if (lower.startsWith('a2a codemap') || lower.includes('--codemap')) {
    category = 'codemap';
    stdout = [
      `\x1b[36m[a2a-cli]\x1b[0m Generating D3 Topological Codemap for \x1b[1;35m${repo}\x1b[0m...`,
      `\x1b[90m→ Constructing directed acyclic graph (DAG) force-layout coordinates...`,
      `\x1b[90m→ Computed ${fileCount} nodes, ${Math.floor(fileCount * 1.6)} links, 0 circular dependency traps.`,
      ``,
      `  ┌─────────────────────────────────────────────────────────────┐`,
      `  │  \x1b[1;36m[Codemap Schematic Preview]\x1b[0m                                 │`,
      `  │  (Client/UI) ──────► [API Gateway] ──────► [Domain Logic]   │`,
      `  │                           │                       │         │`,
      `  │                           ▼                       ▼         │`,
      `  │                     [State Store] ──────► [Database/ORM]    │`,
      `  └─────────────────────────────────────────────────────────────┘`,
      ``,
      `\x1b[1;32m✓ Codemap snapshot generated:\x1b[0m \x1b[4m.a2a/codemap-${repo.replace('/', '-')}.svg\x1b[0m`,
      `\x1b[33m⚡ Codemap telemetry URL ready:\x1b[0m https://ais-dev-eam4s2zhxpzlyygg62qd6e-558652697267.asia-southeast1.run.app/#codemap?repo=${encodeURIComponent(repo)}`
    ];
  } else if (lower.startsWith('a2a vibe-lint') || lower.startsWith('a2a vibe') || lower.includes('antislop')) {
    category = 'vibe';
    stdout = [
      `\x1b[35m[a2a Vibeslop Radar v3.7]\x1b[0m Auditing \x1b[1m${repo}\x1b[0m for AI Slop & architectural debt...`,
      `\x1b[90m→ Rule 1: No nested container recursion (Max depth 3)   [PASS]`,
      `\x1b[90m→ Rule 2: Strict WCAG color contrast & theme balance    [PASS]`,
      `\x1b[90m→ Rule 3: Zero unneeded server routes or mock data       [PASS]`,
      `\x1b[90m→ Rule 4: Clean single-responsibility separation        [PASS]`,
      ``,
      `\x1b[1;32m[Radar Result]\x1b[0m Comprehension Index: \x1b[1;32m98/100\x1b[0m (Zero Hallucinated Boilerplate)`,
      `\x1b[1;34m[Cleanliness]\x1b[0m Cognitive Load: \x1b[32mOptimal\x1b[0m | Vibeslop Defense Shield: \x1b[32mACTIVE\x1b[0m`,
      `\x1b[90mExported ruleset to: \x1b[0m\x1b[36m.cursorrules\x1b[0m & \x1b[36m.a2a/vibe-guardrails.json\x1b[0m`
    ];
  } else if (lower.startsWith('a2a plan') || lower.includes('--plan')) {
    category = 'plan';
    const planSubject = trimmed.replace(/^a2a plan/i, '').trim() || 'Modernize Architecture & State Layer';
    stdout = [
      `\x1b[35m[a2a Plan Creator]\x1b[0m Synthesizing milestone execution DAG for: \x1b[1;37m"${planSubject}"\x1b[0m`,
      `\x1b[90m→ Codebase Context: \x1b[36m${repo}\x1b[0m (${lang} / ${framework})`,
      ``,
      `  \x1b[1;33mPhase 1: Invariant Audit & Baseline Hardening\x1b[0m (Est: 2h)`,
      `    ├── [Task 1.1] Extract shared type contracts into types.ts`,
      `    └── [Task 1.2] Audit critical entrypoints for circular dependencies`,
      ``,
      `  \x1b[1;36mPhase 2: Modular Implementation & Decoupling\x1b[0m (Est: 4h)`,
      `    ├── [Task 2.1] Refactor core service pipelines`,
      `    └── [Task 2.2] Implement defensive fallback boundaries`,
      ``,
      `  \x1b[1;32mPhase 3: Verification, Telemetry & Rollback Strategy\x1b[0m (Est: 1.5h)`,
      `    └── [Task 3.1] Run automated health check test suite`,
      ``,
      `\x1b[1;32m✓ Implementation Plan DAG Created (3 Milestones, 5 Tasks)\x1b[0m`,
      `\x1b[90mSynced to Link2Ink Plan Creator studio board.\x1b[0m`
    ];
  } else if (lower.startsWith('a2a mcp') || lower.includes('mcp serve')) {
    category = 'mcp';
    stdout = [
      `\x1b[34m[a2a MCP Server]\x1b[0m Booting Model Context Protocol (v2024-11-05)...`,
      `\x1b[90m→ Transport: stdio / JSON-RPC 2.0`,
      `\x1b[90m→ Target Codebase: \x1b[1;35m${repo}\x1b[0m`,
      ``,
      `\x1b[1;32m✓ 6 MCP Tools Registered & Ready:\x1b[0m`,
      `  • \x1b[36mlink2ink_get_codemap\x1b[0m         - Returns live D3 topological nodes & links`,
      `  • \x1b[36mlink2ink_run_health_check\x1b[0m    - Detects anti-patterns & circular dependencies`,
      `  • \x1b[36mlink2ink_generate_plan\x1b[0m       - Synthesizes milestone DAG execution plans`,
      `  • \x1b[36mlink2ink_inspect_module\x1b[0m      - Returns AST contracts, exports & slop risk`,
      `  • \x1b[36mlink2ink_vibe_lint\x1b[0m          - Anti-slop firewall validation`,
      `  • \x1b[36mlink2ink_export_a2ui\x1b[0m        - Emits declarative A2UI interface schema`,
      ``,
      `\x1b[33m[Claude Desktop / Cursor Ready]\x1b[0m Listening on standard I/O.`
    ];
  } else if (lower.startsWith('a2a diff') || lower.includes('diff')) {
    category = 'diff';
    stdout = [
      `\x1b[36m[a2a Architecture Diff]\x1b[0m Comparing \x1b[1mmain..HEAD\x1b[0m on \x1b[35m${repo}\x1b[0m`,
      `\x1b[90m→ Analyzing architectural impact across 4 tiers...`,
      ``,
      `  \x1b[32m+ [Added]\x1b[0m    components/integrations/IntegrationsConsole.tsx (Tier: UI/Client)`,
      `  \x1b[32m+ [Added]\x1b[0m    services/integrationService.ts (Tier: Core Domain)`,
      `  \x1b[33m~ [Modified]\x1b[0m types.ts (+109 lines, ViewMode + Integrations types)`,
      `  \x1b[33m~ [Modified]\x1b[0m App.tsx (Integrated ViewMode.INTEGRATIONS)`,
      ``,
      `\x1b[1;32m✓ Net Architectural Churn: +2 Modules, 0 Breaking Changes, Risk: Low\x1b[0m`
    ];
  } else if (lower.startsWith('a2a init') || lower.includes('init')) {
    category = 'init';
    stdout = [
      `\x1b[36m[a2a-cli]\x1b[0m Initializing Link2Ink Studio configuration for \x1b[1;35m${repo}\x1b[0m...`,
      `\x1b[32m✓ Created\x1b[0m .a2arc`,
      `\x1b[32m✓ Created\x1b[0m link2ink.config.json`,
      `\x1b[32m✓ Created\x1b[0m .cursorrules (Tailored to ${lang} / ${framework})`,
      `\x1b[32m✓ Created\x1b[0m .github/workflows/a2a-architecture-firewall.yml`,
      ``,
      `\x1b[1;32mInitialization complete! Run 'a2a scan' to analyze your repository.\x1b[0m`
    ];
  } else if (lower.startsWith('a2a export') || lower.includes('export')) {
    category = 'export';
    stdout = [
      `\x1b[36m[a2a-cli]\x1b[0m Exporting architectural artifacts for \x1b[1;35m${repo}\x1b[0m...`,
      `\x1b[32m✓ Exported:\x1b[0m .a2a/artifacts/codemap-topology.svg (24.8 KB)`,
      `\x1b[32m✓ Exported:\x1b[0m .a2a/artifacts/architecture-spec.json (12.4 KB)`,
      `\x1b[32m✓ Exported:\x1b[0m .a2a/artifacts/vibe-context-pack.md (8.1 KB)`,
      `\x1b[32m✓ Exported:\x1b[0m .a2a/artifacts/mcp-manifest.json (3.2 KB)`,
      ``,
      `\x1b[1;32m✓ All artifacts exported successfully.\x1b[0m`
    ];
  } else {
    category = 'help';
    stdout = [
      `\x1b[1;35mLink2Ink / A2A Studio Developer CLI v3.7.0\x1b[0m`,
      `Architectural Intelligence, Topological Codemaps, and Vibe Platform Protocol`,
      ``,
      `\x1b[1;33mUSAGE:\x1b[0m`,
      `  $ a2a <command> [options]`,
      `  $ npx link2ink <command> [options]`,
      ``,
      `\x1b[1;33mAVAILABLE COMMANDS:\x1b[0m`,
      `  \x1b[36mscan\x1b[0m        [path]       Deep topological AST scan and architectural health check`,
      `  \x1b[36mcodemap\x1b[0m     [--open]     Generate interactive D3 graph or export vector schematic`,
      `  \x1b[36mvibe-lint\x1b[0m   [--strict]   Run anti-slop firewall and validate clean abstractions`,
      `  \x1b[36mplan\x1b[0m        <goal>       Generate execution DAG milestone plan for features/refactors`,
      `  \x1b[36mmcp\x1b[0m         serve        Launch Model Context Protocol server for Claude / Cursor`,
      `  \x1b[36mdiff\x1b[0m        <ref1..ref2> Architecture and semantic invariant diff`,
      `  \x1b[36mexport\x1b[0m      [--format]   Export SVG blueprints, JSON schemas, and Vibe context packs`,
      `  \x1b[36minit\x1b[0m        [--ide]      Generate .cursorrules, .vscode configs, and CI workflows`,
      ``,
      `\x1b[1;33mACTIVE TARGET:\x1b[0m \x1b[1;32m${repo}\x1b[0m (${lang} / ${framework})`
    ];
  }

  return {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    command,
    timestamp: startTime,
    stdout,
    exitCode: 0,
    durationMs,
    category
  };
}

// -------------------------------------------------------------
// IDE CONFIGURATION GENERATORS (CURSOR, VS CODE, JETBRAINS, ZED, NEOVIM)
// -------------------------------------------------------------

export function generateIdeConfigs(ideType: IdeType, codebase: CodebaseCatalogItem): IdeConfigFile[] {
  const repo = codebase.repoName;
  const lang = codebase.primaryLanguage;
  const framework = codebase.framework;
  const filesSample = codebase.sampleFileTree.slice(0, 15).map(f => `  - ${f.path}`).join('\n');

  switch (ideType) {
    case 'cursor':
      return [
        {
          id: 'cursor-rules',
          filename: '.cursorrules',
          destinationPath: '/.cursorrules',
          language: 'markdown',
          title: 'Cursor Rules (Anti-Slop & Architecture Guardrails)',
          description: 'Project-specific instructions for Cursor AI to preserve architectural integrity and prevent AI slop.',
          features: ['Architectural Invariants', 'Anti-Slop Guidelines', 'Design System Enforcement', 'TypeScript Strict Contracts'],
          content: `# Link2Ink / A2A Architecture Guardrails for ${repo}
# Stack: ${lang} | ${framework}

## 1. Core Architectural Hierarchy
- Target Repository: ${repo}
- Primary Framework: ${framework}
- Strictly enforce single-responsibility layering (Entrypoint -> API/Route -> Domain Logic -> State/DB -> Utils).
- Never introduce unsolicited backend routes or mock database files unless explicitly requested.

## 2. Anti-Slop Principles
- Color & FX: No random purple-to-blue gradients, gradient text, or arbitrary glowing shadows.
- Layout: No nested cards inside cards. Max outer container padding >= inner child spacing.
- Typography: Use mathematical font scales. Do not truncate labels inside badges or buttons.
- State: Never update state directly in React render cycles. Keep useEffect dependencies primitive.

## 3. Grounded Codebase Structure
Key reference paths in this project:
${filesSample}

## 4. MCP Tools Available
When deeper topological context is needed, query the Link2Ink MCP Server:
- Use \`link2ink_get_codemap\` to understand dependency impact before major refactors.
- Use \`link2ink_run_health_check\` to detect circular dependencies.
`
        },
        {
          id: 'cursor-mdc',
          filename: 'architecture.mdc',
          destinationPath: '/.cursor/rules/architecture.mdc',
          language: 'markdown',
          title: 'Cursor MDC Rule Spec',
          description: 'Modular rules configuration compatible with Cursor 0.45+ MDC format.',
          features: ['MDC Rule Triggering', 'Glob Pattern Matching', 'Type Safety Guardrails'],
          content: `---
description: Architectural standards and design rules for ${repo}
globs: ["**/*.{ts,tsx,js,jsx,py,rs,go}"]
alwaysApply: true
---

# Architectural Invariants for ${repo}
1. Always check type exports before refactoring shared interfaces.
2. Keep UI component files under 350 lines by extracting modular sub-components.
3. Preserve established Tailwind CSS and styling themes across all changes.
`
        }
      ];

    case 'vscode':
      return [
        {
          id: 'vscode-tasks',
          filename: 'tasks.json',
          destinationPath: '/.vscode/tasks.json',
          language: 'json',
          title: 'VS Code Tasks (a2a Automation)',
          description: 'Pre-configured build, scan, and architectural validation tasks for the Command Palette.',
          features: ['1-Click Scan', 'Vibe Linting Task', 'Codemap Export Task'],
          content: JSON.stringify({
            version: "2.0.0",
            tasks: [
              {
                label: "a2a: Architectural Health Scan",
                type: "shell",
                command: "npx link2ink scan ./ --format=json",
                problemMatcher: ["$eslint-compact"],
                group: {
                  kind: "test",
                  isDefault: true
                },
                presentation: {
                  reveal: "always",
                  panel: "dedicated",
                  clear: true
                }
              },
              {
                label: "a2a: Vibeslop Defense Audit",
                type: "shell",
                command: "npx link2ink vibe-lint --strict",
                problemMatcher: []
              },
              {
                label: "a2a: Start Local MCP Server",
                type: "shell",
                command: "npx link2ink mcp serve",
                isBackground: true,
                problemMatcher: []
              }
            ]
          }, null, 2)
        },
        {
          id: 'vscode-settings',
          filename: 'settings.json',
          destinationPath: '/.vscode/settings.json',
          language: 'json',
          title: 'VS Code Workspace Settings',
          description: 'Optimized workspace editor and telemetry settings for Link2Ink / A2A Studio.',
          features: ['In-Editor Diagnostics', 'Schema Associations', 'Tailwind IntelliSense'],
          content: JSON.stringify({
            "editor.formatOnSave": true,
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "tailwindCSS.experimental.classRegex": [
              ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
              ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
            ],
            "json.schemas": [
              {
                "fileMatch": ["link2ink.config.json", ".a2arc"],
                "url": "https://link2ink.studio/schemas/a2a-config.v1.json"
              },
              {
                "fileMatch": ["*.a2ui.json"],
                "url": "https://link2ink.studio/schemas/a2ui-spec.v1.json"
              }
            ]
          }, null, 2)
        },
        {
          id: 'vscode-extensions',
          filename: 'extensions.json',
          destinationPath: '/.vscode/extensions.json',
          language: 'json',
          title: 'VS Code Recommended Extensions',
          description: 'Recommended extensions for full architectural parity.',
          features: ['Tailwind CSS', 'ESLint', 'Prettier', 'MCP Bridge'],
          content: JSON.stringify({
            recommendations: [
              "bradlc.vscode-tailwindcss",
              "dbaeumer.vscode-eslint",
              "esbenp.prettier-vscode",
              "usernamehw.errorlens"
            ]
          }, null, 2)
        }
      ];

    case 'jetbrains':
      return [
        {
          id: 'jetbrains-tools',
          filename: 'externalTools.xml',
          destinationPath: '/.idea/externalTools.xml',
          language: 'xml',
          title: 'JetBrains External Tools Bridge',
          description: 'Integration for IntelliJ IDEA, WebStorm, PyCharm, and CLion.',
          features: ['Right-Click Scan', 'Toolbar Action Buttons', 'Fast CLI Hook'],
          content: `<?xml version="1.0" encoding="UTF-8"?>
<toolSet name="Link2Ink / A2A Studio">
  <tool name="a2a Scan Architecture" description="Topological AST analysis and circular dependency check" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchUtility="true">
    <exec>
      <option name="COMMAND" value="npx" />
      <option name="PARAMETERS" value="link2ink scan $ProjectFileDir$" />
      <option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
    </exec>
  </tool>
  <tool name="a2a Vibeslop Audit" description="Check codebase against anti-slop rules" showInMainMenu="true" showInEditor="true">
    <exec>
      <option name="COMMAND" value="npx" />
      <option name="PARAMETERS" value="link2ink vibe-lint --strict" />
      <option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
    </exec>
  </tool>
</toolSet>`
        }
      ];

    case 'zed':
      return [
        {
          id: 'zed-settings',
          filename: 'settings.json',
          destinationPath: '/.zed/settings.json',
          language: 'json',
          title: 'Zed Editor Configuration',
          description: 'Optimized language server and slash-commands for Zed Editor.',
          features: ['Zed Slash Commands', 'Format on Save', 'In-Editor Diagnostics'],
          content: JSON.stringify({
            "format_on_save": "on",
            "tab_size": 2,
            "hard_tabs": false,
            "languages": {
              "TypeScript": {
                "format_on_save": "on",
                "formatter": {
                  "external": {
                    "command": "prettier",
                    "arguments": ["--stdin-filepath", "{buffer_path}"]
                  }
                }
              }
            }
          }, null, 2)
        }
      ];

    case 'neovim':
      return [
        {
          id: 'neovim-lua',
          filename: 'link2ink.lua',
          destinationPath: '/lua/plugins/link2ink.lua',
          language: 'lua',
          title: 'Neovim / Lazy.nvim Plugin Spec',
          description: 'Custom Lua bindings and keymaps for Neovim developers.',
          features: ['Leader Keymaps (<leader>as, <leader>ac)', 'Floating Terminal Output', 'Telescope Codemap Picker'],
          content: `-- Link2Ink / A2A Neovim Integration for ${repo}
return {
  "akinsho/toggleterm.nvim",
  keys = {
    { "<leader>as", "<cmd>TermExec cmd='npx link2ink scan .' direction=float<cr>", desc = "a2a: Scan Architecture" },
    { "<leader>ac", "<cmd>TermExec cmd='npx link2ink codemap --open' direction=float<cr>", desc = "a2a: Open Codemap" },
    { "<leader>av", "<cmd>TermExec cmd='npx link2ink vibe-lint --strict' direction=float<cr>", desc = "a2a: Vibe Slop Audit" },
    { "<leader>ap", "<cmd>TermExec cmd='npx link2ink plan' direction=float<cr>", desc = "a2a: Plan Creator" },
  },
  opts = {
    float_opts = {
      border = "curved",
    },
  },
}`
        }
      ];

    case 'windsurf':
    default:
      return [
        {
          id: 'windsurf-rules',
          filename: '.windsurfrules',
          destinationPath: '/.windsurfrules',
          language: 'markdown',
          title: 'Windsurf Cascade Rules',
          description: 'Context rules for Windsurf AI Cascade flow.',
          features: ['Cascade Memory Anchors', 'Design System Invariants', 'Type Verification'],
          content: `# Windsurf AI Rules for ${repo}
- Respect architectural layers: ${framework}
- Avoid adding unnecessary npm packages or unrequested backend layers.
- Check type contracts before modifying shared utility functions.
`
        }
      ];
  }
}

// -------------------------------------------------------------
// VIBE PLATFORMS EXPORT DECK (v0, BOLT.NEW, LOVABLE, CURSOR, ETC.)
// -------------------------------------------------------------

export function generateVibePromptPacks(
  codebase: CodebaseCatalogItem,
  options: {
    includeFileTree: boolean;
    includeAntiSlop: boolean;
    includeContracts: boolean;
    includeDagFlow: boolean;
    tokenBudget: 'compact' | 'standard' | 'maximum';
  }
): VibePromptPack[] {
  const repo = codebase.repoName;
  const lang = codebase.primaryLanguage;
  const framework = codebase.framework;

  const fileTreeSnippet = codebase.sampleFileTree
    .slice(0, options.tokenBudget === 'compact' ? 8 : options.tokenBudget === 'standard' ? 18 : 40)
    .map(f => `- ${f.path}`)
    .join('\n');

  const antiSlopText = options.includeAntiSlop
    ? `\n### Anti-Slop & Quality Guardrails:
- No generic purple/blue gradients or neon drop-shadows.
- No nested cards (card inside card). Use whitespace and subtle dividers instead.
- Strict typography pairing with clean line heights (1.5-1.7).
- Zero mock servers or artificial splash screens. Show working UI immediately.`
    : '';

  const treeSection = options.includeFileTree
    ? `\n### Reference Architecture & File Tree:\n\`\`\`\n${fileTreeSnippet}\n\`\`\``
    : '';

  const dagSection = options.includeDagFlow
    ? `\n### Architectural Flow:
1. Client UI Entrypoint -> Dispatches Actions
2. State Machine / Hook Handlers -> Manages In-Memory State
3. Service Integration Layer -> Interacts with APIs/Contracts`
    : '';

  return [
    {
      platform: 'v0',
      platformName: 'v0 by Vercel',
      tagline: 'Component & UI Generation with shadcn/ui and Tailwind CSS',
      iconName: 'Sparkles',
      accentColor: 'from-slate-800 to-zinc-900 border-zinc-700',
      recommendedModel: 'Claude 3.7 Sonnet / GPT-4o',
      estimatedTokens: 780,
      description: 'Pre-formatted prompt context for generating flawless React components in v0 that match this repository\'s exact design system.',
      systemInstruction: `You are an expert React and Tailwind design engineer matching the architecture of ${repo}. Use modern React 19, Tailwind CSS, and Lucide icons.`,
      guardrails: [
        'Use Tailwind utility classes directly',
        'Import icons exclusively from lucide-react',
        'Do not generate mock API keys or settings forms unless requested',
        'Adhere to single-view responsive layout'
      ],
      promptText: `Create a modern, high-craft feature component for ${repo} (${framework}).
Ensure full visual parity with our dark slate (#020617) theme, violet-indigo accents, and clean typography.
${antiSlopText}
${treeSection}
${dagSection}

Please provide the complete, self-contained React component with TypeScript types.`,
      contextPacks: [
        { title: 'File Tree Context', content: fileTreeSnippet, type: 'tree' },
        { title: 'Anti-Slop Guardrails', content: antiSlopText, type: 'rules' }
      ]
    },
    {
      platform: 'bolt_new',
      platformName: 'Bolt.new (StackBlitz)',
      tagline: 'Full-Stack WebContainer Application Scaffolding',
      iconName: 'Zap',
      accentColor: 'from-amber-950 to-orange-950 border-amber-500/40',
      recommendedModel: 'Claude 3.7 Sonnet',
      estimatedTokens: 1120,
      description: 'Scaffold a complete, running full-stack app in Bolt.new WebContainers matching this codebase structure.',
      systemInstruction: `You are building a production-ready application mirroring ${repo}. Provide all file paths, dependencies in package.json, and fully implemented code.`,
      guardrails: [
        'Configure Vite dev server on port 3000 host 0.0.0.0',
        'Include full package.json dependencies',
        'Ensure zero build errors with TypeScript strict mode'
      ],
      promptText: `Scaffold a complete Vite + React application mirroring the architecture of ${repo} (${framework}).
${treeSection}
${antiSlopText}
${dagSection}

Set up all initial files, modular sub-components, types in types.ts, and services.`,
      contextPacks: [
        { title: 'Project Manifest', content: `Target: ${repo}\nFramework: ${framework}\nLanguage: ${lang}`, type: 'architecture' },
        { title: 'File Structure', content: fileTreeSnippet, type: 'tree' }
      ]
    },
    {
      platform: 'lovable',
      platformName: 'Lovable.dev',
      tagline: 'AI Full-Stack App Builder with Supabase & React',
      iconName: 'Heart',
      accentColor: 'from-pink-950 to-rose-950 border-pink-500/40',
      recommendedModel: 'GPT-4o / Claude 3.5 Sonnet',
      estimatedTokens: 890,
      description: 'Prompt package for generating Supabase schema, React views, and interactive state in Lovable.',
      systemInstruction: `You are an elite product architect on Lovable. Build an intuitive application with clean UI and resilient Supabase backend integration for ${repo}.`,
      guardrails: [
        'Use clean relational schema design',
        'Provide responsive UI for mobile and desktop',
        'Use semantic Tailwind color palettes'
      ],
      promptText: `Build an interactive dashboard module for ${repo}.
Stack: ${lang} / ${framework}.
${treeSection}
${antiSlopText}

Include intuitive controls, filter options, and seamless responsive layout.`,
      contextPacks: [
        { title: 'Schema & Architecture', content: `Base repo: ${repo}`, type: 'architecture' }
      ]
    },
    {
      platform: 'cursor_composer',
      platformName: 'Cursor Composer',
      tagline: 'Multi-File Agentic Refactoring & Feature Implementation',
      iconName: 'Terminal',
      accentColor: 'from-cyan-950 to-blue-950 border-cyan-500/40',
      recommendedModel: 'Claude 3.7 Sonnet (Thinking) / GPT-4o',
      estimatedTokens: 1450,
      description: 'Comprehensive multi-file instructions designed specifically for Cursor Composer (Cmd+I) agentic loops.',
      systemInstruction: `You are Cursor Composer operating directly in ${repo}. Make atomic, multi-file edits while maintaining architectural invariants.`,
      guardrails: [
        'Edit files surgically without wiping existing logic',
        'Update types.ts before creating new component props',
        'Verify imports and avoid circular dependency chains'
      ],
      promptText: `@Codebase I need to implement a new feature in ${repo}.
Reference Files:
${fileTreeSnippet}

Architectural Rules:
${antiSlopText}
${dagSection}

Please plan the changes across types.ts, components, and services, then implement them sequentially.`,
      contextPacks: [
        { title: 'Composer Rules', content: 'Atomic multi-file generation with strict types.', type: 'rules' }
      ]
    },
    {
      platform: 'chatgpt_canvas',
      platformName: 'ChatGPT Canvas',
      tagline: 'Interactive Code & Architecture Canvas Co-Creation',
      iconName: 'Layers',
      accentColor: 'from-emerald-950 to-teal-950 border-emerald-500/40',
      recommendedModel: 'GPT-4o with Canvas',
      estimatedTokens: 650,
      description: 'Streamlined prompt context tailored for ChatGPT Canvas side-by-side editing.',
      systemInstruction: `You are working in ChatGPT Canvas. Refine and iterate on code modules for ${repo}.`,
      guardrails: ['Keep code clean and commented', 'Maintain type safety'],
      promptText: `Open a canvas to draft a core module for ${repo} (${framework}).
Key Architectural Constraints:
${antiSlopText}
${treeSection}`,
      contextPacks: [
        { title: 'Canvas Prompt', content: `Focus on ${repo}`, type: 'rules' }
      ]
    },
    {
      platform: 'claude_artifacts',
      platformName: 'Claude Artifacts',
      tagline: 'Single-File & Modular Interactive React Prototypes',
      iconName: 'Cpu',
      accentColor: 'from-violet-950 to-purple-950 border-violet-500/40',
      recommendedModel: 'Claude 3.7 Sonnet',
      estimatedTokens: 920,
      description: 'Interactive artifact specification for rendering live interactive tools directly in Claude chat.',
      systemInstruction: `Generate an interactive React artifact using Tailwind CSS and Lucide React icons matching ${repo}.`,
      guardrails: ['Self-contained executable React component', 'Use Tailwind CSS classes'],
      promptText: `Create an interactive Claude Artifact demonstrating the core workflow of ${repo}.
${treeSection}
${antiSlopText}`,
      contextPacks: [
        { title: 'Artifact Blueprint', content: `Repository: ${repo}`, type: 'architecture' }
      ]
    },
    {
      platform: 'replit',
      platformName: 'Replit Agent',
      tagline: 'Autonomous Autonomous Environment Deployment',
      iconName: 'Flame',
      accentColor: 'from-red-950 to-orange-950 border-red-500/40',
      recommendedModel: 'Replit Agent Core',
      estimatedTokens: 820,
      description: 'Configuration and prompt spec for Replit Agent autonomous builds.',
      systemInstruction: `You are the Replit Agent building an environment for ${repo}.`,
      guardrails: ['Set up .replit workflow', 'Install all prerequisites'],
      promptText: `Deploy a full running instance inspired by ${repo}.
${treeSection}
${antiSlopText}`,
      contextPacks: [
        { title: 'Replit Config', content: `run = "npm run dev"`, type: 'architecture' }
      ]
    }
  ];
}

// -------------------------------------------------------------
// MODEL CONTEXT PROTOCOL (MCP) TOOL DEFINITIONS & MOCK EXECUTOR
// -------------------------------------------------------------

export const MCP_TOOLS_CATALOG: McpToolDefinition[] = [
  {
    name: 'link2ink_get_codemap',
    description: 'Retrieves the complete D3 topological AST codemap (nodes, links, tiers, and categories) for a repository.',
    category: 'Topology',
    parameters: [
      { name: 'repoName', type: 'string', required: true, description: 'The GitHub repository name (e.g., "facebook/react" or "vercel/next.js")' },
      { name: 'depth', type: 'number', required: false, description: 'Maximum directory traversal depth (default: 4)' },
      { name: 'tierFilter', type: 'string', required: false, description: 'Filter nodes by tier (e.g., "entrypoint", "core_domain", "data_state")' }
    ],
    jsonSchema: {
      type: "object",
      properties: {
        repoName: { type: "string", description: "GitHub repo slug" },
        depth: { type: "number", default: 4 },
        tierFilter: { type: "string", enum: ["all", "entrypoint", "routing_api", "core_domain", "data_state", "infra_config"] }
      },
      required: ["repoName"]
    },
    samplePayload: {
      repoName: "vercel/next.js",
      depth: 3,
      tierFilter: "all"
    },
    exampleResponse: JSON.stringify({
      status: "success",
      repoName: "vercel/next.js",
      totalNodes: 18,
      totalLinks: 24,
      architectureTiers: ["entrypoint", "routing_api", "core_domain", "data_state", "infra_config"],
      healthScore: 96,
      topologicalRoot: "app/layout.tsx"
    }, null, 2)
  },
  {
    name: 'link2ink_run_health_check',
    description: 'Runs proactive architectural health checks, circular dependency detection, and anti-pattern analysis.',
    category: 'Diagnostics',
    parameters: [
      { name: 'repoName', type: 'string', required: true, description: 'The target repository to scan' },
      { name: 'strictMode', type: 'boolean', required: false, description: 'Enforce zero circular dependency and god-module limits' }
    ],
    jsonSchema: {
      type: "object",
      properties: {
        repoName: { type: "string" },
        strictMode: { type: "boolean", default: true }
      },
      required: ["repoName"]
    },
    samplePayload: {
      repoName: "facebook/react",
      strictMode: true
    },
    exampleResponse: JSON.stringify({
      repoName: "facebook/react",
      overallHealthScore: 94,
      grade: "A",
      circularDependenciesFound: 0,
      highComplexityHotspots: [
        { path: "packages/react-reconciler/src/ReactFiberWorkLoop.js", fanIn: 14, complexityScore: 82 }
      ],
      recommendations: ["Maintain fiber workloop modularity", "Keep shared symbols invariant"]
    }, null, 2)
  },
  {
    name: 'link2ink_generate_plan',
    description: 'Synthesizes a milestone-based DAG implementation plan with tasks, file paths, and risk assessment.',
    category: 'Planning',
    parameters: [
      { name: 'repoName', type: 'string', required: true, description: 'Repository context' },
      { name: 'goal', type: 'string', required: true, description: 'The feature, migration, or refactoring goal' },
      { name: 'planType', type: 'string', required: false, description: 'Type: "refactoring" | "feature" | "migration" | "performance"' }
    ],
    jsonSchema: {
      type: "object",
      properties: {
        repoName: { type: "string" },
        goal: { type: "string" },
        planType: { type: "string", enum: ["feature", "refactoring", "migration", "performance", "security"] }
      },
      required: ["repoName", "goal"]
    },
    samplePayload: {
      repoName: "tailwindlabs/tailwindcss",
      goal: "Add custom CSS container query utilities",
      planType: "feature"
    },
    exampleResponse: JSON.stringify({
      planId: "plan-cq-001",
      title: "Add Container Query Utilities",
      milestonesCount: 3,
      totalTasks: 6,
      estimatedHours: 8,
      riskLevel: "low",
      verificationSuite: ["crates/oxide/tests/scanner_test.rs", "packages/tailwindcss/tests/container.test.ts"]
    }, null, 2)
  },
  {
    name: 'link2ink_vibe_lint',
    description: 'Executes the Vibeslop Defense Radar to prevent AI hallucination, bloat, and UI design anti-patterns.',
    category: 'Quality Firewall',
    parameters: [
      { name: 'repoName', type: 'string', required: true, description: 'Repository name' },
      { name: 'codeSnippet', type: 'string', required: false, description: 'Optional code snippet to check for slop' }
    ],
    jsonSchema: {
      type: "object",
      properties: {
        repoName: { type: "string" },
        codeSnippet: { type: "string" }
      },
      required: ["repoName"]
    },
    samplePayload: {
      repoName: "shadcn-ui/ui",
      codeSnippet: "export const Button = () => <button className=\"bg-purple-600 shadow-xl\">Click</button>"
    },
    exampleResponse: JSON.stringify({
      verdict: "PASS_WITH_WARNINGS",
      comprehensionScore: 92,
      antiSlopViolations: [
        { rule: "Avoid ungrounded purple accent without design-token linkage", severity: "minor" }
      ],
      suggestedFix: "Use standard bg-primary text-primary-foreground tokens."
    }, null, 2)
  }
];

export function executeMockMcpTool(toolName: string, payload: Record<string, any>, codebase: CodebaseCatalogItem): any {
  const tool = MCP_TOOLS_CATALOG.find(t => t.name === toolName);
  if (!tool) {
    return { error: `Tool ${toolName} not found on MCP Server` };
  }

  const repo = payload.repoName || codebase.repoName;
  const lang = codebase.primaryLanguage;
  const framework = codebase.framework;
  const fileCount = codebase.sampleFileTree.length;

  if (toolName === 'link2ink_get_codemap') {
    return {
      jsonrpc: "2.0",
      id: "mcp-req-" + Date.now(),
      result: {
        repoName: repo,
        status: "success",
        language: lang,
        framework: framework,
        nodesCount: fileCount,
        linksCount: Math.floor(fileCount * 1.5),
        sampleNodes: codebase.sampleFileTree.slice(0, 6).map((f, i) => ({
          id: f.path,
          label: f.path.split('/').pop() || f.path,
          tier: i === 0 ? "entrypoint" : i < 3 ? "routing_api" : "core_domain"
        })),
        healthScore: 95
      }
    };
  }

  if (toolName === 'link2ink_run_health_check') {
    return {
      jsonrpc: "2.0",
      id: "mcp-req-" + Date.now(),
      result: {
        repoName: repo,
        overallHealthScore: 96,
        grade: "A",
        healthyModulesCount: fileCount,
        warningModulesCount: 0,
        criticalModulesCount: 0,
        antiPatternViolations: [],
        timestamp: Date.now()
      }
    };
  }

  if (toolName === 'link2ink_generate_plan') {
    return {
      jsonrpc: "2.0",
      id: "mcp-req-" + Date.now(),
      result: {
        repoName: repo,
        planTitle: payload.goal || "Architectural Modernization",
        planType: payload.planType || "feature",
        phases: [
          { phaseNumber: 1, title: "Specification & Contract Definition", taskCount: 2 },
          { phaseNumber: 2, title: "Core Implementation", taskCount: 3 },
          { phaseNumber: 3, title: "Verification & Telemetry", taskCount: 1 }
        ],
        generatedAt: Date.now()
      }
    };
  }

  return {
    jsonrpc: "2.0",
    id: "mcp-req-" + Date.now(),
    result: {
      repoName: repo,
      verdict: "CLEAN",
      comprehensionScore: 98,
      slopRisk: "low",
      details: "All architectural invariants satisfied."
    }
  };
}
