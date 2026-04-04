import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { PipelineEvent, EventFilter } from '../types.js';
import type { StorageBackend } from './StorageBackend.js';

export class FileStorageBackend implements StorageBackend {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async append(event: PipelineEvent): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, JSON.stringify(event) + '\n', 'utf-8');
  }

  async query(filter: EventFilter): Promise<PipelineEvent[]> {
    const events = await this.readAll();
    return events.filter((e) => matchesFilter(e, filter));
  }

  async count(filter: EventFilter): Promise<number> {
    const events = await this.readAll();
    return events.filter((e) => matchesFilter(e, filter)).length;
  }

  private async readAll(): Promise<PipelineEvent[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === 'ENOENT') return [];
      throw err;
    }

    return content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as PipelineEvent];
        } catch {
          return [];
        }
      });
  }
}

function matchesFilter(event: PipelineEvent, filter: EventFilter): boolean {
  if (event.pipelineId !== filter.pipelineId) return false;
  if (filter.stage !== undefined && event.stage !== filter.stage) return false;
  if (filter.action !== undefined && event.action !== filter.action)
    return false;
  if (filter.from !== undefined && event.timestamp < filter.from) return false;
  if (filter.to !== undefined && event.timestamp > filter.to) return false;
  return true;
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
