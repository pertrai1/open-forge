## ADDED Requirements

### Requirement: Record tool result as invocation
The system SHALL provide a `recordToolResult(invocationNumber: number, role: AgentRole, phase: number, taskId: string | null, result: { inputTokens: number; outputTokens: number; cacheTokens: number; costUsd: number; outcome: InvocationOutcome; skillRefs: number; durationMs: number }): InvocationMetrics` function that constructs a complete `InvocationMetrics` record with an ISO 8601 timestamp.

#### Scenario: Build metrics record
- **WHEN** given invocationNumber 1, role 'implementer', phase 3, taskId '3.1', and result data
- **THEN** the returned `InvocationMetrics` has all fields set from the arguments, with `timestamp` as a valid ISO 8601 string

#### Scenario: Null task ID
- **WHEN** given taskId as null
- **THEN** the returned `InvocationMetrics` has `taskId` equal to null

### Requirement: Calculate aggregated totals
The system SHALL provide a `calculateTotals(invocations: readonly InvocationMetrics[]): CostManifestTotals` function that computes aggregated totals from an array of invocation records.

#### Scenario: Sum all numeric fields
- **WHEN** given 3 invocations with inputTokens [100, 200, 300], outputTokens [10, 20, 30], cacheTokens [50, 100, 150], costUsd [0.01, 0.02, 0.03], durationMs [100, 200, 300]
- **THEN** the returned totals have `totalInputTokens` 600, `totalOutputTokens` 60, `totalCacheTokens` 300, `totalCostUsd` 0.06, `totalDurationMs` 600, `totalInvocations` 3

#### Scenario: Count successes and failures
- **WHEN** given invocations with outcomes ['pass', 'fail', 'error', 'pass', 'timeout']
- **THEN** `successfulInvocations` is 2 (only 'pass' counts) and `failedInvocations` is 3

#### Scenario: Empty array
- **WHEN** given an empty invocations array
- **THEN** all totals are zero
