/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { RepoFileTree, DetectedTech, FolderTechSummary, FolderTreeNode, RepoTechStackOverview } from '../types';

// Palette and metadata catalogue for recognized technologies
export const KNOWN_TECHS: Record<string, DetectedTech> = {
  react: {
    id: 'react',
    name: 'React',
    category: 'frontend',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    icon: '⚛️',
    badgeLabel: 'React'
  },
  nextjs: {
    id: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    color: '#e2e8f0',
    bgColor: 'rgba(226, 232, 240, 0.15)',
    borderColor: 'rgba(226, 232, 240, 0.4)',
    icon: '▲',
    badgeLabel: 'Next.js'
  },
  vue: {
    id: 'vue',
    name: 'Vue.js',
    category: 'frontend',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: '💚',
    badgeLabel: 'Vue'
  },
  angular: {
    id: 'angular',
    name: 'Angular',
    category: 'frontend',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    icon: '🅰️',
    badgeLabel: 'Angular'
  },
  svelte: {
    id: 'svelte',
    name: 'Svelte',
    category: 'frontend',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    icon: '🟠',
    badgeLabel: 'Svelte'
  },
  nodejs: {
    id: 'nodejs',
    name: 'Node.js',
    category: 'backend',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    icon: '🟢',
    badgeLabel: 'Node.js'
  },
  express: {
    id: 'express',
    name: 'Express',
    category: 'backend',
    color: '#cbd5e1',
    bgColor: 'rgba(203, 213, 225, 0.15)',
    borderColor: 'rgba(203, 213, 225, 0.4)',
    icon: '🚂',
    badgeLabel: 'Express'
  },
  nestjs: {
    id: 'nestjs',
    name: 'NestJS',
    category: 'backend',
    color: '#e11d48',
    bgColor: 'rgba(225, 29, 72, 0.15)',
    borderColor: 'rgba(225, 29, 72, 0.4)',
    icon: '🦁',
    badgeLabel: 'NestJS'
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    category: 'language',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: '🔷',
    badgeLabel: 'TypeScript'
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    category: 'language',
    color: '#facc15',
    bgColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: 'rgba(250, 204, 21, 0.4)',
    icon: '🟨',
    badgeLabel: 'JavaScript'
  },
  python: {
    id: 'python',
    name: 'Python',
    category: 'language',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    icon: '🐍',
    badgeLabel: 'Python'
  },
  django: {
    id: 'django',
    name: 'Django',
    category: 'backend',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.15)',
    borderColor: 'rgba(5, 150, 105, 0.4)',
    icon: '🎸',
    badgeLabel: 'Django'
  },
  fastapi: {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'backend',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'rgba(13, 148, 136, 0.4)',
    icon: '⚡',
    badgeLabel: 'FastAPI'
  },
  flask: {
    id: 'flask',
    name: 'Flask',
    category: 'backend',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    icon: '🧪',
    badgeLabel: 'Flask'
  },
  go: {
    id: 'go',
    name: 'Go',
    category: 'language',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    icon: '🦫',
    badgeLabel: 'Go'
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    category: 'language',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    icon: '🦀',
    badgeLabel: 'Rust'
  },
  java: {
    id: 'java',
    name: 'Java',
    category: 'language',
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.15)',
    borderColor: 'rgba(234, 88, 12, 0.4)',
    icon: '☕',
    badgeLabel: 'Java'
  },
  spring: {
    id: 'spring',
    name: 'Spring Boot',
    category: 'backend',
    color: '#84cc16',
    bgColor: 'rgba(132, 204, 22, 0.15)',
    borderColor: 'rgba(132, 204, 22, 0.4)',
    icon: '🌱',
    badgeLabel: 'Spring Boot'
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'mobile',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    icon: '🤖',
    badgeLabel: 'Kotlin'
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    category: 'mobile',
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    icon: '🍎',
    badgeLabel: 'Swift'
  },
  flutter: {
    id: 'flutter',
    name: 'Flutter',
    category: 'mobile',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: '🎯',
    badgeLabel: 'Flutter / Dart'
  },
  php: {
    id: 'php',
    name: 'PHP',
    category: 'language',
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: 'rgba(129, 140, 248, 0.4)',
    icon: '🐘',
    badgeLabel: 'PHP'
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    category: 'language',
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    icon: '💎',
    badgeLabel: 'Ruby'
  },
  csharp: {
    id: 'csharp',
    name: 'C# / .NET',
    category: 'backend',
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
    icon: '🟣',
    badgeLabel: 'C# / .NET'
  },
  cpp: {
    id: 'cpp',
    name: 'C / C++',
    category: 'language',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    icon: '⚙️',
    badgeLabel: 'C / C++'
  },
  database: {
    id: 'database',
    name: 'Database / SQL',
    category: 'database',
    color: '#2dd4bf',
    bgColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: 'rgba(45, 212, 191, 0.4)',
    icon: '🗄️',
    badgeLabel: 'SQL / DB'
  },
  prisma: {
    id: 'prisma',
    name: 'Prisma ORM',
    category: 'database',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: '▲',
    badgeLabel: 'Prisma'
  },
  graphql: {
    id: 'graphql',
    name: 'GraphQL',
    category: 'backend',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    icon: '◈',
    badgeLabel: 'GraphQL'
  },
  tailwind: {
    id: 'tailwind',
    name: 'Tailwind CSS',
    category: 'frontend',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: '🎨',
    badgeLabel: 'Tailwind CSS'
  },
  docker: {
    id: 'docker',
    name: 'Docker / DevOps',
    category: 'devops',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    icon: '🐳',
    badgeLabel: 'Docker / DevOps'
  },
  ai_ml: {
    id: 'ai_ml',
    name: 'AI / ML Logic',
    category: 'ai',
    color: '#d946ef',
    bgColor: 'rgba(217, 70, 239, 0.15)',
    borderColor: 'rgba(217, 70, 239, 0.4)',
    icon: '🧠',
    badgeLabel: 'AI / ML'
  },
  generic_module: {
    id: 'generic_module',
    name: 'Modular Service',
    category: 'tools',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    icon: '📁',
    badgeLabel: 'General Code'
  }
};

/**
 * Detects the dominant tech stack, secondary technologies, and architectural role
 * for a list of file paths belonging to a given folder.
 */
export function detectFolderTechStack(folderPath: string, files: RepoFileTree[]): {
  primaryTech: DetectedTech;
  secondaryTechs: DetectedTech[];
  architecturalRole: string;
  languages: { name: string; count: number; percentage: number; color: string }[];
} {
  if (files.length === 0) {
    return {
      primaryTech: KNOWN_TECHS.generic_module,
      secondaryTechs: [],
      architecturalRole: 'General Subsystem',
      languages: []
    };
  }

  // Count file extensions and check signature indicator files
  const extCounts: Record<string, number> = {};
  const lowerPaths = files.map(f => f.path.toLowerCase());
  const folderLower = folderPath.toLowerCase();

  let hasReact = false;
  let hasVue = false;
  let hasAngular = false;
  let hasSvelte = false;
  let hasNext = false;
  let hasFastAPI = false;
  let hasDjango = false;
  let hasFlask = false;
  let hasSpring = false;
  let hasNest = false;
  let hasExpress = false;
  let hasPrisma = false;
  let hasTailwind = false;
  let hasDocker = false;
  let hasGraphQL = false;
  let hasAiMl = false;

  let tsCount = 0;
  let jsCount = 0;
  let pyCount = 0;
  let goCount = 0;
  let rsCount = 0;
  let javaCount = 0;
  let ktCount = 0;
  let csCount = 0;
  let cppCount = 0;
  let phpCount = 0;
  let rbCount = 0;
  let swiftCount = 0;
  let dartCount = 0;
  let sqlCount = 0;
  let styleCount = 0;

  files.forEach(f => {
    const p = f.path.toLowerCase();
    const ext = p.split('.').pop() || '';
    extCounts[ext] = (extCounts[ext] || 0) + 1;

    if (p.endsWith('.tsx') || p.endsWith('.jsx') || p.includes('react') || p.includes('components') || p.includes('hooks')) {
      hasReact = true;
    }
    if (p.endsWith('.vue') || p.includes('nuxt')) hasVue = true;
    if (p.includes('angular') || p.endsWith('.component.ts') || p.endsWith('.module.ts')) hasAngular = true;
    if (p.endsWith('.svelte')) hasSvelte = true;
    if (p.includes('next.config') || p.includes('app/') || p.includes('pages/api')) hasNext = true;
    
    if (p.includes('fastapi') || p.includes('main.py') && p.includes('router')) hasFastAPI = true;
    if (p.includes('manage.py') || p.includes('django')) hasDjango = true;
    if (p.includes('flask') || p.includes('app.py')) hasFlask = true;
    if (p.includes('torch') || p.includes('gemini') || p.includes('openai') || p.includes('transformers') || p.includes('model') && p.endsWith('.py')) hasAiMl = true;
    
    if (p.includes('nest') || p.includes('.controller.ts') || p.includes('.service.ts')) hasNest = true;
    if (p.includes('express') || p.includes('server.js') || p.includes('server.ts') || p.includes('routes/')) hasExpress = true;
    if (p.endsWith('.prisma') || p.includes('prisma')) hasPrisma = true;
    if (p.includes('tailwind') || p.endsWith('.css') && p.includes('styles')) hasTailwind = true;
    if (p.includes('dockerfile') || p.includes('docker-compose')) hasDocker = true;
    if (p.endsWith('.graphql') || p.endsWith('.gql') || p.includes('schema.graphql')) hasGraphQL = true;
    if (p.includes('pom.xml') || p.includes('application.yml') || p.includes('spring')) hasSpring = true;

    if (ext === 'ts' || ext === 'tsx') tsCount++;
    if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') jsCount++;
    if (ext === 'py') pyCount++;
    if (ext === 'go') goCount++;
    if (ext === 'rs') rsCount++;
    if (ext === 'java') javaCount++;
    if (ext === 'kt' || ext === 'kts') ktCount++;
    if (ext === 'cs') csCount++;
    if (ext === 'cpp' || ext === 'c' || ext === 'h' || ext === 'hpp') cppCount++;
    if (ext === 'php') phpCount++;
    if (ext === 'rb') rbCount++;
    if (ext === 'swift') swiftCount++;
    if (ext === 'dart') dartCount++;
    if (ext === 'sql') sqlCount++;
    if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') styleCount++;
  });

  // Calculate language distribution
  const langEntries = [
    { name: 'TypeScript', count: tsCount, color: '#38bdf8' },
    { name: 'JavaScript', count: jsCount, color: '#facc15' },
    { name: 'Python', count: pyCount, color: '#eab308' },
    { name: 'Go', count: goCount, color: '#06b6d4' },
    { name: 'Rust', count: rsCount, color: '#f97316' },
    { name: 'Java', count: javaCount, color: '#ea580c' },
    { name: 'Kotlin', count: ktCount, color: '#a855f7' },
    { name: 'C#', count: csCount, color: '#c084fc' },
    { name: 'C/C++', count: cppCount, color: '#60a5fa' },
    { name: 'PHP', count: phpCount, color: '#818cf8' },
    { name: 'Ruby', count: rbCount, color: '#f43f5e' },
    { name: 'Swift', count: swiftCount, color: '#f43f5e' },
    { name: 'Dart', count: dartCount, color: '#38bdf8' },
    { name: 'SQL', count: sqlCount, color: '#2dd4bf' },
    { name: 'CSS/Styles', count: styleCount, color: '#a78bfa' },
  ].filter(l => l.count > 0);

  const totalLangFiles = langEntries.reduce((acc, l) => acc + l.count, 0) || files.length;
  const languages = langEntries.map(l => ({
    ...l,
    percentage: Math.round((l.count / totalLangFiles) * 100)
  })).sort((a, b) => b.count - a.count);

  // Determine Architectural Role based on directory name and files
  let architecturalRole = 'General Module';
  if (/(components|views|pages|screens|ui|layouts|frontend|client|widgets)/i.test(folderLower)) {
    architecturalRole = 'Presentation & UI Components';
  } else if (/(api|routes|controllers|endpoints|handlers|router|gateway)/i.test(folderLower)) {
    architecturalRole = 'API Routing & HTTP Handlers';
  } else if (/(services|usecases|domain|logic|managers|store|redux|context|hooks)/i.test(folderLower)) {
    architecturalRole = 'Business Logic & State Services';
  } else if (/(models|schemas|db|database|entities|queries|repositories|prisma|migrations)/i.test(folderLower)) {
    architecturalRole = 'Data Persistence & Models';
  } else if (/(utils|helpers|common|shared|lib|formatters|validators)/i.test(folderLower)) {
    architecturalRole = 'Shared Utilities & Libraries';
  } else if (/(config|types|constants|env|config)/i.test(folderLower)) {
    architecturalRole = 'Configuration & Type Definitions';
  } else if (/(tests|test|e2e|specs|mock)/i.test(folderLower)) {
    architecturalRole = 'Test Suite & Quality Assurance';
  } else if (/(server|backend|core|main|app)/i.test(folderLower)) {
    architecturalRole = 'Backend Core & Orchestration';
  }

  // Prioritize Primary Technology
  let primaryTech = KNOWN_TECHS.generic_module;
  const secondaryTechs: DetectedTech[] = [];

  if (hasNext) {
    primaryTech = KNOWN_TECHS.nextjs;
  } else if (hasReact) {
    primaryTech = KNOWN_TECHS.react;
  } else if (hasVue) {
    primaryTech = KNOWN_TECHS.vue;
  } else if (hasAngular) {
    primaryTech = KNOWN_TECHS.angular;
  } else if (hasSvelte) {
    primaryTech = KNOWN_TECHS.svelte;
  } else if (hasFastAPI) {
    primaryTech = KNOWN_TECHS.fastapi;
  } else if (hasDjango) {
    primaryTech = KNOWN_TECHS.django;
  } else if (hasFlask) {
    primaryTech = KNOWN_TECHS.flask;
  } else if (hasSpring) {
    primaryTech = KNOWN_TECHS.spring;
  } else if (hasNest) {
    primaryTech = KNOWN_TECHS.nestjs;
  } else if (hasExpress) {
    primaryTech = KNOWN_TECHS.express;
  } else if (hasPrisma) {
    primaryTech = KNOWN_TECHS.prisma;
  } else if (pyCount > 0 && pyCount >= Math.max(tsCount, jsCount, goCount, rsCount, javaCount)) {
    primaryTech = hasAiMl ? KNOWN_TECHS.ai_ml : KNOWN_TECHS.python;
  } else if (goCount > 0 && goCount >= Math.max(tsCount, jsCount, pyCount, rsCount)) {
    primaryTech = KNOWN_TECHS.go;
  } else if (rsCount > 0 && rsCount >= Math.max(tsCount, jsCount, pyCount)) {
    primaryTech = KNOWN_TECHS.rust;
  } else if (tsCount > 0 && tsCount >= jsCount) {
    // Check if it's node backend or general TS
    primaryTech = folderLower.includes('server') || folderLower.includes('backend') || folderLower.includes('api')
      ? KNOWN_TECHS.nodejs
      : KNOWN_TECHS.typescript;
  } else if (jsCount > 0) {
    primaryTech = folderLower.includes('server') || folderLower.includes('backend') || folderLower.includes('api')
      ? KNOWN_TECHS.nodejs
      : KNOWN_TECHS.javascript;
  } else if (javaCount > 0) {
    primaryTech = KNOWN_TECHS.java;
  } else if (ktCount > 0) {
    primaryTech = KNOWN_TECHS.kotlin;
  } else if (csCount > 0) {
    primaryTech = KNOWN_TECHS.csharp;
  } else if (cppCount > 0) {
    primaryTech = KNOWN_TECHS.cpp;
  } else if (phpCount > 0) {
    primaryTech = KNOWN_TECHS.php;
  } else if (rbCount > 0) {
    primaryTech = KNOWN_TECHS.ruby;
  } else if (swiftCount > 0) {
    primaryTech = KNOWN_TECHS.swift;
  } else if (dartCount > 0) {
    primaryTech = KNOWN_TECHS.flutter;
  } else if (sqlCount > 0) {
    primaryTech = KNOWN_TECHS.database;
  }

  // Populate secondary badges
  if (primaryTech.id !== 'typescript' && tsCount > 0) secondaryTechs.push(KNOWN_TECHS.typescript);
  if (primaryTech.id !== 'react' && hasReact) secondaryTechs.push(KNOWN_TECHS.react);
  if (hasTailwind && primaryTech.id !== 'tailwind') secondaryTechs.push(KNOWN_TECHS.tailwind);
  if (hasDocker && primaryTech.id !== 'docker') secondaryTechs.push(KNOWN_TECHS.docker);
  if (hasGraphQL && primaryTech.id !== 'graphql') secondaryTechs.push(KNOWN_TECHS.graphql);
  if (hasPrisma && primaryTech.id !== 'prisma') secondaryTechs.push(KNOWN_TECHS.prisma);
  if (hasAiMl && primaryTech.id !== 'ai_ml') secondaryTechs.push(KNOWN_TECHS.ai_ml);

  return {
    primaryTech,
    secondaryTechs: secondaryTechs.slice(0, 3), // Keep top 3 secondary tags
    architecturalRole,
    languages
  };
}

/**
 * Builds a hierarchical folder tree from repository files
 * with automated tech stack detection for each directory level.
 */
export function buildFolderHierarchy(fileTree: RepoFileTree[]): FolderTreeNode {
  const rootNode: FolderTreeNode = {
    name: 'root',
    path: '',
    depth: 0,
    files: [],
    subFolders: [],
    primaryTech: KNOWN_TECHS.generic_module,
    secondaryTechs: [],
    architecturalRole: 'Root Repository Workspace',
    totalFilesCount: 0
  };

  const folderMap = new Map<string, FolderTreeNode>();
  folderMap.set('', rootNode);

  // Group files into folder buckets
  fileTree.forEach(file => {
    const parts = file.path.split('/');
    if (parts.length === 1) {
      // Root level file
      rootNode.files.push(file);
    } else {
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!folderMap.has(currentPath)) {
          const newFolder: FolderTreeNode = {
            name: folderName,
            path: currentPath,
            depth: i + 1,
            files: [],
            subFolders: [],
            primaryTech: KNOWN_TECHS.generic_module,
            secondaryTechs: [],
            architecturalRole: 'Module Folder',
            totalFilesCount: 0
          };
          folderMap.set(currentPath, newFolder);

          const parent = folderMap.get(parentPath);
          if (parent && !parent.subFolders.some(sf => sf.path === currentPath)) {
            parent.subFolders.push(newFolder);
          }
        }
      }

      // Add file to leaf directory
      const directParentPath = parts.slice(0, parts.length - 1).join('/');
      const leafFolder = folderMap.get(directParentPath);
      if (leafFolder) {
        leafFolder.files.push(file);
      }
    }
  });

  // Calculate tech stack and total files for all folders recursively
  function enrichFolder(node: FolderTreeNode): number {
    let allNestedFiles = [...node.files];
    node.subFolders.forEach(sub => {
      enrichFolder(sub);
      // Collect nested files for directory level tech analysis
      const subFolderAllFiles = fileTree.filter(f => f.path.startsWith(`${sub.path}/`));
      allNestedFiles = allNestedFiles.concat(subFolderAllFiles);
    });

    node.totalFilesCount = fileTree.filter(f => f.path === node.path || f.path.startsWith(`${node.path}/`)).length;
    if (node.path === '') node.totalFilesCount = fileTree.length;

    const analysis = detectFolderTechStack(node.path || node.name, allNestedFiles);
    node.primaryTech = analysis.primaryTech;
    node.secondaryTechs = analysis.secondaryTechs;
    node.architecturalRole = analysis.architecturalRole;

    // Sort subfolders alphabetically
    node.subFolders.sort((a, b) => a.name.localeCompare(b.name));
    return node.totalFilesCount;
  }

  enrichFolder(rootNode);
  return rootNode;
}

/**
 * Analyzes the entire repository to produce high-level tech stack summaries,
 * folder-by-folder analysis, and language distributions.
 */
export function analyzeRepoTechStack(repoName: string, fileTree: RepoFileTree[]): RepoTechStackOverview {
  const folderTree = buildFolderHierarchy(fileTree);

  // Flatten top-level / distinct architecture folders for overview list
  const folderSummaries: FolderTechSummary[] = [];

  // Identify distinctive folders (depth 1 or significant depth 2)
  const folderPaths = new Set<string>();
  fileTree.forEach(f => {
    const parts = f.path.split('/');
    if (parts.length > 1) {
      folderPaths.add(parts[0]);
      if (parts.length > 2 && (parts[0] === 'src' || parts[0] === 'packages' || parts[0] === 'apps')) {
        folderPaths.add(`${parts[0]}/${parts[1]}`);
      }
    }
  });

  // If root has files, add root summary as well
  const rootFiles = fileTree.filter(f => !f.path.includes('/'));
  if (rootFiles.length > 0 || folderPaths.size === 0) {
    const rootAnalysis = detectFolderTechStack('root', rootFiles.length > 0 ? rootFiles : fileTree);
    folderSummaries.push({
      folderPath: '/',
      folderName: 'root',
      depth: 0,
      totalFiles: rootFiles.length,
      primaryTech: rootAnalysis.primaryTech,
      secondaryTechs: rootAnalysis.secondaryTechs,
      languages: rootAnalysis.languages,
      architecturalRole: 'Root Workspace & Config',
      sampleFiles: rootFiles.slice(0, 4).map(f => f.path)
    });
  }

  Array.from(folderPaths).sort().forEach(fp => {
    const filesInFolder = fileTree.filter(f => f.path.startsWith(`${fp}/`) || f.path === fp);
    if (filesInFolder.length === 0) return;

    const folderName = fp.split('/').pop() || fp;
    const depth = fp.split('/').length;
    const analysis = detectFolderTechStack(fp, filesInFolder);

    folderSummaries.push({
      folderPath: fp,
      folderName,
      depth,
      totalFiles: filesInFolder.length,
      primaryTech: analysis.primaryTech,
      secondaryTechs: analysis.secondaryTechs,
      languages: analysis.languages,
      architecturalRole: analysis.architecturalRole,
      sampleFiles: filesInFolder.slice(0, 4).map(f => f.path.split('/').pop() || f.path)
    });
  });

  // Global repository tech stack analysis
  const globalAnalysis = detectFolderTechStack(repoName, fileTree);

  // Global detected tech badges (unique)
  const globalTechMap = new Map<string, DetectedTech>();
  if (globalAnalysis.primaryTech.id !== 'generic_module') {
    globalTechMap.set(globalAnalysis.primaryTech.id, globalAnalysis.primaryTech);
  }
  globalAnalysis.secondaryTechs.forEach(t => globalTechMap.set(t.id, t));

  folderSummaries.forEach(fs => {
    if (fs.primaryTech.id !== 'generic_module') {
      globalTechMap.set(fs.primaryTech.id, fs.primaryTech);
    }
    fs.secondaryTechs.forEach(t => globalTechMap.set(t.id, t));
  });

  const globalTechs = Array.from(globalTechMap.values()).slice(0, 6);
  const dominantLanguage = globalAnalysis.languages[0]?.name || 'TypeScript';

  // Construct stack summary label (e.g., "Full-Stack TypeScript (React + Node.js)")
  let stackSummaryLabel = dominantLanguage;
  if (globalTechMap.has('react') && (globalTechMap.has('nodejs') || globalTechMap.has('express'))) {
    stackSummaryLabel = 'Full-Stack TypeScript (React + Node.js)';
  } else if (globalTechMap.has('nextjs')) {
    stackSummaryLabel = 'Next.js Full-Stack App';
  } else if (globalTechMap.has('react') && globalTechMap.has('fastapi')) {
    stackSummaryLabel = 'Polyglot Stack (React + FastAPI Python)';
  } else if (globalTechMap.has('python')) {
    stackSummaryLabel = 'Python Architecture';
  } else if (globalTechMap.has('go')) {
    stackSummaryLabel = 'Go Microservices';
  } else if (globalTechMap.has('rust')) {
    stackSummaryLabel = 'Rust Systems Architecture';
  } else if (globalTechMap.has('react')) {
    stackSummaryLabel = 'React Single Page App';
  }

  return {
    globalTechs,
    primaryFramework: globalAnalysis.primaryTech.id !== 'generic_module' ? globalAnalysis.primaryTech : null,
    dominantLanguage,
    stackSummaryLabel,
    folders: folderSummaries,
    folderTree,
    stats: {
      totalFiles: fileTree.length,
      totalFolders: folderPaths.size,
      languageBreakdown: globalAnalysis.languages
    }
  };
}

/**
 * Returns the detected tech stack for an individual node or file path
 */
export function getTechForFilePath(filePath: string): DetectedTech {
  const parts = filePath.split('/');
  const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  const fakeFile = [{ path: filePath, type: 'blob' }];
  const res = detectFolderTechStack(folder || filePath, fakeFile);
  return res.primaryTech;
}
