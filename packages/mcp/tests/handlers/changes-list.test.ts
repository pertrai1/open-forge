import { describe, it, expect } from 'vitest';
import { handleChangesList } from '../../src/handlers/handle-changes-list.js';

describe('Changes List Handler', () => {
  it('should return changes array', async () => {
    const result = await handleChangesList();
    expect(result).toHaveProperty('changes');
    expect(Array.isArray(result.changes)).toBe(true);
  });

  it('should include uri for each change', async () => {
    const result = await handleChangesList();
    if (result.changes.length > 0) {
      expect(result.changes[0]).toHaveProperty('uri');
      expect(result.changes[0].uri).toMatch(/^changes:\/\//);
    }
  });
});
