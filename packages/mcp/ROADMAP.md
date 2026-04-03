# Specdex MCP Server - Implementation Roadmap

## Overview

This roadmap breaks down the REQUIREMENTS.md into atomic, self-contained tasks that can be executed independently or in parallel by multiple subagents.

**Tech Stack**: TypeScript / NodeJS
**Interface**: MCP Server (stdio transport)
**Architecture**: MCP server exposing OpenSpec archives as Resources, Tools, and Prompts

**Key Decisions (VASEA Clarified)**:
- **Path Config**: Archive path is always `./openspec/` relative to project root (after `openspec init`)
- **Testing**: Tests required for each phase
- **Output Format**: Structured JSON for all tools
- **Scope**: "Going Further" items are Phase 10 (optional)

---

## Phase 0: Project Foundation

**Goal**: Establish the development environment, project structure, and testing infrastructure.

### Tasks

- [x] 0.1 Initialize NodeJS project with `package.json` [deps: None] [deliverable: `package.json` with TypeScript, MCP SDK, testing deps]
- [x] 0.2 Configure TypeScript (`tsconfig.json`) [deps: None] [deliverable: `tsconfig.json` with strict mode, ESM support]
- [x] 0.3 Set up testing framework (Vitest) [deps: 0.1] [deliverable: `vitest.config.ts` + sample passing test]
- [x] 0.4 Create project directory structure [deps: None] [deliverable: `src/`, `tests/` directories]
- [x] 0.5 Add linter/formatter (ESLint + Prettier) [deps: None] [deliverable: `.eslintrc.js`, `.prettierrc`]
- [x] 0.6 Install MCP TypeScript SDK [deps: 0.1] [deliverable: `@modelcontextprotocol/sdk` in dependencies]

**Parallel Groups**:

- Group A: 0.1, 0.2, 0.4, 0.5 (all independent)
- Group B: 0.3, 0.6 (requires 0.1)

---

## Phase 1: Basic MCP Server

**Goal**: Create a basic MCP server that starts up, responds to `initialize`, and declares capabilities.

### Tasks

- [x] 1.1 Create server entry point [deps: 0.6] [deliverable: `src/index.ts`]
- [x] 1.2 Create MCP server instance with name `specdex` and version `0.1.0` [deps: 1.1] [deliverable: `src/server.ts`]
- [x] 1.3 Register `resources` capability [deps: 1.2] [deliverable: capability registration in `src/server.ts`]
- [x] 1.4 Configure stdio transport [deps: 1.3] [deliverable: stdio transport setup in `src/index.ts`]
- [x] 1.5 Add npm `bin` entry for CLI execution [deps: 1.4] [deliverable: `bin` field in `package.json`]
- [x] 1.6 Write tests for server initialization [deps: 1.4] [deliverable: `tests/server.test.ts`]

**Parallel Groups**:

- Group A: 1.1 (independent)
- Group B: 1.2, 1.3, 1.4 (sequential)
- Group C: 1.5 (requires 1.4)
- Group D: 1.6 (requires 1.4)

---

## Phase 2: Resources - List Specs

**Goal**: Implement `resources/list` handler to expose all specs as MCP resources.

### Tasks

- [x] 2.1 Create config module for openspec path resolution [deps: 0.4] [deliverable: `src/config.ts` - resolves `./openspec/` path]
- [x] 2.2 Create spec directory reader utility [deps: 2.1] [deliverable: `src/specs/reader.ts` - reads `openspec/specs/` directory]
- [x] 2.3 Create purpose extractor utility [deps: 2.2] [deliverable: `src/specs/purpose-extractor.ts` - extracts first paragraph from Purpose section]
- [x] 2.4 Implement `resources/list` handler [deps: 2.2, 2.3] [deliverable: `src/handlers/resources-list.ts`]
- [x] 2.5 Wire handler to server [deps: 2.4, 1.3] [deliverable: handler registration in `src/server.ts`]
- [x] 2.6 Write tests for resources/list [deps: 2.5] [deliverable: `tests/resources-list.test.ts`]

**Parallel Groups**:

- Group A: 2.1, 2.2 (2.2 depends on 2.1)
- Group B: 2.3 (can start after 2.2)
- Group C: 2.4, 2.5 (sequential, depends on 2.2, 2.3)
- Group D: 2.6 (requires 2.5)

**Output Format (resources/list)**:
```json
{
  "resources": [
    {
      "uri": "spec://bash-tool",
      "name": "bash-tool",
      "description": "Shell command execution tool for the AI coding agent...",
      "mimeType": "text/markdown"
    }
  ]
}
```

---

## Phase 3: Resources - Read Spec

**Goal**: Implement `resources/read` handler to return full spec content.

### Tasks

- [x] 3.1 Create URI parser utility [deps: 0.4] [deliverable: `src/specs/uri-parser.ts` - parses `spec://name` format]
- [x] 3.2 Create spec file reader [deps: 2.1] [deliverable: `src/specs/file-reader.ts` - reads `openspec/specs/{name}/spec.md`]
- [x] 3.3 Implement `resources/read` handler [deps: 3.1, 3.2] [deliverable: `src/handlers/resources-read.ts`]
- [x] 3.4 Add error handling for missing specs [deps: 3.3] [deliverable: error response in `src/handlers/resources-read.ts`]
- [x] 3.5 Wire handler to server [deps: 3.4, 2.5] [deliverable: handler registration in `src/server.ts`]
- [x] 3.6 Write tests for resources/read [deps: 3.5] [deliverable: `tests/resources-read.test.ts`]

**Parallel Groups**:

- Group A: 3.1, 3.2 (independent)
- Group B: 3.3, 3.4 (sequential, depends on Group A)
- Group C: 3.5 (depends on 3.4)
- Group D: 3.6 (depends on 3.5)

**Output Format (resources/read)**:
```json
{
  "contents": [
    {
      "uri": "spec://bash-tool",
      "mimeType": "text/markdown",
      "text": "## Purpose\n\nShell command execution..."
    }
  ]
}
```

**Error Format**:
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Spec not found: nonexistent"
    }
  ]
}
```

---

## Phase 4: Tool - Search Specs

**Goal**: Implement `search_specs` tool for discovering relevant specs.

### Tasks

- [x] 4.1 Define tool schema [deps: 0.4] [deliverable: `src/tools/search-specs/schema.ts` - input/output types]
- [x] 4.2 Create search utility [deps: 2.2] [deliverable: `src/specs/searcher.ts` - searches names and purpose sections]
- [x] 4.3 Implement `search_specs` tool handler [deps: 4.1, 4.2] [deliverable: `src/tools/search-specs/handler.ts`]
- [x] 4.4 Register tool with server [deps: 4.3, 1.3] [deliverable: tool registration in `src/server.ts`]
- [x] 4.5 Write tests for search_specs [deps: 4.4] [deliverable: `tests/tools/search-specs.test.ts`]

**Parallel Groups**:

- Group A: 4.1, 4.2 (independent)
- Group B: 4.3 (depends on Group A)
- Group C: 4.4 (depends on 4.3)
- Group D: 4.5 (depends on 4.4)

**Output Format**:
```json
{
  "results": [
    {
      "uri": "spec://bash-tool",
      "name": "bash-tool",
      "description": "Shell command execution tool...",
      "matchType": "name"
    }
  ],
  "query": "bash",
  "total": 1
}
```

---

## Phase 5: Tool - Get Requirements

**Goal**: Implement `get_requirements` tool to extract just the Requirements section.

### Tasks

- [x] 5.1 Define tool schema [deps: 0.4] [deliverable: `src/tools/get-requirements/schema.ts`]
- [x] 5.2 Create requirements extractor [deps: 3.2] [deliverable: `src/specs/extractors/requirements.ts` - parses `## Requirements` section]
- [x] 5.3 Implement `get_requirements` tool handler [deps: 5.1, 5.2] [deliverable: `src/tools/get-requirements/handler.ts`]
- [x] 5.4 Register tool with server [deps: 5.3] [deliverable: tool registration in `src/server.ts`]
- [x] 5.5 Write tests for get_requirements [deps: 5.4] [deliverable: `tests/tools/get-requirements.test.ts`]

**Parallel Groups**:

- Group A: 5.1, 5.2 (independent)
- Group B: 5.3 (depends on Group A)
- Group C: 5.4, 5.5 (sequential)

**Output Format**:
```json
{
  "specName": "bash-tool",
  "requirements": [
    {
      "id": "bash-tool-definition",
      "title": "Bash tool definition",
      "content": "The system SHALL register a `bash` tool..."
    }
  ],
  "raw": "### Requirement: Bash tool definition\n..."
}
```

---

## Phase 6: Tool - Get Scenarios

**Goal**: Implement `get_scenarios` tool to extract scenarios from a spec.

### Tasks

- [x] 6.1 Define tool schema [deps: 0.4] [deliverable: `src/tools/get-scenarios/schema.ts`]
- [x] 6.2 Create scenarios extractor [deps: 3.2] [deliverable: `src/specs/extractors/scenarios.ts` - parses `#### Scenario:` entries]
- [x] 6.3 Implement `get_scenarios` tool handler [deps: 6.1, 6.2] [deliverable: `src/tools/get-scenarios/handler.ts`]
- [x] 6.4 Register tool with server [deps: 6.3] [deliverable: tool registration in `src/server.ts`]
- [x] 6.5 Write tests for get_scenarios [deps: 6.4] [deliverable: `tests/tools/get-scenarios.test.ts`]

**Parallel Groups**:

- Group A: 6.1, 6.2 (independent)
- Group B: 6.3 (depends on Group A)
- Group C: 6.4, 6.5 (sequential)

**Output Format**:
```json
{
  "specName": "bash-tool",
  "scenarios": [
    {
      "name": "Bash tool is registered in the tool registry",
      "when": "`createToolRegistry()` is called",
      "then": "the registry contains a tool named `\"bash\"`...",
      "raw": "#### Scenario: Bash tool is registered...\n..."
    }
  ],
  "total": 5
}
```

---

## Phase 7: Resources - Changes

**Goal**: Expose the `openspec/changes/` directory as a resource.

### Tasks

- [x] 7.1 Create changes directory reader [deps: 2.1] [deliverable: `src/changes/reader.ts`]
- [x] 7.2 Implement `changes://list` resource handler [deps: 7.1] [deliverable: `src/handlers/changes-list.ts`]
- [x] 7.3 Implement `changes://{name}` resource handler (optional) [deps: 7.1] [deliverable: `src/handlers/changes-read.ts`]
- [x] 7.4 Wire handlers to server [deps: 7.2, 7.3] [deliverable: handler registrations in `src/server.ts`]
- [x] 7.5 Write tests for changes resources [deps: 7.4] [deliverable: `tests/changes.test.ts`]

**Parallel Groups**:

- Group A: 7.1 (independent)
- Group B: 7.2, 7.3 (can run in parallel after 7.1)
- Group C: 7.4 (depends on Group B)
- Group D: 7.5 (depends on 7.4)

**Output Format (changes://list)**:
```json
{
  "changes": [
    {
      "name": "2025-03-28-add-memory-store",
      "uri": "changes://2025-03-28-add-memory-store",
      "timestamp": "2025-03-28T14:22:00Z",
      "file": "openspec/changes/2025-03-28-add-memory-store.md"
    }
  ],
  "total": 3
}
```

---

## Phase 8: Prompts

**Goal**: Implement MCP prompts for common spec workflows.

### Tasks

- [x] 8.1 Define prompt schemas [deps: 0.4] [deliverable: `src/prompts/schemas.ts`]
- [x] 8.2 Implement `understand_spec` prompt [deps: 8.1, 3.2] [deliverable: `src/prompts/understand-spec.ts`]
- [x] 8.3 Implement `compare_specs` prompt [deps: 8.1, 3.2] [deliverable: `src/prompts/compare-specs.ts`]
- [x] 8.4 Register prompts with server [deps: 8.2, 8.3] [deliverable: prompt registrations in `src/server.ts`]
- [x] 8.5 Write tests for prompts [deps: 8.4] [deliverable: `tests/prompts.test.ts`]

**Parallel Groups**:

- Group A: 8.1 (independent)
- Group B: 8.2, 8.3 (can run in parallel after 8.1)
- Group C: 8.4 (depends on Group B)
- Group D: 8.5 (depends on 8.4)

**Output Format (understand_spec)**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Explain the following spec, what requirements it defines, and how to test against it:\n\n## Purpose\n...\n\n## Requirements\n..."
      }
    }
  ]
}
```

---

## Phase 9: Packaging & Documentation

**Goal**: Package the server for distribution and document usage.

### Tasks

- [x] 9.1 Update `package.json` with complete metadata [deps: 1.5] [deliverable: name, version, description, bin, keywords]
- [x] 9.2 Create `README.md` with installation instructions [deps: 9.1] [deliverable: `README.md`]
- [x] 9.3 Add Claude Desktop configuration example [deps: 9.2] [deliverable: config snippet in README]
- [x] 9.4 Document all resources, tools, and prompts [deps: 9.2] [deliverable: API documentation in README]
- [x] 9.5 Add path configuration documentation [deps: 9.2] [deliverable: configuration section in README]
- [x] 9.6 Verify installation in Claude Desktop [deps: 9.3] [deliverable: manual test confirmation]

**Parallel Groups**:

- Group A: 9.1 (independent)
- Group B: 9.2, 9.3, 9.4, 9.5 (can start after 9.1, run in parallel)
- Group C: 9.6 (depends on 9.3)

---

## Phase 10: Extensions (Optional)

**Goal**: Add advanced features for enhanced functionality.

### Tasks

- [ ] 10.1 Implement `find_related` tool [deps: 4.4] [deliverable: `src/tools/find-related/`]
- [ ] 10.2 Implement `search_by_tag` tool [deps: 4.4] [deliverable: `src/tools/search-by-tag/`]
- [ ] 10.3 Implement `validate_spec` tool [deps: 3.2] [deliverable: `src/tools/validate-spec/`]
- [ ] 10.4 Add `changes://summary` resource [deps: 7.4] [deliverable: `src/handlers/changes-summary.ts`]
- [ ] 10.5 Implement multi-archive support [deps: 2.1] [deliverable: updated `src/config.ts`]
- [ ] 10.6 Add search caching/indexing [deps: 4.4] [deliverable: `src/specs/cache.ts`]
- [ ] 10.7 Implement MCP sampling for AI suggestions [deps: 1.3] [deliverable: sampling integration]

---

## Dependency Graph Summary

```
Phase 0 (Foundation)
    │
    ├──→ Phase 1 (Basic Server)
    │         │
    │         ├──→ Phase 2 (Resources/List)
    │         │         │
    │         │         ├──→ Phase 3 (Resources/Read)
    │         │         │         │
    │         │         │         ├──→ Phase 5 (Get Requirements)
    │         │         │         │
    │         │         │         └──→ Phase 6 (Get Scenarios)
    │         │         │
    │         │         └──→ Phase 4 (Search Specs)
    │         │
    │         └──→ Phase 7 (Changes)
    │                   │
    │                   └──→ Phase 8 (Prompts)
    │
    └──→ Phase 9 (Packaging)
              │
              └──→ Phase 10 (Extensions - Optional)
```

---

## Parallel Execution Strategy

| Phase | Max Parallel Agents | Tasks for Parallel Execution |
| ----- | ------------------- | ---------------------------- |
| 0     | 4                   | 0.1, 0.2, 0.4, 0.5           |
| 1     | 2                   | 1.1, (1.2-1.4 sequential)    |
| 2     | 2                   | 2.1→2.2, 2.3                 |
| 3     | 2                   | 3.1, 3.2                     |
| 4     | 2                   | 4.1, 4.2                     |
| 5     | 2                   | 5.1, 5.2                     |
| 6     | 2                   | 6.1, 6.2                     |
| 7     | 2                   | 7.2, 7.3                     |
| 8     | 2                   | 8.2, 8.3                     |
| 9     | 4                   | 9.2, 9.3, 9.4, 9.5           |

---

## File Structure Reference

```
openspec-mcp/
├── src/
│   ├── index.ts                    # Entry point, stdio transport
│   ├── server.ts                   # MCP server instance, capability registration
│   ├── config.ts                   # Path resolution for ./openspec/
│   ├── specs/
│   │   ├── reader.ts               # Read specs directory
│   │   ├── file-reader.ts          # Read individual spec.md files
│   │   ├── uri-parser.ts           # Parse spec:// URIs
│   │   ├── searcher.ts             # Search across specs
│   │   ├── purpose-extractor.ts    # Extract Purpose section
│   │   └── extractors/
│   │       ├── requirements.ts     # Extract Requirements section
│   │       └── scenarios.ts        # Extract Scenarios
│   ├── changes/
│   │   └── reader.ts               # Read changes directory
│   ├── handlers/
│   │   ├── resources-list.ts       # resources/list handler
│   │   ├── resources-read.ts       # resources/read handler
│   │   ├── changes-list.ts         # changes://list handler
│   │   └── changes-read.ts         # changes://{name} handler
│   ├── tools/
│   │   ├── search-specs/
│   │   │   ├── schema.ts
│   │   │   └── handler.ts
│   │   ├── get-requirements/
│   │   │   ├── schema.ts
│   │   │   └── handler.ts
│   │   └── get-scenarios/
│   │       ├── schema.ts
│   │       └── handler.ts
│   └── prompts/
│       ├── schemas.ts
│       ├── understand-spec.ts
│       └── compare-specs.ts
├── tests/
│   ├── server.test.ts
│   ├── resources-list.test.ts
│   ├── resources-read.test.ts
│   ├── changes.test.ts
│   ├── tools/
│   │   ├── search-specs.test.ts
│   │   ├── get-requirements.test.ts
│   │   └── get-scenarios.test.ts
│   └── prompts.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.js
├── .prettierrc
├── README.md
├── REQUIREMENTS.md
└── ROADMAP.md
```

---

## Edge Cases to Handle

| Edge Case | Handler | Response |
|-----------|---------|----------|
| Spec folder exists but no `spec.md` | resources/read | Error: "Spec file not found: {name}" |
| Purpose section missing | resources/list | Description: "No description available" |
| Changes directory empty | changes://list | Empty array: `{"changes": [], "total": 0}` |
| Empty search query | search_specs | Error: "Query parameter required" |
| Spec name with path traversal | resources/read | Error: "Invalid spec name" |
| Requirements section missing | get_requirements | Empty array: `{"requirements": []}` |
| Scenarios section missing | get_scenarios | Empty array: `{"scenarios": []}` |

---

## Estimated Effort

| Phase | Tasks | Complexity | Estimated Time |
| ----- | ----- | ---------- | -------------- |
| 0     | 6     | Low        | 1-2 hours      |
| 1     | 6     | Low        | 2-3 hours      |
| 2     | 6     | Medium     | 2-3 hours      |
| 3     | 6     | Medium     | 2-3 hours      |
| 4     | 5     | Medium     | 2-3 hours      |
| 5     | 5     | Medium     | 1-2 hours      |
| 6     | 5     | Medium     | 1-2 hours      |
| 7     | 5     | Low        | 1-2 hours      |
| 8     | 5     | Medium     | 2-3 hours      |
| 9     | 6     | Low        | 1-2 hours      |

**Total Estimated Time**: 15-23 hours (core phases 0-9)

---

## Notes for Subagents

1. **Each task is atomic** - A single subagent can complete it independently
2. **Check dependencies** - Ensure prerequisite tasks are complete before starting
3. **Follow existing patterns** - Look at similar files in the same directory for style
4. **Write tests** - Each phase should include relevant tests
5. **Use structured JSON** - All tool outputs must be valid JSON with documented schemas
6. **Handle edge cases** - Empty directories, missing sections, invalid inputs
7. **Path resolution** - Always resolve paths relative to `./openspec/` in project root
