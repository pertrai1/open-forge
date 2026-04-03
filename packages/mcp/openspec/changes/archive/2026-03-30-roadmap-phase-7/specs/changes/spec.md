# Spec: Resources - Changes

## ADDED Requirements

### Requirement: Changes list resource exists

The system SHALL expose changes://list as an MCP resource.

#### Scenario: List changes

- **WHEN** client requests changes://list
- **THEN** system returns list of change files

### Requirement: Individual change can be read

The system SHALL support reading individual changes.

#### Scenario: Read change file

- **WHEN** client requests changes://{name}
- **THEN** system returns change file content
