# open-forge-evaluations — Requirements

## 1. Problem Statement

The open-forge pipeline orchestrates multi-phase agent workflows with quality gates, but lacks systematic evaluation infrastructure to measure output quality across iterations. Without comprehensive evaluations, the system cannot:

- Detect quality regressions across pipeline iterations
- Measure agent performance across different models/configurations
- Provide statistical confidence in evaluation results
- Enable continuous evaluation as part of the development workflow
- Generate actionable insights from evaluation data

We need an evaluation system to support continuous quality measurement, statistical rigor, and integration with the existing telemetry and constraint systems (`@open-forge/telemetry`).

> **Prerequisite:** `@open-forge/telemetry` currently exports type definitions only. Telemetry implementations (event emitting, querying, constraint evaluation) MUST be shipped before or in parallel with this package — specifically before telemetry integration requirements (§3.6) and constraint integration requirements (§3.7) can be fulfilled. Core evaluation capabilities (§3.1–§3.5) can proceed independently.

---

## 2. Users and Personas

| Persona               | Needs                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Pipeline Operator** | Confidence that agents perform well, early detection of regressions, data-driven rollout decisions |
| **Developer**         | Quick feedback on code changes affecting agent behavior, A/B test different prompts/configs        |
| **QA Engineer**       | Comprehensive test coverage, automated regression detection, quality gates for deployment          |
| **Data Scientist**    | Rich evaluation data for analysis, trend identification, model performance benchmarking            |

---

## 3. Functional Requirements

### 3.1 Dataset Management

| ID    | Requirement                                                                     | Priority |
| ----- | ------------------------------------------------------------------------------- | -------- |
| E-001 | System MUST support creating datasets from JSON/YAML files                      | P0       |
| E-002 | System MUST support dataset versioning (track changes over time)                | P1       |
| E-003 | System MUST validate dataset schema (inputs, expected outputs)                  | P0       |
| E-004 | System MUST support dataset splitting (train/test/hold)                         | P1       |
| E-005 | System SHOULD support synthetic dataset generation from seed examples           | P2       |
| E-006 | System MUST provide dataset introspection (scenario count, input distributions) | P1       |

### 3.2 Evaluator Types

| ID    | Requirement                                                                                            | Priority |
| ----- | ------------------------------------------------------------------------------------------------------ | -------- |
| E-010 | System MUST support deterministic evaluators (exact match, schema validation)                          | P0       |
| E-011 | System MUST support LLM-based evaluators (judge with rubric)                                           | P0       |
| E-012 | System MUST support custom evaluators (user-defined evaluation logic)                                  | P0       |
| E-013 | System SHOULD support composite evaluators (combine multiple evaluation results)                       | P1       |
| E-014 | System MUST support evaluators for: answer quality, reasoning quality, tool selection, task completion | P0       |
| E-015 | System SHOULD support evaluators for: safety, security, cost efficiency, latency                       | P2       |

### 3.3 Evaluation Execution

| ID    | Requirement                                                                        | Priority |
| ----- | ---------------------------------------------------------------------------------- | -------- |
| E-020 | System MUST support synchronous evaluation (blocking, returns results immediately) | P0       |
| E-021 | System MUST support batch evaluation (evaluate entire dataset)                     | P0       |
| E-022 | System MUST support streaming evaluation (emit results as they complete)           | P1       |
| E-023 | System MUST support parallel execution with configurable concurrency               | P1       |
| E-024 | System SHOULD support timeout handling per scenario                                | P1       |
| E-025 | System MUST capture evaluation traces (full execution history for debugging)       | P1       |

### 3.4 Statistical Analysis

| ID    | Requirement                                                                           | Priority |
| ----- | ------------------------------------------------------------------------------------- | -------- |
| E-030 | System MUST calculate confidence intervals for pass rates                             | P0       |
| E-031 | System MUST support statistical significance testing between baseline and candidate   | P0       |
| E-032 | System MUST detect regressions with configurable thresholds                           | P0       |
| E-033 | System MUST calculate per-metric statistics (mean, median, std dev, percentiles)      | P1       |
| E-034 | System SHOULD support power analysis (minimum scenarios for statistical significance) | P2       |
| E-035 | System MUST calculate aggregate scores across evaluators                              | P1       |

### 3.5 Report Generation

| ID    | Requirement                                                                                     | Priority |
| ----- | ----------------------------------------------------------------------------------------------- | -------- |
| E-040 | System MUST generate structured reports (JSON) with full evaluation results                     | P0       |
| E-041 | System MUST support report comparison (baseline vs candidate)                                   | P0       |
| E-042 | System MUST include per-scenario breakdown with pass/fail status                                | P0       |
| E-043 | System MUST include per-evaluator breakdown with metric details                                 | P1       |
| E-044 | System SHOULD generate human-readable summaries (markdown)                                      | P1       |
| E-045 | System MUST support report persistence (save/load from file or database)                        | P1       |
| E-046 | System SHOULD export reports in formats suitable for CI integration (junit, github annotations) | P2       |

### 3.6 Integration with Telemetry

| ID    | Requirement                                                                         | Priority |
| ----- | ----------------------------------------------------------------------------------- | -------- |
| E-050 | System MUST consume telemetry events as evaluation inputs                           | P1       |
| E-051 | System MUST extract evaluation-relevant metrics from telemetry traces               | P1       |
| E-052 | System SHOULD correlate evaluation failures with telemetry anomalies                | P2       |
| E-053 | System MUST include telemetry trace IDs in evaluation reports for cross-referencing | P1       |

### 3.7 Integration with Constraints

| ID    | Requirement                                                                            | Priority |
| ----- | -------------------------------------------------------------------------------------- | -------- |
| E-060 | System MUST support constraint-driven evaluation (only evaluate if constraints passed) | P1       |
| E-061 | System MUST include constraint violations in evaluation reports                        | P1       |
| E-062 | System SHOULD be able to halt evaluation on critical constraint violations             | P2       |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID     | Requirement                                                              |
| ------ | ------------------------------------------------------------------------ |
| NE-001 | Single scenario evaluation MUST complete in < 30s (p99)                  |
| NE-002 | Batch evaluation (100 scenarios) MUST complete in < 5 minutes            |
| NE-003 | Report generation MUST complete in < 1 second for 1000 scenarios         |
| NE-004 | Statistical calculations MUST complete in < 100ms for 10,000 data points |

### 4.2 Reliability

| ID     | Requirement                                                                           |
| ------ | ------------------------------------------------------------------------------------- |
| NE-010 | Evaluation MUST be deterministic (same inputs = same outputs)                         |
| NE-011 | System MUST handle evaluator failures gracefully (continue with remaining evaluators) |
| NE-012 | System MUST persist evaluation state to support resumption after interruption         |

### 4.3 Compatibility

| ID     | Requirement                                                                      |
| ------ | -------------------------------------------------------------------------------- |
| NE-020 | MUST be a Node.js package (ESM + CJS)                                            |
| NE-021 | MUST work with TypeScript 5.x                                                    |
| NE-022 | MUST integrate with `@open-forge/telemetry` types and event system               |
| NE-023 | MUST be compatible with `@open-forge/pipeline` agent and orchestrator interfaces |

### 4.4 Developer Experience

| ID     | Requirement                                                           |
| ------ | --------------------------------------------------------------------- |
| NE-030 | MUST be usable with zero configuration for common evaluation patterns |
| NE-031 | MUST have type definitions included                                   |
| NE-032 | MUST provide CLI for running evaluations from command line            |
| NE-033 | MUST support programmatic API for integration with pipelines          |

---

## 5. Interface Specification

### 5.1 Core Types

```typescript
interface EvaluationDataset {
  id: string;
  name: string;
  description?: string;
  version: string;
  scenarios: EvaluationScenario[];
  metadata?: Record<string, unknown>;
}

interface EvaluationScenario {
  id: string;
  input: string;
  expectedOutput?: string;
  expectedBehavior?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, unknown>;
}

interface EvaluationResult {
  scenarioId: string;
  passed: boolean;
  score: number; // 0-1
  evaluatorResults: EvaluatorResult[];
  executionTrace: ExecutionTrace;
  duration: number;
  error?: string;
}

interface EvaluatorResult {
  evaluatorName: string;
  passed: boolean;
  score: number;
  reasoning?: string;
  details?: Record<string, unknown>;
}

interface ExecutionTrace {
  agentName: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  toolCalls: ToolCallRecord[];
  steps: string[];
  duration: number;
}

interface ToolCallRecord {
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  duration: number;
}
```

### 5.2 Evaluator API

```typescript
interface Evaluator {
  name: string;
  description?: string;
  evaluate(context: EvaluationContext): Promise<EvaluatorResult>;
}

interface EvaluationContext {
  scenario: EvaluationScenario;
  agentResponse: string;
  executionTrace: ExecutionTrace;
  expectedOutput?: string;
}

interface EvaluatorConfig {
  type: 'deterministic' | 'llm-judge' | 'custom';
  rubric?: JudgeRubric;
  customEvaluator?: CustomEvaluatorFunction;
}

type CustomEvaluatorFunction = (
  context: EvaluationContext
) => Promise<EvaluatorResult>;
```

### 5.3 Evaluation Runner API

```typescript
interface EvaluationRunner {
  run(config: RunConfig): Promise<EvaluationReport>;
  runStreaming(
    config: RunConfig,
    onResult: (result: EvaluationResult) => void
  ): Promise<EvaluationReport>;
}

interface RunConfig {
  dataset: EvaluationDataset;
  agentFactory: () => Agent;
  evaluators: Evaluator[];
  options?: RunOptions;
}

interface RunOptions {
  maxConcurrency?: number; // default: 1
  timeoutPerScenario?: number; // default: 30000
  stopOnFailure?: boolean; // default: false
  includeTrace?: boolean; // default: true
}

interface EvaluationReport {
  id: string;
  timestamp: string;
  datasetId: string;
  datasetVersion: string;
  config: RunConfig;
  summary: EvaluationSummary;
  scenarios: EvaluationResult[];
  statistics: StatisticalAnalysis;
  comparison?: ComparisonResult;
}

interface EvaluationSummary {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRate: number;
  confidenceInterval: ConfidenceInterval;
  averageDuration: number;
  totalTokens: number;
  averageScore: number;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // e.g., 0.95 for 95%
}
```

### 5.4 Statistical Analysis API

```typescript
interface StatisticalAnalysis {
  perMetric: Record<string, MetricStatistics>;
  perEvaluator: Record<string, EvaluatorStatistics>;
  regressionDetection: RegressionFinding[];
}

interface MetricStatistics {
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

interface EvaluatorStatistics {
  passRate: number;
  averageScore: number;
  scoreDistribution: number[];
  failureReasons: Record<string, number>;
}

interface RegressionFinding {
  scenarioId: string;
  metricName: string;
  baselineValue: number;
  candidateValue: number;
  delta: number;
  threshold: number;
  isRegression: boolean;
  severity: 'minor' | 'major' | 'critical';
}
```

### 5.5 Report Comparison API

```typescript
interface ReportComparator {
  compare(
    baseline: EvaluationReport,
    candidate: EvaluationReport
  ): Promise<ComparisonReport>;
}

interface ComparisonReport {
  baselineId: string;
  candidateId: string;
  summary: ComparisonSummary;
  scenarioComparisons: ScenarioComparison[];
  regressions: RegressionFinding[];
  improvements: ImprovementFinding[];
  recommendation: 'adopt' | 'reject' | 'investigate';
}

interface ComparisonSummary {
  baselinePassRate: number;
  candidatePassRate: number;
  delta: number;
  statisticalSignificance: number; // p-value
  isSignificant: boolean;
}

interface ScenarioComparison {
  scenarioId: string;
  baselinePassed: boolean;
  candidatePassed: boolean;
  baselineScore: number;
  candidateScore: number;
  changed: boolean;
  improved: boolean;
}

interface ImprovementFinding {
  scenarioId: string;
  metricName: string;
  baselineValue: number;
  candidateValue: number;
  delta: number;
}
```

---

## 6. Default Evaluators

The system MUST ship with these default evaluators:

| Evaluator           | Type          | Description                                            |
| ------------------- | ------------- | ------------------------------------------------------ |
| `answer-quality`    | llm-judge     | Evaluates correctness and completeness of the answer   |
| `reasoning-quality` | llm-judge     | Evaluates logical coherence and step-by-step reasoning |
| `tool-selection`    | deterministic | Validates correct tools were called for the task       |
| `task-completion`   | deterministic | Verifies the task was fully completed                  |
| `safety`            | deterministic | Checks for PII, harmful content, policy violations     |
| `cost-efficiency`   | deterministic | Evaluates token usage relative to task complexity      |

---

## 7. File Structure

```
open-forge-evaluations/
├── src/
│   ├── index.ts                    # Public exports
│   ├── runner/
│   │   ├── evaluation-runner.ts    # Main runner implementation
│   │   ├── streaming-runner.ts     # Streaming execution
│   │   └── statistical-runner.ts   # Statistical analysis
│   ├── evaluators/
│   │   ├── interface.ts            # Evaluator interface
│   │   ├── registry.ts             # Evaluator registry
│   │   ├── deterministic/
│   │   │   ├── tool-selection.ts
│   │   │   ├── task-completion.ts
│   │   │   ├── safety.ts
│   │   │   └── cost-efficiency.ts
│   │   └── llm-judge/
│   │       ├── answer-quality.ts
│   │       ├── reasoning-quality.ts
│   │       ├── judge-provider.ts
│   │       └── rubrics/
│   │           ├── answer-rubric.ts
│   │           └── reasoning-rubric.ts
│   ├── datasets/
│   │   ├── interface.ts            # Dataset interface
│   │   ├── loader.ts               # Load from file
│   │   ├── splitter.ts             # Train/test/hold split
│   │   └── validation.ts           # Schema validation
│   ├── statistics/
│   │   ├── confidence-intervals.ts
│   │   ├── significance-testing.ts
│   │   └── regression-detection.ts
│   ├── reports/
│   │   ├── generator.ts            # Report generation
│   │   ├── comparator.ts           # Baseline vs candidate
│   │   ├── persistence.ts          # Save/load reports
│   │   └── formatters/
│   │       ├── json.ts
│   │       ├── markdown.ts
│   │       └── ci.ts               # JUnit, GitHub annotations
│   ├── telemetry/
│   │   ├── integration.ts          # Consume telemetry events
│   │   └── trace-extraction.ts     # Extract eval metrics from traces
│   ├── constraints/
│   │   └── integration.ts          # Constraint-driven evaluation
│   └── types.ts                    # Type definitions
├── cli/
│   └── eval-cli.ts                 # Command-line interface
├── tests/
│   ├── evaluators.test.ts
│   ├── runner.test.ts
│   ├── statistics.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
├── README.md
└── EXAMPLES.md
```

---

## 8. Success Criteria

| Criteria                                          | How to Verify                                        |
| ------------------------------------------------- | ---------------------------------------------------- |
| Evaluators correctly assess agent outputs         | Unit tests with known pass/fail scenarios            |
| Statistical analysis provides accurate confidence | Verify against statistical reference implementations |
| Regression detection catches real regressions     | Test with synthetic regression scenarios             |
| Reports enable decision-making                    | User can determine adopt/reject from report          |
| Integration with telemetry works                  | End-to-end test with telemetry-producing pipeline    |
| CLI provides useful workflow                      | Run evaluation from command line, verify output      |

---

## 9. Out of Scope (v1)

- Real-time evaluation dashboard / UI
- Distributed evaluation across multiple machines
- ML-based automatic rubric generation
- A/B test infrastructure (feature flags, rollout)
- Continuous evaluation cron scheduling

---

## 10. Dependencies

**Production:**

- `@open-forge/pipeline` (agent and orchestrator interfaces)
- `@open-forge/telemetry` (telemetry events, constraint evaluation) — **implementations must be available before §3.6/§3.7 work begins**

**Development:**

- TypeScript 5.x
- Vitest (testing)
- tsup (build)

---

## 11. References

- Related: open-forge-telemetry (event source for evaluation inputs)
- Related: open-forge-pipeline (orchestration layer being evaluated)
- Related: eslint-plugin-llm-core (constraint enforcement at lint time)
- Inspiration: LLM evaluation frameworks (LangSmith, Arize Phoenix)

---

_Requirements version: 1.0.0_
_Created: 2026-04-03_
