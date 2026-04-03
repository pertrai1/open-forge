import { describe, it, expect } from 'vitest';
import { parseSpecUri } from '../../src/specs/parse-spec-uri.js';

describe('URI Parser', () => {
  describe('parseSpecUri', () => {
    it('should extract name from valid spec:// URI', () => {
      expect(parseSpecUri('spec://bash-tool')).toBe('bash-tool');
      expect(parseSpecUri('spec://read-file-tool')).toBe('read-file-tool');
    });

    it('should return null for invalid URIs', () => {
      expect(parseSpecUri('invalid-uri')).toBeNull();
      expect(parseSpecUri('http://example.com')).toBeNull();
      expect(parseSpecUri('')).toBeNull();
    });

    it('should reject path traversal attempts', () => {
      expect(parseSpecUri('spec://../etc/passwd')).toBeNull();
      expect(parseSpecUri('spec://foo/../../../etc/passwd')).toBeNull();
    });
  });
});
