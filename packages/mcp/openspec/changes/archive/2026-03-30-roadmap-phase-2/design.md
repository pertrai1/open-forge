# Design: Phase 2 - Resources - List Specs

## Context

Phase 1 created a basic MCP server. Now we need to implement the first real functionality: listing OpenSpec specifications as MCP resources.

Current state:

- Server running with resources capability declared
- No resource handlers implemented
- OpenSpec structure: `openspec/specs/{spec-name}/spec.md`

## Goals / Non-Goals

**Goals:**

- Read `openspec/specs/` directory to discover available specs
- Extract Purpose section from each spec for description
- Return resources in MCP-compliant format
- Handle edge cases (missing specs, missing Purpose sections)

**Non-Goals:**

- Reading full spec content (Phase 3)
- Searching specs (Phase 4)
- Caching or performance optimization

## Decisions

### 1. Path Resolution Strategy

**Decision:** Use `fileURLToPath` and `import.meta.url` to resolve project root.

**Rationale:**

- Works in ESM modules
- No dependency on `__dirname` (CommonJS)
- Reliable across different execution contexts

**Implementation:**

```typescript
const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const OPENSPEC_PATH = path.join(PROJECT_ROOT, '..', 'openspec');
```

### 2. Spec Directory Structure

**Decision:** Assume structure: `openspec/specs/{spec-name}/spec.md`

**Rationale:**

- Standard OpenSpec format
- Each spec is a folder with `spec.md` inside
- Folder name becomes resource name

### 3. Purpose Extraction

**Decision:** Extract first paragraph after `## Purpose` heading.

**Rationale:**

- Purpose section is always `## Purpose`
- First paragraph provides concise description
- Fallback to "No description available" if missing

**Implementation:**

```typescript
function extractPurpose(content: string): string | null {
  const match = content.match(/## Purpose\n\n([^\n]+)/);
  return match ? match[1] : null;
}
```

### 4. Resource URI Scheme

**Decision:** Use `spec://` URI scheme for specs.

**Rationale:**

- Clear namespacing
- Easy to parse
- MCP-compliant (custom schemes allowed)

**Format:** `spec://{spec-name}`

### 5. Error Handling

**Decision:** Return empty array on errors, don't throw.

**Rationale:**

- Graceful degradation
- Server stays responsive even if specs directory missing
- Logs errors for debugging

## Technical Approach

### File Structure

```
src/
├── config.ts                      # Path resolution
├── specs/
│   ├── reader.ts                  # Read specs directory
│   └── purpose-extractor.ts       # Extract Purpose section
└── handlers/
    └── resources-list.ts          # MCP handler
```

### Output Format

```json
{
  "resources": [
    {
      "uri": "spec://bash-tool",
      "name": "bash-tool",
      "description": "Shell command execution tool...",
      "mimeType": "text/markdown"
    }
  ]
}
```

## Risks / Trade-offs

### Risk: File system errors

**Risk:** Spec directory might not exist or have permission issues.
**Mitigation:** Try-catch around fs operations, return empty array on error.

### Risk: Malformed markdown

**Risk:** Specs might not have proper Purpose sections.
**Mitigation:** Fallback to "No description available" string.
