# Example Usage

Once the server is connected to Claude, here are prompts you can try.

---

## Discover what specs you have

> "What specs are available?"

Claude calls `resources/list` and shows all `spec://` resources with their descriptions.

---

## Search for relevant specs

> "Search my specs for anything about resources"

Claude calls `search_specs` with your query and returns matching specs. Useful when you don't know the exact spec name.

---

## Read a full spec

> "Read the spec for mcp-server"

Claude calls `resources/read` with `spec://mcp-server` and returns the full markdown content.

---

## Extract just requirements

> "What are the requirements for the search-specs spec?"

Claude calls `get_requirements` — returns only the Requirements section, not the whole document. Useful for keeping context usage low on large specs.

---

## Extract scenarios

> "What scenarios does the resources-read spec define?"

Claude calls `get_scenarios` — returns a structured list of WHEN/THEN scenarios. Useful for understanding test cases without reading the full spec.

---

## Understand a spec (built-in prompt)

> "Use the understand_spec prompt for mcp-server"

Triggers the `understand_spec` prompt, which injects the full spec content and asks Claude to explain what it does, identify the key requirements, and describe how to test against it.

---

## Compare two specs (built-in prompt)

> "Use compare_specs to compare resources-list and resources-read"

Triggers the `compare_specs` prompt with both specs inline. Claude identifies overlaps, dependencies, and differences between them.

---

## Check change history

> "What changes are in my openspec archive?"

Claude lists the `changes://` resources — a record of every change made to the archive.

---

## Progressive disclosure in practice

The real value emerges when Claude chains these tools naturally:

1. **Search** to find relevant specs (`search_specs`)
2. **Skim requirements** to decide if it's relevant (`get_requirements`)
3. **Read scenarios** to understand expected behavior (`get_scenarios`)
4. **Read the full spec** only when needed (`resources/read`)

This keeps context usage low on large archives — Claude loads only what it needs, when it needs it.
