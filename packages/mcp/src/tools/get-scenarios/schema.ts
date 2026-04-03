export const getScenariosTool = {
  name: 'get_scenarios',
  description: 'Extract scenarios from a spec',
  inputSchema: {
    type: 'object',
    properties: {
      spec_name: {
        type: 'string',
        description: 'Name of the spec',
      },
    },
    required: ['spec_name'],
  },
};
