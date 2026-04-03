import { describe, it, expect } from 'vitest';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '../src/create-server.js';

describe('MCP Server', () => {
  describe('createServer', () => {
    it('should return a server instance', () => {
      const server = createServer();
      expect(server).toBeDefined();
      expect(server.connect).toBeDefined();
    });
  });

  describe('server configuration', () => {
    it('should have resources capability', () => {
      const server = createServer();
      const capabilities = (
        server as unknown as { _capabilities: { resources?: unknown } }
      )._capabilities;
      expect(capabilities.resources).toBeDefined();
    });
  });

  describe('transport', () => {
    it('should be able to connect to transport', async () => {
      const server = createServer();
      const transport = new StdioServerTransport();

      await expect(server.connect(transport)).resolves.toBeUndefined();
    });
  });
});
