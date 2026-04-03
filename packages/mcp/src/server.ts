import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema, ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createResourcesListHandler } from './handlers/resources-list.js';
import { createResourcesReadHandler } from './handlers/resources-read.js';
import { searchSpecsTool } from './tools/search-specs/schema.js';
import { handleSearchSpecs } from './tools/search-specs/handler.js';
import { getRequirementsTool } from './tools/get-requirements/schema.js';
import { handleGetRequirements } from './tools/get-requirements/handler.js';
import { getScenariosTool } from './tools/get-scenarios/schema.js';
import { handleGetScenarios } from './tools/get-scenarios/handler.js';
import { handleChangesList } from './handlers/changes-list.js';
import { handleChangesRead } from './handlers/changes-read.js';

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

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const specResources = await createResourcesListHandler()();
    const changesResources = await handleChangesList();

    return {
      resources: [
        ...specResources.resources,
        ...changesResources.changes.map((change) => ({
          uri: change.uri,
          name: change.name,
          description: `Change: ${change.name}`,
          mimeType: 'text/markdown',
        })),
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri.startsWith('changes://')) {
      const name = uri.replace('changes://', '');
      return handleChangesRead(name);
    }

    return createResourcesReadHandler()(request);
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [searchSpecsTool, getRequirementsTool, getScenariosTool],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'search_specs') {
      return handleSearchSpecs(request.params.arguments as { query: string });
    }
    if (request.params.name === 'get_requirements') {
      return handleGetRequirements(request.params.arguments as { spec_name: string });
    }
    if (request.params.name === 'get_scenarios') {
      return handleGetScenarios(request.params.arguments as { spec_name: string });
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}
