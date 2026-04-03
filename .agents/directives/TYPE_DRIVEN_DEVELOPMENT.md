# Type-First Development Directive

## MANDATORY: Type-First Development

You MUST define types before writing any implementation code. This is non-negotiable.

### The Rule

**No types = no code.**

Before implementing ANY function, class, or module:

1. **Check** — Do types/interfaces already exist for what you're building?
2. **Define** — If not, create type definitions FIRST in a `types.ts` file
3. **Verify** — Run `npx nx affected -t build` to ensure types compile
4. **Confirm** — If introducing new type contracts with 5+ types or complex generics, ask the user to confirm the contract is correct
5. **Hand off** — Types are done. Proceed to [TEST_DRIVEN_DEVELOPMENT](./TEST_DRIVEN_DEVELOPMENT.md) for the RED/GREEN/REFACTOR cycle

### What This Means in Practice

#### WRONG: Implementation First

```typescript
// Don't do this
export function processOrder(order) {
  return {
    id: order.id,
    status: 'processed',
    total: order.items.reduce((sum, item) => sum + item.price, 0),
  };
}
```

#### RIGHT: Types First

```typescript
// Step 1: Define types in types.ts
export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  createdAt: Date;
};

export type ProcessedOrder = {
  id: string;
  status: 'processed';
  total: number;
};

// Step 2: Export from index.ts
export type { Order, OrderItem, ProcessedOrder } from './types.js';

// Step 3: Implementation comes via TDD (see TEST_DRIVEN_DEVELOPMENT.md)
```

### Required Type Elements

Always define:

1. **Domain types** — The core data structures
2. **Input types** — What goes in
3. **Output types** — What comes out

Define as applicable:

4. **Error types** — For operations that can fail (discriminated unions for public APIs)
5. **Interface contracts** — For services, repositories, or collaborators that need a boundary

### Error Handling Pattern

Prefer discriminated unions for public APIs and service boundaries:

```typescript
// For public APIs and service boundaries:
type FindUserResult =
  | { success: true; user: User }
  | { success: false; error: 'not-found' | 'access-denied' };

function findUser(id: string): Promise<FindUserResult>;

// For internal helpers, `| null` is acceptable when unambiguous:
function describeKind(node: Expression): string | null;
```

### Monorepo Considerations

- **Shared types** belong in the package that owns the domain (e.g., agent types in `@open-forge/agent`, telemetry types in `@open-forge/telemetry`)
- **Cross-package type imports** must go through the package's public `index.ts` — never import from internal paths
- **Verify with Nx** — `npx nx affected -t build` catches type errors across the dependency graph, not just the current package

### Quality Gate

Before types are considered complete:

```bash
npx nx affected -t build
```

After implementation (via TDD), all gates must pass:

```bash
npx nx affected -t build,test,lint
```

### When Types Are Complex

If a type contract is non-trivial (5+ types, complex unions, generics), present the types to the user BEFORE implementing:

```
I've defined the type contract for [feature]. Please confirm this matches your intent:

[Show types]

Once confirmed, I'll implement against these types.
```

### Rationale

Types are executable specifications. They:

- **Reduce solution space** — From millions of implementations to thousands
- **Provide instant feedback** — Compiler errors are immediate, tests are slow
- **Document intent** — Types are self-documenting contracts
- **Catch bugs early** — At compile time, not runtime
- **Guide implementation** — The type signature tells you what to build

---

## Quick Reference

| Step | Action               | Command                                                   |
| ---- | -------------------- | --------------------------------------------------------- |
| 1    | Define types         | Create/edit `types.ts`                                    |
| 2    | Export types         | Add to `index.ts`                                         |
| 3    | Verify types         | `npx nx affected -t build`                                |
| 4    | Confirm (if complex) | Present types to user                                     |
| 5    | Hand off to TDD      | → [TEST_DRIVEN_DEVELOPMENT](./TEST_DRIVEN_DEVELOPMENT.md) |

---

_After types are verified, proceed to [TEST_DRIVEN_DEVELOPMENT](./TEST_DRIVEN_DEVELOPMENT.md). Do not implement without tests._
