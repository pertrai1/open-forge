import { describe, it, expect } from 'vitest';
import { getScenariosTool } from '../../src/tools/get-scenarios/get-scenarios-tool.js';
import { handleGetScenarios } from '../../src/tools/get-scenarios/handle-get-scenarios.js';

describe('Get Scenarios Tool', () => {
  describe('schema', () => {
    it('should have correct name', () => {
      expect(getScenariosTool.name).toBe('get_scenarios');
    });

    it('should require spec_name parameter', () => {
      expect(getScenariosTool.inputSchema.required).toContain('spec_name');
    });
  });

  describe('handler', () => {
    it('should return scenarios for valid spec', async () => {
      const result = await handleGetScenarios({
        spec_name: 'project-foundation',
      });
      expect(result).toHaveProperty('scenarios');
      expect(Array.isArray(result.scenarios)).toBe(true);
    });

    it('should return error for nonexistent spec', async () => {
      const result = await handleGetScenarios({
        spec_name: 'nonexistent-spec-12345',
      });
      expect(result.isError).toBe(true);
    });
  });
});
