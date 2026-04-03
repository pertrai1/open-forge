# Design: Phase 3 - Resources - Read Spec

## Decisions
1. URI Parser: Extract spec name from spec://name format
2. File Reader: Read openspec/specs/{name}/spec.md
3. Error Handling: Return MCP error for missing specs

## Technical Approach
- Parse URI with regex: /^spec:\/\/(.+)$/
- Read file with fs/promises
- Return content with mimeType text/markdown
