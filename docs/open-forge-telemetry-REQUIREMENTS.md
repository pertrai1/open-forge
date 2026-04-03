# open-forge-telemetry — Requirements

## 1. Problem Statement

The open-forge-pipeline orchestrates multi-stage agent workflows but lacks visibility into what agents are doing and whether constraints are being met. Without telemetry and evaluation, the pipeline cannot:

- Detect when agents are stuck in loops
- Enforce budget constraints (tokens, time, cost)
- Provide feedback to agents about their own behavior
- Generate audit trails for human review
- Enable data-driven optimization of the pipeline itself

We need a standalone telemetry package that captures structured events from pipeline stages, evaluates constraints against those events, and enables corrective action.

---

## 2. Users and Personas

| Persona               | Needs                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Pipeline Operator** | Visibility into running pipelines, alerts on constraint violations, ability to halt/steer |
| **Agent (LLM)**       | Access to its own telemetry for self-correction (if in context)                           |
| **Developer**         | Debug failed pipelines, understand what went wrong, optimize slow stages                  |
| **Auditor**           | Complete trace of what agents did, when, and with what outcomes                           |

---

## 3. Functional Requirements

### 3.1 Event Capture

| ID    | Requirement                                                             | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| F-001 | System MUST capture events at the start and end of every pipeline stage | P0       |
| F-002 | System MUST capture events on retry, failure, and escalation            | P0       |
| F-003 | Each event MUST include: timestamp, pipelineId, phase, stage, action    | P0       |
| F-004 | Each event SHOULD include: durationMs, tokenUsage, agentId, model       | P1       |
| F-005 | Each event MAY include: filesModified, filesCreated, error details      | P2       |
| F-006 | System MUST provide an `emit()` function that pipeline stages call      | P0       |
| F-007 | System MUST support async emission without blocking pipeline execution  | P1       |

### 3.2 Event Storage

| ID    | Requirement                                                             | Priority |
| ----- | ----------------------------------------------------------------------- | -------- |
| F-010 | System MUST store events durably (survive pipeline restart)             | P0       |
| F-011 | System MUST support pluggable storage backends (file, SQLite, Postgres) | P1       |
| F-012 | System MUST provide a default zero-config storage option (file-based)   | P0       |
| F-013 | System MUST support querying events by pipelineId, stage, time range    | P1       |

### 3.3 Constraint Definition

| ID    | Requirement                                                                                                  | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------- |
| F-020 | System MUST support defining constraints as code                                                             | P0       |
| F-021 | System MUST support constraint types: threshold (max X), boolean (must be true), aggregation (sum/count/avg) | P0       |
| F-022 | System MUST support constraints scoped per-stage and per-pipeline                                            | P1       |
| F-023 | System MUST provide a default constraint set for agent pipelines (retries, token budget, duration)           | P1       |
| F-024 | System SHOULD support hot-reload of constraint definitions                                                   | P2       |

### 3.4 Constraint Evaluation

| ID    | Requirement                                                                         | Priority |
| ----- | ----------------------------------------------------------------------------------- | -------- |
| F-030 | System MUST evaluate constraints after each stage completion                        | P0       |
| F-031 | System MUST return a structured result: `{ passed: boolean, violations: string[] }` | P0       |
| F-032 | System MUST support synchronous evaluation (blocking)                               | P0       |
| F-033 | System SHOULD support asynchronous evaluation (background, callback on violation)   | P2       |
| F-034 | System MUST log all constraint evaluations for audit                                | P1       |

### 3.5 Feedback Loop Integration

| ID    | Requirement                                                                                | Priority |
| ----- | ------------------------------------------------------------------------------------------ | -------- |
| F-040 | System MUST expose a `evaluate()` function that the orchestrator calls                     | P0       |
| F-041 | System MUST provide a summary of pipeline health for HANDOFF.md context                    | P1       |
| F-042 | System SHOULD be able to serialize recent events for agent context (token-limited)         | P2       |
| F-043 | System MUST integrate with existing eslint-plugin-llm-core violations as constraint inputs | P1       |

### 3.6 Observability

| ID    | Requirement                                                        | Priority |
| ----- | ------------------------------------------------------------------ | -------- |
| F-050 | System MUST expose a health check endpoint (if running as service) | P1       |
| F-051 | System MUST export metrics in Prometheus format (optional)         | P2       |
| F-052 | System SHOULD support OpenTelemetry export for traces              | P2       |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID     | Requirement                                                         |
| ------ | ------------------------------------------------------------------- |
| NF-001 | Event emission MUST complete in < 5ms (p99)                         |
| NF-002 | Constraint evaluation MUST complete in < 50ms (p99) for 1000 events |
| NF-003 | Storage MUST support pipelines with 10,000+ events                  |

### 4.2 Reliability

| ID     | Requirement                                                               |
| ------ | ------------------------------------------------------------------------- |
| NF-010 | Event storage MUST be append-only (no mutation of historical events)      |
| NF-011 | System MUST NOT crash the pipeline on telemetry failure (fail gracefully) |

### 4.3 Compatibility

| ID     | Requirement                                                         |
| ------ | ------------------------------------------------------------------- |
| NF-020 | MUST be a Node.js package (ESM + CJS)                               |
| NF-021 | MUST work with TypeScript 5.x                                       |
| NF-022 | MUST have zero required runtime dependencies for core functionality |

### 4.4 Developer Experience

| ID     | Requirement                                                       |
| ------ | ----------------------------------------------------------------- |
| NF-030 | MUST be usable with zero configuration (defaults work out of box) |
| NF-031 | MUST have type definitions included                               |
| NF-032 | MUST have a clear README with examples                            |

---

## 5. Interface Specification

### 5.1 Core Types

```typescript
interface PipelineEvent {
  timestamp: string; // ISO 8601
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

type StageName =
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
```

### 5.2 Telemetry API

```typescript
interface Telemetry {
  emit(event: PipelineEvent): Promise<void>;
  query(filter: EventFilter): Promise<PipelineEvent[]>;
  getPipelineSummary(pipelineId: string): Promise<PipelineSummary>;
}

interface EventFilter {
  pipelineId: string;
  stage?: StageName;
  action?: PipelineEvent['action'];
  from?: string; // timestamp
  to?: string; // timestamp
}

interface PipelineSummary {
  pipelineId: string;
  totalDurationMs: number;
  totalTokens: number;
  stagesCompleted: StageName[];
  currentStage?: StageName;
  retryCount: number;
  status: 'running' | 'completed' | 'failed' | 'halted';
}
```

### 5.3 Constraint API

```typescript
interface ConstraintEvaluator {
  evaluate(pipelineId: string): Promise<ConstraintResult>;
  addConstraint(constraint: Constraint): void;
  removeConstraint(name: string): void;
}

interface Constraint {
  name: string;
  description?: string;
  scope: 'stage' | 'pipeline';
  check: (events: PipelineEvent[]) => ConstraintCheckResult;
}

interface ConstraintCheckResult {
  passed: boolean;
  message?: string;
  actualValue?: number | string;
  threshold?: number | string;
}

interface ConstraintResult {
  passed: boolean;
  violations: ConstraintViolation[];
  evaluatedAt: string;
}

interface ConstraintViolation {
  constraintName: string;
  stage?: StageName;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}
```

### 5.4 Integration API

```typescript
// Main entry point for pipeline integration
interface OpenForgeTelemetry {
  telemetry: Telemetry;
  constraints: ConstraintEvaluator;

  // Convenience method for pipeline orchestrator
  onStageEvent(event: PipelineEvent): Promise<ConstraintResult | null>;

  // Serialize for HANDOFF.md or agent context
  serializeContext(pipelineId: string, maxTokens?: number): Promise<string>;
}

function createTelemetry(config?: TelemetryConfig): OpenForgeTelemetry;
```

---

## 6. Default Constraints

The package MUST ship with these default constraints:

| Constraint                | Scope    | Threshold  | Severity |
| ------------------------- | -------- | ---------- | -------- |
| `max-retries-per-stage`   | stage    | 3          | error    |
| `max-pipeline-duration`   | pipeline | 30 minutes | error    |
| `max-token-budget`        | pipeline | 200,000    | error    |
| `max-stage-duration`      | stage    | 10 minutes | warning  |
| `no-consecutive-failures` | stage    | 2          | critical |
| `lint-violations`         | pipeline | 0          | error    |

---

## 7. File Structure

```
open-forge-telemetry/
├── src/
│   ├── index.ts              # Public exports
│   ├── telemetry.ts          # Telemetry implementation
│   ├── constraints.ts        # Constraint evaluator
│   ├── storage/
│   │   ├── interface.ts      # Storage interface
│   │   ├── file.ts           # File-based storage (default)
│   │   ├── sqlite.ts         # SQLite storage
│   │   └── memory.ts         # In-memory storage (testing)
│   ├── constraints/
│   │   ├── defaults.ts       # Default constraint definitions
│   │   └── builder.ts        # Constraint builder utilities
│   └── types.ts              # Type definitions
├── tests/
│   ├── telemetry.test.ts
│   ├── constraints.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
├── README.md
└── EXAMPLES.md
```

---

## 8. Success Criteria

| Criteria                                     | How to Verify                                        |
| -------------------------------------------- | ---------------------------------------------------- |
| Events are captured from all pipeline stages | Integration test with mock pipeline                  |
| Constraints halt a misbehaving pipeline      | Test with simulated infinite loop                    |
| Zero-config works                            | `npm install && import` without any config           |
| Performance meets SLA                        | Benchmark with 10,000 events                         |
| Audit trail is complete                      | Query all events for a pipeline, verify completeness |

---

## 9. Out of Scope (v1)

- Real-time dashboard / UI
- Distributed tracing across multiple machines
- ML-based anomaly detection
- OpenTelemetry trace export
- Postgres storage backend (file + SQLite only for v1)

---

## 10. Dependencies

**Production:**

- None (zero required dependencies)

**Development:**

- TypeScript 5.x
- Vitest (testing)
- tsup (build)

---

## 11. References

- Related: eslint-plugin-llm-core (constraint enforcement at lint time)
- Related: open-forge-pipeline (orchestration layer that consumes this)
- Related: openspec-mcp (agent bridge that emits events)
- Inspiration: OpenTelemetry specification

---

_Requirements version: 1.0.0_
_Created: 2026-04-02_
