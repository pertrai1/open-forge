import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createResourcesListHandler } from './handlers/resources-list.js';

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

  server.setRequestHandler(ListResourcesRequestSchema, createResourcesListHandler());

  return server;
}
