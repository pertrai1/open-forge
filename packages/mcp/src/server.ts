import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema, ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createResourcesListHandler } from './handlers/resources-list.js';
import { createResourcesReadHandler } from './handlers/resources-read.js';
import { searchSpecsTool } from './tools/search-specs/schema.js';
import { handleSearchSpecs } from './tools/search-specs/handler.js';
import { getRequirementsTool } from './tools/get-requirements/schema.js';
import { handleGetRequirements } from './tools/get-requirements/handler.js';

export function createServer(): Server {
  const server = new Server(
    {
      name: 'specdex',
      version: '0.1.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListResourcesRequestSchema, createResourcesListHandler());
  server.setRequestHandler(ReadResourceRequestSchema, createResourcesReadHandler());

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [searchSpecsTool, getRequirementsTool],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'search_specs') {
      return handleSearchSpecs(request.params.arguments as { query: string });
    }
    if (request.params.name === 'get_requirements') {
      return handleGetRequirements(request.params.arguments as { spec_name: string });
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}
