# Proposal: Phase 1 - Basic MCP Server

## Why

Phase 0 established the project foundation with TypeScript, testing, and build tooling. Now we need to create the actual MCP server that will expose OpenSpec archives. Without a functioning server, we cannot implement resources, tools, or prompts in subsequent phases.

This phase creates a minimal but functional MCP server that:
- Starts up and listens on stdio transport
- Responds to the MCP `initialize` request
- Declares support for the `resources` capability
- Can be invoked as a CLI tool via npm bin

## What Changes

- **src/server.ts**: Create MCP server instance named `specdex` with version `0.1.0`
- **src/index.ts**: Entry point that configures stdio transport and starts the server
- **resources capability**: Register the resources capability (actual handlers come in Phase 2)
- **package.json**: Add `bin` field for CLI execution
- **tests/server.test.ts**: Tests verifying server initialization and capability declaration

## Capabilities

### New Capabilities

- **mcp-server**: Core MCP server that responds to protocol requests and declares capabilities

### Modified Capabilities

None. This is the first implementation phase.

## Impact

**Affected Code:**
- `src/index.ts` - Updated from placeholder to actual server entry point
- `src/server.ts` - New file with MCP server instance
- `package.json` - Add bin field

**Dependencies:**
- Uses `@modelcontextprotocol/sdk` (installed in Phase 0)

**Enables:**
- Phase 2: Resources - List Specs (can now register resource handlers)
- All subsequent phases (depend on working server)

**Protocol Compliance:**
- Server will implement MCP 2024-11-05 specification
- Transport: stdio (standard input/output)
- Capabilities: resources (tools and prompts in later phases)
