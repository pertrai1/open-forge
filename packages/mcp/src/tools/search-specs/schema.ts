export const searchSpecsTool = {
  name: 'search_specs',
  description: 'Search spec names and purpose sections for matching text',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string',
      },
    },
    required: ['query'],
  },
};
