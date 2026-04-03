# Open Forge

A TypeScript monorepo for open-forge packages.

## Packages

| Package                                     | Description                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@open-forge/pipeline`](packages/pipeline) | An OpenCode plugin that turns natural language requirements into a fully built application — autonomously, with minimal human intervention |
| [`@open-forge/mcp`](packages/mcp)           | MCP server implementation for OpenSpec archives                                                                                            |

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npx nx run-many -t build

# Run tests
npx nx run-many -t test

# Lint all projects
npx nx run-many -t lint

# Visualize the project graph
npx nx graph
```

## Useful Commands

```bash
npx nx graph                          # Interactive dependency graph
npx nx show project <name> --web      # View project details
npx nx run-many -t build              # Build all projects
npx nx run-many -t test --parallel=3  # Test in parallel
npx nx affected -t build              # Build only affected projects
npx nx release --dry-run              # Preview release changes
npx nx release                        # Create a new release
```

## Nx Cloud

This workspace is connected to [Nx Cloud](https://nx.dev/ci/intro/why-nx-cloud) for remote caching, distributed task execution, and self-healing CI.
