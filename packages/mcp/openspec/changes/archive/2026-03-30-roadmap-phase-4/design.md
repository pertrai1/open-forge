# Design: Phase 4 - Tool - Search Specs

## Decisions
1. Search both spec names and Purpose sections
2. Case-insensitive matching
3. Return structured results with match type

## Technical Approach
- MCP tool with query parameter
- Search via string.includes() for simplicity
- Return array of results with URI, name, description, matchType
