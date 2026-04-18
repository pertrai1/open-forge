import type {
  Constraint,
  ConstraintCheckResult,
  ConstraintEvaluator,
  ConstraintResult,
  ConstraintViolation,
  PipelineEvent,
  StageName,
} from './types.js';
import type { StorageBackend } from './storage/StorageBackend.js';

interface StageEvents {
  stage: StageName;
  events: PipelineEvent[];
  completed: boolean;
}

export class ConstraintEvaluatorImpl implements ConstraintEvaluator {
  private readonly constraints = new Map<string, Constraint>();

  constructor(private readonly storage: StorageBackend) {}

  addConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.name, constraint);
  }

  removeConstraint(name: string): void {
    this.constraints.delete(name);
  }

  async evaluate(pipelineId: string): Promise<ConstraintResult> {
    const events = await this.storage.query({ pipelineId });
    const stageGroups = groupCompletedStageEvents(events);
    const violations: ConstraintViolation[] = [];

    for (const constraint of this.constraints.values()) {
      if (constraint.scope === 'pipeline') {
        const result = constraint.check(events);
        if (!result.passed) {
          violations.push(
            createViolation({ constraintName: constraint.name, result })
          );
        }

        continue;
      }

      for (const stageGroup of stageGroups) {
        const result = constraint.check(stageGroup.events);
        if (!result.passed) {
          violations.push(
            createViolation({
              constraintName: constraint.name,
              result,
              stage: stageGroup.stage,
            })
          );
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

function groupCompletedStageEvents(events: PipelineEvent[]): StageEvents[] {
  const groups = new Map<StageName, StageEvents>();

  for (const event of events) {
    const existing = groups.get(event.stage);

    if (existing === undefined) {
      groups.set(event.stage, {
        stage: event.stage,
        events: [event],
        completed: event.action === 'complete',
      });
      continue;
    }

    existing.events.push(event);
    if (event.action === 'complete') {
      existing.completed = true;
    }
  }

  return [...groups.values()].filter((group) => group.completed);
}

function createViolation({
  constraintName,
  result,
  stage,
}: {
  constraintName: string;
  result: ConstraintCheckResult;
  stage?: StageName;
}): ConstraintViolation {
  return {
    constraintName,
    stage,
    message: result.message ?? `Constraint failed: ${constraintName}`,
    severity: 'error',
  };
}
