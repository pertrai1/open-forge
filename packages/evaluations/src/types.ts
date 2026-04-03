// --- Dataset Types ---

export interface EvaluationDataset {
  id: string;
  name: string;
  description?: string;
  version: string;
  scenarios: EvaluationScenario[];
  metadata?: Record<string, unknown>;
}

export interface EvaluationScenario {
  id: string;
  input: string;
  expectedOutput?: string;
  expectedBehavior?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, unknown>;
}

// --- Evaluator Types ---

export interface Evaluator {
  name: string;
  description?: string;
  evaluate(context: EvaluationContext): Promise<EvaluatorResult>;
}

export interface EvaluationContext {
  scenario: EvaluationScenario;
  agentResponse: string;
  executionTrace: ExecutionTrace;
  expectedOutput?: string;
}

export interface EvaluatorResult {
  evaluatorName: string;
  passed: boolean;
  score: number;
  reasoning?: string;
  details?: Record<string, unknown>;
}

export interface EvaluatorConfig {
  type: 'deterministic' | 'llm-judge' | 'custom';
  rubric?: JudgeRubric;
  customEvaluator?: CustomEvaluatorFunction;
}

export interface JudgeRubric {
  criteria: string;
  scaleDescription: string;
  examples?: { input: string; score: number; reasoning: string }[];
}

export type CustomEvaluatorFunction = (
  context: EvaluationContext
) => Promise<EvaluatorResult>;

// --- Execution Trace Types ---

export interface ExecutionTrace {
  agentName: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  toolCalls: ToolCallRecord[];
  steps: string[];
  duration: number;
}

export interface ToolCallRecord {
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  duration: number;
}

// --- Runner Types ---

export interface EvaluationRunner {
  run(config: RunConfig): Promise<EvaluationReport>;
  runStreaming(
    config: RunConfig,
    onResult: (result: EvaluationResult) => void
  ): Promise<EvaluationReport>;
}

export interface RunConfig {
  dataset: EvaluationDataset;
  agentFactory: () => unknown;
  evaluators: Evaluator[];
  options?: RunOptions;
}

export interface RunOptions {
  maxConcurrency?: number;
  timeoutPerScenario?: number;
  stopOnFailure?: boolean;
  includeTrace?: boolean;
}

// --- Result Types ---

export interface EvaluationResult {
  scenarioId: string;
  passed: boolean;
  score: number;
  evaluatorResults: EvaluatorResult[];
  executionTrace: ExecutionTrace;
  duration: number;
  error?: string;
}

// --- Report Types ---

export interface EvaluationReport {
  id: string;
  timestamp: string;
  datasetId: string;
  datasetVersion: string;
  summary: EvaluationSummary;
  scenarios: EvaluationResult[];
  statistics: StatisticalAnalysis;
  comparison?: ComparisonReport;
}

export interface EvaluationSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRate: number;
  confidenceInterval: ConfidenceInterval;
  averageDuration: number;
  totalTokens: number;
  averageScore: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}

// --- Statistical Types ---

export interface StatisticalAnalysis {
  perMetric: Record<string, MetricStatistics>;
  perEvaluator: Record<string, EvaluatorStatistics>;
  regressionDetection: RegressionFinding[];
}

export interface MetricStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
}

export interface EvaluatorStatistics {
  passRate: number;
  averageScore: number;
  scoreDistribution: number[];
  failureReasons: Record<string, number>;
}

export interface RegressionFinding {
  scenarioId: string;
  metricName: string;
  baselineValue: number;
  candidateValue: number;
  delta: number;
  threshold: number;
  isRegression: boolean;
  severity: 'minor' | 'major' | 'critical';
}

// --- Comparison Types ---

export interface ReportComparator {
  compare(
    baseline: EvaluationReport,
    candidate: EvaluationReport
  ): Promise<ComparisonReport>;
}

export interface ComparisonReport {
  baselineId: string;
  candidateId: string;
  summary: ComparisonSummary;
  scenarioComparisons: ScenarioComparison[];
  regressions: RegressionFinding[];
  improvements: ImprovementFinding[];
  recommendation: 'adopt' | 'reject' | 'investigate';
}

export interface ComparisonSummary {
  baselinePassRate: number;
  candidatePassRate: number;
  delta: number;
  statisticalSignificance: number;
  isSignificant: boolean;
}

export interface ScenarioComparison {
  scenarioId: string;
  baselinePassed: boolean;
  candidatePassed: boolean;
  baselineScore: number;
  candidateScore: number;
  changed: boolean;
  improved: boolean;
}

export interface ImprovementFinding {
  scenarioId: string;
  metricName: string;
  baselineValue: number;
  candidateValue: number;
  delta: number;
}
