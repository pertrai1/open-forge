import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Project Foundation', () => {
  describe('TypeScript compilation', () => {
    it('should have tsconfig.json extending workspace base', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.extends).toBe('../../tsconfig.base.json');
    });

    it('should have tsconfig.lib.json for builds', () => {
      const tsconfigLibPath = join(process.cwd(), 'tsconfig.lib.json');
      expect(existsSync(tsconfigLibPath)).toBe(true);
    });
  });

  describe('Nx targets', () => {
    it('should have vitest.config.ts for test target', () => {
      const vitestPath = join(process.cwd(), 'vitest.config.ts');
      expect(existsSync(vitestPath)).toBe(true);
    });
  });

  describe('MCP SDK', () => {
    it('should have @modelcontextprotocol/sdk in dependencies', () => {
      const packagePath = join(process.cwd(), 'package.json');
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));

      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    });
  });

  describe('Directory structure', () => {
    it('should have src/ directory', () => {
      const srcPath = join(process.cwd(), 'src');
      expect(existsSync(srcPath)).toBe(true);
    });

    it('should have tests/ directory', () => {
      const testsPath = join(process.cwd(), 'tests');
      expect(existsSync(testsPath)).toBe(true);
    });
  });
});
