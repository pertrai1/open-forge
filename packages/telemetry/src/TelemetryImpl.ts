import type {
  PipelineEvent,
  EventFilter,
  PipelineSummary,
  StageName,
  Telemetry,
} from './types.js';
import type { StorageBackend } from './storage/StorageBackend.js';

export class TelemetryImpl implements Telemetry {
  constructor(private readonly storage: StorageBackend) {}

  async emit(event: PipelineEvent): Promise<void> {
    validateEvent(event);
    try {
      await this.storage.append(event);
    } catch {
      return;
    }
  }

  async query(filter: EventFilter): Promise<PipelineEvent[]> {
    return this.storage.query(filter);
  }

  async getPipelineSummary(pipelineId: string): Promise<PipelineSummary> {
    const events = await this.storage.query({ pipelineId });
    return aggregateSummary(pipelineId, events);
  }
}

function validateEvent(event: PipelineEvent): void {
  if (!event.timestamp) {
    throw new Error('PipelineEvent.timestamp is required');
  }
  if (!event.pipelineId) {
    throw new Error('PipelineEvent.pipelineId is required');
  }
  if (event.stage === undefined) {
    throw new Error('PipelineEvent.stage is required');
  }
  if (event.phase === undefined) {
    throw new Error('PipelineEvent.phase is required');
  }
  if (event.action === undefined) {
    throw new Error('PipelineEvent.action is required');
  }
}

interface AggregationState {
  totalDurationMs: number;
  totalTokens: number;
  stagesSeen: Set<StageName>;
  stagesCompleted: StageName[];
  currentStage: StageName | undefined;
  latestTimestamp: string;
  retryCount: number;
  hasEscalate: boolean;
  hasFail: boolean;
}

function aggregateSummary(
  pipelineId: string,
  events: PipelineEvent[]
): PipelineSummary {
  const state: AggregationState = {
    totalDurationMs: 0,
    totalTokens: 0,
    stagesSeen: new Set(),
    stagesCompleted: [],
    currentStage: undefined,
    latestTimestamp: '',
    retryCount: 0,
    hasEscalate: false,
    hasFail: false,
  };

  for (const event of events) {
    accumulateEvent(state, event);
  }

  return {
    pipelineId,
    totalDurationMs: state.totalDurationMs,
    totalTokens: state.totalTokens,
    stagesCompleted: state.stagesCompleted,
    currentStage: state.currentStage,
    retryCount: state.retryCount,
    status: deriveStatus({
      events,
      hasEscalate: state.hasEscalate,
      hasFail: state.hasFail,
      latestTimestamp: state.latestTimestamp,
    }),
  };
}

function accumulateEvent(state: AggregationState, event: PipelineEvent): void {
  if (event.action === 'complete' && event.durationMs !== undefined) {
    state.totalDurationMs += event.durationMs;
  }

  if (event.tokenUsage !== undefined) {
    state.totalTokens += event.tokenUsage.prompt + event.tokenUsage.completion;
  }

  if (event.action === 'complete' && !state.stagesSeen.has(event.stage)) {
    state.stagesSeen.add(event.stage);
    state.stagesCompleted.push(event.stage);
  }

  if (event.timestamp >= state.latestTimestamp) {
    state.latestTimestamp = event.timestamp;
    state.currentStage = event.stage;
  }

  if (event.action === 'retry') {
    state.retryCount++;
  }

  if (event.action === 'escalate') {
    state.hasEscalate = true;
  }

  if (event.action === 'fail') {
    state.hasFail = true;
  }
}

interface StatusInput {
  events: PipelineEvent[];
  hasEscalate: boolean;
  hasFail: boolean;
  latestTimestamp: string;
}

function deriveStatus(input: StatusInput): PipelineSummary['status'] {
  if (input.events.length === 0) return 'running';
  if (input.hasEscalate) return 'halted';
  if (input.hasFail) return 'failed';

  const lastEvent = input.events.find(
    (e) => e.timestamp === input.latestTimestamp
  );
  if (lastEvent?.action === 'complete') return 'completed';

  return 'running';
}
