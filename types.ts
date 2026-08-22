/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export enum ViewMode {
  HOME = 'HOME',
  REPO_ANALYZER = 'REPO_ANALYZER',
  CODEMAP = 'CODEMAP',
  CHANGE_STACK = 'CHANGE_STACK',
  AI_ASSISTANT = 'AI_ASSISTANT',
  PLAN_CREATOR = 'PLAN_CREATOR',
  ARTICLE_INFOGRAPHIC = 'ARTICLE_INFOGRAPHIC',
  A2UI_STUDIO = 'A2UI_STUDIO',
  INTEGRATIONS = 'INTEGRATIONS'
}

export type DiagramLayoutAlgorithm = 'force' | 'modular-force' | 'hierarchical';

export interface ArchitecturalModule {
  id: string;
  name: string;
  category: string;
  role: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  badge: string;
  description: string;
  folderPaths: string[];
  nodeIds: string[];
  fileCount: number;
  samplePaths: string[];
  primaryTech?: string;
  cohesionScore: number;
  clusterCenter?: { x: number; y: number };
}

export interface ArchitecturalDecomposition {
  modules: ArchitecturalModule[];
  patternName: string;
  description: string;
  totalModules: number;
  totalGroupedFiles: number;
  cohesionRating: 'High' | 'Moderate' | 'Dynamic';
  couplingRating: 'Low' | 'Moderate' | 'Tight';
}

export interface D3Node extends SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  category?: string;
  path?: string;
  folder?: string;
  moduleId?: string;
  moduleName?: string;
  moduleColor?: string;
  techStack?: string;
  techBadge?: string;
  techColor?: string;
  size?: number;
  importance?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface DetectedTech {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'language' | 'database' | 'devops' | 'mobile' | 'ai' | 'framework' | 'tools';
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  badgeLabel: string;
  versionHint?: string;
  confidence?: number;
}

export interface FolderTechSummary {
  folderPath: string;
  folderName: string;
  depth: number;
  totalFiles: number;
  primaryTech: DetectedTech;
  secondaryTechs: DetectedTech[];
  languages: { name: string; count: number; percentage: number; color: string }[];
  architecturalRole: string;
  sampleFiles: string[];
}

export interface FolderTreeNode {
  name: string;
  path: string;
  depth: number;
  files: RepoFileTree[];
  subFolders: FolderTreeNode[];
  primaryTech: DetectedTech;
  secondaryTechs: DetectedTech[];
  architecturalRole: string;
  totalFilesCount: number;
}

export interface RepoTechStackOverview {
  globalTechs: DetectedTech[];
  primaryFramework: DetectedTech | null;
  dominantLanguage: string;
  stackSummaryLabel: string;
  folders: FolderTechSummary[];
  folderTree: FolderTreeNode;
  stats: {
    totalFiles: number;
    totalFolders: number;
    languageBreakdown: { name: string; count: number; percentage: number; color: string }[];
  };
}

export interface D3Link extends SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  value: number;
}

export interface DataFlowGraph {
  nodes: D3Node[];
  links: D3Link[];
  modules?: ArchitecturalModule[];
  decomposition?: ArchitecturalDecomposition;
}

export interface RepoFileTree {
  path: string;
  type: string;
}

export interface ConsumingComponentInfo {
  id: string;
  label: string;
  path?: string;
  folder?: string;
  techBadge?: string;
  techColor?: string;
  distance: number;
  loc: number;
}

export interface DownstreamDependencyInfo {
  id: string;
  label: string;
  path?: string;
  folder?: string;
  techBadge?: string;
  techColor?: string;
  distance: number;
  loc: number;
}

export interface TierBlastRadius {
  tierName: string;
  category: string;
  color: string;
  affectedCount: number;
  totalTierCount: number;
  percentage: number;
}

export interface FileImpactAnalysis {
  nodeId: string;
  label: string;
  path: string;
  folder?: string;
  selfLoc: number;
  impactScore: number;
  impactLevel: 'low' | 'moderate' | 'high' | 'critical';
  impactColor: string;
  
  // Consuming components
  directConsumingCount: number;
  transitiveConsumingCount: number;
  totalConsumingComponents: number;
  consumingComponents: ConsumingComponentInfo[];
  
  // Downstream metrics
  directDownstreamCount: number;
  transitiveDownstreamCount: number;
  totalDownstreamNodes: number;
  totalDownstreamLoc: number;
  combinedImpactedLoc: number;
  downstreamDependencies: DownstreamDependencyInfo[];
  
  // Blast Radius & Risk Assessment
  blastRadiusPercent: number;
  tierBreakdown: TierBlastRadius[];
  riskSummary: string;
  refactoringAdvice: string[];
}

export interface DevStudioState {
  repoName: string;
  fileTree: RepoFileTree[];
  graphData: DataFlowGraph;
}

export interface Citation {
  uri: string;
  title: string;
}

export interface RepoHistoryItem {
  id: string;
  repoName: string;
  imageData: string;
  is3D: boolean;
  style: string;
  date: Date;
}

// Code Evolution & Architecture Diff Types
export type DiffStatus = 'added' | 'modified' | 'deleted' | 'unchanged';

export interface GitCommitItem {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  timestamp: number;
  tag?: string;
  branch?: string;
  kind?: 'commit' | 'tag' | 'branch' | 'custom';
}

export interface GitRevisionItem extends GitCommitItem {}

export type ComparePreset = 
  | 'latest_vs_previous_release'
  | 'latest_vs_initial'
  | 'head_vs_recent_commit'
  | 'custom';

export interface EvolutionNodeDiff extends SimulationNodeDatum {
  id: string;
  label: string;
  path: string;
  group: number;
  category: string;
  diffStatus: DiffStatus;
  additions?: number;
  deletions?: number;
  changesSummary?: string;
  previousGroup?: number;
  tier?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface EvolutionLinkDiff extends SimulationLinkDatum<EvolutionNodeDiff> {
  source: string | EvolutionNodeDiff;
  target: string | EvolutionNodeDiff;
  value: number;
  diffStatus: DiffStatus;
}

export interface EvolutionGraph {
  nodes: EvolutionNodeDiff[];
  links: EvolutionLinkDiff[];
}

export interface EvolutionDiffSummary {
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  unchangedCount: number;
  totalFiles: number;
  churnRate: number;
  baseCommit: GitCommitItem;
  targetCommit: GitCommitItem;
  impactedTiers: { tier: string; count: number; color: string }[];
}

export interface EvolutionAiInsight {
  executiveSummary: string;
  architecturalShifts: string[];
  breakingChanges: string[];
  risks: string[];
  migrationNotes: string[];
  impactLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export interface ArticleHistoryItem {
  id: string;
  title: string;
  url: string;
  imageData: string;
  citations: Citation[];
  date: Date;
}

// AI Assistant Types
export type GeminiModelId = 
  | 'gemini-3.7-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite';

export interface AssistantRole {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  modelUsed?: string;
  roleId?: string;
  citations?: Citation[];
}

// Plan Creator Types
export type PlanType = 
  | 'refactoring'
  | 'feature'
  | 'migration'
  | 'performance'
  | 'security'
  | 'architecture';

export interface PlanModelRequest {
  title: string;
  goal: string;
  planType: PlanType;
  currentStack: string;
  targetStack?: string;
  priority: 'speed' | 'reliability' | 'scalability' | 'maintainability';
  constraints?: string;
  repoContext?: string;
  fileTree?: RepoFileTree[];
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  filePath?: string;
  actionType: 'create' | 'modify' | 'delete' | 'test' | 'config';
  completed: boolean;
  dependencies?: string[]; // IDs of tasks that this task depends on (must be completed first)
  priority?: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours?: number;
}

// Parallel Task Distribution & DAG Workflow Engine Types
export type MessageBrokerType = 'worker_pool' | 'rabbitmq' | 'kafka' | 'redis_bullmq' | 'kubernetes_matrix';

export type TaskRuntimeStatus = 'blocked' | 'ready' | 'queued' | 'running' | 'completed' | 'failed';

export interface WorkerNodeState {
  id: string;
  name: string;
  type: 'thread' | 'process' | 'container' | 'node';
  status: 'idle' | 'busy' | 'rebalancing' | 'offline';
  currentTaskId: string | null;
  taskTitle?: string;
  progress: number;
  tasksCompleted: number;
  totalTimeSpentMs: number;
  color: string;
  assignedBranchId?: string;
}

export interface ParallelBranchPartition {
  id: string;
  name: string;
  taskIds: string[];
  entryTaskIds: string[];
  exitTaskIds: string[];
  concurrencyLevel: number;
  estimatedSerialHours: number;
  estimatedParallelHours: number;
  speedupFactor: number;
  color: string;
  assignedWorkerId?: string;
  isCriticalPath: boolean;
}

export interface ConcurrentStageWave {
  stageIndex: number;
  taskIds: string[];
  maxParallelism: number;
  estimatedDurationHours: number;
}

export interface ParallelDistributionAnalysis {
  concurrentStages: ConcurrentStageWave[];
  branches: ParallelBranchPartition[];
  totalTasks: number;
  criticalPathTaskIds: string[];
  serialDurationHours: number;
  parallelDurationHours: number;
  theoreticalSpeedup: number;
  concurrencyEfficiency: number;
  optimalWorkerCount: number;
}

export interface ExecutionEventLog {
  id: string;
  timestamp: number;
  taskId: string;
  taskTitle: string;
  workerId: string;
  workerName: string;
  eventType: 'ready' | 'enqueued' | 'dispatched' | 'completed' | 'blocked' | 'barrier_synced';
  message: string;
  brokerMeta?: {
    queue?: string;
    partition?: number;
    routingKey?: string;
    latencyMs?: number;
  };
}

// State Persistence Layers & Crash Recovery Types
export type StateStoreBackend = 'redis_kv' | 'postgres_relational' | 'firestore_doc' | 'sqlite_wal' | 'local_storage';

export interface DAGExecutionContext {
  workflowId: string;
  workflowTitle: string;
  globalVariables: Record<string, any>;
  taskOutputs: Record<string, {
    status: TaskRuntimeStatus;
    resultSummary?: string;
    outputPayload?: Record<string, any>;
    completedAt?: number;
    durationMs?: number;
    workerId?: string;
  }>;
  completedTaskIds: string[];
  pendingTaskIds: string[];
  runningTaskIds: string[];
  currentStageIndex: number;
  elapsedTimeMs: number;
  totalTasks: number;
}

export interface DAGExecutionSnapshot {
  id: string;
  checkpointName: string;
  timestamp: number;
  triggerReason: 'manual' | 'node_completed' | 'timeout' | 'crash_simulated' | 'stage_barrier' | 'auto_interval';
  workflowId: string;
  backend: StateStoreBackend;
  taskStatuses: Record<string, TaskRuntimeStatus>;
  taskWorkerAssignments: Record<string, string>;
  workerStates: WorkerNodeState[];
  executionContext: DAGExecutionContext;
  checksum: string;
  serializedSizeBytes: number;
  isCrashPoint?: boolean;
}

export interface PersistenceEngineConfig {
  backend: StateStoreBackend;
  autoSnapshotOnNodeComplete: boolean;
  autoSnapshotIntervalMs: number;
  walSyncEnabled: boolean;
  maxRetainedSnapshots: number;
  durabilityLevel: 'at_least_once' | 'exactly_once' | 'wal_fsync';
}

export interface PlanMilestone {
  id: string;
  phaseNumber: number;
  title: string;
  estimatedDuration: string;
  focus: string;
  tasks: PlanTask[];
}

export interface ImplementationPlan {
  id: string;
  title: string;
  planType: PlanType;
  executiveSummary: string;
  targetArchitecture: string;
  milestones: PlanMilestone[];
  originalMilestones?: PlanMilestone[]; // AI generated baseline for reset
  riskAssessment: {
    risk: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
  verificationSteps: string[];
  rollbackStrategy: string;
  architectureDiagramAscii?: string;
  createdAt: Date;
}

// Codemap Types
export type ModuleCategory = 
  | 'frontend'
  | 'backend'
  | 'database'
  | 'auth'
  | 'utils'
  | 'config'
  | 'test'
  | 'docs';

export type ArchitectureTier = 
  | 'entrypoint'
  | 'routing_api'
  | 'core_domain'
  | 'data_state'
  | 'infra_config'
  | 'testing_qa';

export interface ModuleAnnotation {
  path: string;
  role: string;
  intent: string;
  contracts: string[];
  sideEffects: string[];
  slopRisk: 'low' | 'medium' | 'high';
  slopRiskReason?: string;
  complexity: 'simple' | 'moderate' | 'complex';
  keyExports?: string[];
}

export interface VibeslopDefenseAudit {
  comprehensionScore: number; // 0 - 100
  architectureIntegrity: number; // 0 - 100
  cognitiveLoadScore: 'low' | 'moderate' | 'heavy';
  summary: string;
  philosophyVerdict: string;
  antiSlopRules: string[];
  safeSurfingZones: string[];
  vulnerableModules: {
    path: string;
    risk: 'high' | 'medium' | 'low';
    issue: string;
    mitigation: string;
  }[];
  layerMetrics: {
    layer: string;
    health: number;
    count: number;
    description: string;
  }[];
}

export type CodeEntityType = 
  | 'module'
  | 'class'
  | 'function'
  | 'component'
  | 'interface'
  | 'config'
  | 'test';

export interface CodeMapNodeItem {
  id: string;
  label: string;
  path: string;
  category: ModuleCategory;
  tier: ArchitectureTier;
  entityType: CodeEntityType;
  extension: string;
  depth: number;
  connections: string[];
  description?: string;
  importance: 'critical' | 'normal' | 'utility';
  annotation?: ModuleAnnotation;
  healthStatus?: NodeHealthStatus;
}

// Proactive Architectural Health Check & Anti-Pattern Detection Types
export type HealthSeverity = 'critical' | 'warning' | 'notice' | 'healthy';

export type AntiPatternType = 
  | 'circular_dependency'
  | 'excessive_complexity'
  | 'god_module'
  | 'layer_inversion'
  | 'orphan_module'
  | 'high_coupling'
  | 'shotgun_surgery_risk';

export interface AntiPatternAlert {
  id: string;
  type: AntiPatternType;
  severity: HealthSeverity;
  title: string;
  description: string;
  targetNodeId: string;
  targetFilePath: string;
  affectedCycle?: string[];
  metrics: {
    couplingScore?: number;
    fanIn?: number;
    fanOut?: number;
    connectionsCount?: number;
    cycleLength?: number;
    depth?: number;
    complexityScore?: number;
  };
  impact: string;
  mitigation: string;
  suggestedActionLabel: string;
}

export interface NodeHealthStatus {
  nodeId: string;
  filePath: string;
  severity: HealthSeverity;
  healthScore: number; // 0 - 100
  color: string;
  badgeLabel: string;
  alerts: AntiPatternAlert[];
  fanIn: number;
  fanOut: number;
  isCycleMember: boolean;
  cycleChain?: string[];
  complexityRank: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface ArchitecturalHealthReport {
  repoName: string;
  scannedAt: number;
  totalModulesScanned: number;
  overallHealthScore: number; // 0 - 100
  healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  healthyModulesCount: number;
  warningModulesCount: number;
  criticalModulesCount: number;
  noticeModulesCount: number;
  summary: string;
  antiPatternBreakdown: {
    type: AntiPatternType;
    label: string;
    count: number;
    severity: HealthSeverity;
    color: string;
    description: string;
  }[];
  detectedCycles: {
    id: string;
    nodes: string[];
    description: string;
    severity: HealthSeverity;
  }[];
  highComplexityHotspots: {
    nodeId: string;
    filePath: string;
    fanIn: number;
    fanOut: number;
    connections: number;
    complexityScore: number;
    recommendation: string;
  }[];
  nodeHealthMap: Record<string, NodeHealthStatus>;
  recommendations: string[];
}

// Intelligent Refactoring & Code Modernization Types
export type RefactoringType = 
  | 'class_to_functional'
  | 'custom_hook_extraction'
  | 'state_modernization'
  | 'typescript_hardening'
  | 'architecture_decoupling'
  | 'async_pipeline'
  | 'performance_memoization';

export interface RefactoringSuggestion {
  id: string;
  title: string;
  filePath: string;
  refactoringType: RefactoringType;
  tier: ArchitectureTier | string;
  severity: 'high_impact' | 'medium_impact' | 'quick_win';
  effort: 'low' | 'moderate' | 'high';
  estimatedMinutes: number;
  motivation: string;
  codeBefore: string;
  codeAfter: string;
  diffExplanation: string[];
  modernizationGains: {
    boilerplateReductionPercent?: number;
    testability: 'high' | 'medium';
    bundleImpact: 'reduced' | 'neutral' | 'improved';
    readabilityScore: number; // 0 - 100
  };
  invariantGuardrails: string[];
  applied?: boolean;
}

export interface RefactoringCatalog {
  repoName: string;
  generatedAt: number;
  modernizationScore: number; // 0 - 100
  totalSuggestions: number;
  quickWinsCount: number;
  architecturalDebtReduction: string;
  summary: string;
  categoriesBreakdown: {
    category: string;
    type: RefactoringType;
    count: number;
    color: string;
  }[];
  suggestions: RefactoringSuggestion[];
}

export interface CustomFileRefactoringRequest {
  filePath: string;
  category: string;
  targetRecipe: RefactoringType | 'comprehensive';
  customInstructions?: string;
}

// Storage & Session State Types
export interface ActiveRepoContext {
  repoName: string;
  fileTree: RepoFileTree[];
  lastLoadedAt?: number;
  selectedFilePath?: string;
}

export interface AiAssistantSettings {
  selectedRoleId: string;
  selectedModel: GeminiModelId;
  includeCodebaseContext: boolean;
  customContext: string;
  messages: ChatMessage[];
  enableSearchGrounding?: boolean;
}

export interface PlanCreatorSettings {
  formData: PlanModelRequest;
  currentPlan: ImplementationPlan | null;
  selectedPhaseFilter: number | 'all';
}

export interface CodemapSettings {
  repoInput: string;
  activeRepoName: string;
  selectedCategory: ModuleCategory | 'all';
  selectedTier?: ArchitectureTier | 'all';
  searchQuery: string;
  activeTab?: 'topology' | 'schematic' | 'annotations' | 'antislop' | 'refactoring' | 'health';
  colorMode?: 'category' | 'tier' | 'health';
  aiInsights: {
    summary: string;
    hotspots: string[];
    recommendations: string[];
  } | null;
  vibeslopAudit?: VibeslopDefenseAudit | null;
  annotations?: Record<string, ModuleAnnotation>;
  refactoringCatalog?: RefactoringCatalog | null;
  healthReport?: ArchitecturalHealthReport | null;
}

export interface RepoAnalyzerSettings {
  repoInput: string;
  selectedStyle: string;
  selectedLanguage: string;
  customStyle: string;
}

export interface ArticleInfographicSettings {
  urlInput: string;
  selectedStyle: string;
  selectedLanguage: string;
  customStyle: string;
}

export type ReadmeStyle = 'comprehensive' | 'showcase' | 'minimalist' | 'opensource';

export interface ReadmeGeneratorOptions {
  repoName: string;
  style: ReadmeStyle;
  language: string;
  includeBadges: boolean;
  includeArchitectureMap: boolean;
  includeQuickstart: boolean;
  includeEnvTable: boolean;
  includeSecurityAudit: boolean;
  customFocusPrompt?: string;
}

export interface ReadmeResult {
  markdown: string;
  title: string;
  summary: string;
  featureCount: number;
  techStackDetected: string[];
  generatedAt: number;
  wordCount: number;
  readingTimeMinutes: number;
}

// -------------------------------------------------------------
// Auto-Skill Specification & AI Tooling Types
// -------------------------------------------------------------
export type SkillTargetDomain = 
  | 'architecture_governance'
  | 'security_hardening'
  | 'api_integration'
  | 'database_orm'
  | 'testing_qa'
  | 'performance_tuning'
  | 'deployment_devops'
  | 'frontend_design_system'
  | 'custom_domain';

export type SkillRuntimeTarget = 'ai_studio_system_skill' | 'claude_mcp_tool' | 'custom_agent_instruction';

export interface AutoSkillPromptOptions {
  repoName: string;
  domain: SkillTargetDomain;
  runtimeTarget: SkillRuntimeTarget;
  customObjective?: string;
  includeExecutableScripts: boolean;
  includeAntiPatterns: boolean;
  includeTypeContracts: boolean;
  includeEvaluationRubrics: boolean;
}

export interface AutoSkillReferenceExample {
  title: string;
  context: string;
  codeSnippet: string;
  expectedOutcome: string;
}

export interface AutoSkillArtifact {
  id: string;
  name: string;
  skillSlug: string;
  version: string;
  domain: SkillTargetDomain;
  runtimeTarget: SkillRuntimeTarget;
  description: string;
  markdownContent: string; // The complete SKILL.md
  yamlFrontmatter: {
    name: string;
    description: string;
    targetVersion?: string;
    author?: string;
    tags: string[];
  };
  triggerConditions: string[];
  invariantsAndRules: string[];
  antiPatterns: string[];
  executableScripts: {
    filename: string;
    language: string;
    description: string;
    code: string;
  }[];
  referenceExamples: AutoSkillReferenceExample[];
  groundedTechnologies: string[];
  generatedAt: number;
}

export type StudioTheme = 'architect' | 'blueprint' | 'draft';

export interface UserSessionData {
  version: number;
  lastSavedAt: number;
  currentView: ViewMode;
  introSeen: boolean;
  theme?: StudioTheme;
  activeRepoContext: ActiveRepoContext | null;
  repoHistory: RepoHistoryItem[];
  articleHistory: ArticleHistoryItem[];
  aiAssistantSettings?: AiAssistantSettings;
  planCreatorSettings?: PlanCreatorSettings;
  codemapSettings?: CodemapSettings;
  repoAnalyzerSettings?: RepoAnalyzerSettings;
  articleInfographicSettings?: ArticleInfographicSettings;
  a2uiSettings?: A2UISettings;
  integrationsSettings?: IntegrationsConsoleSettings;
}

// -------------------------------------------------------------
// A2UI: PROTOCOL FOR AGENT-DRIVEN INTERFACES (Declarative Native Spec)
// -------------------------------------------------------------

export type A2UIPlatform = 'web' | 'mobile_ios' | 'mobile_android' | 'desktop_macos';

export type A2UIComponentType =
  // Structural & Layout
  | 'container'
  | 'stack'
  | 'grid'
  | 'card'
  | 'section_header'
  | 'divider'
  | 'tabs'
  | 'accordion'
  | 'banner'
  | 'modal'
  // Content & Typography
  | 'text'
  | 'heading'
  | 'markdown'
  | 'badge'
  | 'callout'
  // Interactive Inputs & Controls
  | 'button'
  | 'action_button'
  | 'text_input'
  | 'number_input'
  | 'textarea'
  | 'select'
  | 'slider'
  | 'toggle'
  | 'checkbox_group'
  | 'radio_group'
  | 'date_picker'
  | 'tag_input'
  // Data Visualizations & Metrics
  | 'metric'
  | 'kpi_grid'
  | 'data_table'
  | 'bar_chart'
  | 'area_chart'
  | 'pie_chart'
  | 'progress_bar'
  | 'progress_ring'
  | 'timeline'
  | 'json_viewer'
  // Engineering & AI Primitives
  | 'code_diff'
  | 'code_block'
  | 'terminal_logs'
  | 'decision_matrix'
  | 'checklist'
  | 'flow_mini'
  | 'wizard_stepper';

export interface A2UIStyleOverrides {
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  direction?: 'row' | 'col';
  columns?: number;
  bgVariant?: 'default' | 'surface' | 'subtle' | 'elevated' | 'glass' | 'highlight' | 'danger' | 'warning' | 'success';
  borderVariant?: 'none' | 'default' | 'subtle' | 'highlight' | 'dashed' | 'danger';
  width?: 'auto' | 'full' | 'half' | 'third' | 'quarter';
  maxWidth?: string;
  maxHeight?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
}

export type A2UIActionType =
  | 'trigger_agent'
  | 'update_state'
  | 'navigate'
  | 'copy_to_clipboard'
  | 'submit_form'
  | 'open_modal'
  | 'close_modal'
  | 'download_payload'
  | 'reset_state';

export interface A2UIAction {
  type: A2UIActionType;
  actionId?: string;
  target?: string;
  label?: string;
  payload?: Record<string, any>;
  stateKey?: string;
  stateValue?: any;
  confirmation?: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: 'warning' | 'danger' | 'info';
  };
}

export interface A2UIComponent {
  id: string;
  type: A2UIComponentType;
  props?: Record<string, any>;
  children?: A2UIComponent[] | string;
  action?: A2UIAction;
  condition?: string; // e.g. "$state.activeTab === 'metrics'"
  style?: A2UIStyleOverrides;
}

export interface A2UIAgentMetadata {
  agentName?: string;
  agentRole?: string;
  model?: string;
  confidence?: number;
  executionTimeMs?: number;
  timestamp?: number;
  intent?: string;
}

export interface A2UISchema {
  version: string; // e.g. "a2ui/v1.0"
  id: string;
  title: string;
  description?: string;
  targetDomain?: string;
  agentMetadata?: A2UIAgentMetadata;
  initialState?: Record<string, any>;
  root: A2UIComponent;
}

export interface A2UIActionEvent {
  actionId?: string;
  type: A2UIActionType;
  componentId: string;
  timestamp: number;
  payload?: Record<string, any>;
  stateSnapshot: Record<string, any>;
}

export interface A2UISettings {
  activeTemplateId?: string;
  activePlatform?: A2UIPlatform;
  activeTab?: 'canvas' | 'spec_schema' | 'agent_chat' | 'export' | 'library';
  customSchema?: A2UISchema | null;
  history?: {
    id: string;
    title: string;
    generatedAt: number;
    prompt?: string;
  }[];
}

// -------------------------------------------------------------
// INTEGRATIONS CONSOLE TYPES (CLI, IDE, VIBE PLATFORMS, MCP, ALL CODEBASES)
// -------------------------------------------------------------

export type IntegrationConsoleTab = 'cli' | 'ide' | 'vibe' | 'mcp' | 'cicd' | 'ai_bridge' | 'auto_fix';

export type IdeType = 'cursor' | 'vscode' | 'jetbrains' | 'zed' | 'neovim' | 'windsurf';

export type VibePlatformType = 
  | 'v0' 
  | 'bolt_new' 
  | 'lovable' 
  | 'cursor_composer' 
  | 'chatgpt_canvas' 
  | 'claude_artifacts' 
  | 'replit';

export interface CodebaseCatalogItem {
  id: string;
  repoName: string;
  displayName: string;
  category: 'workspace' | 'history' | 'flagship' | 'custom';
  description: string;
  primaryLanguage: string;
  framework: string;
  badgeColor?: string;
  starsCount?: string;
  sampleFileTree: RepoFileTree[];
  tags: string[];
}

export interface CliCommandLog {
  id: string;
  command: string;
  timestamp: number;
  stdout: string[];
  exitCode: number;
  durationMs: number;
  category: 'scan' | 'codemap' | 'plan' | 'vibe' | 'mcp' | 'export' | 'help' | 'init' | 'diff';
  isExecuting?: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  jsonSchema: Record<string, any>;
  samplePayload: Record<string, any>;
  exampleResponse: string;
}

export interface VibePromptPack {
  platform: VibePlatformType;
  platformName: string;
  tagline: string;
  description?: string;
  iconName: string;
  accentColor: string;
  recommendedModel: string;
  estimatedTokens: number;
  promptText: string;
  systemInstruction: string;
  guardrails: string[];
  contextPacks: {
    title: string;
    content: string;
    type: 'tree' | 'rules' | 'contracts' | 'architecture';
  }[];
}

export interface IdeConfigFile {
  id: string;
  filename: string;
  destinationPath: string;
  language: 'json' | 'yaml' | 'markdown' | 'lua' | 'xml' | 'bash';
  title: string;
  description: string;
  content: string;
  features: string[];
}

export interface IntegrationsConsoleSettings {
  activeTab: IntegrationConsoleTab;
  activeCodebaseId: string;
  selectedIde: IdeType;
  selectedPlatform?: VibePlatformType;
  selectedVibePlatform?: VibePlatformType;
  selectedMcpTool?: string;
  commandHistory: CliCommandLog[];
  customRepoInput?: string;
  vibeOptions: {
    includeFileTree: boolean;
    includeAntiSlop: boolean;
    includeContracts: boolean;
    includeDagFlow: boolean;
    tokenBudget: 'compact' | 'standard' | 'maximum';
  };
}

// -------------------------------------------------------------
// CHANGE STACK & PULL REQUEST STUDIO TYPES
// -------------------------------------------------------------

export type PrStatus = 'open' | 'merged' | 'draft' | 'needs_review' | 'failing_ci' | 'approved';
export type PrCiStatus = 'passed' | 'failed' | 'running' | 'pending';
export type PrCommentSeverity = 'critical' | 'security' | 'performance' | 'suggestion' | 'style';
export type PrCommentStatus = 'unresolved' | 'resolved' | 'in_progress';

export interface PrReviewComment {
  id: string;
  author: string;
  authorRole: 'Tech Lead' | 'Security Bot' | 'Staff Architect' | 'CI Sentinel' | 'Peer Reviewer';
  authorAvatar?: string;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  body: string;
  severity: PrCommentSeverity;
  status: PrCommentStatus;
  createdAt: number;
  suggestedPatch?: {
    before: string;
    after: string;
    description: string;
  };
  aiAgentResponse?: {
    agentName: string;
    analysis: string;
    recommendedAction: string;
    confidence: number;
  };
}

export interface PrCiCheck {
  id: string;
  name: string;
  category: 'build' | 'typecheck' | 'test' | 'lint' | 'security' | 'bundle';
  status: 'passed' | 'failed' | 'running' | 'skipped';
  durationSeconds: number;
  errorMessage?: string;
  failureLog?: string;
  failingFile?: string;
  failingLine?: number;
  aiSuggestedFix?: {
    explanation: string;
    patchCode: string;
    fileToModify: string;
  };
}

export interface PrDocstringItem {
  id: string;
  filePath: string;
  symbolName: string;
  symbolKind: 'function' | 'class' | 'interface' | 'method' | 'hook';
  lineNumber: number;
  codeSnippet: string;
  hasDocstring: boolean;
  generatedDocstring?: string;
  applied?: boolean;
}

export interface PrUnitTestItem {
  id: string;
  sourceFile: string;
  testFilePath: string;
  framework: 'vitest' | 'jest' | 'pytest';
  testCode: string;
  testNames: string[];
  coverageDelta: number;
  status: 'draft' | 'committed_to_branch' | 'pr_created';
}

export interface PrFileDiff {
  path: string;
  oldPath?: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  architecturalIntent: string;
  diffHunks: {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    header: string;
    lines: {
      type: 'add' | 'delete' | 'context';
      content: string;
      oldLineNumber?: number;
      newLineNumber?: number;
    }[];
  }[];
}

export interface ChangeStackPr {
  id: string;
  number: number;
  title: string;
  branch: string;
  baseBranch: string;
  description: string;
  author: string;
  authorAvatar?: string;
  status: PrStatus;
  stackOrder: number; // 1 = base/deepest in stack, 2 = child, 3 = top
  isCurrentActive: boolean;
  createdAt: number;
  updatedAt: number;
  commitsCount: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  ciStatus: PrCiStatus;
  ciChecks: PrCiCheck[];
  reviewComments: PrReviewComment[];
  fileDiffs: PrFileDiff[];
  missingDocstrings: PrDocstringItem[];
  generatedUnitTests?: PrUnitTestItem;
  walkthrough: {
    highLevelSummary: string;
    architecturalImpact: string;
    keyModulesAffected: string[];
    riskScore: 'Low' | 'Moderate' | 'High';
    blastRadius: string;
    breakingChanges: boolean;
  };
  commitHistory: {
    hash: string;
    message: string;
    author: string;
    timestamp: number;
    filesCount: number;
  }[];
}

export interface ChangeStackState {
  repoName: string;
  activePrId: string;
  stack: ChangeStackPr[];
  selectedTab: 'walkthrough' | 'pre_merge' | 'finishing_touches' | 'comments' | 'diff';
  finishingSubTab: 'docstrings' | 'ci_fix' | 'unit_tests';
}




