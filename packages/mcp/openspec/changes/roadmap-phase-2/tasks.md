# Implementation Tasks

## 1. Configuration

- [ ] 1.1 Create `src/config.ts` with path resolution utilities
- [ ] 1.2 Export `OPENSPEC_PATH`, `SPECS_PATH`, `CHANGES_PATH` constants
- [ ] 1.3 Use `fileURLToPath` and `import.meta.url` for ESM compatibility

## 2. Spec Reading

- [ ] 2.1 Create `src/specs/reader.ts`
- [ ] 2.2 Implement `readSpecDirectory()` function
- [ ] 2.3 Handle missing directory gracefully (return empty array)
- [ ] 2.4 Filter for directories only (ignore files)

## 3. Purpose Extraction

- [ ] 3.1 Create `src/specs/purpose-extractor.ts`
- [ ] 3.2 Implement `extractPurpose()` function
- [ ] 3.3 Parse `## Purpose` section and extract first paragraph
- [ ] 3.4 Return `null` if Purpose section not found

## 4. Resources Handler

- [ ] 4.1 Create `src/handlers/resources-list.ts`
- [ ] 4.2 Import `ListResourcesRequestSchema` from MCP SDK
- [ ] 4.3 Implement handler that reads specs and formats as MCP resources
- [ ] 4.4 Use `spec://` URI scheme
- [ ] 4.5 Set `mimeType` to `text/markdown`
- [ ] 4.6 Use "No description available" fallback

## 5. Server Integration

- [ ] 5.1 Import handler in `src/server.ts`
- [ ] 5.2 Register handler with `server.setRequestHandler()`

## 6. Testing

- [ ] 6.1 Create `tests/specs/reader.test.ts`
- [ ] 6.2 Test: readSpecDirectory returns spec names
- [ ] 6.3 Test: readSpecDirectory handles missing directory
- [ ] 6.4 Create `tests/specs/purpose-extractor.test.ts`
- [ ] 6.5 Test: extractPurpose extracts first paragraph
- [ ] 6.6 Test: extractPurpose returns null for missing Purpose
- [ ] 6.7 Create `tests/handlers/resources-list.test.ts`
- [ ] 6.8 Test: Handler returns resources array
- [ ] 6.9 Test: Resources have correct format (uri, name, description, mimeType)

## 7. Verification

- [ ] 7.1 Run `npm run build` successfully
- [ ] 7.2 Run `npm run test` successfully
- [ ] 7.3 Run `npm run check` successfully
