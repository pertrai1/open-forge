# get-scenarios Specification

## Purpose

TBD - created by archiving change roadmap-phase-6. Update Purpose after archive.

## Requirements

### Requirement: Tool extracts Scenarios

The system SHALL provide a get_scenarios tool that extracts scenarios from a spec.

#### Scenario: Tool extracts scenarios

- **WHEN** get_scenarios is called with spec_name
- **THEN** it returns array of scenarios

#### Scenario: Tool handles missing Scenarios

- **WHEN** spec has no Scenarios section
- **THEN** it returns empty array

### Requirement: Scenarios are structured

The system SHALL return structured scenario data.

#### Scenario: Scenarios have names

- **WHEN** scenarios extracted
- **THEN** each has name, when, then, raw
