# Proposal: Phase 5 - Tool - Get Requirements

## Why
Agents often need just the Requirements section from a spec, not the full content. This saves context.

## What Changes
- src/tools/get-requirements/: Tool schema and handler
- src/specs/extractors/requirements.ts: Extract Requirements section
- src/server.ts: Register tool

## Capabilities
### New Capabilities
- get-requirements: Extract Requirements section from spec

### Modified Capabilities
- mcp-server: Add get_requirements tool
