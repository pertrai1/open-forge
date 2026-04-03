export const getRequirementsTool = {
  name: 'get_requirements',
  description: 'Extract the Requirements section from a spec',
  inputSchema: {
    type: 'object',
    properties: {
      spec_name: {
        type: 'string',
        description: 'Name of the spec (e.g., "bash-tool")',
      },
    },
    required: ['spec_name'],
  },
};
