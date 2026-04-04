import type { PipelineEvent, EventFilter } from '../types.js';

export interface StorageBackend {
  append(event: PipelineEvent): Promise<void>;
  query(filter: EventFilter): Promise<PipelineEvent[]>;
  count(filter: EventFilter): Promise<number>;
}
