# Design: Phase 8 - Prompts

## Decisions

1. Two prompts: understand_spec and compare_specs
2. Prompts include inline spec content
3. Use MCP prompt format with messages array

## Technical Approach

- Prompts return message arrays
- Include spec content inline in prompt
- Support parameterized prompts
