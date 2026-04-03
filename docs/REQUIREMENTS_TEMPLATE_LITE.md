# {package-name} — Requirements (Lite)

## Problem

> One sentence: {current_state} lacks {capability}. This causes {pain_point}.

**Solution:** {brief_solution}

---

## Who Needs This

| Persona   | Need             |
| --------- | ---------------- |
| {persona} | {what they need} |
| {persona} | {what they need} |

---

## Must Have (P0)

- [ ] {requirement 1}
- [ ] {requirement 2}
- [ ] {requirement 3}

## Should Have (P1)

- [ ] {requirement 1}
- [ ] {requirement 2}

## Nice to Have (P2)

- [ ] {requirement 1}

---

## API

```typescript
// Main interface
interface {ServiceName} {
  {method}({param}: {Type}): {ReturnType};
  {method}({param}: {Type}): {ReturnType};
}

// Config
interface Config {
  {option}?: {type};  // default: {value}
}
```

---

## Quality Targets

| Metric      | Target      |
| ----------- | ----------- |
| Latency     | < {X}ms p99 |
| Throughput  | {X} ops/sec |
| Bundle size | < {X}KB     |

---

## Out of Scope

- {thing we won't do}
- {thing we won't do}

---

## Done When

- [ ] {success criterion 1}
- [ ] {success criterion 2}
- [ ] All P0 requirements met

---

_Created: {YYYY-MM-DD}_
