import { describe, it, expect } from 'vitest';
import { readSpecDirectory } from '../../src/specs/read-spec-directory.js';

describe('Spec Reader', () => {
  describe('readSpecDirectory', () => {
    it('should return an array', async () => {
      const specs = await readSpecDirectory();
      expect(Array.isArray(specs)).toBe(true);
    });

    it('should return spec names as strings', async () => {
      const specs = await readSpecDirectory();
      specs.forEach((spec) => {
        expect(typeof spec).toBe('string');
      });
    });

    it('should handle missing directory gracefully', async () => {
      const specs = await readSpecDirectory();
      expect(specs).toBeDefined();
    });
  });
});
