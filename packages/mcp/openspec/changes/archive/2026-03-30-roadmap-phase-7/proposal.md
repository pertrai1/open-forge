# Proposal: Phase 7 - Resources - Changes

## Why

Phase 0-6 provide spec reading capabilities. The `openspec/changes/` directory tracks modifications and needs to be exposed as resources.

## What Changes

- src/changes/reader.ts: Read changes directory
- src/handlers/changes-list.ts: MCP handler for changes://list
- src/handlers/changes-read.ts: MCP handler for changes://{name}
- src/server.ts: Register handlers

## Capabilities

### New Capabilities

- changes-list: List change files
- changes-read: Read individual change files

### Modified Capabilities

- mcp-server: Add changes resource handlers
