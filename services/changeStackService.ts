/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ChangeStackPr, 
  PrReviewComment, 
  PrCiCheck, 
  PrDocstringItem, 
  PrUnitTestItem, 
  PrFileDiff,
  ActiveRepoContext
} from '../types';

// Initial / Default Change Stack Mock Data grounded in realistic repository architecture
export const getDefaultChangeStack = (activeRepoContext?: ActiveRepoContext | null): ChangeStackPr[] => {
  const repoName = activeRepoContext?.repoName || 'google/link2ink-core';

  return [
    {
      id: 'pr-101',
      number: 101,
      title: 'refactor(core): modularize DAG layout engine & cluster bounds',
      branch: 'refactor/dag-layout-modularization',
      baseBranch: 'main',
      description: 'Isolate force-directed simulation algorithms into decoupled layout engines to boost graph rendering performance for 10,000+ node codebases.',
      author: 'alex-architect',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60',
      status: 'merged',
      stackOrder: 1,
      isCurrentActive: false,
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 2,
      commitsCount: 3,
      filesChanged: 4,
      additions: 218,
      deletions: 94,
      ciStatus: 'passed',
      ciChecks: [
        { id: 'ci-101-1', name: 'TypeScript Typecheck', category: 'typecheck', status: 'passed', durationSeconds: 14 },
        { id: 'ci-101-2', name: 'Vitest Unit & Integration', category: 'test', status: 'passed', durationSeconds: 22 },
        { id: 'ci-101-3', name: 'ESLint Ruleset', category: 'lint', status: 'passed', durationSeconds: 9 }
      ],
      reviewComments: [],
      fileDiffs: [],
      missingDocstrings: [],
      walkthrough: {
        highLevelSummary: 'Foundation layer of the change stack. Decoupled monolithic graph calculations into clean spatial coordinate transformers.',
        architecturalImpact: 'Substantially reduces memory footprint by 35% across high-density graph renders.',
        keyModulesAffected: ['utils/layoutAlgorithms.ts', 'components/D3FlowChart.tsx'],
        riskScore: 'Low',
        blastRadius: 'Internal simulation math',
        breakingChanges: false
      },
      commitHistory: [
        { hash: 'a19b8c2', message: 'refactor: extract computeGraphBounds and spatial collision grids', author: 'alex-architect', timestamp: Date.now() - 86400000 * 3, filesCount: 3 },
        { hash: 'e4f2109', message: 'test: add layout algorithm regression test fixtures', author: 'alex-architect', timestamp: Date.now() - 86400000 * 2, filesCount: 2 }
      ]
    },
    {
      id: 'pr-102',
      number: 102,
      title: 'feat(auth): token claim verification & RBAC policy resolver',
      branch: 'feat/token-claim-verification-rbac',
      baseBranch: 'refactor/dag-layout-modularization',
      description: 'Implement secure JWT signature validation, granular role-permission mappings, and middleware guardrails for API routes.',
      author: 'sam-security',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60',
      status: 'approved',
      stackOrder: 2,
      isCurrentActive: false,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 1,
      commitsCount: 4,
      filesChanged: 6,
      additions: 342,
      deletions: 48,
      ciStatus: 'passed',
      ciChecks: [
        { id: 'ci-102-1', name: 'TypeScript Strict Mode', category: 'typecheck', status: 'passed', durationSeconds: 16 },
        { id: 'ci-102-2', name: 'Security Vulnerability Audit', category: 'security', status: 'passed', durationSeconds: 31 },
        { id: 'ci-102-3', name: 'Test Coverage > 80%', category: 'test', status: 'passed', durationSeconds: 28 }
      ],
      reviewComments: [],
      fileDiffs: [],
      missingDocstrings: [],
      walkthrough: {
        highLevelSummary: 'Introduces core security domain primitives and cryptographic claim verification middleware.',
        architecturalImpact: 'Standardizes auth headers across all API endpoints with zero-allocation token decode cache.',
        keyModulesAffected: ['services/authService.ts', 'server/middleware/auth.ts'],
        riskScore: 'Moderate',
        blastRadius: 'Authentication barrier',
        breakingChanges: false
      },
      commitHistory: [
        { hash: '7c89f11', message: 'feat: add rbac matrix evaluator with policy inheritance', author: 'sam-security', timestamp: Date.now() - 86400000 * 2, filesCount: 4 },
        { hash: '3d2b09a', message: 'test: add mock token verification edge cases', author: 'sam-security', timestamp: Date.now() - 86400000 * 1, filesCount: 2 }
      ]
    },
    {
      id: 'pr-103',
      number: 103,
      title: 'feat(change-stack): interactive PR review hub & pre-merge AI sentinel',
      branch: 'feat/change-stack-pr-review-hub',
      baseBranch: 'feat/token-claim-verification-rbac',
      description: 'Integrates automated change stack traversal, pre-merge gatekeeper diagnostics, intelligent finishing touches (docstring generation, CI error healing, unit test synthesizer), and interactive multi-agent review comment remediation.',
      author: 'dev-master',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
      status: 'failing_ci',
      stackOrder: 3,
      isCurrentActive: true,
      createdAt: Date.now() - 3600000 * 8,
      updatedAt: Date.now() - 3600000 * 1,
      commitsCount: 5,
      filesChanged: 7,
      additions: 512,
      deletions: 68,
      ciStatus: 'failed',
      ciChecks: [
        { 
          id: 'ci-103-1', 
          name: 'TypeScript Compiler (tsc --noEmit)', 
          category: 'typecheck', 
          status: 'failed', 
          durationSeconds: 12,
          errorMessage: 'Property "roleHierarchy" does not exist on type "RolePermissionConfig". Did you mean "roleHierachy"?',
          failureLog: `[error] src/services/authService.ts(64,19): error TS2551: Property 'roleHierarchy' does not exist on type 'RolePermissionConfig'.
[error] src/services/authService.ts(68,14): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
[failure] Type check completed with 2 fatal diagnostic errors. Exit code 2.`,
          failingFile: 'services/authService.ts',
          failingLine: 64,
          aiSuggestedFix: {
            explanation: 'Fix typo in interface contract from "roleHierachy" to "roleHierarchy" and provide fallback empty string default for undefined token realm.',
            patchCode: `export interface RolePermissionConfig {\n  roles: Record<string, string[]>;\n  roleHierarchy: Record<string, number>; // Fixed typo from roleHierachy\n  defaultRealm: string;\n}`,
            fileToModify: 'services/authService.ts'
          }
        },
        { 
          id: 'ci-103-2', 
          name: 'Vitest Unit & Integration Suite', 
          category: 'test', 
          status: 'failed', 
          durationSeconds: 19,
          errorMessage: '2 test cases failed: Expected expired token to throw AuthenticationError(401), received null',
          failureLog: `FAIL src/services/authService.test.ts > verifyRole() > should reject expired token with 401
AssertionError: expected null to be instance of AuthenticationError
  - Expected: AuthenticationError
  - Received: null
    at src/services/authService.test.ts:48:19`,
          failingFile: 'services/authService.ts',
          failingLine: 42,
          aiSuggestedFix: {
            explanation: 'Add explicit token expiry check inside verifyRole() before returning claims.',
            patchCode: `if (claims.exp && claims.exp * 1000 < Date.now()) {\n  throw new AuthenticationError('Token has expired', 401);\n}`,
            fileToModify: 'services/authService.ts'
          }
        },
        { id: 'ci-103-3', name: 'ESLint & Architecture Invariants', category: 'lint', status: 'passed', durationSeconds: 8 },
        { id: 'ci-103-4', name: 'Security Vulnerability & Secret Scanner', category: 'security', status: 'passed', durationSeconds: 15 },
        { id: 'ci-103-5', name: 'Bundle Size & Performance Budget', category: 'bundle', status: 'passed', durationSeconds: 11 }
      ],
      reviewComments: [
        {
          id: 'comm-1',
          author: 'sarah-security-lead',
          authorRole: 'Tech Lead',
          authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=60',
          filePath: 'services/authService.ts',
          lineNumber: 42,
          codeSnippet: `export function verifyRole(token: string, requiredRole: string): UserClaims | null {\n  const claims = decodeJwt(token);\n  // BUG: Missing check for token expiration timestamp\n  if (claims.role !== requiredRole) return null;\n  return claims;\n}`,
          body: 'Critical security risk: `verifyRole()` checks role equality but does NOT validate `claims.exp` timestamp. Expired JWTs will be treated as valid as long as role matches.',
          severity: 'critical',
          status: 'unresolved',
          createdAt: Date.now() - 3600000 * 5,
          suggestedPatch: {
            before: `if (claims.role !== requiredRole) return null;`,
            after: `if (claims.exp && claims.exp * 1000 < Date.now()) return null;\nif (claims.role !== requiredRole) return null;`,
            description: 'Validate token expiration timestamp before checking role permissions.'
          },
          aiAgentResponse: {
            agentName: 'Security Sentinel AI',
            analysis: 'Confirmed high-severity vulnerability: without timestamp bounds verification, revoked or stale bearer tokens will bypass access gateways.',
            recommendedAction: 'Apply expiration timestamp guard and throw typed AuthenticationError instead of silently returning null.',
            confidence: 0.98
          }
        },
        {
          id: 'comm-2',
          author: 'marcus-perf-bot',
          authorRole: 'CI Sentinel',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60',
          filePath: 'hooks/useRolePermissions.ts',
          lineNumber: 88,
          codeSnippet: `useEffect(() => {\n  const sub = authStore.subscribe((state) => setPerms(state.permissions));\n  // Missing return unsubscribe listener cleanup\n}, []);`,
          body: 'Potential memory leak: The reactive subscription to `authStore` is never cleaned up when component unmounts.',
          severity: 'performance',
          status: 'unresolved',
          createdAt: Date.now() - 3600000 * 4,
          suggestedPatch: {
            before: `  authStore.subscribe((state) => setPerms(state.permissions));\n}, []);`,
            after: `  const unsubscribe = authStore.subscribe((state) => setPerms(state.permissions));\n  return () => unsubscribe();\n}, []);`,
            description: 'Return unsubscribe cleanup function inside useEffect.'
          },
          aiAgentResponse: {
            agentName: 'Performance Guard AI',
            analysis: 'Every navigation lifecycle instantiates a duplicate listener on authStore, holding references in memory.',
            recommendedAction: 'Return cleanup callback to prevent detached DOM memory leaks.',
            confidence: 0.95
          }
        },
        {
          id: 'comm-3',
          author: 'elena-staff-eng',
          authorRole: 'Staff Architect',
          authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&auto=format&fit=crop&q=60',
          filePath: 'types/auth.ts',
          lineNumber: 24,
          codeSnippet: `export interface RolePermissionConfig {\n  roles: Record<string, string[]>;\n  roleHierachy: Record<string, number>; // typo: roleHierachy\n}`,
          body: 'Typo in public contract interface: `roleHierachy` should be spelled `roleHierarchy`. This breaks TypeScript auto-complete and causes CI build failure TS2551.',
          severity: 'suggestion',
          status: 'unresolved',
          createdAt: Date.now() - 3600000 * 3,
          suggestedPatch: {
            before: `roleHierachy: Record<string, number>;`,
            after: `roleHierarchy: Record<string, number>;`,
            description: 'Fix typo in property name from roleHierachy to roleHierarchy.'
          },
          aiAgentResponse: {
            agentName: 'Contract Linter AI',
            analysis: 'Typographical error causing breaking compiler error TS2551 across consumer files.',
            recommendedAction: 'Rename interface property and update all 3 call sites in authService.ts.',
            confidence: 0.99
          }
        },
        {
          id: 'comm-4',
          author: 'david-qa',
          authorRole: 'Peer Reviewer',
          authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&auto=format&fit=crop&q=60',
          filePath: 'services/authService.ts',
          lineNumber: 112,
          codeSnippet: `export function resolveInheritedPermissions(role: string): string[] {\n  // Missing handling for circular hierarchy references\n  const visited = new Set<string>();`,
          body: 'Boundary case: If custom roles configure a circular hierarchy (A inherits B, B inherits A), `resolveInheritedPermissions()` could enter an infinite recursion loop.',
          severity: 'suggestion',
          status: 'unresolved',
          createdAt: Date.now() - 3600000 * 2,
          suggestedPatch: {
            before: `function getRecursiveRoles(r: string) {\n  return hierarchy[r].flatMap(getRecursiveRoles);\n}`,
            after: `function getRecursiveRoles(r: string, visited = new Set<string>()): string[] {\n  if (visited.has(r)) return [];\n  visited.add(r);\n  return (hierarchy[r] || []).flatMap(child => [child, ...getRecursiveRoles(child, visited)]);\n}`,
            description: 'Guard recursive role traversal with visited set.'
          },
          aiAgentResponse: {
            agentName: 'Algorithm Sentinel AI',
            analysis: 'Unbounded recursion is vulnerable to stack overflow when dynamic multi-tenant role hierarchies have loops.',
            recommendedAction: 'Add visited Set accumulator to prevent infinite recursion.',
            confidence: 0.94
          }
        }
      ],
      missingDocstrings: [
        {
          id: 'doc-1',
          filePath: 'services/authService.ts',
          symbolName: 'verifyRole',
          symbolKind: 'function',
          lineNumber: 38,
          codeSnippet: `export function verifyRole(token: string, requiredRole: string): UserClaims | null`,
          hasDocstring: false,
          generatedDocstring: `/**
 * Validates the provided JSON Web Token claims against the required RBAC role.
 * Verifies cryptographic integrity, expiration timestamp bounds, and realm permissions.
 *
 * @param token - The raw Bearer JWT string supplied by the client
 * @param requiredRole - The target RBAC role required to access the resource
 * @returns Decoded UserClaims if valid and authorized, or throws AuthenticationError
 * @throws {AuthenticationError} When token is expired, malformed, or unauthorized
 *
 * @example
 * \`\`\`ts
 * const claims = verifyRole(req.headers.authorization, 'admin');
 * console.log('Authenticated user:', claims.userId);
 * \`\`\`
 */`,
          applied: false
        },
        {
          id: 'doc-2',
          filePath: 'services/authService.ts',
          symbolName: 'resolveInheritedPermissions',
          symbolKind: 'function',
          lineNumber: 112,
          codeSnippet: `export function resolveInheritedPermissions(role: string): string[]`,
          hasDocstring: false,
          generatedDocstring: `/**
 * Recursively computes the full set of effective permissions for a given role,
 * traversing the configured inheritance DAG with cycle detection guards.
 *
 * @param role - The source role identifier to expand (e.g. 'editor', 'superadmin')
 * @returns Array of unique inherited permission strings
 *
 * @example
 * \`\`\`ts
 * const perms = resolveInheritedPermissions('moderator');
 * // ['posts:read', 'posts:flag', 'comments:delete']
 * \`\`\`
 */`,
          applied: false
        },
        {
          id: 'doc-3',
          filePath: 'hooks/useRolePermissions.ts',
          symbolName: 'useRolePermissions',
          symbolKind: 'hook',
          lineNumber: 15,
          codeSnippet: `export function useRolePermissions(requiredRoles: string[])`,
          hasDocstring: false,
          generatedDocstring: `/**
 * React hook that subscribes to the active user's role and calculates whether
 * they satisfy the specified permission constraints with automatic memoization.
 *
 * @param requiredRoles - Array of roles allowed to view or interact with the wrapped UI
 * @returns Object containing \`hasPermission\`, \`activeRoles\`, and \`isPending\`
 */`,
          applied: false
        },
        {
          id: 'doc-4',
          filePath: 'types/auth.ts',
          symbolName: 'RolePermissionConfig',
          symbolKind: 'interface',
          lineNumber: 20,
          codeSnippet: `export interface RolePermissionConfig`,
          hasDocstring: false,
          generatedDocstring: `/**
 * Architectural configuration schema defining system roles, inheritance trees,
 * and default tenant authorization realms.
 */`,
          applied: false
        }
      ],
      generatedUnitTests: {
        id: 'test-suite-103',
        sourceFile: 'services/authService.ts',
        testFilePath: 'services/authService.test.ts',
        framework: 'vitest',
        testNames: [
          'verifyRole() - successfully authorizes user with matching role',
          'verifyRole() - throws 401 AuthenticationError when JWT expiration timestamp is in the past',
          'verifyRole() - returns 403 Forbidden when user lacks required hierarchical role',
          'resolveInheritedPermissions() - resolves nested multi-level role hierarchies',
          'resolveInheritedPermissions() - gracefully handles cyclic dependencies without infinite recursion'
        ],
        testCode: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyRole, resolveInheritedPermissions, AuthenticationError } from './authService';

describe('authService - Architectural Unit Tests', () => {
  const MOCK_VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.mock_signature';
  const MOCK_EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQ1NiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTYwMDAwMDAwMH0.mock_signature';

  it('successfully authorizes user with matching role', () => {
    const claims = verifyRole(MOCK_VALID_TOKEN, 'admin');
    expect(claims).not.toBeNull();
    expect(claims?.userId).toBe('user-123');
    expect(claims?.role).toBe('admin');
  });

  it('throws 401 AuthenticationError when JWT expiration timestamp is in the past', () => {
    expect(() => {
      verifyRole(MOCK_EXPIRED_TOKEN, 'admin');
    }).toThrowError(AuthenticationError);
  });

  it('returns null or throws 403 when user lacks required hierarchical role', () => {
    expect(() => {
      verifyRole(MOCK_VALID_TOKEN, 'super_admin');
    }).toThrowError(/insufficient role permissions/i);
  });

  it('resolves nested multi-level role hierarchies correctly', () => {
    const permissions = resolveInheritedPermissions('moderator');
    expect(permissions).toContain('posts:read');
    expect(permissions).toContain('posts:flag');
    expect(permissions).toContain('comments:delete');
  });

  it('gracefully handles cyclic dependencies without infinite recursion', () => {
    const permissions = resolveInheritedPermissions('cyclic_test_role');
    expect(Array.isArray(permissions)).toBe(true);
  });
});`,
        coverageDelta: 24,
        status: 'draft'
      },
      fileDiffs: [
        {
          path: 'services/authService.ts',
          status: 'modified',
          additions: 184,
          deletions: 22,
          architecturalIntent: 'Core JWT verification logic, role resolution algorithms, and exception boundaries.',
          diffHunks: [
            {
              oldStart: 35,
              oldLines: 15,
              newStart: 35,
              newLines: 25,
              header: '@@ -35,15 +35,25 @@ export function verifyRole',
              lines: [
                { type: 'context', content: ' export function verifyRole(token: string, requiredRole: string): UserClaims | null {', oldLineNumber: 35, newLineNumber: 35 },
                { type: 'context', content: '   if (!token) throw new AuthenticationError("Token required", 401);', oldLineNumber: 36, newLineNumber: 36 },
                { type: 'context', content: '   const claims = decodeJwt(token);', oldLineNumber: 37, newLineNumber: 37 },
                { type: 'delete', content: '-  if (claims.role !== requiredRole) return null;', oldLineNumber: 38 },
                { type: 'add', content: '+  // Enforce cryptographic timestamp expiration bounds', newLineNumber: 38 },
                { type: 'add', content: '+  if (claims.exp && claims.exp * 1000 < Date.now()) {', newLineNumber: 39 },
                { type: 'add', content: '+    throw new AuthenticationError("Token has expired", 401);', newLineNumber: 40 },
                { type: 'add', content: '+  }', newLineNumber: 41 },
                { type: 'add', content: '+  if (!hasRolePermission(claims.role, requiredRole)) {', newLineNumber: 42 },
                { type: 'add', content: '+    throw new AuthenticationError("Insufficient role permissions", 403);', newLineNumber: 43 },
                { type: 'add', content: '+  }', newLineNumber: 44 },
                { type: 'context', content: '   return claims;', oldLineNumber: 39, newLineNumber: 45 }
              ]
            }
          ]
        },
        {
          path: 'types/auth.ts',
          status: 'modified',
          additions: 45,
          deletions: 8,
          architecturalIntent: 'TypeScript interface contracts for RBAC policies and user claim payloads.',
          diffHunks: [
            {
              oldStart: 18,
              oldLines: 10,
              newStart: 18,
              newLines: 12,
              header: '@@ -18,10 +18,12 @@ export interface RolePermissionConfig',
              lines: [
                { type: 'context', content: ' export interface RolePermissionConfig {', oldLineNumber: 18, newLineNumber: 18 },
                { type: 'context', content: '   roles: Record<string, string[]>;', oldLineNumber: 19, newLineNumber: 19 },
                { type: 'delete', content: '-  roleHierachy: Record<string, number>;', oldLineNumber: 20 },
                { type: 'add', content: '+  roleHierarchy: Record<string, number>;', newLineNumber: 20 },
                { type: 'add', content: '+  defaultRealm: string;', newLineNumber: 21 },
                { type: 'context', content: ' }', oldLineNumber: 21, newLineNumber: 22 }
              ]
            }
          ]
        },
        {
          path: 'hooks/useRolePermissions.ts',
          status: 'modified',
          additions: 68,
          deletions: 14,
          architecturalIntent: 'React subscription hook for real-time permission state synchronization.',
          diffHunks: [
            {
              oldStart: 80,
              oldLines: 12,
              newStart: 80,
              newLines: 16,
              header: '@@ -80,12 +80,16 @@ export function useRolePermissions',
              lines: [
                { type: 'context', content: '   useEffect(() => {', oldLineNumber: 80, newLineNumber: 80 },
                { type: 'delete', content: '-    authStore.subscribe((state) => setPerms(state.permissions));', oldLineNumber: 81 },
                { type: 'add', content: '+    const unsubscribe = authStore.subscribe((state) => {', newLineNumber: 81 },
                { type: 'add', content: '+      setPerms(state.permissions);', newLineNumber: 82 },
                { type: 'add', content: '+    });', newLineNumber: 83 },
                { type: 'add', content: '+    return () => unsubscribe();', newLineNumber: 84 },
                { type: 'context', content: '   }, []);', oldLineNumber: 82, newLineNumber: 85 }
              ]
            }
          ]
        }
      ],
      walkthrough: {
        highLevelSummary: 'Comprehensive Pull Request implementing the Change Stack Review Hub, automated Pre-Merge Gatekeeper, Finishing Touches engine (Docstrings, CI Self-Healing, Unit Test Synthesizer), and Interactive Multi-Agent Review Comments Resolution.',
        architecturalImpact: 'Eliminates 3 critical security loopholes in token expiration, fixes type mismatches across auth contracts, prevents listener leaks, and increases test coverage by +24%.',
        keyModulesAffected: ['services/authService.ts', 'types/auth.ts', 'hooks/useRolePermissions.ts', 'components/ChangeStackStudio.tsx'],
        riskScore: 'Moderate',
        blastRadius: 'Authentication, PR Review Workflows, Testing Architecture',
        breakingChanges: false
      },
      commitHistory: [
        { hash: 'b819f02', message: 'feat(change-stack): scaffold change stack visualizer and PR walkthrough engine', author: 'dev-master', timestamp: Date.now() - 3600000 * 8, filesCount: 3 },
        { hash: '9fa123c', message: 'feat(pre-merge): implement automated gatekeeper check matrix and status evaluator', author: 'dev-master', timestamp: Date.now() - 3600000 * 6, filesCount: 2 },
        { hash: '2d8819a', message: 'feat(finishing-touches): add docstring scanner, CI failure healer, and unit test generator', author: 'dev-master', timestamp: Date.now() - 3600000 * 4, filesCount: 4 },
        { hash: 'f1e4099', message: 'feat(comments): add interactive multi-agent review comments engine with two-pathway resolution', author: 'dev-master', timestamp: Date.now() - 3600000 * 2, filesCount: 3 },
        { hash: 'c302198', message: 'wip(ci): trigger build verification pipeline', author: 'dev-master', timestamp: Date.now() - 3600000 * 1, filesCount: 2 }
      ]
    },
    {
      id: 'pr-104',
      number: 104,
      title: 'feat(telemetry): audit trail event bus & distributed tracing headers',
      branch: 'feat/audit-trail-telemetry',
      baseBranch: 'feat/change-stack-pr-review-hub',
      description: 'Stacked on top of PR #103. Attaches immutable event logs to all authorized actions for SOC2 compliance.',
      author: 'dev-master',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
      status: 'draft',
      stackOrder: 4,
      isCurrentActive: false,
      createdAt: Date.now() - 3600000 * 2,
      updatedAt: Date.now() - 3600000 * 1,
      commitsCount: 1,
      filesChanged: 3,
      additions: 164,
      deletions: 12,
      ciStatus: 'pending',
      ciChecks: [
        { id: 'ci-104-1', name: 'Stack Dependency Gate (Waiting on #103)', category: 'build', status: 'skipped', durationSeconds: 0 }
      ],
      reviewComments: [],
      fileDiffs: [],
      missingDocstrings: [],
      walkthrough: {
        highLevelSummary: 'Top of stack. Consumes RBAC claim metadata from PR #103 to emit structured audit logs to OpenTelemetry collectors.',
        architecturalImpact: 'Zero runtime overhead with async ring-buffer batch dispatcher.',
        keyModulesAffected: ['services/telemetryService.ts', 'server/telemetry.ts'],
        riskScore: 'Low',
        blastRadius: 'Telemetry bus',
        breakingChanges: false
      },
      commitHistory: [
        { hash: '88a101b', message: 'draft(telemetry): initialize ring buffer event dispatcher', author: 'dev-master', timestamp: Date.now() - 3600000 * 2, filesCount: 3 }
      ]
    }
  ];
};

// Storage key for persisting Change Stack workspace state
const CHANGE_STACK_STORAGE_KEY = 'link2ink_change_stack_v1';

export const loadStoredChangeStack = (): ChangeStackPr[] | null => {
  try {
    const raw = localStorage.getItem(CHANGE_STACK_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load change stack from storage', e);
  }
  return null;
};

export const saveStoredChangeStack = (stack: ChangeStackPr[]) => {
  try {
    localStorage.setItem(CHANGE_STACK_STORAGE_KEY, JSON.stringify(stack));
  } catch (e) {
    console.error('Failed to save change stack to storage', e);
  }
};
