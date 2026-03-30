import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export function createServer(): Server {
  const server = new Server(
    {
      name: 'specdex',
      version: '0.1.0',
    },
    {
      capabilities: {
        resources: {},
      },
    },
  );

  return server;
}
