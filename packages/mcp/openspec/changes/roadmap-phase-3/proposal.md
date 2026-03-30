# Proposal: Phase 3 - Resources - Read Spec

## Why
Phase 2 lists available specs but clients cannot read their content. This phase implements resources/read to return full spec content.

## What Changes
- src/specs/uri-parser.ts: Parse spec:// URIs
- src/specs/file-reader.ts: Read spec.md files
- src/handlers/resources-read.ts: MCP resources/read handler
- src/server.ts: Register handler

## Capabilities
### New Capabilities
- resources-read: Read individual spec content

### Modified Capabilities
- mcp-server: Add resources/read handler
