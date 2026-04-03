import { describe, it, expect } from 'vitest';
import { getRequirementsTool } from '../../src/tools/get-requirements/schema.js';
import { handleGetRequirements } from '../../src/tools/get-requirements/handler.js';

describe('Get Requirements Tool', () => {
  describe('schema', () => {
    it('should have correct name', () => {
      expect(getRequirementsTool.name).toBe('get_requirements');
    });

    it('should require spec_name parameter', () => {
      expect(getRequirementsTool.inputSchema.required).toContain('spec_name');
    });
  });

  describe('handler', () => {
    it('should return requirements for valid spec', async () => {
      const result = await handleGetRequirements({ spec_name: 'project-foundation' });
      expect(result).toHaveProperty('requirements');
      expect(Array.isArray(result.requirements)).toBe(true);
    });

    it('should return empty array for nonexistent spec', async () => {
      const result = await handleGetRequirements({ spec_name: 'nonexistent-spec-12345' });
      expect(result.isError).toBe(true);
    });
  });
});
