import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { PipelineEvent, EventFilter } from '../types.js';
import type { StorageBackend } from './StorageBackend.js';
import { matchesFilter } from './matchesFilter.js';

export class FileStorageBackend implements StorageBackend {
  private readonly filePath: string;
  private dirCreated = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async append(event: PipelineEvent): Promise<void> {
    if (!this.dirCreated) {
      await mkdir(dirname(this.filePath), { recursive: true });
      this.dirCreated = true;
    }
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
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') return [];
      throw error;
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

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
