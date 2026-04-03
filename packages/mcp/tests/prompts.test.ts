import { describe, it, expect } from 'vitest';
import { listPrompts, getPrompt } from '../src/prompts/list.js';

describe('Prompts', () => {
  describe('listPrompts', () => {
    it('should return prompts array', async () => {
      const result = await listPrompts();
      expect(result).toHaveProperty('prompts');
      expect(Array.isArray(result.prompts)).toBe(true);
    });

    it('should include understand_spec prompt', async () => {
      const result = await listPrompts();
      const prompt = result.prompts.find((p) => p.name === 'understand_spec');
      expect(prompt).toBeDefined();
    });

    it('should include compare_specs prompt', async () => {
      const result = await listPrompts();
      const prompt = result.prompts.find((p) => p.name === 'compare_specs');
      expect(prompt).toBeDefined();
    });
  });

  describe('getPrompt', () => {
    it('should return messages for understand_spec', async () => {
      const result = await getPrompt('understand_spec', { spec_name: 'project-foundation' });
      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it('should return messages for compare_specs', async () => {
      const result = await getPrompt('compare_specs', {
        spec_a: 'project-foundation',
        spec_b: 'mcp-server',
      });
      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it('should throw for unknown prompt', async () => {
      await expect(getPrompt('unknown_prompt', {})).rejects.toThrow();
    });
  });
});
