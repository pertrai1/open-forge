# OpenSpec MCP Server

An MCP (Model Context Protocol) server that exposes OpenSpec specification archives as resources, tools, and prompts for AI assistants. This server enables progressive disclosure of specifications — letting agents discover, search, and read specs without loading everything into context upfront.

## Features

- **Resources**: Browse and read specs via `spec://` and `changes://` URIs
- **Tools**: Search specs, extract requirements, and get scenarios
- **Prompts**: Pre-built prompts for understanding and comparing specs
- **Progressive Disclosure**: Load only what you need, when you need it

## Installation

### From npm (when published)

```bash
npm install -g openspec-mcp
```

### From source

```bash
git clone https://github.com/ohmyopencode/openspec-mcp.git
cd openspec-mcp
npm install
npm run build
npm link  # Makes 'openspec-mcp' available globally
```

## Configuration

### Claude Desktop

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openspec": {
      "command": "node",
      "args": ["/path/to/openspec-mcp/dist/index.js"]
    }
  }
}
```

If installed globally via npm:

```json
{
  "mcpServers": {
    "openspec": {
      "command": "openspec-mcp"
    }
  }
}
```

After updating the configuration, restart Claude Desktop.

### Path Configuration

The server reads specs from the `./openspec/` directory relative to where the server is started. The expected structure is:

```
your-project/
├── openspec/
│   ├── specs/
│   │   ├── feature-a/
│   │   │   └── spec.md
│   │   └── feature-b/
│   │       └── spec.md
│   └── changes/
│       └── ...
└── ...
```

Each spec folder should contain a `spec.md` file with the OpenSpec format:

```markdown
## Purpose

Brief description of what this spec is about.

## Requirements

### Requirement: Feature name
The system SHALL...

#### Scenario: Scenario name
- **WHEN** condition
- **THEN** expected outcome
```

## API Reference

### Resources

#### `spec://list` (via `resources/list`)

List all available specifications.

**Returns**:
```json
{
  "resources": [
    {
      "uri": "spec://bash-tool",
      "name": "bash-tool",
      "description": "Shell command execution tool...",
      "mimeType": "text/markdown"
    }
  ]
}
```

#### `spec://{name}` (via `resources/read`)

Read the full content of a specification.

**Parameters**:
- `uri`: `spec://bash-tool`

**Returns**:
```json
{
  "contents": [
    {
      "uri": "spec://bash-tool",
      "mimeType": "text/markdown",
      "text": "## Purpose\n\nShell command execution..."
    }
  ]
}
```

#### `changes://list` (via `resources/list`)

List all change records.

**Returns**:
```json
{
  "changes": [
    {
      "name": "2025-03-28-add-feature",
      "uri": "changes://2025-03-28-add-feature",
      "timestamp": "2025-03-28T14:22:00Z",
      "file": "openspec/changes/2025-03-28-add-feature.md"
    }
  ],
  "total": 3
}
```

#### `changes://{name}` (via `resources/read`)

Read a specific change record.

### Tools

#### `search_specs`

Search across spec names and purpose sections.

**Parameters**:
- `query` (string, required): Search term

**Returns**:
```json
{
  "results": [
    {
      "uri": "spec://bash-tool",
      "name": "bash-tool",
      "description": "Shell command execution tool...",
      "matchType": "name"
    }
  ],
  "query": "bash",
  "total": 1
}
```

#### `get_requirements`

Extract just the Requirements section from a spec.

**Parameters**:
- `spec_name` (string, required): Name of the spec (e.g., "bash-tool")

**Returns**:
```json
{
  "specName": "bash-tool",
  "requirements": [
    {
      "id": "bash-tool-definition",
      "title": "Bash tool definition",
      "content": "The system SHALL register a `bash` tool..."
    }
  ],
  "raw": "### Requirement: Bash tool definition\n..."
}
```

#### `get_scenarios`

Extract scenarios from a spec.

**Parameters**:
- `spec_name` (string, required): Name of the spec

**Returns**:
```json
{
  "specName": "bash-tool",
  "scenarios": [
    {
      "name": "Bash tool is registered",
      "when": "`createToolRegistry()` is called",
      "outcome": "the registry contains a tool named `\"bash\"`",
      "raw": "#### Scenario: Bash tool is registered\n..."
    }
  ],
  "total": 5
}
```

### Prompts

#### `understand_spec`

Generate a prompt for understanding a specification.

**Arguments**:
- `spec_name` (string, required): Name of the spec to understand

**Returns**: A prompt asking the AI to explain the spec, its requirements, and how to test it.

#### `compare_specs`

Generate a prompt for comparing two specifications.

**Arguments**:
- `spec_a` (string, required): First spec to compare
- `spec_b` (string, required): Second spec to compare

**Returns**: A prompt asking the AI to compare the specs, identifying overlaps, dependencies, and differences.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Commands

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode for development
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code style
npm run lint:fix     # Fix lint issues
npm run format       # Format code
npm run typecheck    # Type check without emitting
npm run check        # Full check: lint + typecheck + test + build
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens an interactive UI to test resources, tools, and prompts.

## Architecture

```
src/
├── index.ts              # Entry point, stdio transport
├── server.ts             # MCP server with all handlers
├── config.ts             # Path resolution for ./openspec/
├── specs/
│   ├── reader.ts         # Read specs directory
│   ├── file-reader.ts    # Read individual spec.md files
│   ├── uri-parser.ts     # Parse spec:// URIs
│   ├── searcher.ts       # Search across specs
│   ├── purpose-extractor.ts
│   └── extractors/
│       ├── requirements.ts
│       └── scenarios.ts
├── changes/
│   └── reader.ts         # Read changes directory
├── handlers/
│   ├── resources-list.ts
│   ├── resources-read.ts
│   ├── changes-list.ts
│   └── changes-read.ts
├── tools/
│   ├── search-specs/
│   ├── get-requirements/
│   └── get-scenarios/
└── prompts/
    ├── index.ts
    └── list.ts
```

## License

MIT

## Progress

See [ROADMAP.md](ROADMAP.md) for implementation status.
