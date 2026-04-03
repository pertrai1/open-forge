import { describe, it, expect } from 'vitest';
import { extractPurpose } from '../../src/specs/purpose-extractor.js';

describe('Purpose Extractor', () => {
  describe('extractPurpose', () => {
    it('should extract first paragraph after Purpose heading', () => {
      const markdown = `# Spec Title

## Purpose

This is the first paragraph of the purpose section.

This is the second paragraph.

## Requirements

Some requirements here.`;

      const result = extractPurpose(markdown);
      expect(result).toBe('This is the first paragraph of the purpose section.');
    });

    it('should return null if Purpose section not found', () => {
      const markdown = `# Spec Title

## Requirements

Some requirements here.`;

      const result = extractPurpose(markdown);
      expect(result).toBeNull();
    });

    it('should return null for empty content', () => {
      const result = extractPurpose('');
      expect(result).toBeNull();
    });
  });
});
