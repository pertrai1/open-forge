# Building Specdex: An MCP Server for OpenSpec Archives

You'll build an MCP (Model Context Protocol) server that exposes your OpenSpec specification archives as resources and tools for any MCP-compatible AI assistant. Your server will let agents discover, read, and search your spec files without loading everything into context upfront — demonstrating the "progressive disclosure" pattern that makes MCP efficient.

This is a learning project focused on understanding MCP architecture, the Tools/Resources/Prompts model, and how agents interact with external systems through standardized protocols.

## Step Zero

In this introductory step you're going to set your environment up ready to begin developing and testing your solution.

Choose a programming language with MCP SDK support. The official TypeScript SDK is the reference implementation, but Python is also well-supported. **Language selected**: TypeScript

You'll need a spec archive to work with. This server is designed for the OpenSpec format — markdown files with Purpose/Requirements/Scenarios structure. **Spec archive path**: `openspec/`

For testing, you'll verify your server works with an MCP client. The Claude desktop app is the easiest way to test, but you can also use the MCP inspector CLI tool.

**Resources to review before starting:**

- [MCP Documentation](https://modelcontextprotocol.io/)
- [TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Anthropic's Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) — explains why progressive disclosure matters

## Step 1

In this step your goal is to create a basic MCP server that starts up and reports its capabilities.

Your server should initialize the MCP protocol and declare that it supports resources. It doesn't need to expose any actual resources yet — just prove that the server can start, respond to the `initialize` request, and advertise resource capability.

Create a basic server entry point that:

- Creates an MCP server instance named `specdex`
- Declares version `0.1.0`
- Registers the `resources` capability
- Starts listening on stdio transport

**Testing guidance**: Run your server and verify it responds to an `initialize` request. You can use the MCP inspector (`npx @modelcontextprotocol/inspector`) to connect and see the server's declared capabilities. The server should appear as `specdex` with resources capability listed.

## Step 2

In this step your goal is to list available specs as resources.

Your server should read the `openspec/specs/` directory and expose each spec as an MCP resource. Each spec folder contains a `spec.md` file — these are your resource entries.

Implement the `resources/list` handler to return:

- A resource URI for each spec (e.g., `spec://bash-tool`)
- A name (the spec folder name, e.g., "bash-tool")
- A description extracted from the spec's Purpose section (first line/paragraph)
- A MIME type of `text/markdown`

You do not need to implement `resources/read` yet — just the listing.

**Testing guidance**: Use the MCP inspector to call `resources/list`. You should see 17+ resources, one for each spec in your archive. Verify the URIs follow the `spec://` scheme and names match the folder names.

## Step 3

In this step your goal is to implement resource reading.

Your server should handle `resources/read` requests to return the full content of a spec file.

Implement the `resources/read` handler to:

- Accept a URI like `spec://bash-tool`
- Resolve it to the file path `../ai-coding-agent/openspec/specs/bash-tool/spec.md`
- Return the file contents as text
- Handle missing specs gracefully with an error response

**Testing guidance**: Use the MCP inspector to call `resources/read` with `spec://bash-tool`. Verify you receive the full markdown content of the bash-tool spec. Try requesting a non-existent spec like `spec://nonexistent` and confirm you get an appropriate error.

## Step 4

In this step your goal is to add a `search_specs` tool.

Resources are great for reading known specs, but agents need a way to discover which specs are relevant. Add a tool that lets agents search across all specs.

Implement a `search_specs` tool that:

- Accepts a `query` string parameter
- Searches spec names and Purpose sections for matching text
- Returns a list of matching specs with their URIs and brief descriptions
- Supports case-insensitive matching
- Returns an empty list (not an error) when no matches found

**Testing guidance**: Call `search_specs` with query "file" — you should get `read-file-tool`, `write-file-tool`, `edit-file-tool`, and `glob-tool`. Try "bash" and verify `bash-tool` is returned. Try a nonsense query and verify an empty list is returned.

## Step 5

In this step your goal is to add a `get_requirements` tool.

Sometimes an agent doesn't need the full spec — just the requirements section. This demonstrates how MCP tools can provide filtered views of data, saving context.

Implement a `get_requirements` tool that:

- Accepts a `spec_name` parameter (e.g., "bash-tool")
- Parses the spec markdown to extract just the Requirements section
- Returns the requirements as formatted text
- Handles specs without a Requirements section gracefully

You can use simple string parsing (regex for `## Requirements` to `##` boundary) or a markdown parser.

**Testing guidance**: Call `get_requirements` for "bash-tool" and verify you get only the requirements section, not the Purpose or Scenarios. Compare the length of this output to the full spec — it should be significantly shorter.

## Step 6

In this step your goal is to add a `get_scenarios` tool.

Similar to requirements, agents may want just the scenarios for a spec — useful for understanding test cases without reading the full document.

Implement a `get_scenarios` tool that:

- Accepts a `spec_name` parameter
- Extracts all scenarios from the spec (lines starting with `#### Scenario:`)
- Returns scenarios as a structured list with scenario names and their descriptions
- Handles specs without scenarios gracefully

**Testing guidance**: Call `get_scenarios` for "bash-tool" and verify you get all scenario names and their When/Then blocks. Verify the output is more concise than the full spec.

## Step 7

In this step your goal is to expose the changes directory as a resource.

OpenSpec archives include a `changes/` directory tracking modifications. Expose this as a resource so agents can see recent activity.

Add a `changes://list` resource that:

- Reads the `openspec/changes/` directory
- Returns a listing of change files with timestamps
- Orders changes by most recent first
- Includes the change name and file path

Optionally, add `changes://{name}` to read individual change files.

**Testing guidance**: Use the MCP inspector to list resources and verify `changes://list` appears. Read it and verify you see the change history with timestamps.

## Step 8

In this step your goal is to add MCP prompts for common workflows.

Prompts are pre-built interaction patterns — templated starting points for agents. Add prompts that encapsulate common ways to work with specs.

Implement two prompts:

1. **`understand_spec`** — Takes a `spec_name` parameter and returns a prompt template that asks the agent to explain what the spec does, what requirements it defines, and how to test against it.

2. **`compare_specs`** — Takes `spec_a` and `spec_b` parameters and returns a prompt template asking the agent to compare two specs, identifying overlaps, dependencies, and differences.

Both prompts should include the relevant spec content inline so the agent has everything it needs.

**Testing guidance**: Use the MCP inspector to list prompts and verify both appear. Call `understand_spec` with "bash-tool" and verify the returned prompt includes the spec content and asks for explanation. Call `compare_specs` with two related specs and verify the prompt asks for comparison.

## Step 9

In this step your goal is to package and document your server.

Your server should be easy to install and configure in any MCP client. Create the necessary configuration and documentation.

Complete the following:

- Add a `package.json` with proper metadata (name, version, description, bin entry)
- Create a `README.md` with installation instructions for Claude desktop and other MCP clients
- Add an MCP configuration example showing how to add specdex to `claude_desktop_config.json`
- Document all available resources, tools, and prompts
- Include the path configuration for pointing to your spec archive

**Testing guidance**: Install your server in the Claude desktop app using your documented configuration. Restart Claude and verify the server appears in the tools list. Try asking Claude "What specs do I have?" and verify it can list your specs.

## Going Further

Once you've built the core server, here are ways to extend it:

- **Find related specs** — Add a `find_related` tool that scans for cross-references between specs (mentions of other spec names in requirements or scenarios).

- **Tag-based filtering** — Parse frontmatter or a tags section from specs and add a `search_by_tag` tool.

- **Spec validation** — Add a tool that validates a spec follows the Purpose/Requirements/Scenarios structure and reports issues.

- **Change summary** — Add a resource or tool that summarizes what changed in the last N days from the changes directory.

- **Multi-archive support** — Allow configuring multiple spec archive paths and namespace them (e.g., `spec://project-a/bash-tool`, `spec://project-b/bash-tool`).

- **Search optimization** — For large archives, implement caching or indexing to speed up search across hundreds of specs.

- **MCP sampling** — Use MCP's sampling capability to let the server ask the LLM questions, enabling features like "suggest related specs" powered by AI.
