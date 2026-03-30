import { describe, it, expect } from 'vitest';
import { createResourcesReadHandler } from '../../src/handlers/resources-read.js';

describe('Resources Read Handler', () => {
  describe('handler', () => {
    it('should return content for valid spec URI', async () => {
      const handler = createResourcesReadHandler();
      const result = await handler({ params: { uri: 'spec://project-foundation' } });

      expect(result).toHaveProperty('contents');
      expect(Array.isArray(result.contents)).toBe(true);
    });

    it('should return error for invalid URI', async () => {
      const handler = createResourcesReadHandler();
      const result = await handler({ params: { uri: 'invalid-uri' } });

      expect(result.isError).toBe(true);
    });
  });
});
