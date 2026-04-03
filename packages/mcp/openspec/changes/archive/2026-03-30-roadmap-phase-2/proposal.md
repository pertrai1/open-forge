# Proposal: Phase 2 - Resources - List Specs

## Why

The MCP server is running (Phase 1) but has no resources to expose. OpenSpec archives contain specifications in `openspec/specs/` that need to be discoverable by MCP clients. This phase implements the `resources/list` handler so clients can see what specs are available.

## What Changes

- **src/config.ts**: Path resolution for `./openspec/` directory
- **src/specs/reader.ts**: Utility to read `openspec/specs/` directory
- **src/specs/purpose-extractor.ts**: Extract Purpose section from spec markdown
- **src/handlers/resources-list.ts**: MCP `resources/list` handler implementation
- **src/server.ts**: Register resources/list handler
- **tests/**: Tests for all new modules

## Capabilities

### New Capabilities

- **resources-list**: Capability to list available OpenSpec specifications as MCP resources

### Modified Capabilities

- **mcp-server**: Add resources/list handler to existing server

## Impact

**Affected Code:**

- New modules: config.ts, specs/reader.ts, specs/purpose-extractor.ts, handlers/resources-list.ts
- Updated: server.ts (handler registration)

**Enables:**

- Phase 3: Resources - Read Spec (can now list specs to read)
- Phase 4: Search Specs (can search across listed specs)
