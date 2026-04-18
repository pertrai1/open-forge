import type { Constraint, PipelineEvent } from '../types.js';

type ConstraintOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
type ConstraintScope = Constraint['scope'];

export interface ThresholdOptions {
  name: string;
  description?: string;
  value: number;
  operator: ConstraintOperator;
  extract: (events: PipelineEvent[]) => number;
  scope?: ConstraintScope;
}

export interface BooleanOptions {
  name: string;
  description?: string;
  assert: (events: PipelineEvent[]) => boolean;
  message?: string;
  scope?: ConstraintScope;
}

export interface AggregationOptions {
  name: string;
  description?: string;
  fn: 'sum' | 'count' | 'avg';
  extract: (event: PipelineEvent) => number;
  value: number;
  operator: ConstraintOperator;
  scope?: ConstraintScope;
}

function compare(options: {
  actualValue: number;
  operator: ConstraintOperator;
  value: number;
}) {
  const { actualValue, operator, value } = options;
  switch (operator) {
    case 'gt':
      return actualValue > value;
    case 'gte':
      return actualValue >= value;
    case 'lt':
      return actualValue < value;
    case 'lte':
      return actualValue <= value;
    case 'eq':
      return actualValue === value;
  }
}

function createFailure(
  prefix: 'Threshold exceeded' | 'Aggregation threshold exceeded',
  options: { actualValue: number; operator: ConstraintOperator; value: number }
) {
  const { actualValue, operator, value } = options;
  return {
    passed: false,
    actualValue,
    threshold: value,
    message: `${prefix}: ${actualValue} ${operator} ${value}`,
  };
}

function aggregateValue(events: PipelineEvent[], options: AggregationOptions) {
  switch (options.fn) {
    case 'count':
      return events.length;
    case 'sum':
      return events.reduce((total, event) => total + options.extract(event), 0);
    case 'avg': {
      if (events.length === 0) {
        return 0;
      }

      const total = events.reduce(
        (sum, event) => sum + options.extract(event),
        0
      );

      return total / events.length;
    }
  }
}

export function threshold(options: ThresholdOptions): Constraint {
  return {
    name: options.name,
    description: options.description,
    scope: options.scope ?? 'pipeline',
    check: (events) => {
      const actualValue = options.extract(events);

      if (
        compare({
          actualValue,
          operator: options.operator,
          value: options.value,
        })
      ) {
        return createFailure('Threshold exceeded', {
          actualValue,
          operator: options.operator,
          value: options.value,
        });
      }

      return { passed: true };
    },
  };
}

export function boolean(options: BooleanOptions): Constraint {
  return {
    name: options.name,
    description: options.description,
    scope: options.scope ?? 'pipeline',
    check: (events) => {
      if (options.assert(events)) {
        return { passed: true };
      }

      return {
        passed: false,
        message: options.message ?? `Assertion failed: ${options.name}`,
      };
    },
  };
}

export function aggregation(options: AggregationOptions): Constraint {
  return {
    name: options.name,
    description: options.description,
    scope: options.scope ?? 'pipeline',
    check: (events) => {
      const actualValue = aggregateValue(events, options);

      if (
        compare({
          actualValue,
          operator: options.operator,
          value: options.value,
        })
      ) {
        return createFailure('Aggregation threshold exceeded', {
          actualValue,
          operator: options.operator,
          value: options.value,
        });
      }

      return { passed: true };
    },
  };
}
