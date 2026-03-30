# Design: Phase 7 - Resources - Changes

## Decisions
1. Use changes:// URI scheme
2. List changes with timestamps
3. Read individual change files

## Technical Approach
- Read openspec/changes/ directory (excluding archive/)
- Return list with name, uri, timestamp
- Support reading individual files via changes://{name}
