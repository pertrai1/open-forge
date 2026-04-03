import { defineConfig } from 'vitest/config';

const TEST_TIMEOUT_MS = 5_000;
const COVERAGE_THRESHOLD_PERCENT = 80;

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: TEST_TIMEOUT_MS,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: COVERAGE_THRESHOLD_PERCENT,
        branches: COVERAGE_THRESHOLD_PERCENT,
        functions: COVERAGE_THRESHOLD_PERCENT,
        lines: COVERAGE_THRESHOLD_PERCENT,
      },
    },
  },
});
