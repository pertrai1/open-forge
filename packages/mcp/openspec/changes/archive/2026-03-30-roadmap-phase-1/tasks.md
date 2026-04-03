# Implementation Tasks

## 1. Server Instance

- [ ] 1.1 Create `src/server.ts` with `createServer()` factory function
- [ ] 1.2 Configure server with name `specdex` and version `0.1.0`
- [ ] 1.3 Register `resources` capability

## 2. Entry Point

- [ ] 2.1 Update `src/index.ts` with shebang `#!/usr/bin/env node`
- [ ] 2.2 Import StdioServerTransport from MCP SDK
- [ ] 2.3 Import and call `createServer()`
- [ ] 2.4 Connect server to stdio transport
- [ ] 2.5 Add error handling for startup failures

## 3. Package Configuration

- [ ] 3.1 Add `bin` field to package.json pointing to `./dist/index.js`
- [ ] 3.2 Verify build output includes shebang

## 4. Testing

- [ ] 4.1 Create `tests/server.test.ts`
- [ ] 4.2 Test: `createServer()` returns a server instance
- [ ] 4.3 Test: Server has correct name and version
- [ ] 4.4 Test: Resources capability is registered
- [ ] 4.5 Test: Server can connect to transport

## 5. Verification

- [ ] 5.1 Run `npm run build` successfully
- [ ] 5.2 Run `npm run test` successfully
- [ ] 5.3 Run `npm run check` successfully
