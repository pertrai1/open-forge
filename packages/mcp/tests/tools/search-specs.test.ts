import { describe, it, expect } from 'vitest';
import { searchSpecsTool } from '../../src/tools/search-specs/schema.js';
import { handleSearchSpecs } from '../../src/tools/search-specs/handler.js';

describe('Search Specs Tool', () => {
  describe('schema', () => {
    it('should have correct name', () => {
      expect(searchSpecsTool.name).toBe('search_specs');
    });

    it('should require query parameter', () => {
      expect(searchSpecsTool.inputSchema.required).toContain('query');
    });
  });

  describe('handler', () => {
    it('should return results for valid query', async () => {
      const result = await handleSearchSpecs({ query: 'foundation' });
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should return empty results for no matches', async () => {
      const result = await handleSearchSpecs({ query: 'xyz123nonexistent456' });
      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
