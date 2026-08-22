/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { RepoFileTree, DataFlowGraph, D3Node, D3Link } from '../types';
import { getTechForFilePath } from './techStackDetector';
import { detectArchitecturalModules } from './moduleDetectionService';

/**
 * Builds a structured DataFlowGraph from repository file tree
 * grouping files into logical architectural modules with interconnected links,
 * tech stack badges, and modular cluster metadata.
 */
export function buildGraphFromFileTree(repoName: string, fileTree: RepoFileTree[]): DataFlowGraph {
  const nodes: D3Node[] = [];
  const links: D3Link[] = [];

  // Run automated architectural module and directory structure detection
  const { modules, decomposition, fileToModuleMap } = detectArchitecturalModules(fileTree, repoName);

  // Root node for repository core orchestrator
  const rootId = 'root';
  const rootModule = modules.find(m => m.category === 'core') || modules[0];

  nodes.push({
    id: rootId,
    group: 0,
    label: repoName || 'Repository',
    folder: '/',
    moduleId: rootModule?.id || 'mod-core',
    moduleName: rootModule?.name || 'Core Entry & Manifest',
    moduleColor: rootModule?.color || '#8b5cf6',
    techStack: 'Repository Root',
    techBadge: '📁 Core',
    techColor: '#8b5cf6'
  });

  // Track node IDs by module for clustering and interconnections
  const moduleNodeMap = new Map<string, string[]>();
  modules.forEach(m => {
    moduleNodeMap.set(m.id, []);
  });

  // Sample file tree for optimal graph rendering performance and clarity
  const maxFiles = 65;
  const sampledTree = fileTree.slice(0, maxFiles);

  sampledTree.forEach((file, index) => {
    const parts = file.path.split('/');
    const filename = parts.pop() || file.path;
    const folder = parts.join('/') || 'root';
    const cleanLabel = filename.replace(/\.[^/.]+$/, ''); // Strip extension for clean display

    // Resolve assigned architectural module
    const matchedModule = fileToModuleMap.get(file.path) || rootModule;
    const detectedTech = getTechForFilePath(file.path);
    const nodeId = `node-${index}-${cleanLabel}`;

    const groupNum = matchedModule ? (
      matchedModule.category === 'core' ? 0 :
      matchedModule.category === 'presentation' ? 1 :
      matchedModule.category === 'api' ? 2 :
      matchedModule.category === 'services' ? 3 :
      matchedModule.category === 'data' ? 4 :
      matchedModule.category === 'utils' ? 5 :
      matchedModule.category === 'config' ? 6 :
      matchedModule.category === 'infra' ? 7 :
      matchedModule.category === 'testing' ? 8 : 9
    ) : 5;

    nodes.push({
      id: nodeId,
      group: groupNum,
      label: cleanLabel || filename,
      path: file.path,
      folder,
      category: matchedModule?.name || 'Module Component',
      moduleId: matchedModule?.id,
      moduleName: matchedModule?.name,
      moduleColor: matchedModule?.color,
      techStack: detectedTech.name,
      techBadge: `${detectedTech.icon} ${detectedTech.badgeLabel}`,
      techColor: detectedTech.color,
    });

    if (matchedModule) {
      const list = moduleNodeMap.get(matchedModule.id) || [];
      list.push(nodeId);
      moduleNodeMap.set(matchedModule.id, list);
    }

    // Connect node to Root
    links.push({
      source: rootId,
      target: nodeId,
      value: 1,
    });
  });

  // Intra-module links (connect nodes inside the same architectural module cluster)
  modules.forEach(m => {
    const clusterNodes = moduleNodeMap.get(m.id) || [];
    if (clusterNodes.length > 1) {
      for (let i = 0; i < clusterNodes.length - 1; i++) {
        // Connect sequential sibling nodes within cluster
        links.push({
          source: clusterNodes[i],
          target: clusterNodes[i + 1],
          value: 1
        });
      }
    }
  });

  // Inter-module logical architectural flows
  const uiNodes = moduleNodeMap.get('mod-presentation') || [];
  const apiNodes = moduleNodeMap.get('mod-api') || [];
  const serviceNodes = moduleNodeMap.get('mod-services') || [];
  const dataNodes = moduleNodeMap.get('mod-data') || [];
  const utilNodes = moduleNodeMap.get('mod-utils') || [];
  const configNodes = moduleNodeMap.get('mod-config') || [];

  // 1. UI -> Services
  uiNodes.forEach((uiNode, i) => {
    if (serviceNodes.length > 0) {
      const targetService = serviceNodes[i % serviceNodes.length];
      links.push({ source: uiNode, target: targetService, value: 2 });
    }
  });

  // 2. API -> Services
  apiNodes.forEach((apiNode, i) => {
    if (serviceNodes.length > 0) {
      const targetService = serviceNodes[i % serviceNodes.length];
      links.push({ source: apiNode, target: targetService, value: 2 });
    }
  });

  // 3. Services -> Data
  serviceNodes.forEach((svcNode, i) => {
    if (dataNodes.length > 0) {
      const targetData = dataNodes[i % dataNodes.length];
      links.push({ source: svcNode, target: targetData, value: 3 });
    }
    if (utilNodes.length > 0 && i % 2 === 0) {
      const targetUtil = utilNodes[i % utilNodes.length];
      links.push({ source: svcNode, target: targetUtil, value: 1 });
    }
  });

  // 4. Config & Types -> UI / Services
  if (configNodes.length > 0) {
    const mainConfig = configNodes[0];
    if (uiNodes.length > 0) links.push({ source: mainConfig, target: uiNodes[0], value: 1 });
    if (serviceNodes.length > 0) links.push({ source: mainConfig, target: serviceNodes[0], value: 1 });
  }

  return {
    nodes,
    links,
    modules,
    decomposition
  };
}
