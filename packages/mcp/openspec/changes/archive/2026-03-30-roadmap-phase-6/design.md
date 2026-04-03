# Design: Phase 6 - Tool - Get Scenarios

## Decisions

1. Parse #### Scenario: blocks
2. Extract WHEN/THEN blocks
3. Return structured scenario data

## Technical Approach

- Extract from Scenarios section
- Parse scenario name and steps
- Return array with name, when, then, raw
