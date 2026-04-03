# Design: Phase 1 - Basic MCP Server

## Context

Phase 0 established the project foundation. Now we need to implement the core MCP server that will serve OpenSpec archives. The server uses the Model Context Protocol (MCP) TypeScript SDK to handle protocol communication.

Current state:

- TypeScript project with build/test infrastructure
- MCP SDK installed as dependency
- No server implementation yet

## Goals / Non-Goals

**Goals:**

- Create a functional MCP server that starts and responds to initialize
- Register the `resources` capability
- Enable CLI execution via npm bin
- Establish patterns for future capability additions

**Non-Goals:**

- Implementing actual resource handlers (Phase 2)
- Adding tools or prompts (Phases 4-8)
- Advanced server features (logging, error recovery)

## Decisions

### 1. Server Architecture

**Decision:** Separate server instance (`server.ts`) from entry point (`index.ts`).

**Rationale:**

- `server.ts`: Creates and configures the MCP server instance
- `index.ts`: Handles transport and startup
- Enables testing server configuration independently of transport
- Follows separation of concerns

**Alternative considered:** Single file with everything

- Rejected: Harder to test and maintain

### 2. Transport Selection

**Decision:** Use stdio transport exclusively.

**Rationale:**

- MCP servers typically run as CLI tools
- stdio is the simplest transport for local development
- Claude Desktop and other MCP clients expect stdio
- No need for HTTP/WebSocket complexity

**Alternative considered:** Support multiple transports

- Rejected: YAGNI - stdio sufficient for all planned use cases

### 3. Capability Registration

**Decision:** Register only `resources` capability initially.

**Rationale:**

- Resources are the first feature (Phase 2)
- Tools and prompts come in later phases
- Can add capabilities incrementally

**Alternative considered:** Register all capabilities upfront

- Rejected: Misleading to advertise capabilities that don't exist yet

### 4. Server Name and Version

**Decision:** Server name: `specdex`, version: `0.1.0`.

**Rationale:**

- Name reflects purpose (spec index/dex)
- Version indicates early development
- Matches package.json version

## Technical Approach

### File Structure

```
src/
├── index.ts       # Entry point, stdio transport
└── server.ts      # MCP server instance, capability registration
```

### server.ts

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export function createServer(): Server {
  return new Server(
    { name: 'specdex', version: '0.1.0' },
    { capabilities: { resources: {} } }
  );
}
```

### index.ts

```typescript
#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

### package.json bin field

```json
{
  "bin": {
    "openspec-mcp": "./dist/index.js"
  }
}
```

## Risks / Trade-offs

### Risk: SDK API changes

**Risk:** MCP SDK is relatively new, API might change.
**Mitigation:** Pin SDK version in package.json. Monitor SDK releases.

### Risk: Error handling gaps

**Risk:** Minimal error handling in this phase might cause issues.
**Mitigation:** Add comprehensive error handling in Phase 2 when implementing handlers.

## Migration Plan

Not applicable - new functionality.

## Open Questions

None. Architecture is straightforward for basic MCP server.
