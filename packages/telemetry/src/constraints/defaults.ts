import type { Constraint, PipelineEvent } from '../types.js';

type DefaultConstraintOptions = {
  maxRetries: number;
  maxTokens: number;
  maxDurationMs: number;
  maxConsecutive: number;
  maxViolations: number;
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MAX_TOKENS = 50_000;
const DEFAULT_MAX_DURATION_MS = 30_000;
const DEFAULT_MAX_CONSECUTIVE = 3;
const DEFAULT_MAX_VIOLATIONS = 10;

const DEFAULT_OPTIONS: DefaultConstraintOptions = {
  maxRetries: DEFAULT_MAX_RETRIES,
  maxTokens: DEFAULT_MAX_TOKENS,
  maxDurationMs: DEFAULT_MAX_DURATION_MS,
  maxConsecutive: DEFAULT_MAX_CONSECUTIVE,
  maxViolations: DEFAULT_MAX_VIOLATIONS,
};

export function createMaxRetriesConstraint(maxRetries: number): Constraint {
  return {
    name: 'max-retries',
    description:
      'Ensures pipeline retry attempts do not exceed the configured maximum.',
    scope: 'pipeline',
    check: (events) => {
      const retryCount = events.filter(
        (event) => event.action === 'retry'
      ).length;

      if (retryCount <= maxRetries) {
        return { passed: true };
      }

      return {
        passed: false,
        message: `Max retries exceeded: ${retryCount} > ${maxRetries}`,
        actualValue: retryCount,
        threshold: maxRetries,
      };
    },
  };
}

export function createTokenBudgetConstraint(maxTokens: number): Constraint {
  return {
    name: 'token-budget',
    description:
      'Ensures total token usage stays within the configured pipeline budget.',
    scope: 'pipeline',
    check: (events) => {
      const totalTokens = events.reduce(
        (sum, event) => sum + getEventTokenUsage(event),
        0
      );

      if (totalTokens <= maxTokens) {
        return { passed: true };
      }

      return {
        passed: false,
        message: `Token budget exceeded: ${totalTokens} > ${maxTokens}`,
        actualValue: totalTokens,
        threshold: maxTokens,
      };
    },
  };
}

export function createDurationConstraint(maxDurationMs: number): Constraint {
  return {
    name: 'duration-limit',
    description:
      'Ensures completed stages do not exceed the configured duration limit.',
    scope: 'stage',
    check: (events) => {
      for (const event of events) {
        if (event.action !== 'complete' || event.durationMs === undefined) {
          continue;
        }

        if (event.durationMs <= maxDurationMs) {
          continue;
        }

        return {
          passed: false,
          message: `Stage duration exceeded for ${event.stage}: ${event.durationMs}ms > ${maxDurationMs}ms`,
          actualValue: event.durationMs,
          threshold: maxDurationMs,
        };
      }

      return { passed: true };
    },
  };
}

export function createConsecutiveFailuresConstraint(
  maxConsecutive: number
): Constraint {
  return {
    name: 'consecutive-failures',
    description:
      'Ensures pipelines do not accumulate too many consecutive failures.',
    scope: 'pipeline',
    check: (events) => {
      let currentFailures = 0;
      let maxObservedFailures = 0;

      for (const event of events) {
        if (event.action === 'fail') {
          currentFailures += 1;
          if (currentFailures > maxObservedFailures) {
            maxObservedFailures = currentFailures;
          }
          continue;
        }

        if (event.action === 'complete') {
          currentFailures = 0;
        }
      }

      if (maxObservedFailures <= maxConsecutive) {
        return { passed: true };
      }

      return {
        passed: false,
        message: `Consecutive failures exceeded: ${maxObservedFailures} > ${maxConsecutive}`,
        actualValue: maxObservedFailures,
        threshold: maxConsecutive,
      };
    },
  };
}

export function createLintViolationsConstraint(
  maxViolations: number
): Constraint {
  return {
    name: 'lint-violations',
    description:
      'Ensures total lint violations stay within the configured maximum.',
    scope: 'pipeline',
    check: (events) => {
      const totalViolations = events.reduce(
        (sum, event) => sum + getLintViolations(event),
        0
      );

      if (totalViolations <= maxViolations) {
        return { passed: true };
      }

      return {
        passed: false,
        message: `Lint violations exceeded: ${totalViolations} > ${maxViolations}`,
        actualValue: totalViolations,
        threshold: maxViolations,
      };
    },
  };
}

export function createDefaultConstraints(
  options: Partial<DefaultConstraintOptions> = {}
): Constraint[] {
  const resolvedOptions: DefaultConstraintOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return [
    createMaxRetriesConstraint(resolvedOptions.maxRetries),
    createTokenBudgetConstraint(resolvedOptions.maxTokens),
    createDurationConstraint(resolvedOptions.maxDurationMs),
    createConsecutiveFailuresConstraint(resolvedOptions.maxConsecutive),
    createLintViolationsConstraint(resolvedOptions.maxViolations),
  ];
}

function getEventTokenUsage(event: PipelineEvent): number {
  return (event.tokenUsage?.prompt ?? 0) + (event.tokenUsage?.completion ?? 0);
}

function getLintViolations(event: PipelineEvent): number {
  const lintViolations = event.metadata?.lintViolations;
  return typeof lintViolations === 'number' ? lintViolations : 0;
}
