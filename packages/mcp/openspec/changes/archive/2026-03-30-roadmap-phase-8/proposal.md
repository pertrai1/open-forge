# Proposal: Phase 8 - Prompts

## Why

MCP supports prompts as pre-built interaction patterns. Add prompts for common spec workflows.

## What Changes

- src/prompts/understand-spec.ts: Prompt for understanding a spec
- src/prompts/compare-specs.ts: Prompt for comparing two specs
- src/server.ts: Register prompts

## Capabilities

### New Capabilities

- understand_spec: Prompt to understand and explain a spec
- compare_specs: Prompt to compare two specs

### Modified Capabilities

- mcp-server: Add prompts capability
