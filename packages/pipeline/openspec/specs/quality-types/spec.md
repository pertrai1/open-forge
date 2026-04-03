# quality-types

Quality gate contracts — GateResult, CheckResult, GateVerdict, GateName, and self-correction loop types.

## Requirements

### Requirement: GateName type

The system SHALL define a `GateName` literal union type with exactly six values: `'verify'`, `'qa-testing'`, `'security-audit'`, `'architect-review'`, `'code-review'`, `'integration-testing'`.

#### Scenario: Exhaustive gate matching

- **WHEN** code switches on a `GateName` value
- **THEN** TypeScript enforces exhaustive matching across all six gates

### Requirement: GateVerdict type

The system SHALL define a `GateVerdict` literal union type with values: `'pass'`, `'fail'`, `'request-changes'`.

#### Scenario: Gate with request-changes verdict

- **WHEN** intent verification finds 2+ failed claims
- **THEN** the verdict is `'request-changes'`

### Requirement: CheckCategory type

The system SHALL define a `CheckCategory` literal union type with values: `'lint'`, `'typecheck'`, `'test'`, `'build'`.

### Requirement: FindingSeverity type

The system SHALL define a `FindingSeverity` literal union type with values: `'must-fix'`, `'should-fix'`, `'suggestion'`.

### Requirement: GateFinding interface

The system SHALL define a `GateFinding` interface with: `severity` (`FindingSeverity`), `filePath` (string), `line` (number | null), `description` (string), and `remediation` (string).

### Requirement: CheckResult interface

The system SHALL define a `CheckResult` interface with: `category` (`CheckCategory`), `passed` (boolean), `exitCode` (number), `output` (string), and `durationMs` (number).

#### Scenario: Passing type check

- **WHEN** `tsc --noEmit` exits with code 0
- **THEN** `CheckResult` has `passed: true` and a descriptive `message`

#### Scenario: Failing lint check with details

- **WHEN** eslint reports 3 errors
- **THEN** `CheckResult` has `passed: false` and `details` containing the error output

### Requirement: GateResult interface

The system SHALL define a `GateResult` interface with: `gate` (`GateName`), `verdict` (`GateVerdict`), `findings` (array of `GateFinding`), `mustFixCount` (number), `durationMs` (number), and `attempt` (number).

#### Scenario: Gate passes on first attempt

- **WHEN** the verify gate passes immediately
- **THEN** `GateResult` has `verdict: 'pass'`, `attempt: 1`, and empty `findings`

#### Scenario: Gate fails with findings

- **WHEN** the security gate finds 2 issues
- **THEN** `GateResult` has `verdict: 'fail'` and `findings` of length 2

### Requirement: GateSequenceResult interface

The system SHALL define a `GateSequenceResult` interface with: `gateResults` (array of `GateResult`), `allPassed` (boolean), `firstFailedGate` (`GateName | null`), and `totalDurationMs` (number).

#### Scenario: Gate sequence all passed

- **WHEN** all gates in the sequence pass
- **THEN** `GateSequenceResult` has `allPassed: true` and `firstFailedGate: null`

#### Scenario: Gate sequence with failure

- **WHEN** the security-audit gate fails
- **THEN** `GateSequenceResult` has `allPassed: false` and `firstFailedGate: 'security-audit'`
