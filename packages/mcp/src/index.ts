#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './create-server.js';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  try {
    await server.connect(transport);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
