import { describe, it, expect } from 'vitest';
import type {
  EvaluationDataset,
  EvaluationScenario,
  EvaluatorResult,
  EvaluationResult,
  RegressionFinding,
  ComparisonReport,
} from '../src/index.js';

describe('evaluation types', () => {
  it('should allow creating a valid dataset', () => {
    const dataset: EvaluationDataset = {
      id: 'test-dataset',
      name: 'Test Dataset',
      version: '1.0.0',
      scenarios: [
        {
          id: 'scenario-1',
          input: 'What is 2+2?',
          expectedOutput: '4',
          tags: ['math'],
          difficulty: 'easy',
        },
      ],
    };

    expect(dataset.id).toBe('test-dataset');
    expect(dataset.scenarios).toHaveLength(1);
  });

  it('should allow all difficulty levels', () => {
    const difficulties: EvaluationScenario['difficulty'][] = [
      'easy',
      'medium',
      'hard',
    ];

    expect(difficulties).toHaveLength(3);
  });

  it('should allow defining an evaluator result', () => {
    const result: EvaluatorResult = {
      evaluatorName: 'answer-quality',
      passed: true,
      score: 0.95,
      reasoning: 'Answer is correct and complete',
    };

    expect(result.evaluatorName).toBe('answer-quality');
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('should allow creating an evaluation result', () => {
    const result: EvaluationResult = {
      scenarioId: 'scenario-1',
      passed: true,
      score: 0.9,
      evaluatorResults: [],
      executionTrace: {
        agentName: 'test-agent',
        modelId: 'claude-sonnet-4-6',
        promptTokens: 100,
        completionTokens: 50,
        toolCalls: [],
        steps: ['step-1'],
        duration: 1000,
      },
      duration: 1200,
    };

    expect(result.scenarioId).toBe('scenario-1');
    expect(result.executionTrace.modelId).toBe('claude-sonnet-4-6');
  });

  it('should allow defining a regression finding', () => {
    const finding: RegressionFinding = {
      scenarioId: 'scenario-1',
      metricName: 'answer-quality',
      baselineValue: 0.95,
      candidateValue: 0.7,
      delta: -0.25,
      threshold: 0.1,
      isRegression: true,
      severity: 'major',
    };

    expect(finding.isRegression).toBe(true);
    expect(finding.severity).toBe('major');
  });

  it('should allow all comparison recommendations', () => {
    const recommendations: ComparisonReport['recommendation'][] = [
      'adopt',
      'reject',
      'investigate',
    ];

    expect(recommendations).toHaveLength(3);
  });
});
