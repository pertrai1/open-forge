# Proposal: Phase 4 - Tool - Search Specs

## Why

Clients need to discover which specs are relevant without reading all of them. Search allows finding specs by name or content.

## What Changes

- src/tools/search-specs/: Tool schema and handler
- src/specs/searcher.ts: Search implementation
- src/server.ts: Register tool

## Capabilities

### New Capabilities

- search-specs: Search across spec names and descriptions

### Modified Capabilities

- mcp-server: Add tools capability and search_specs tool
