# metrics-types

Observability and cost tracking — InvocationMetrics, CostManifest, ToolResultMetadata.

## Requirements

### Requirement: InvocationMetrics interface

The system SHALL define an `InvocationMetrics` interface with: `invocationId` (number), `role` (string), `inputTokens` (number), `outputTokens` (number), `cacheTokens` (number), `cost` (number), `outcome` (`InvocationOutcome`), and `skillRefs` (number).

#### Scenario: Successful implementer invocation

- **WHEN** an implementer agent completes a task using 18K input tokens
- **THEN** `InvocationMetrics` records the token counts, cost, and `outcome: 'pass'`

#### Scenario: Failed invocation with retry

- **WHEN** a test-author invocation fails
- **THEN** `InvocationMetrics` has `outcome: 'fail'` with accurate token counts

### Requirement: InvocationOutcome type

The system SHALL define an `InvocationOutcome` literal union type with values: `'pass'`, `'fail'`, `'retry'`, `'blocked'`.

#### Scenario: Blocked invocation

- **WHEN** an agent hits a drift sentinel
- **THEN** the outcome is `'blocked'`

### Requirement: CostManifest interface

The system SHALL define a `CostManifest` interface with: `invocations` (array of `InvocationMetrics`), `totalInputTokens` (number), `totalOutputTokens` (number), `totalCacheTokens` (number), `totalCost` (number), and `phaseIndex` (number).

#### Scenario: Cost manifest for a completed phase

- **WHEN** phase 2 completes with 5 invocations
- **THEN** `CostManifest` has `invocations` of length 5 and accurate totals

### Requirement: ToolResultMetadata interface

The system SHALL define a `ToolResultMetadata` interface with: `exitCode` (optional number), `duration` (optional number in milliseconds), `filesChanged` (optional string array), and `tokensUsed` (optional number).

#### Scenario: Tool execution with all metadata

- **WHEN** a build tool runs for 3200ms changing 2 files
- **THEN** `ToolResultMetadata` has `duration: 3200`, `filesChanged` of length 2, and `exitCode: 0`

#### Scenario: Tool execution with partial metadata

- **WHEN** only exit code is available
- **THEN** `ToolResultMetadata` has `exitCode` populated and all other fields undefined
