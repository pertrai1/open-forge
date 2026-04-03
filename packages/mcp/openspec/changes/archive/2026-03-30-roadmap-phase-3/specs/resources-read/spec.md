# Spec: Resources - Read Spec

## ADDED Requirements

### Requirement: URI parser extracts spec name
The system SHALL parse spec:// URIs to extract the spec name.

#### Scenario: Parser extracts name from valid URI
- **WHEN** parseSpecURI("spec://bash-tool") is called
- **THEN** it returns "bash-tool"

#### Scenario: Parser returns null for invalid URI
- **WHEN** parseSpecURI("invalid-uri") is called
- **THEN** it returns null

### Requirement: File reader reads spec content
The system SHALL read spec.md files from the specs directory.

#### Scenario: Reader returns file content
- **WHEN** readSpecFile("bash-tool") is called
- **THEN** it returns the content of openspec/specs/bash-tool/spec.md

#### Scenario: Reader throws for missing spec
- **WHEN** readSpecFile("nonexistent") is called
- **THEN** it throws an error

### Requirement: Resources read handler returns content
The system SHALL implement resources/read handler.

#### Scenario: Handler returns spec content
- **WHEN** resources/read request with URI spec://bash-tool is received
- **THEN** handler returns contents array with spec content
- **AND** mimeType is text/markdown

#### Scenario: Handler returns error for missing spec
- **WHEN** resources/read request with URI spec://nonexistent is received
- **THEN** handler returns isError: true
