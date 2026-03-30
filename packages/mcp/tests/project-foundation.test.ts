import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Project Foundation', () => {
  describe('TypeScript compilation', () => {
    it('should have tsconfig.json with strict mode enabled', () => {
      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
      
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.module).toBe('NodeNext');
      expect(tsconfig.compilerOptions.target).toMatch(/ES2022|ESNext/);
    });
  });

  describe('Build command', () => {
    it('should have build script in package.json', () => {
      const packagePath = join(process.cwd(), 'package.json');
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      expect(pkg.scripts.build).toBeDefined();
    });
  });

  describe('Test command', () => {
    it('should have test script in package.json', () => {
      const packagePath = join(process.cwd(), 'package.json');
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      expect(pkg.scripts.test).toBeDefined();
    });

    it('should have vitest.config.ts', () => {
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
