import { describe, it, expect } from 'vitest';
import { searchSpecs } from '../../src/specs/searcher.js';

describe('Spec Searcher', () => {
  describe('searchSpecs', () => {
    it('should return array of results', async () => {
      const results = await searchSpecs('foundation');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const results1 = await searchSpecs('foundation');
      const results2 = await searchSpecs('FOUNDATION');
      expect(results1).toEqual(results2);
    });

    it('should return empty array for no matches', async () => {
      const results = await searchSpecs('xyz123nonexistent456');
      expect(results).toEqual([]);
    });
  });
});
