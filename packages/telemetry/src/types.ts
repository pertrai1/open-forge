export type StageName =
  | 'intent-router'
  | 'roadmap'
  | 'plan'
  | 'test'
  | 'implement'
  | 'qa'
  | 'security'
  | 'architect'
  | 'review'
  | 'integration'
  | 'cleanup';

export interface PipelineEvent {
  timestamp: string;
  pipelineId: string;
  phase: number;
  stage: StageName;
  action: 'start' | 'complete' | 'fail' | 'retry' | 'escalate';
  durationMs?: number;
  tokenUsage?: { prompt: number; completion: number };
  agentId?: string;
  model?: string;
  filesModified?: string[];
  filesCreated?: string[];
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface EventFilter {
  pipelineId: string;
  stage?: StageName;
  action?: PipelineEvent['action'];
  from?: string;
  to?: string;
}

export interface PipelineSummary {
  pipelineId: string;
  totalDurationMs: number;
  totalTokens: number;
  stagesCompleted: StageName[];
  currentStage?: StageName;
  retryCount: number;
  status: 'running' | 'completed' | 'failed' | 'halted';
}

export interface Telemetry {
  emit(event: PipelineEvent): Promise<void>;
  query(filter: EventFilter): Promise<PipelineEvent[]>;
  getPipelineSummary(pipelineId: string): Promise<PipelineSummary>;
}

export interface ConstraintCheckResult {
  passed: boolean;
  message?: string;
  actualValue?: number | string;
  threshold?: number | string;
}

export interface Constraint {
  name: string;
  description?: string;
  scope: 'stage' | 'pipeline';
  check: (events: PipelineEvent[]) => ConstraintCheckResult;
}

export interface ConstraintViolation {
  constraintName: string;
  stage?: StageName;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface ConstraintResult {
  passed: boolean;
  violations: ConstraintViolation[];
  evaluatedAt: string;
}

export interface ConstraintEvaluator {
  evaluate(pipelineId: string): Promise<ConstraintResult>;
  addConstraint(constraint: Constraint): void;
  removeConstraint(name: string): void;
}

export interface TelemetryConfig {
  storagePath?: string;
}

export interface OpenForgeTelemetry {
  telemetry: Telemetry;
  constraints: ConstraintEvaluator;
  onStageEvent(event: PipelineEvent): Promise<ConstraintResult | null>;
  serializeContext(pipelineId: string, maxTokens?: number): Promise<string>;
}
