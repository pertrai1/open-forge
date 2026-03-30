# Spec: MCP Server

This specification defines the core MCP server capability.

## ADDED Requirements

### Requirement: Server responds to initialize

The system SHALL create an MCP server instance that responds to the `initialize` request with server information and capabilities.

#### Scenario: Initialize request succeeds
- **WHEN** an MCP client sends an `initialize` request
- **THEN** the server responds with name `specdex` and version `0.1.0`
- **AND** the response includes the `resources` capability

#### Scenario: Server declares resources capability
- **WHEN** the server capabilities are queried
- **THEN** `resources` capability is present in the capabilities object

### Requirement: Server uses stdio transport

The system SHALL use stdio (standard input/output) as the transport mechanism for MCP communication.

#### Scenario: Server listens on stdio
- **WHEN** the server is started
- **THEN** it reads MCP messages from stdin
- **AND** writes MCP responses to stdout

#### Scenario: Server connects to transport
- **WHEN** `server.connect(transport)` is called with a StdioServerTransport
- **THEN** the server begins processing incoming MCP requests

### Requirement: Server is executable as CLI

The system SHALL provide a CLI entry point for running the server.

#### Scenario: Server can be executed via npm bin
- **WHEN** `npx openspec-mcp` or `npm exec openspec-mcp` is run
- **THEN** the server starts and begins listening for MCP requests

#### Scenario: package.json has bin field
- **WHEN** package.json is inspected
- **THEN** a `bin.openspec-mcp` field exists pointing to `./dist/index.js`

### Requirement: Server entry point has shebang

The system SHALL include a shebang line in the entry point for direct execution.

#### Scenario: index.ts has shebang
- **WHEN** `src/index.ts` is inspected
- **THEN** the first line is `#!/usr/bin/env node`

### Requirement: Server module exports server factory

The system SHALL export a server factory function for testability.

#### Scenario: createServer function is exported
- **WHEN** `src/server.ts` is imported
- **THEN** a `createServer()` function is available
- **AND** calling it returns a configured MCP Server instance
