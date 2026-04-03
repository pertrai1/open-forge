import { describe, it, expect } from 'vitest';
import { readSpecFile } from '../../src/specs/read-spec-file.js';

describe('File Reader', () => {
  describe('readSpecFile', () => {
    it('should throw for nonexistent spec', async () => {
      await expect(readSpecFile('nonexistent-spec-12345')).rejects.toThrow();
    });
  });
});
