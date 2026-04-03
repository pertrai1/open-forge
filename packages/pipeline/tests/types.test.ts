import type {
  Roadmap,
  RoadmapPhase,
  RoadmapTask,
  ParallelGroup,
  TaskComplexity,
  TaskStatus,
} from '../src/lib/roadmap/types.js';

import type {
  HandoffState,
  TaskLogEntry,
  Convention,
  WakeContext,
} from '../src/lib/handoff/types.js';

import type {
  PipelineState,
  PhaseState,
  ExecutionMode,
  AgentRole,
  DriftSentinel,
  PipelineIssue,
} from '../src/types.js';

import type {
  GateResult,
  CheckResult,
  GateName,
  GateFinding,
  GateSequenceResult,
} from '../src/lib/quality/types.js';

import type {
  InvocationMetrics,
  CostManifest,
  InvocationOutcome,
} from '../src/lib/metrics/types.js';

import type {
  Intent,
  Strategy,
  SessionState,
  IntentStrategyMapping,
  PipelineRunOptions,
} from '../src/lib/orchestrator/types.js';

import {
  ForgeConfigSchema,
  ProjectConfigSchema,
} from '../src/lib/config/schema.js';

describe('Roadmap types', () => {
  it('should allow creating a valid RoadmapTask', () => {
    const task: RoadmapTask = {
      id: '1.1',
      description: 'Define ROADMAP types',
      dependencies: [],
      deliverable: 'src/lib/roadmap/types.ts',
      completed: false,
      complexity: 'simple',
    };
    expect(task.id).toBe('1.1');
    expect(task.completed).toBe(false);
    expect(task.complexity).toBe('simple');
  });

  it('should allow creating a valid RoadmapPhase', () => {
    const phase: RoadmapPhase = {
      number: 0,
      name: 'Project Foundation',
      goal: 'Establish the development environment',
      tasks: [],
      parallelGroups: [],
    };
    expect(phase.number).toBe(0);
    expect(phase.tasks).toHaveLength(0);
  });

  it('should allow creating a valid Roadmap', () => {
    const roadmap: Roadmap = {
      title: 'Test Project',
      overview: 'A test project',
      phases: [],
    };
    expect(roadmap.title).toBe('Test Project');
    expect(roadmap.phases).toHaveLength(0);
  });

  it('should allow creating a valid ParallelGroup', () => {
    const group: ParallelGroup = {
      name: 'Group A',
      taskIds: ['0.1', '0.2', '0.4'],
      note: 'all independent',
    };
    expect(group.taskIds).toHaveLength(3);
  });

  it('should enforce TaskComplexity values', () => {
    const complexities: TaskComplexity[] = [
      'trivial',
      'simple',
      'medium',
      'complex',
    ];
    expect(complexities).toHaveLength(4);
  });

  it('should enforce TaskStatus values', () => {
    const statuses: TaskStatus[] = [
      'pending',
      'in-progress',
      'completed',
      'blocked',
    ];
    expect(statuses).toHaveLength(4);
  });
});

describe('Handoff types', () => {
  it('should allow creating a valid TaskLogEntry', () => {
    const entry: TaskLogEntry = {
      taskId: '1.1',
      description: 'Defined ROADMAP types',
      keyDecision: 'Used readonly interfaces',
      filesModified: ['src/lib/roadmap/types.ts'],
      commitHash: 'abc123',
      timestamp: '2026-03-31T12:00:00Z',
    };
    expect(entry.taskId).toBe('1.1');
    expect(entry.filesModified).toHaveLength(1);
  });

  it('should allow creating a valid Convention', () => {
    const convention: Convention = {
      name: 'Error handling',
      pattern: 'Typed errors with custom Error subclasses',
      rationale: 'Better error tracking',
      usage: 'Extend Error for domain errors',
    };
    expect(convention.name).toBe('Error handling');
  });

  it('should allow creating a valid HandoffState', () => {
    const handoff: HandoffState = {
      sessionId: 'session-1',
      createdAt: '2026-03-31T12:00:00Z',
      updatedAt: '2026-03-31T12:00:00Z',
      currentState: {
        tasksCompleted: ['0.1'],
        packagesTouched: ['src/'],
        branch: 'main',
        currentPhase: 1,
        status: 'in-progress',
      },
      goalContext: {
        problem: 'Manual software development',
        userStory: 'Autonomous pipeline',
        specRequirement: 'Type definitions',
        currentTask: 'Define types',
      },
      conventions: [],
      architectureDecisions: [],
      openIssues: [],
      taskLog: [],
      compressedHistory: [],
    };
    expect(handoff.sessionId).toBe('session-1');
    expect(handoff.currentState.status).toBe('in-progress');
  });

  it('should allow creating a valid WakeContext', () => {
    const wake: WakeContext = {
      changeName: 'phase-1-types',
      branch: 'change/phase-1-types',
      nextTask: '1.1 — Define ROADMAP types',
      progress: '0/8 tasks complete',
      goalContext: 'Types for pipeline',
      packagesTouched: [],
      activeConventions: ['Error handling pattern'],
      openIssues: [],
      lastCommit: 'abc123 — initial setup',
    };
    expect(wake.changeName).toBe('phase-1-types');
  });
});

describe('Pipeline state types', () => {
  it('should allow creating a valid PhaseState', () => {
    const state: PhaseState = {
      phaseNumber: 1,
      phaseName: 'Core Types',
      status: 'in-progress',
      pendingTasks: ['1.1', '1.2'],
      completedTasks: [],
      qualityGatesPassed: false,
      retryCount: 0,
      maxRetries: 3,
    };
    expect(state.phaseNumber).toBe(1);
    expect(state.pendingTasks).toHaveLength(2);
  });

  it('should allow creating a valid PipelineState', () => {
    const pipeline: PipelineState = {
      runId: 'run-1',
      mode: 'continuous',
      phases: [],
      currentPhaseIndex: 0,
      startedAt: '2026-03-31T12:00:00Z',
      completedAt: null,
      driftDetected: false,
    };
    expect(pipeline.runId).toBe('run-1');
    expect(pipeline.completedAt).toBeNull();
  });

  it('should enforce ExecutionMode values', () => {
    const modes: ExecutionMode[] = ['single-phase', 'continuous', 'range'];
    expect(modes).toHaveLength(3);
  });

  it('should enforce AgentRole values', () => {
    const roles: AgentRole[] = [
      'orchestrator',
      'test-author',
      'implementer',
      'gate-agent',
      'cleanup-agent',
    ];
    expect(roles).toHaveLength(5);
  });

  it('should allow creating a valid DriftSentinel', () => {
    const sentinel: DriftSentinel = {
      phase: 2,
      reason: 'quality checks failed after 3 cycles',
      timestamp: '2026-03-31T12:00:00Z',
      rolledBackTo: null,
      attemptHashes: [],
    };
    expect(sentinel.phase).toBe(2);
  });

  it('should allow creating a valid PipelineIssue', () => {
    const issue: PipelineIssue = {
      phase: 1,
      taskId: '1.3',
      errorMessage: 'Type error in types.ts',
      context: 'Running typecheck',
      attemptedSolutions: ['Fixed import path'],
      humanActionNeeded: 'Review type definitions',
      timestamp: '2026-03-31T12:00:00Z',
    };
    expect(issue.taskId).toBe('1.3');
    expect(issue.attemptedSolutions).toHaveLength(1);
  });
});

describe('Quality gate types', () => {
  it('should allow creating a valid CheckResult', () => {
    const result: CheckResult = {
      category: 'typecheck',
      passed: true,
      exitCode: 0,
      output: 'No errors found',
      durationMs: 1500,
    };
    expect(result.passed).toBe(true);
    expect(result.exitCode).toBe(0);
  });

  it('should allow creating a valid GateResult', () => {
    const result: GateResult = {
      gate: 'verify',
      verdict: 'pass',
      findings: [],
      mustFixCount: 0,
      durationMs: 3000,
      attempt: 1,
    };
    expect(result.gate).toBe('verify');
    expect(result.verdict).toBe('pass');
  });

  it('should allow creating a GateFinding', () => {
    const finding: GateFinding = {
      severity: 'must-fix',
      filePath: 'src/types.ts',
      line: 42,
      description: 'Missing type annotation',
      remediation: 'Add explicit return type',
    };
    expect(finding.severity).toBe('must-fix');
    expect(finding.line).toBe(42);
  });

  it('should allow creating a GateSequenceResult', () => {
    const sequence: GateSequenceResult = {
      gateResults: [],
      allPassed: true,
      firstFailedGate: null,
      totalDurationMs: 0,
    };
    expect(sequence.allPassed).toBe(true);
    expect(sequence.firstFailedGate).toBeNull();
  });

  it('should enforce GateName values', () => {
    const gates: GateName[] = [
      'verify',
      'qa-testing',
      'security-audit',
      'architect-review',
      'code-review',
      'integration-testing',
    ];
    expect(gates).toHaveLength(6);
  });
});

describe('Metrics types', () => {
  it('should allow creating a valid InvocationMetrics', () => {
    const metrics: InvocationMetrics = {
      invocationNumber: 1,
      role: 'test-author',
      inputTokens: 12000,
      outputTokens: 3000,
      cacheTokens: 8000,
      costUsd: 0.15,
      outcome: 'pass',
      skillRefs: 2,
      durationMs: 45000,
      timestamp: '2026-03-31T12:00:00Z',
      phase: 1,
      taskId: '1.1',
    };
    expect(metrics.invocationNumber).toBe(1);
    expect(metrics.costUsd).toBe(0.15);
  });

  it('should allow creating a valid CostManifest', () => {
    const manifest: CostManifest = {
      runId: 'run-1',
      invocations: [],
      totals: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheTokens: 0,
        totalCostUsd: 0,
        totalInvocations: 0,
        successfulInvocations: 0,
        failedInvocations: 0,
        totalDurationMs: 0,
      },
      byRole: [],
      byPhase: [],
    };
    expect(manifest.runId).toBe('run-1');
    expect(manifest.totals.totalCostUsd).toBe(0);
  });

  it('should enforce InvocationOutcome values', () => {
    const outcomes: InvocationOutcome[] = ['pass', 'fail', 'error', 'timeout'];
    expect(outcomes).toHaveLength(4);
  });
});

describe('Orchestrator types', () => {
  it('should allow creating a valid SessionState', () => {
    const session: SessionState = {
      sessionId: 'session-1',
      status: 'active',
      intent: 'new-project',
      strategy: 'full-pipeline',
      mode: 'continuous',
      currentPhase: null,
      totalPhases: 12,
      completedPhases: 0,
      startedAt: '2026-03-31T12:00:00Z',
      lastActivityAt: '2026-03-31T12:00:00Z',
      clarificationRoundsUsed: 0,
      maxClarificationRounds: 2,
    };
    expect(session.intent).toBe('new-project');
    expect(session.strategy).toBe('full-pipeline');
    expect(session.maxClarificationRounds).toBe(2);
  });

  it('should enforce Intent values', () => {
    const intents: Intent[] = [
      'new-project',
      'feature-add',
      'bug-fix',
      'refactor',
      'migration',
    ];
    expect(intents).toHaveLength(5);
  });

  it('should enforce Strategy values', () => {
    const strategies: Strategy[] = [
      'full-pipeline',
      'incremental',
      'targeted',
      'transformation',
      'port',
    ];
    expect(strategies).toHaveLength(5);
  });

  it('should allow creating IntentStrategyMapping', () => {
    const mapping: IntentStrategyMapping = {
      intent: 'new-project',
      strategy: 'full-pipeline',
      description: 'Complete application from scratch',
    };
    expect(mapping.intent).toBe('new-project');
  });

  it('should allow creating PipelineRunOptions', () => {
    const options: PipelineRunOptions = {
      mode: 'range',
      range: { start: 2, end: 5 },
    };
    expect(options.mode).toBe('range');
    expect(options.range?.start).toBe(2);
  });
});

describe('ForgeConfig Zod schemas', () => {
  it('should validate a minimal config', () => {
    const result = ForgeConfigSchema.safeParse({
      project: { name: 'test-project' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.name).toBe('test-project');
      expect(result.data.pipeline.mode).toBe('continuous');
      expect(result.data.quality.lint).toBe(true);
      expect(result.data.logging.level).toBe('info');
    }
  });

  it('should validate a full config', () => {
    const result = ForgeConfigSchema.safeParse({
      project: {
        name: 'my-app',
        language: 'typescript',
        framework: 'express',
        testFramework: 'vitest',
        buildCommand: 'npm run build',
        testCommand: 'npm run test',
        lintCommand: 'npm run lint',
      },
      pipeline: {
        mode: 'single-phase',
        parallel: false,
        qualityGates: true,
      },
      agents: {
        testAuthor: { enabled: true, timeout: 200000 },
        implementer: { enabled: true, timeout: 500000 },
        gateAgent: { enabled: false, timeout: 100000 },
      },
      quality: {
        lint: true,
        typecheck: true,
        test: true,
        build: true,
      },
      logging: {
        level: 'debug',
        metrics: false,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.language).toBe('typescript');
      expect(result.data.pipeline.mode).toBe('single-phase');
      expect(result.data.agents.gateAgent.enabled).toBe(false);
      expect(result.data.quality.build).toBe(true);
      expect(result.data.logging.level).toBe('debug');
    }
  });

  it('should reject config without required project.name', () => {
    const result = ForgeConfigSchema.safeParse({
      project: {},
    });
    expect(result.success).toBe(false);
  });

  it('should reject config without project', () => {
    const result = ForgeConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid language', () => {
    const result = ForgeConfigSchema.safeParse({
      project: { name: 'test', language: 'rust' },
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid execution mode', () => {
    const result = ForgeConfigSchema.safeParse({
      project: { name: 'test' },
      pipeline: { mode: 'invalid-mode' },
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid log level', () => {
    const result = ForgeConfigSchema.safeParse({
      project: { name: 'test' },
      logging: { level: 'trace' },
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative agent timeout', () => {
    const result = ForgeConfigSchema.safeParse({
      project: { name: 'test' },
      agents: { testAuthor: { timeout: -1 } },
    });
    expect(result.success).toBe(false);
  });

  it('should apply defaults for optional sections', () => {
    const result = ForgeConfigSchema.safeParse({
      project: { name: 'test' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pipeline.parallel).toBe(true);
      expect(result.data.pipeline.qualityGates).toBe(true);
      expect(result.data.agents.testAuthor.enabled).toBe(true);
      expect(result.data.agents.testAuthor.timeout).toBe(300000);
      expect(result.data.agents.implementer.timeout).toBe(600000);
      expect(result.data.quality.typecheck).toBe(true);
      expect(result.data.quality.build).toBe(false);
      expect(result.data.logging.metrics).toBe(true);
    }
  });

  it('should validate ProjectConfigSchema independently', () => {
    const result = ProjectConfigSchema.safeParse({
      name: 'standalone',
      language: 'python',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty project name', () => {
    const result = ProjectConfigSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });
});
