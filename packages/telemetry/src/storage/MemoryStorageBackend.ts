import type { PipelineEvent, EventFilter } from '../types.js';
import type { StorageBackend } from './StorageBackend.js';
import { matchesFilter } from './matchesFilter.js';

export class MemoryStorageBackend implements StorageBackend {
  private readonly events: PipelineEvent[] = [];

  async append(event: PipelineEvent): Promise<void> {
    this.events.push(event);
  }

  async query(filter: EventFilter): Promise<PipelineEvent[]> {
    return this.events.filter((e) => matchesFilter(e, filter));
  }

  async count(filter: EventFilter): Promise<number> {
    return this.events.filter((e) => matchesFilter(e, filter)).length;
  }
}
