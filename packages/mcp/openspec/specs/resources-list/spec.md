# resources-list Specification

## Purpose

TBD - created by archiving change roadmap-phase-2. Update Purpose after archive.

## Requirements

### Requirement: Config module resolves openspec paths

The system SHALL provide a configuration module that resolves paths to the OpenSpec directory structure.

#### Scenario: OPENSPEC_PATH is resolved correctly

- **WHEN** config module is imported
- **THEN** `OPENSPEC_PATH` points to `./openspec/` directory relative to project root

#### Scenario: SPECS_PATH is resolved correctly

- **WHEN** config module is imported
- **THEN** `SPECS_PATH` points to `./openspec/specs/` directory

### Requirement: Spec directory reader lists available specs

The system SHALL read the specs directory and return a list of available specification folders.

#### Scenario: Reader returns spec names

- **WHEN** `readSpecDirectory()` is called
- **THEN** it returns an array of spec folder names
- **AND** each name corresponds to a folder in `openspec/specs/`

#### Scenario: Reader handles missing directory gracefully

- **WHEN** `readSpecDirectory()` is called and specs directory doesn't exist
- **THEN** it returns an empty array
- **AND** does not throw an error

### Requirement: Purpose extractor extracts first paragraph

The system SHALL extract the Purpose section from spec markdown files.

#### Scenario: Extractor returns first paragraph

- **WHEN** `extractPurpose()` is called with markdown containing `## Purpose`
- **THEN** it returns the first paragraph after the Purpose heading

#### Scenario: Extractor returns null for missing Purpose

- **WHEN** `extractPurpose()` is called with markdown without Purpose section
- **THEN** it returns `null`

### Requirement: Resources list handler returns MCP resources

The system SHALL implement an MCP `resources/list` handler that returns all available specs as resources.

#### Scenario: Handler returns resources array

- **WHEN** `resources/list` request is received
- **THEN** handler returns object with `resources` array
- **AND** each resource has `uri`, `name`, `description`, and `mimeType`

#### Scenario: Resource URIs use spec scheme

- **WHEN** resources are listed
- **THEN** each resource URI follows format `spec://{spec-name}`

#### Scenario: Resource names match folder names

- **WHEN** resources are listed
- **THEN** each resource `name` matches its spec folder name

#### Scenario: Resource descriptions use Purpose section

- **WHEN** resources are listed
- **THEN** each resource `description` contains the Purpose first paragraph
- **OR** "No description available" if Purpose is missing

#### Scenario: Resource MIME type is markdown

- **WHEN** resources are listed
- **THEN** each resource `mimeType` is `text/markdown`

### Requirement: Handler is registered with server

The system SHALL register the resources/list handler with the MCP server.

#### Scenario: Handler responds to resources/list requests

- **WHEN** MCP client sends `resources/list` request
- **THEN** the registered handler processes the request
- **AND** returns the resources list
