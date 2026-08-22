/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { A2UISchema } from '../../types';

export interface A2UITemplateMetadata {
  id: string;
  name: string;
  category: 'devops' | 'database' | 'refactoring' | 'security' | 'ai_tuning' | 'incident';
  icon: string;
  badge: string;
  description: string;
  schema: A2UISchema;
}

export const A2UI_TEMPLATES: A2UITemplateMetadata[] = [
  {
    id: 'k8s_autoscaler',
    name: 'Kubernetes Cluster & Autoscaling Governor',
    category: 'devops',
    icon: 'Cpu',
    badge: 'DevOps & Cloud',
    description: 'Real-time telemetry, replica scaling sliders, active node inventory, and one-click rollback gate.',
    schema: {
      version: 'a2ui/v1.0',
      id: 'schema-k8s-autoscale-01',
      title: 'Kubernetes Cluster Health & Autoscaling Governor',
      description: 'Agent-driven control plane for workload scaling and node pool lifecycle management.',
      targetDomain: 'Infrastructure / Cloud',
      agentMetadata: {
        agentName: 'DevOps Copilot',
        agentRole: 'Site Reliability Agent',
        model: 'gemini-3.7-flash',
        confidence: 0.98,
        executionTimeMs: 420,
        intent: 'Tune pod replica allocation and verify node pressure thresholds'
      },
      initialState: {
        minReplicas: 3,
        maxReplicas: 12,
        targetCpuPercent: 75,
        canaryTrafficPercent: 15,
        autoDrainUnhealthy: true,
        clusterRegion: 'us-central1-a',
        activeProfile: 'production_high_avail'
      },
      root: {
        id: 'root-container',
        type: 'container',
        style: { padding: 'md', gap: 'md', bgVariant: 'surface', rounded: 'xl' },
        children: [
          {
            id: 'header-banner',
            type: 'banner',
            props: {
              title: 'Cluster Autoscale Governor (Production)',
              subtitle: 'Agent monitored cluster "prod-asia-cluster-04" • Health Grade A+ • 12 Active Nodes',
              status: 'healthy',
              tag: 'Agent Active'
            }
          },
          {
            id: 'kpi-row',
            type: 'kpi_grid',
            props: {
              columns: 4,
              items: [
                { id: 'kpi-1', label: 'CPU Utilization', value: '64.2%', change: '-4.1%', trend: 'down', status: 'good' },
                { id: 'kpi-2', label: 'Memory Pressure', value: '4.8 GB / 16 GB', change: '+1.2%', trend: 'up', status: 'normal' },
                { id: 'kpi-3', label: 'P99 Pod Latency', value: '28ms', change: '-12ms', trend: 'down', status: 'good' },
                { id: 'kpi-4', label: 'Active Replicas', value: '8 Pods', change: 'Autoscaling Enabled', status: 'highlight' }
              ]
            }
          },
          {
            id: 'main-grid',
            type: 'grid',
            style: { columns: 2, gap: 'md' },
            children: [
              {
                id: 'scaling-card',
                type: 'card',
                props: { title: 'Autoscaling Thresholds & Limits', icon: 'Sliders' },
                style: { padding: 'md', gap: 'sm', bgVariant: 'subtle', rounded: 'lg' },
                children: [
                  {
                    id: 'cpu-slider',
                    type: 'slider',
                    props: {
                      label: 'Target CPU Utilization Trigger (%)',
                      min: 30,
                      max: 95,
                      step: 5,
                      valueKey: 'targetCpuPercent',
                      unit: '%'
                    },
                    action: {
                      type: 'update_state',
                      stateKey: 'targetCpuPercent'
                    }
                  },
                  {
                    id: 'replicas-slider',
                    type: 'slider',
                    props: {
                      label: 'Maximum Pod Replica Ceiling',
                      min: 4,
                      max: 32,
                      step: 1,
                      valueKey: 'maxReplicas',
                      unit: ' pods'
                    },
                    action: {
                      type: 'update_state',
                      stateKey: 'maxReplicas'
                    }
                  },
                  {
                    id: 'auto-drain-toggle',
                    type: 'toggle',
                    props: {
                      label: 'Automated Node Cordon & Drain',
                      description: 'Isolate nodes encountering memory leaks or kernel panic',
                      valueKey: 'autoDrainUnhealthy'
                    },
                    action: {
                      type: 'update_state',
                      stateKey: 'autoDrainUnhealthy'
                    }
                  },
                  {
                    id: 'apply-scaling-btn',
                    type: 'action_button',
                    props: {
                      label: 'Deploy Scaler Adjustments',
                      variant: 'primary',
                      icon: 'Zap'
                    },
                    action: {
                      type: 'trigger_agent',
                      actionId: 'apply_k8s_hpa_config',
                      confirmation: {
                        title: 'Confirm HPA Policy Update',
                        message: 'This will patch the HorizontalPodAutoscaler spec across all 8 deployment namespaces.',
                        confirmLabel: 'Apply Config',
                        severity: 'info'
                      }
                    }
                  }
                ]
              },
              {
                id: 'nodes-card',
                type: 'card',
                props: { title: 'Node Pool Health Telemetry', icon: 'HardDrive' },
                style: { padding: 'md', gap: 'sm', bgVariant: 'subtle', rounded: 'lg' },
                children: [
                  {
                    id: 'node-table',
                    type: 'data_table',
                    props: {
                      headers: ['Node Host', 'Role', 'CPU Load', 'Status'],
                      rows: [
                        ['node-gke-worker-01', 'Worker', '58%', { type: 'badge', label: 'Healthy', variant: 'success' }],
                        ['node-gke-worker-02', 'Worker', '72%', { type: 'badge', label: 'High Load', variant: 'warning' }],
                        ['node-gke-worker-03', 'Worker', '44%', { type: 'badge', label: 'Healthy', variant: 'success' }],
                        ['node-gke-ingress-01', 'Ingress', '81%', { type: 'badge', label: 'Cordon Candidate', variant: 'danger' }]
                      ]
                    }
                  },
                  {
                    id: 'terminal-stream',
                    type: 'terminal_logs',
                    props: {
                      title: 'Live HPA Event Stream',
                      maxLines: 4,
                      logs: [
                        '[18:14:02] [HPA-Controller] Pod autoscaling evaluated: 8 replicas stable.',
                        '[18:14:15] [Kubelet] node-gke-worker-02 reported memory reclaim event.',
                        '[18:14:30] [A2UI-Agent] Telemetry invariant verified. No eviction thresholds exceeded.'
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'db_migration_wizard',
    name: 'Zero-Downtime Database Schema Migration',
    category: 'database',
    icon: 'Database',
    badge: 'Database & SQL',
    description: 'Step-by-step SQL migration planner with safety lock validation, table size impact, and rollback scripts.',
    schema: {
      version: 'a2ui/v1.0',
      id: 'schema-db-migration-02',
      title: 'Zero-Downtime PostgreSQL Schema Migration',
      description: 'Declarative schema evolution plan generated for non-blocking online column migrations.',
      targetDomain: 'Database / PostgreSQL',
      agentMetadata: {
        agentName: 'Data Architect Agent',
        agentRole: 'Database Reliability Specialist',
        model: 'gemini-3.7-flash',
        confidence: 0.99,
        executionTimeMs: 510,
        intent: 'Add non-blocking composite index and nullable foreign key column'
      },
      initialState: {
        activeStep: 2,
        concurrentIndexEnabled: true,
        statementTimeoutMs: 3000,
        targetTable: 'user_audit_events'
      },
      root: {
        id: 'root-db-container',
        type: 'container',
        style: { padding: 'md', gap: 'md', bgVariant: 'surface', rounded: 'xl' },
        children: [
          {
            id: 'migration-stepper',
            type: 'wizard_stepper',
            props: {
              currentStep: 2,
              steps: [
                { id: 1, title: 'Dry Run Analysis', status: 'completed' },
                { id: 2, title: 'Lock Impact & SQL Diff', status: 'active' },
                { id: 3, title: 'Online Shadow Index', status: 'upcoming' },
                { id: 4, title: 'Final Cutover', status: 'upcoming' }
              ]
            }
          },
          {
            id: 'sql-diff-block',
            type: 'code_diff',
            props: {
              title: 'Migration SQL Blueprint: 20260821_add_tenant_indexes.sql',
              language: 'sql',
              leftTitle: 'Current Table Schema (V4)',
              rightTitle: 'Target Non-Blocking Schema (V5)',
              codeBefore: `-- V4: Single column index\nCREATE TABLE user_audit_events (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID NOT NULL,\n  action VARCHAR(64) NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX idx_audit_user ON user_audit_events(user_id);`,
              codeAfter: `-- V5: Non-blocking multi-tenant composite index\nALTER TABLE user_audit_events \n  ADD COLUMN IF NOT EXISTS tenant_id UUID NULL;\n\n-- Concurrently build composite index to avoid exclusive locks\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant_created \n  ON user_audit_events (tenant_id, created_at DESC)\n  WHERE tenant_id IS NOT NULL;`
            }
          },
          {
            id: 'db-metrics-grid',
            type: 'grid',
            style: { columns: 3, gap: 'md' },
            children: [
              {
                id: 'table-rows-metric',
                type: 'metric',
                props: {
                  label: 'Affected Rows',
                  value: '4,280,100',
                  subtext: 'Table size: ~840 MB on disk',
                  badge: 'Large Dataset',
                  variant: 'warning'
                }
              },
              {
                id: 'lock-risk-metric',
                type: 'metric',
                props: {
                  label: 'Estimated Lock Duration',
                  value: '< 15 ms',
                  subtext: 'Safe online operation (CONCURRENTLY)',
                  badge: 'Zero Downtime',
                  variant: 'success'
                }
              },
              {
                id: 'timeout-metric',
                type: 'metric',
                props: {
                  label: 'Statement Lock Timeout',
                  value: '3.0s Max',
                  subtext: 'Prevents query starvation queue',
                  badge: 'Enforced',
                  variant: 'highlight'
                }
              }
            ]
          },
          {
            id: 'safety-checklist',
            type: 'checklist',
            props: {
              title: 'Database Reliability Guardrails',
              items: [
                { id: 'c1', label: 'Nullable column addition requires no full-table rewrite (PG 11+)', checked: true },
                { id: 'c2', label: 'Index creation uses CONCURRENTLY to prevent SHARE UPDATE EXCLUSIVE locks', checked: true },
                { id: 'c3', label: 'Automated rollback script generated and validated in staging', checked: true },
                { id: 'c4', label: 'Replication lag monitor configured (< 2.0s threshold)', checked: true }
              ]
            }
          },
          {
            id: 'action-bar',
            type: 'stack',
            style: { direction: 'row', justify: 'between', align: 'center', padding: 'sm' },
            children: [
              {
                id: 'abort-btn',
                type: 'button',
                props: { label: 'Abort Migration', variant: 'ghost' },
                action: { type: 'reset_state' }
              },
              {
                id: 'execute-btn',
                type: 'action_button',
                props: { label: 'Execute Online Migration Phase', variant: 'primary', icon: 'Play' },
                action: {
                  type: 'trigger_agent',
                  actionId: 'execute_db_migration_step',
                  confirmation: {
                    title: 'Execute Database Schema Migration',
                    message: 'Are you sure you want to execute step 2 on "user_audit_events"? Real-time statement timeouts are active.',
                    confirmLabel: 'Run Migration',
                    severity: 'warning'
                  }
                }
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'ai_refactoring_diff',
    name: 'AI Code Refactoring & Semantic Safety Diff',
    category: 'refactoring',
    icon: 'GitMerge',
    badge: 'Code Modernization',
    description: 'Interactive side-by-side component refactoring preview with invariant checklists and boilerplate reduction gains.',
    schema: {
      version: 'a2ui/v1.0',
      id: 'schema-ai-refactor-03',
      title: 'Component Modernization: Custom Hook & Strict TypeScript',
      description: 'AI-generated refactoring transforming legacy class lifecycle into React 19 functional hooks.',
      targetDomain: 'Frontend / React',
      agentMetadata: {
        agentName: 'Architecture Modernization Agent',
        agentRole: 'Staff TypeScript Architect',
        model: 'gemini-3.7-flash',
        confidence: 0.97,
        executionTimeMs: 380,
        intent: 'Refactor SessionManager.tsx to eliminative race conditions and memory leaks'
      },
      initialState: {
        selectedTarget: 'useSessionManager',
        autoFormat: true,
        runTestsAfterApply: true
      },
      root: {
        id: 'root-refactor',
        type: 'container',
        style: { padding: 'md', gap: 'md', bgVariant: 'surface', rounded: 'xl' },
        children: [
          {
            id: 'refactor-header',
            type: 'section_header',
            props: {
              title: 'Refactor Target: src/components/SessionManager.tsx',
              description: 'Class component lifecycle extraction into modular custom hook `useSessionManager` with strict Discriminated Union contracts.',
              badgeText: 'High Impact • 48% Boilerplate Cut'
            }
          },
          {
            id: 'gains-kpis',
            type: 'kpi_grid',
            props: {
              columns: 3,
              items: [
                { id: 'g1', label: 'Boilerplate Reduction', value: '-48%', subtext: '38 lines removed', trend: 'down', status: 'good' },
                { id: 'g2', label: 'Testability Score', value: '96 / 100', subtext: 'Decoupled DOM mock', trend: 'up', status: 'good' },
                { id: 'g3', label: 'Memory Leak Risk', value: 'Zero', subtext: 'AbortController attached', status: 'highlight' }
              ]
            }
          },
          {
            id: 'code-diff-component',
            type: 'code_diff',
            props: {
              title: 'Side-by-Side Modernization Diff',
              language: 'typescript',
              leftTitle: 'Before: Legacy Class Lifecycle',
              rightTitle: 'After: Modern Functional Hook',
              codeBefore: `// Legacy Class Component\nexport class SessionManager extends React.Component<Props, State> {\n  state = { session: null, loading: true };\n\n  componentDidMount() {\n    this.initSession();\n    window.addEventListener('storage', this.onStorageChange);\n  }\n\n  componentWillUnmount() {\n    window.removeEventListener('storage', this.onStorageChange);\n  }\n\n  initSession = async () => {\n    const data = await authService.loadSession();\n    this.setState({ session: data, loading: false });\n  };\n\n  render() {\n    if (this.state.loading) return <Spinner />;\n    return <div>User: {this.state.session?.email}</div>;\n  }\n}`,
              codeAfter: `// Modernized Custom Hook & Functional Component\nexport function useSessionManager() {\n  const [session, setSession] = useState<UserSession | null>(null);\n  const [isLoading, setIsLoading] = useState(true);\n\n  useEffect(() => {\n    const controller = new AbortController();\n    authService.loadSession({ signal: controller.signal })\n      .then(data => setSession(data))\n      .finally(() => setIsLoading(false));\n\n    const onStorage = (e: StorageEvent) => {\n      if (e.key === 'session') setSession(JSON.parse(e.newValue || 'null'));\n    };\n    window.addEventListener('storage', onStorage);\n    return () => {\n      controller.abort();\n      window.removeEventListener('storage', onStorage);\n    };\n  }, []);\n\n  return { session, isLoading };\n}`
            }
          },
          {
            id: 'invariants-matrix',
            type: 'decision_matrix',
            props: {
              title: 'Verified Invariant Contracts',
              items: [
                { name: 'Public Prop Compatibility', status: 'pass', description: 'Zero breaking changes to outer component consumer interfaces' },
                { name: 'Storage Event Sync', status: 'pass', description: 'Cross-tab multi-window session updates remain synchronized' },
                { name: 'Unmount Abort Cleanup', status: 'pass', description: 'In-flight fetch requests safely aborted on navigation unmount' }
              ]
            }
          },
          {
            id: 'bottom-actions',
            type: 'stack',
            style: { direction: 'row', justify: 'end', gap: 'sm' },
            children: [
              {
                id: 'copy-code-btn',
                type: 'button',
                props: { label: 'Copy Refactored Code', variant: 'secondary', icon: 'Copy' },
                action: { type: 'copy_to_clipboard', payload: { text: 'useSessionManager' } }
              },
              {
                id: 'apply-patch-btn',
                type: 'action_button',
                props: { label: 'Apply Refactoring to Workspace', variant: 'primary', icon: 'CheckCircle2' },
                action: {
                  type: 'trigger_agent',
                  actionId: 'apply_code_refactoring_patch',
                  confirmation: {
                    title: 'Apply Code Modernization',
                    message: 'This will replace SessionManager.tsx with the modernized custom hook pattern.',
                    confirmLabel: 'Apply Patch',
                    severity: 'info'
                  }
                }
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'feature_flag_canary',
    name: 'Feature Flag & Traffic Canary Dial',
    category: 'devops',
    icon: 'Radio',
    badge: 'Release Engineering',
    description: 'Dynamic traffic distribution dials, real-time error rate comparison, and automated circuit breaker tripwires.',
    schema: {
      version: 'a2ui/v1.0',
      id: 'schema-flag-canary-04',
      title: 'Canary Release Governor: AI_SMART_SUGGESTIONS_V2',
      description: 'Dynamic traffic distribution controls with live error rate tripwires and user segment toggles.',
      targetDomain: 'Release Management',
      agentMetadata: {
        agentName: 'Release Orchestrator',
        agentRole: 'Continuous Delivery Agent',
        model: 'gemini-3.7-flash',
        confidence: 0.99,
        executionTimeMs: 310,
        intent: 'Safely dial up canary traffic to 25% for internal beta testers'
      },
      initialState: {
        canaryPercent: 25,
        targetSegment: 'beta_users',
        enableTripwire: true,
        maxErrorThreshold: 0.05
      },
      root: {
        id: 'root-flag-container',
        type: 'container',
        style: { padding: 'md', gap: 'md', bgVariant: 'surface', rounded: 'xl' },
        children: [
          {
            id: 'canary-banner',
            type: 'banner',
            props: {
              title: 'Flag: EXPERIMENTAL_A2UI_RENDERER',
              subtitle: 'Canary Tier 2 • Active Traffic: 25% • Error Budget: 99.98% Available',
              status: 'healthy',
              tag: 'Rolling Out'
            }
          },
          {
            id: 'traffic-slider',
            type: 'slider',
            props: {
              label: 'Canary Traffic Allocation Percentage',
              min: 0,
              max: 100,
              step: 5,
              valueKey: 'canaryPercent',
              unit: '%'
            },
            action: { type: 'update_state', stateKey: 'canaryPercent' }
          },
          {
            id: 'metrics-comparison',
            type: 'grid',
            style: { columns: 2, gap: 'md' },
            children: [
              {
                id: 'baseline-card',
                type: 'card',
                props: { title: 'Baseline (V1 Default)', icon: 'ShieldCheck' },
                style: { padding: 'md', bgVariant: 'subtle', rounded: 'lg' },
                children: [
                  {
                    id: 'm1',
                    type: 'metric',
                    props: { label: 'Error Rate', value: '0.012%', subtext: '12 per 100k requests', variant: 'success' }
                  },
                  {
                    id: 'm2',
                    type: 'metric',
                    props: { label: 'Median Latency', value: '42 ms', subtext: 'P95: 88 ms', variant: 'normal' }
                  }
                ]
              },
              {
                id: 'canary-card',
                type: 'card',
                props: { title: 'Canary (V2 Candidate)', icon: 'Zap' },
                style: { padding: 'md', bgVariant: 'subtle', rounded: 'lg' },
                children: [
                  {
                    id: 'm3',
                    type: 'metric',
                    props: { label: 'Error Rate', value: '0.009%', subtext: '9 per 100k requests', variant: 'success' }
                  },
                  {
                    id: 'm4',
                    type: 'metric',
                    props: { label: 'Median Latency', value: '26 ms', subtext: 'P95: 54 ms (38% faster)', variant: 'good' }
                  }
                ]
              }
            ]
          },
          {
            id: 'actions-row',
            type: 'stack',
            style: { direction: 'row', justify: 'between', align: 'center' },
            children: [
              {
                id: 'emergency-rollback',
                type: 'button',
                props: { label: 'Emergency Rollback to 0%', variant: 'danger', icon: 'ShieldAlert' },
                action: {
                  type: 'trigger_agent',
                  actionId: 'emergency_kill_flag',
                  confirmation: {
                    title: 'Emergency Flag Shutdown',
                    message: 'Immediately reroute 100% of traffic back to stable baseline.',
                    confirmLabel: 'Kill Flag',
                    severity: 'danger'
                  }
                }
              },
              {
                id: 'promote-canary',
                type: 'action_button',
                props: { label: 'Promote Canary to 100% (Full GA)', variant: 'primary', icon: 'Sparkles' },
                action: {
                  type: 'trigger_agent',
                  actionId: 'promote_canary_to_ga',
                  confirmation: {
                    title: 'Promote to 100% General Availability',
                    message: 'All users worldwide will now be served by the V2 candidate.',
                    confirmLabel: 'Promote to GA',
                    severity: 'info'
                  }
                }
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'incident_triage_matrix',
    name: 'Incident Postmortem & Root Cause Triage',
    category: 'incident',
    icon: 'ShieldAlert',
    badge: 'Reliability',
    description: 'Post-incident timeline reconstruction, service impact graph, and automated preventive action tracking.',
    schema: {
      version: 'a2ui/v1.0',
      id: 'schema-incident-triage-05',
      title: 'Incident Postmortem: INC-8492 API Latency Spike',
      description: 'Root cause analysis and corrective action items generated after upstream gateway saturation.',
      targetDomain: 'Incident Management',
      agentMetadata: {
        agentName: 'Incident Commander Agent',
        agentRole: 'SRE Postmortem Facilitator',
        model: 'gemini-3.7-flash',
        confidence: 0.99,
        executionTimeMs: 440,
        intent: 'Synthesize incident timeline and track follow-up engineering mitigations'
      },
      initialState: {
        incidentResolved: true,
        durationMinutes: 18,
        affectedUsers: 1420
      },
      root: {
        id: 'root-inc-container',
        type: 'container',
        style: { padding: 'md', gap: 'md', bgVariant: 'surface', rounded: 'xl' },
        children: [
          {
            id: 'inc-banner',
            type: 'banner',
            props: {
              title: 'INC-8492: Gateway Upstream Connection Pool Exhaustion',
              subtitle: 'Severity: SEV-2 • Duration: 18 minutes • MTTR: 11 mins • Status: Resolved & Mitigated',
              status: 'resolved',
              tag: 'Postmortem Active'
            }
          },
          {
            id: 'timeline-comp',
            type: 'timeline',
            props: {
              title: 'Reconstructed Incident Chronology',
              events: [
                { time: '17:42 UTC', title: 'Traffic Spike', description: 'Batch ETL webhook triggered sudden 6x influx on /v1/events', status: 'warning' },
                { time: '17:46 UTC', title: 'Connection Saturation', description: 'Database connection pool reached 100% capacity limit', status: 'danger' },
                { time: '17:51 UTC', title: 'Agent Self-Healing Triggered', description: 'Circuit breaker throttled unauthenticated webhook retry storms', status: 'highlight' },
                { time: '18:00 UTC', title: 'Full Recovery', description: 'All endpoints returned to nominal p99 < 35ms latency', status: 'success' }
              ]
            }
          },
          {
            id: 'action-items',
            type: 'checklist',
            props: {
              title: 'Preventive Engineering Action Items',
              items: [
                { id: 'a1', label: 'Deploy Redis Token Bucket rate-limiter on batch ingestion endpoint', checked: true },
                { id: 'a2', label: 'Increase PgBouncer max client connections pool from 250 to 800', checked: true },
                { id: 'a3', label: 'Configure Prometheus alerting threshold at 80% pool utilization', checked: false },
                { id: 'a4', label: 'Conduct simulated chaos load testing for upstream network partitions', checked: false }
              ]
            }
          }
        ]
      }
    }
  }
];
