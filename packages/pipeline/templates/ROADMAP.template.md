# ROADMAP Template

This template provides the structure for creating a ROADMAP.md file.

## Overview

[Brief description of the project or feature being built]

---

## Phase 0: [Phase Name]

**Goal**: [What this phase accomplishes]

### Tasks

- [ ] 0.1 [Task description] [deps: None] [deliverable: [file or artifact]]
- [ ] 0.2 [Task description] [deps: 0.1] [deliverable: [file or artifact]]
- [ ] 0.3 [Task description] [deps: None] [deliverable: [file or artifact]]

**Parallel Groups**:

- Group A: [List task IDs that can run in parallel]
- Group B: [List task IDs that can run in parallel]

---

## Phase 1: [Phase Name]

**Goal**: [what this phase accomplishes]

### Tasks

- [ ] 1.1 [Task description] [deps: None] [deliverable: [file or artifact]]
- [ ] 1.2 [Task description] [deps: 1.1] [deliverable: [file or artifact]]

**Parallel Groups**

- Group A: [List task IDs]

---

## Dependency Graph

```
Phase 0
    │
    ├──→ Phase 1
    │
    └──→ Phase 2
```

---

## Notes for Subagents

1. **Check dependencies**: Ensure prerequisite tasks are complete before starting
2. **Follow existing patterns**: Look at similar files in the same directory for style
3. **Write tests**: Each task should include or update relevant tests
4. **Respect context firewalls**: Test authors and implementers have different access
