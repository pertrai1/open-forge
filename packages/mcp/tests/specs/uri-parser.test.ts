import { describe, it, expect } from 'vitest';
import { parseSpecURI } from '../../src/specs/uri-parser.js';

describe('URI Parser', () => {
  describe('parseSpecURI', () => {
    it('should extract name from valid spec:// URI', () => {
      expect(parseSpecURI('spec://bash-tool')).toBe('bash-tool');
      expect(parseSpecURI('spec://read-file-tool')).toBe('read-file-tool');
    });

    it('should return null for invalid URIs', () => {
      expect(parseSpecURI('invalid-uri')).toBeNull();
      expect(parseSpecURI('http://example.com')).toBeNull();
      expect(parseSpecURI('')).toBeNull();
    });

    it('should reject path traversal attempts', () => {
      expect(parseSpecURI('spec://../etc/passwd')).toBeNull();
      expect(parseSpecURI('spec://foo/../../../etc/passwd')).toBeNull();
    });
  });
});
