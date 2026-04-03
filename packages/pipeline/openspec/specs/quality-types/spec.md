# quality-types

Quality gate contracts — GateResult, CheckResult, GateVerdict, GateName, and self-correction loop types.

## Requirements

### Requirement: GateName type

The system SHALL define a `GateName` literal union type with exactly six values: `'verify'`, `'qa'`, `'security'`, `'architect'`, `'code-review'`, `'integration'`.

#### Scenario: Exhaustive gate matching

- **WHEN** code switches on a `GateName` value
- **THEN** TypeScript enforces exhaustive matching across all six gates

### Requirement: GateVerdict type

The system SHALL define a `GateVerdict` literal union type with values: `'pass'`, `'fail'`, `'request-changes'`.

#### Scenario: Gate with request-changes verdict

- **WHEN** intent verification finds 2+ failed claims
- **THEN** the verdict is `'request-changes'`

### Requirement: CheckResult interface

The system SHALL define a `CheckResult` interface with: `name` (string), `passed` (boolean), `message` (string), and `details` (optional string).

#### Scenario: Passing type check

- **WHEN** `tsc --noEmit` exits with code 0
- **THEN** `CheckResult` has `passed: true` and a descriptive `message`

#### Scenario: Failing lint check with details

- **WHEN** eslint reports 3 errors
- **THEN** `CheckResult` has `passed: false` and `details` containing the error output

### Requirement: GateResult interface

The system SHALL define a `GateResult` interface with: `gate` (`GateName`), `verdict` (`GateVerdict`), `findings` (array of strings), `attempt` (number), and `maxAttempts` (number).

#### Scenario: Gate passes on first attempt

- **WHEN** the verify gate passes immediately
- **THEN** `GateResult` has `verdict: 'pass'`, `attempt: 1`, and empty `findings`

#### Scenario: Gate fails with findings

- **WHEN** the security gate finds 2 issues
- **THEN** `GateResult` has `verdict: 'fail'` and `findings` of length 2

### Requirement: QualityGateSequence type

The system SHALL define a `QualityGateSequence` as a readonly tuple type listing gates in their required execution order: verify → qa → security → architect → code-review → integration.

#### Scenario: Gate order enforcement

- **WHEN** the sequencer iterates the gate sequence
- **THEN** gates execute in the exact order defined by `QualityGateSequence`
