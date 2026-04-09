# @open-forge/telemetry

Structured event capture, querying, and constraint evaluation for open-forge pipeline stages.

## Installation

```bash
npm install @open-forge/telemetry
```

## Quick Start

```typescript
import { TelemetryImpl, MemoryStorageBackend } from '@open-forge/telemetry';

const storage = new MemoryStorageBackend();
const telemetry = new TelemetryImpl(storage);

// Emit events from pipeline stages
await telemetry.emit({
  timestamp: new Date().toISOString(),
  pipelineId: 'my-pipeline',
  phase: 1,
  stage: 'plan',
  action: 'start',
});

await telemetry.emit({
  timestamp: new Date().toISOString(),
  pipelineId: 'my-pipeline',
  phase: 1,
  stage: 'plan',
  action: 'complete',
  durationMs: 1500,
  tokenUsage: { prompt: 100, completion: 200 },
});

// Query events
const events = await telemetry.query({
  pipelineId: 'my-pipeline',
  stage: 'plan',
});

// Get aggregated summary
const summary = await telemetry.getPipelineSummary('my-pipeline');
console.log(summary);
// {
//   pipelineId: 'my-pipeline',
//   totalDurationMs: 1500,
//   totalTokens: 300,
//   stagesCompleted: ['plan'],
//   currentStage: 'plan',
//   retryCount: 0,
//   status: 'completed'
// }
```

## Storage Backends

Two storage backends are included:

- **`MemoryStorageBackend`** — in-memory, ephemeral. Good for testing and lightweight use.
- **`FileStorageBackend`** — JSONL append-only file. Zero-config production backend; persists events across restarts.

```typescript
import { FileStorageBackend } from '@open-forge/telemetry';

const storage = new FileStorageBackend('./telemetry-events.jsonl');
const telemetry = new TelemetryImpl(storage);
```

## API

### `TelemetryImpl`

Implements the `Telemetry` interface. Construct with a `StorageBackend` instance.

| Method                           | Description                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `emit(event)`                    | Validate and persist a `PipelineEvent`. Throws on missing required fields. Storage failures are caught silently (NF-011). |
| `query(filter)`                  | Retrieve events matching an `EventFilter` (pipelineId, stage, action, time range).                                        |
| `getPipelineSummary(pipelineId)` | Aggregate all events for a pipeline into a `PipelineSummary` (duration, tokens, stages, retries, status).                 |

### `PipelineEvent` Required Fields

| Field        | Type                                                       |
| ------------ | ---------------------------------------------------------- |
| `timestamp`  | `string` (ISO 8601)                                        |
| `pipelineId` | `string`                                                   |
| `phase`      | `number`                                                   |
| `stage`      | `StageName`                                                |
| `action`     | `'start' \| 'complete' \| 'fail' \| 'retry' \| 'escalate'` |

### `PipelineSummary` Status Derivation

| Status      | Condition                                   |
| ----------- | ------------------------------------------- |
| `halted`    | Any `escalate` event exists                 |
| `failed`    | Any `fail` event (no escalation)            |
| `completed` | Last event is `complete` (no fail/escalate) |
| `running`   | Otherwise                                   |

## Building

Run `nx build telemetry` to build the library.

## Running unit tests

Run `nx test telemetry` to execute the unit tests via [Vitest](https://vitest.dev).
