# {package-name} — Requirements

## 1. Problem Statement

> One paragraph describing the problem this package/tool solves. Focus on the _pain_, not the solution.

**Template:**

```
{context} currently lacks {capability}. Without {this}, users cannot {outcome}.
This results in {negative_consequence}. We need {solution_type} that {key_benefit}.
```

**Example:**

> The open-forge-pipeline orchestrates multi-stage agent workflows but lacks visibility into what agents are doing. Without telemetry, the pipeline cannot detect when agents are stuck, enforce budget constraints, or provide feedback. We need a telemetry package that captures events and evaluates constraints.

---

## 2. Users and Personas

> List who will use this and what they need. Keep it to 2-4 personas.

| Persona         | Needs                             |
| --------------- | --------------------------------- |
| **{Persona 1}** | {what they need from this system} |
| **{Persona 2}** | {what they need from this system} |
| **{Persona 3}** | {what they need from this system} |

**Example personas for a developer tool:**

- **End User** — Uses the feature directly, needs it to work reliably
- **Integrator** — Embeds this in a larger system, needs clear APIs
- **Operator** — Runs it in production, needs observability and debuggability
- **Maintainer** — Extends it over time, needs clear architecture

---

## 3. Functional Requirements

> What must the system DO? Number each requirement. Use MUST/SHOULD/MAY (RFC 2119). Assign priority.

### 3.1 {Category 1}

| ID    | Requirement                       | Priority |
| ----- | --------------------------------- | -------- |
| F-001 | System MUST {specific behavior}   | P0       |
| F-002 | System MUST {specific behavior}   | P0       |
| F-003 | System SHOULD {specific behavior} | P1       |
| F-004 | System MAY {specific behavior}    | P2       |

### 3.2 {Category 2}

| ID    | Requirement                     | Priority |
| ----- | ------------------------------- | -------- |
| F-010 | System MUST {specific behavior} | P0       |
| F-011 | System MUST {specific behavior} | P0       |

**Priority definitions:**

- **P0** — Must have for MVP, blocks release
- **P1** — Should have, important but not blocking
- **P2** — Nice to have, can defer

**Requirement verbs:**

- **MUST** — Required, non-negotiable
- **MUST NOT** — Forbidden
- **SHOULD** — Recommended, but exceptions allowed
- **SHOULD NOT** — Not recommended, but exceptions allowed
- **MAY** — Optional

---

## 4. Non-Functional Requirements

> Quality attributes: performance, reliability, security, compatibility, etc.

### 4.1 Performance

| ID     | Requirement                                          |
| ------ | ---------------------------------------------------- |
| NF-001 | {Operation} MUST complete in < {X}ms (p99)           |
| NF-002 | System MUST support {X} concurrent {operations}      |
| NF-003 | Memory usage MUST NOT exceed {X}MB under normal load |

### 4.2 Reliability

| ID     | Requirement                        |
| ------ | ---------------------------------- |
| NF-010 | System MUST {reliability behavior} |
| NF-011 | System MUST NOT {failure mode}     |

### 4.3 Security (if applicable)

| ID     | Requirement                             |
| ------ | --------------------------------------- |
| NF-020 | System MUST {security behavior}         |
| NF-021 | System MUST NOT {security anti-pattern} |

### 4.4 Compatibility

| ID     | Requirement                                |
| ------ | ------------------------------------------ |
| NF-030 | MUST be compatible with {platform/version} |
| NF-031 | MUST support {runtime/environment}         |

### 4.5 Developer Experience

| ID     | Requirement                            |
| ------ | -------------------------------------- |
| NF-040 | MUST be usable with zero configuration |
| NF-041 | MUST have type definitions included    |
| NF-042 | MUST have documentation with examples  |

---

## 5. Interface Specification

> Define the API contract. Use TypeScript interfaces for code projects.

### 5.1 Core Types

```typescript
// Primary data structures
interface {EntityName} {
  {field}: {type};        // {description}
  {field}?: {type};       // {description, optional}
}

// Example:
// interface User {
//   id: string;           // Unique identifier
//   email: string;        // User's email address
//   role?: "admin" | "user";  // Optional role, defaults to "user"
// }
```

### 5.1 Primary API

```typescript
interface {ServiceName} {
  // {description of this method}
  {methodName}({param}: {ParamType}): Promise<{ReturnType}>;

  // {description of this method}
  {methodName}({param}: {ParamType}): {ReturnType};
}

// Example:
// interface UserStore {
//   // Fetch a user by ID
//   get(id: string): Promise<User | null>;
//
//   // Create a new user
//   create(data: CreateUserData): Promise<User>;
// }
```

### 5.2 Configuration

```typescript
interface {ServiceName}Config {
  {option}: {type};       // {description, default: X}
  {option}?: {type};      // {description, default: X}
}

// Example:
// interface TelemetryConfig {
//   storage: "file" | "sqlite" | "memory";  // Storage backend, default: "file"
//   filePath?: string;                       // Path for file storage, default: "./telemetry.json"
// }
```

---

## 6. Default Behavior / Opinions

> What opinions does this package ship with? Reduce decision fatigue for users.

| Default     | Value           | Rationale          |
| ----------- | --------------- | ------------------ |
| {Setting 1} | {default value} | {why this default} |
| {Setting 2} | {default value} | {why this default} |
| {Setting 3} | {default value} | {why this default} |

**Example:**
| Default | Value | Rationale |
|---------|-------|-----------|
| max-retries | 3 | Empirically, most failures resolve by retry 3 |
| timeout | 30s | Long enough for most operations, short enough to fail fast |

---

## 7. File Structure

> Directory layout. Helps roadmap generation and sets expectations.

```
{package-name}/
├── src/
│   ├── index.ts              # {description}
│   ├── {module}.ts           # {description}
│   ├── {module}/
│   │   ├── {file}.ts         # {description}
│   │   └── {file}.ts         # {description}
│   └── types.ts              # {description}
├── tests/
│   ├── {module}.test.ts      # {description}
│   └── integration.test.ts   # {description}
├── package.json
├── tsconfig.json
├── README.md
└── EXAMPLES.md               # {optional: usage examples}
```

---

## 8. Success Criteria

> How do we verify this is complete? Make it testable.

| Criteria      | How to Verify           |
| ------------- | ----------------------- |
| {Criterion 1} | {test or demonstration} |
| {Criterion 2} | {test or demonstration} |
| {Criterion 3} | {test or demonstration} |

**Example:**
| Criteria | How to Verify |
|----------|---------------|
| Events are captured | Integration test with mock pipeline |
| Performance meets SLA | Benchmark with 10,000 events |
| Zero-config works | Fresh install with no config file |

---

## 9. Out of Scope

> Explicitly state what this will NOT do. Prevents scope creep.

| Item      | Reason        | Could be v2? |
| --------- | ------------- | ------------ |
| {Feature} | {why not now} | {yes/no}     |
| {Feature} | {why not now} | {yes/no}     |

**Example:**
| Item | Reason | Could be v2? |
|------|--------|--------------|
| Real-time dashboard | Requires frontend, out of scope | yes |
| Distributed tracing | Single-machine focus for v1 | yes |
| Windows support | Linux/macOS only for now | no |

---

## 10. Dependencies

**Production:**

- {dependency} — {why needed, or "None"}

**Development:**

- {dev dependency} — {why needed}

**Example:**

```
Production:
- None (zero required dependencies)

Development:
- TypeScript 5.x
- Vitest (testing)
- tsup (build)
```

---

## 11. References

> Related projects, docs, or inspiration.

- Related: {project name} — {relationship}
- Inspiration: {source} — {what was borrowed}
- Specification: {spec name} — {link}

---

## 12. Open Questions

> Things we don't know yet. Remove as they're resolved.

| Question    | Decision Needed By | Status          |
| ----------- | ------------------ | --------------- |
| {Question?} | {phase/timeline}   | {open/resolved} |

---

_Requirements version: 1.0.0_
_Created: {YYYY-MM-DD}_
_Author: {name or "Pipeline"}_
