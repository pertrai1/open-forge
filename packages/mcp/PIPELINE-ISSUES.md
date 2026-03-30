# Pipeline Issue Tracker

When ANY subagent encounters a problem during the phase execution loop, it MUST record it here BEFORE proceeding.

---

## Instructions for Agents

**YOU MUST FILL OUT THIS FILE** when you encounter:
- An unexpected error or failure
- Confusion about requirements or next steps
- A blocker that prevents progress for more than 5 minutes
- Need for human decision or clarification
- Discovery of a gap in the roadmap or requirements

**DO NOT** silently work around issues or make assumptions. Document them here.

---

## Active Issues

<!-- Copy this template for each issue -->

### Issue #[N]: [Brief Description]

**Discovered**: [YYYY-MM-DD HH:MM]
**Phase**: [Phase number]
**Task**: [Task ID from ROADMAP.md, e.g., "1.4"]
**Agent**: [Type of agent: explore, deep, quick, etc.]

**What happened**:
[Describe the problem in detail. What were you trying to do? What failed?]

**Error message** (if any):
```
[Paste exact error message or output]
```

**Context**:
[What files were you working with? What command did you run? What was the expected outcome?]

**Attempted solutions**:
1. [What you tried first]
2. [What you tried second]
3. [etc.]

**Why it's blocked**:
[Explain why you can't proceed. Is it:
- Missing information?
- Ambiguous requirements?
- Technical limitation?
- Need human decision?]

**Need from human**: [Required]
- [ ] Clarification on requirement X
- [ ] Decision between options A and B
- [ ] Review of approach
- [ ] Other: [specify]

**Suggested resolution** (optional):
[If you have ideas for how this could be resolved, document them here]

---

## Resolved Issues

<!-- Move issues here after resolution with resolution details -->

### Issue #1: [Brief Description] — RESOLVED

**Discovered**: [YYYY-MM-DD HH:MM]
**Phase**: [Phase number]
**Task**: [Task ID]

**Resolution**: [How was it resolved? What was the decision?]

**Action taken**: [What code change or decision was made?]

**Resolved by**: [Human name OR "self-resolved" with explanation]

**Time to resolve**: [Duration]

---

## Pipeline Improvement Backlog

<!-- Track patterns and improvements for future phases -->

| Pattern | Occurrence Count | Suggested Fix | Priority |
|---------|------------------|---------------|----------|
| [e.g., "Missing test mocks"] | [# times seen] | [e.g., "Add pre-test setup phase"] | [High/Medium/Low] |

---

## How to Use This File

### For Subagents:
1. When you hit a blocker → STOP and fill out the issue template
2. Be specific about what you need from humans
3. Include exact error messages and context
4. Don't proceed until issue is resolved (or you have explicit direction to proceed anyway)

### For Humans:
1. Check this file at the start of each session
2. Review "Active Issues" section
3. Provide decisions/clarifications
4. Move resolved issues to "Resolved Issues" section
5. Update "Pipeline Improvement Backlog" for patterns

### For Pipeline Improvement:
1. Review "Resolved Issues" periodically
2. Identify recurring patterns in "Pipeline Improvement Backlog"
3. Update ROADMAP.md or REQUIREMENTS.md to prevent future occurrences
4. Consider updating AGENTS.md with new constraints
