# config-schema

Zod-validated configuration — ForgeConfigSchema with layered config support.

## Requirements

### Requirement: ForgeConfigSchema Zod schema
The system SHALL define a `ForgeConfigSchema` Zod object schema with optional fields: `language` (enum: typescript, python, go), `framework` (string), `testFramework` (string), `buildCommand` (string), `testCommand` (string), and `lintCommand` (string).

#### Scenario: Valid full config
- **WHEN** a config object has all fields populated with valid values
- **THEN** `ForgeConfigSchema.parse()` succeeds and returns the typed config

#### Scenario: Valid empty config
- **WHEN** an empty object `{}` is passed to the schema
- **THEN** `ForgeConfigSchema.parse()` succeeds (all fields optional)

#### Scenario: Invalid language value
- **WHEN** a config has `language: "rust"` (not in enum)
- **THEN** `ForgeConfigSchema.parse()` throws a ZodError

### Requirement: ForgeConfig inferred type
The system SHALL export a `ForgeConfig` type inferred from `ForgeConfigSchema` using `z.infer<typeof ForgeConfigSchema>`.

#### Scenario: Type assignability
- **WHEN** a variable is typed as `ForgeConfig`
- **THEN** it accepts objects matching the schema shape and rejects non-conforming objects

### Requirement: SUPPORTED_LANGUAGES constant
The system SHALL export a `SUPPORTED_LANGUAGES` readonly array containing `['typescript', 'python', 'go']` that the schema enum references.

#### Scenario: Language enum matches constant
- **WHEN** the Zod enum and `SUPPORTED_LANGUAGES` are compared
- **THEN** they contain the same values
