import type { PipelineEvent, EventFilter } from '../types.js';

export function matchesFilter(
  event: PipelineEvent,
  filter: EventFilter
): boolean {
  if (event.pipelineId !== filter.pipelineId) return false;
  if (filter.stage !== undefined && event.stage !== filter.stage) return false;
  if (filter.action !== undefined && event.action !== filter.action)
    return false;
  if (filter.from !== undefined && event.timestamp < filter.from) return false;
  if (filter.to !== undefined && event.timestamp > filter.to) return false;
  return true;
}
