import { describe, it, expect } from 'vitest';
import { createResourcesListHandler } from '../../src/handlers/create-resources-list-handler.js';

describe('Resources List Handler', () => {
  describe('handler', () => {
    it('should return resources array', async () => {
      const handler = createResourcesListHandler();
      const result = await handler();

      expect(result).toHaveProperty('resources');
      expect(Array.isArray(result.resources)).toBe(true);
    });

    it('should format resources with required fields', async () => {
      const handler = createResourcesListHandler();
      const result = await handler();

      if (result.resources.length > 0) {
        const resource = result.resources[0];
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
      }
    });

    it('should use spec:// URI scheme', async () => {
      const handler = createResourcesListHandler();
      const result = await handler();

      if (result.resources.length > 0) {
        const resource = result.resources[0];
        expect(resource.uri).toMatch(/^spec:\/\//);
      }
    });

    it('should set mimeType to text/markdown', async () => {
      const handler = createResourcesListHandler();
      const result = await handler();

      if (result.resources.length > 0) {
        const resource = result.resources[0];
        expect(resource.mimeType).toBe('text/markdown');
      }
    });
  });
});
