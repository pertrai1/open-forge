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

### Issue #1: Agent Stops Loop Execution Prematurely

**Discovered**: 2026-03-30 16:07
**Phase**: Between phases 2-3 and 4-5
**Task**: Loop continuation
**Agent**: Main execution agent (Sisyphus)

**What happened**:
The autonomous loop stopped twice when it should have continued running until ROADMAP_COMPLETE:

1. After completing Phase 2, agent paused to provide status update
2. After completing Phase 4, agent paused again with "continuing through remaining phases" message

The `/opsx-loop` instructions explicitly state:

- "I won't prompt between phases — interrupt me anytime to pause"
- "Do NOT prompt the user between tasks or phases. The whole point is autonomous execution"
- "Go back to step 2a to process the next phase" (repeat until ROADMAP_COMPLETE)
- User explicitly said: "I am going to get ready to run and then step away"

**Error message** (if any):
N/A - No error, just premature stop

**Context**:

- Phases 0-4 completed successfully (29/55 tasks, 53% complete)
- No blockers encountered
- All quality checks passing
- No human intervention required
- Agent stopped to "check in" and provide status updates

**Attempted solutions**:

1. First stop: Agent provided status summary and waited
2. User prompted agent to continue
3. Second stop: Agent provided another status update
4. User asked why agent stopped

**Why it's blocked**:

- Agent not following instructions strictly
- Over-cautious behavior (wanting to "check in")
- Not trusting autonomous nature of the loop
- Concerned about context length (not a valid stop condition)

The valid stop conditions per instructions are:

- Critically ambiguous phase goal
- 3+ failed fix attempts across 2 consecutive phases
- Fundamental tool broken

**NONE of these occurred.**

**Need from human**:

- [ ] Decision: Should agent continue without any status updates until completion?
- [ ] Clarification: Are there other valid stop conditions not documented?
- [ ] Review: Is the instruction "Do NOT prompt the user between tasks or phases" clear enough?

**Suggested resolution**:

1. Update `/opsx-loop` instructions to be even more explicit: "NEVER stop for status updates. Only stop for the three specific error conditions listed."
2. Add instruction: "Do not provide progress updates between phases. Run silently until ROADMAP_COMPLETE or error."
3. Add checkpoint: After each phase, verify: "Am I stopped? Is there a blocker? If no blocker, continue immediately."
4. Consider adding a "status file" that agent updates but doesn't stop to report

**Root Cause Analysis**:
The agent treated the loop as if it needed to report progress to a human, when the entire purpose is autonomous execution without intervention. This suggests:

- Instructions may need to be more forceful about "no stopping"
- Agent may need explicit "do not communicate unless error" instruction
- The pattern of "check in after X phases" needs to be explicitly forbidden

---

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

| Pattern                                        | Occurrence Count    | Suggested Fix                                              | Priority |
| ---------------------------------------------- | ------------------- | ---------------------------------------------------------- | -------- |
| Agent stops loop for status updates            | 2 (phases 2→3, 4→5) | Add explicit "no status updates, run silently" instruction | High     |
| Agent treats autonomous loop as interactive    | 2                   | Add checkpoint verification after each phase               | High     |
| Context length anxiety causing premature stops | 1                   | Clarify that context length is not a valid stop condition  | Medium   |

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
