import { describe, it, expect } from 'vitest';
import { readChangesDirectory } from '../../src/changes/reader.js';

describe('Changes Reader', () => {
  describe('readChangesDirectory', () => {
    it('should return array of changes', async () => {
      const changes = await readChangesDirectory();
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should exclude archive directory', async () => {
      const changes = await readChangesDirectory();
      const archiveEntries = changes.filter(c => c.includes('archive'));
      expect(archiveEntries).toHaveLength(0);
    });
  });
});
