/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { RepoFileTree, D3Node, D3Link, ArchitecturalModule, ArchitecturalDecomposition } from '../types';
import { getTechForFilePath } from './techStackDetector';

export interface ModuleCategoryDefinition {
  id: string;
  category: string;
  name: string;
  role: string;
  group: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  badge: string;
  description: string;
  match: RegExp;
}

// Canonical Architectural Layer Definitions with vibrant engineering styling
export const ARCHITECTURAL_MODULE_DEFINITIONS: ModuleCategoryDefinition[] = [
  {
    id: 'mod-core',
    category: 'core',
    name: 'Core Entry & Manifest',
    role: 'Root Entrypoint & Application Orchestrator',
    group: 0,
    color: '#8b5cf6', // Violet
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.55)',
    icon: '📁',
    badge: 'CORE • ENTRY',
    description: 'Main application bootstrap, manifest declarations, root index and central config orchestrators.',
    match: /^(index\.[jt]sx?|main\.[jt]sx?|App\.[jt]sx?|server\.[jt]sx?|package\.json|vite\.config|tsconfig|metadata\.json|\.env|manifest\.json|app\.[jt]sx?)$/i
  },
  {
    id: 'mod-presentation',
    category: 'presentation',
    name: 'UI & Presentation Layer',
    role: 'User Interface, Components & Views',
    group: 1,
    color: '#38bdf8', // Sky Cyan
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.55)',
    icon: '🎨',
    badge: 'UI • VIEWS',
    description: 'React/Vue components, page templates, screen layouts, design tokens and visual display views.',
    match: /(components|views|pages|screens|layouts|widgets|templates|frontend|client\/src|ui|elements)/i
  },
  {
    id: 'mod-api',
    category: 'api',
    name: 'API & Routing Layer',
    role: 'Request Handlers, Endpoints & Controllers',
    group: 2,
    color: '#34d399', // Emerald
    bgColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.55)',
    icon: '⚡',
    badge: 'API • ROUTES',
    description: 'HTTP request handlers, REST/GraphQL endpoints, API routes, middlewares and server controllers.',
    match: /(api|routes|controllers|endpoints|handlers|router|server\/api|graphql|rest|trpc|grpc|middleware)/i
  },
  {
    id: 'mod-services',
    category: 'services',
    name: 'Domain Logic & Services',
    role: 'Business Domain & State Management',
    group: 3,
    color: '#fbbf24', // Amber
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.55)',
    icon: '🧠',
    badge: 'LOGIC • SERVICES',
    description: 'Business rules, domain usecases, state management, store reducers, custom hooks and workflows.',
    match: /(services|usecases|domain|managers|store|redux|zustand|context|hooks|logic|workflows|orchestrators|lib\/services)/i
  },
  {
    id: 'mod-data',
    category: 'data',
    name: 'Data & Persistence Layer',
    role: 'Database Models, Schemas & Storage',
    group: 4,
    color: '#f472b6', // Pink
    bgColor: 'rgba(244, 114, 182, 0.12)',
    borderColor: 'rgba(244, 114, 182, 0.55)',
    icon: '🗄️',
    badge: 'DATA • STORAGE',
    description: 'Database schemas, entity definitions, ORM models, migration scripts and data access repositories.',
    match: /(models|schemas|db|database|entities|repositories|prisma|drizzle|migrations|dao|storage|queries|firestore)/i
  },
  {
    id: 'mod-utils',
    category: 'utils',
    name: 'Shared Utilities & Helpers',
    role: 'Reusable Shared Functions & Tools',
    group: 5,
    color: '#a78bfa', // Lavender
    bgColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.55)',
    icon: '🔧',
    badge: 'UTILS • SHARED',
    description: 'Reusable helper algorithms, data formatters, string parsers, validators and common utility libs.',
    match: /(utils|helpers|common|shared|lib\/(?!services)|formatters|validators|tools|calc|math)/i
  },
  {
    id: 'mod-config',
    category: 'config',
    name: 'Configuration & Types',
    role: 'Type Contracts, Constants & Environment',
    group: 6,
    color: '#2dd4bf', // Teal
    bgColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: 'rgba(45, 212, 191, 0.55)',
    icon: '⚙️',
    badge: 'CONFIG • TYPES',
    description: 'Global TypeScript type declarations, contract interfaces, constant configurations and theme tokens.',
    match: /(types|interfaces|config|constants|env|styles|theme|typings|settings|defs)/i
  },
  {
    id: 'mod-infra',
    category: 'infra',
    name: 'Infrastructure & DevOps',
    role: 'Build Pipelines, Containers & Deployment',
    group: 7,
    color: '#fb923c', // Orange
    bgColor: 'rgba(251, 146, 60, 0.12)',
    borderColor: 'rgba(251, 146, 60, 0.55)',
    icon: '🚀',
    badge: 'INFRA • DEVOPS',
    description: 'Docker containerization, CI/CD GitHub workflows, Kubernetes configs, scripts and cloud deploy specs.',
    match: /(docker|k8s|kubernetes|terraform|scripts|\.github|ci|workflows|deploy|infra|helm|pipelines)/i
  },
  {
    id: 'mod-testing',
    category: 'testing',
    name: 'Tests & Quality Assurance',
    role: 'Unit, Integration & E2E Suites',
    group: 8,
    color: '#f87171', // Red
    bgColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.55)',
    icon: '🧪',
    badge: 'TEST • QA',
    description: 'Automated unit test specs, integration test harnesses, Cypress/Playwright suites and test mocks.',
    match: /(tests|__tests__|spec|e2e|cypress|playwright|fixtures|mocks|testing|jest)/i
  },
  {
    id: 'mod-docs-assets',
    category: 'assets',
    name: 'Documentation & Assets',
    role: 'Public Media, Icons & Documentation',
    group: 9,
    color: '#94a3b8', // Slate Silver
    bgColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.55)',
    icon: '📚',
    badge: 'DOCS • ASSETS',
    description: 'Public static files, SVGs, imagery, icons, localization strings and architectural documentation.',
    match: /(docs|assets|public|images|icons|static|media|locales|i18n)/i
  }
];

/**
 * Automatically analyzes directory structures and groups files into logical architectural modules.
 */
export function detectArchitecturalModules(
  fileTree: RepoFileTree[],
  repoName: string,
  sampleLimit = 65
): {
  modules: ArchitecturalModule[];
  decomposition: ArchitecturalDecomposition;
  fileToModuleMap: Map<string, ArchitecturalModule>;
} {
  const fileToModuleMap = new Map<string, ArchitecturalModule>();
  const moduleBucketMap = new Map<string, {
    def: ModuleCategoryDefinition;
    files: RepoFileTree[];
    folderSet: Set<string>;
    techCounts: Map<string, number>;
  }>();

  // Initialize standard buckets
  ARCHITECTURAL_MODULE_DEFINITIONS.forEach(def => {
    moduleBucketMap.set(def.id, {
      def,
      files: [],
      folderSet: new Set(),
      techCounts: new Map()
    });
  });

  // Track any custom directory clusters (e.g. monorepo packages or feature directories)
  const customClusters = new Map<string, {
    name: string;
    files: RepoFileTree[];
    folderSet: Set<string>;
    techCounts: Map<string, number>;
  }>();

  // Process file tree
  fileTree.forEach(file => {
    const parts = file.path.split('/');
    const filename = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    const detectedTech = getTechForFilePath(file.path);

    let matchedDef: ModuleCategoryDefinition | null = null;

    // Check if filename is root entry point
    if (parts.length === 1 && ARCHITECTURAL_MODULE_DEFINITIONS[0].match.test(filename)) {
      matchedDef = ARCHITECTURAL_MODULE_DEFINITIONS[0]; // Core
    } else {
      // Test standard patterns in precedence order
      for (const def of ARCHITECTURAL_MODULE_DEFINITIONS) {
        if (def.match.test(file.path)) {
          matchedDef = def;
          break;
        }
      }
    }

    if (matchedDef) {
      const bucket = moduleBucketMap.get(matchedDef.id)!;
      bucket.files.push(file);
      bucket.folderSet.add(folder);
      bucket.techCounts.set(detectedTech.name, (bucket.techCounts.get(detectedTech.name) || 0) + 1);
    } else {
      // Fallback: group by first significant directory segment (e.g. `packages/auth`, `features/billing`)
      const topFolder = parts.length > 1 ? parts[0] : 'root';
      const clusterKey = `cluster-${topFolder}`;

      if (!customClusters.has(clusterKey)) {
        customClusters.set(clusterKey, {
          name: `${topFolder.charAt(0).toUpperCase() + topFolder.slice(1)} Module`,
          files: [],
          folderSet: new Set(),
          techCounts: new Map()
        });
      }

      const cluster = customClusters.get(clusterKey)!;
      cluster.files.push(file);
      cluster.folderSet.add(folder);
      cluster.techCounts.set(detectedTech.name, (cluster.techCounts.get(detectedTech.name) || 0) + 1);
    }
  });

  const activeModules: ArchitecturalModule[] = [];

  // 1. Collect standard active modules
  ARCHITECTURAL_MODULE_DEFINITIONS.forEach(def => {
    const bucket = moduleBucketMap.get(def.id)!;
    if (bucket.files.length === 0) return; // Skip empty modules

    // Find dominant tech
    let dominantTech = 'General';
    let maxCount = 0;
    bucket.techCounts.forEach((count, tech) => {
      if (count > maxCount) {
        maxCount = count;
        dominantTech = tech;
      }
    });

    const folderPaths = Array.from(bucket.folderSet);
    const samplePaths = bucket.files.slice(0, 5).map(f => f.path);
    const nodeIds = bucket.files.map((_, i) => `node-${def.id}-${i}`);

    // Compute cohesion score based on folder localization (fewer unique folders = higher cohesion)
    const folderRatio = bucket.files.length / Math.max(1, folderPaths.length);
    const cohesionScore = Math.min(100, Math.round(50 + Math.min(40, folderRatio * 8)));

    const moduleObj: ArchitecturalModule = {
      id: def.id,
      name: def.name,
      category: def.category,
      role: def.role,
      color: def.color,
      bgColor: def.bgColor,
      borderColor: def.borderColor,
      icon: def.icon,
      badge: def.badge,
      description: def.description,
      folderPaths,
      nodeIds,
      fileCount: bucket.files.length,
      samplePaths,
      primaryTech: dominantTech,
      cohesionScore
    };

    activeModules.push(moduleObj);

    bucket.files.forEach(f => {
      fileToModuleMap.set(f.path, moduleObj);
    });
  });

  // 2. Collect custom directory clusters if any
  let customGroupIdx = 10;
  customClusters.forEach((cluster, clusterKey) => {
    if (cluster.files.length === 0) return;

    let dominantTech = 'General';
    let maxCount = 0;
    cluster.techCounts.forEach((count, tech) => {
      if (count > maxCount) {
        maxCount = count;
        dominantTech = tech;
      }
    });

    const colorList = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#2dd4bf'];
    const assignedColor = colorList[customGroupIdx % colorList.length];

    const folderPaths = Array.from(cluster.folderSet);
    const samplePaths = cluster.files.slice(0, 5).map(f => f.path);
    const nodeIds = cluster.files.map((_, i) => `node-${clusterKey}-${i}`);

    const moduleObj: ArchitecturalModule = {
      id: clusterKey,
      name: cluster.name,
      category: 'domain',
      role: 'Modular Domain Feature Package',
      color: assignedColor,
      bgColor: `${assignedColor}20`,
      borderColor: `${assignedColor}90`,
      icon: '📦',
      badge: `MOD • ${cluster.name.toUpperCase()}`,
      description: `Domain directory cluster containing ${cluster.files.length} related files and components.`,
      folderPaths,
      nodeIds,
      fileCount: cluster.files.length,
      samplePaths,
      primaryTech: dominantTech,
      cohesionScore: 82
    };

    activeModules.push(moduleObj);
    customGroupIdx++;

    cluster.files.forEach(f => {
      fileToModuleMap.set(f.path, moduleObj);
    });
  });

  // If no standard modules were matched (unusual repository structure), guarantee at least a Core module
  if (activeModules.length === 0 && fileTree.length > 0) {
    const rootMod: ArchitecturalModule = {
      id: 'mod-core',
      name: 'Repository Root Modules',
      category: 'core',
      role: 'Monolithic Root Structure',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      borderColor: 'rgba(139, 92, 246, 0.55)',
      icon: '📁',
      badge: 'CORE • REPO',
      description: 'Directory modules and code files grouped across the repository.',
      folderPaths: ['/'],
      nodeIds: fileTree.map((_, i) => `node-root-${i}`),
      fileCount: fileTree.length,
      samplePaths: fileTree.slice(0, 5).map(f => f.path),
      primaryTech: 'TypeScript/JavaScript',
      cohesionScore: 75
    };
    activeModules.push(rootMod);
    fileTree.forEach(f => fileToModuleMap.set(f.path, rootMod));
  }

  // Determine Architectural Pattern
  const hasUI = activeModules.some(m => m.category === 'presentation');
  const hasAPI = activeModules.some(m => m.category === 'api');
  const hasData = activeModules.some(m => m.category === 'data');
  const hasServices = activeModules.some(m => m.category === 'services');
  const isMonorepo = customClusters.size > 2 || activeModules.some(m => m.folderPaths.some(p => p.startsWith('packages/') || p.startsWith('apps/')));

  let patternName = 'Modular Component Architecture';
  let patternDescription = 'Standard modular code separation with discrete component boundaries.';

  if (isMonorepo) {
    patternName = 'Monorepo Multi-Package Workspace';
    patternDescription = 'Decoupled multi-package architecture with independent workspace module boundaries.';
  } else if (hasUI && hasAPI && hasData) {
    patternName = 'Full-Stack 3-Tier Layered Architecture';
    patternDescription = 'Clean vertical separation: UI presentation layer, API routing controllers, and Data persistence.';
  } else if (hasUI && hasServices) {
    patternName = 'Client-Side Service-Oriented (SPA) Pattern';
    patternDescription = 'Component-driven presentation layer powered by dedicated domain services and state stores.';
  } else if (hasAPI && hasData) {
    patternName = 'Backend Microservice & Data Pipeline';
    patternDescription = 'Headless API routing layer with dedicated ORM schemas and data models.';
  } else if (hasServices && hasData) {
    patternName = 'Domain-Driven Hexagonal Architecture';
    patternDescription = 'Decoupled domain business core communicating through persistence adapters and interfaces.';
  }

  const totalGroupedFiles = fileTree.length;
  const avgCohesion = activeModules.reduce((acc, m) => acc + m.cohesionScore, 0) / Math.max(1, activeModules.length);

  const decomposition: ArchitecturalDecomposition = {
    modules: activeModules,
    patternName,
    description: patternDescription,
    totalModules: activeModules.length,
    totalGroupedFiles,
    cohesionRating: avgCohesion > 78 ? 'High' : avgCohesion > 60 ? 'Moderate' : 'Dynamic',
    couplingRating: activeModules.length > 5 ? 'Low' : 'Moderate'
  };

  return {
    modules: activeModules,
    decomposition,
    fileToModuleMap
  };
}
