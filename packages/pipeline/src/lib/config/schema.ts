/**
 * Zod schemas for forge configuration — validates forge.config.json.
 */

import { z } from 'zod';

/** Schema for project-level configuration. */
export const ProjectConfigSchema = z.object({
  name: z.string().min(1),
  language: z.enum(['typescript', 'javascript', 'python', 'go']).optional(),
  framework: z.string().optional(),
  testFramework: z.string().optional(),
  buildCommand: z.string().optional(),
  testCommand: z.string().optional(),
  lintCommand: z.string().optional(),
});

/** Schema for agent-specific configuration. */
export const AgentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().int().positive().default(300_000),
});

/** Schema for pipeline execution configuration. */
export const PipelineConfigSchema = z.object({
  mode: z.enum(['single-phase', 'continuous', 'range']).default('continuous'),
  phases: z.array(z.string()).optional(),
  parallel: z.boolean().default(true),
  qualityGates: z.boolean().default(true),
});

/** Schema for all agents configuration. */
export const AgentsConfigSchema = z.object({
  testAuthor: AgentConfigSchema.optional().transform((v) =>
    AgentConfigSchema.parse(v ?? {})
  ),
  implementer: AgentConfigSchema.extend({
    timeout: z.number().int().positive().default(600_000),
  })
    .optional()
    .transform((v) =>
      AgentConfigSchema.extend({
        timeout: z.number().int().positive().default(600_000),
      }).parse(v ?? {})
    ),
  gateAgent: AgentConfigSchema.optional().transform((v) =>
    AgentConfigSchema.parse(v ?? {})
  ),
});

/** Schema for quality gate toggles. */
export const QualityConfigSchema = z.object({
  lint: z.boolean().default(true),
  typecheck: z.boolean().default(true),
  test: z.boolean().default(true),
  build: z.boolean().default(false),
});

/** Schema for logging configuration. */
export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  metrics: z.boolean().default(true),
});

/** Top-level forge configuration schema. */
export const ForgeConfigSchema = z.object({
  project: ProjectConfigSchema,
  pipeline: PipelineConfigSchema.optional().transform((v) =>
    PipelineConfigSchema.parse(v ?? {})
  ),
  agents: AgentsConfigSchema.optional().transform((v) =>
    AgentsConfigSchema.parse(v ?? {})
  ),
  quality: QualityConfigSchema.optional().transform((v) =>
    QualityConfigSchema.parse(v ?? {})
  ),
  logging: LoggingConfigSchema.optional().transform((v) =>
    LoggingConfigSchema.parse(v ?? {})
  ),
});

/** Inferred type from the ForgeConfig schema. */
export type ForgeConfig = z.infer<typeof ForgeConfigSchema>;

/** Inferred type for project configuration. */
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/** Inferred type for pipeline configuration. */
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

/** Inferred type for agents configuration. */
export type AgentsConfig = z.infer<typeof AgentsConfigSchema>;

/** Inferred type for quality configuration. */
export type QualityConfig = z.infer<typeof QualityConfigSchema>;

/** Inferred type for logging configuration. */
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
