import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createResourcesListHandler } from './handlers/resources-list.js';
import { createResourcesReadHandler } from './handlers/resources-read.js';

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
  server.setRequestHandler(ReadResourceRequestSchema, createResourcesReadHandler());

  return server;
}
