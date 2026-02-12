# DEBUG Workflow

**Purpose:** Investigate and fix bugs/issues systematically with LOG FIRST approach.

**Trigger:** User reports a bug, describes unexpected behavior, or Oracle detects DEBUG intent.

---

## Agent Chain

```
Analyst (Investigation) → Oracle (Triage) → Builder (Fix) → Janitor (Validation) → Oracle (Report) → Librarian (Closure)
```

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| 1. Investigation | Analyst | Evidence gathering, root cause analysis |
| 2. Triage | Oracle | Scope assessment, fix strategy |
| 3. Fix | Builder | Bug fix with regression test (TDD) |
| 4. Validation | Janitor | Full validation harness |
| 5. Closure | Librarian | Memory persistence, pattern documentation |

---

## Key Principles

- **LOG FIRST:** Gather evidence before hypothesizing
- **Regression Tests:** MUST write test that fails before fix
- **3-Fix Escalation:** If 3 fixes for same root cause fail, escalate to architectural review
- **Backward Data Flow:** Trace from symptom backward to source
- **Evidence > Hypothesis:** Every claim must be backed by observable output

---

## Phase 1: Investigation (Analyst)

**Agent:** Analyst (`task(subagent_type="Analyst")`) — operates in **MODE B (Debug Investigation)**

**Skills Used:**
- `bug-investigator` — LOG FIRST debugging, evidence collection

**Inputs:**
- User description of the issue
- Existing memory (`patterns.md` for similar issues)
- Logs, error messages, stack traces
- Git context (recent changes via `git log`, `git blame`)

**Process:**
1. **LOG FIRST**: Add diagnostic logging before any hypothesis
2. **Backward Data Flow Trace**: Follow data from error point backward
3. **Evidence Collection**: Gather stack traces, logs, reproduction steps
4. **Confidence Scoring**: Rate root cause confidence (≥80 required)
5. **Human Signal Detection**: Check user-provided clues for implied context

**Outputs:**
- Evidence summary with confidence scores
- Root cause hypothesis (≥80 confidence)
- Reproduction steps
- `result.md` in task workspace

**Contract (Oracle writes before delegation):**
```yaml
contract:
  workflow: DEBUG
  phase: INVESTIGATION
  agent: Analyst
  mode: DEBUG
  bug_description: "<user's description>"
  symptoms: ["<symptom1>", "<symptom2>"]
  deliverable: "Root cause analysis with evidence"
```

**Gate:** Evidence collected AND root cause identified (≥80 confidence) before proceeding to Fix.

---

## Phase 2: Triage (Oracle)

**Agent:** Oracle (direct)

**Process:**
1. Review Analyst's `result.md`
2. Assess scope: Is this a simple fix or architectural issue?
3. If architectural → may need TECHSPEC amendment
4. If simple → proceed directly to Builder
5. Check for 3-fix escalation (same area failed 3+ times?)

**Outputs:**
- Fix strategy decision
- Updated `contract.md` for Builder

**Gate:** Strategy determined. If architectural escalation needed, STOP for user approval.

---

## Phase 3: Fix (Builder)

**Agent:** Builder (`task(subagent_type="Builder")`)

**Skills Used:**
- `tdd` — Regression test first, then fix
- `systematic-debugging` — 4-phase debugging methodology
- `minimal-diff-generator` — Focused fix, minimal blast radius
- `verification-gate` — Evidence-based completion

**Inputs:**
- Root cause from Analyst investigation
- Reproduction steps
- Fix strategy from Oracle triage

**Process:**
1. Write regression test that reproduces the bug (MUST fail first)
2. Implement minimal fix
3. Verify regression test now passes
4. Run full test suite
5. Apply verification gate — show evidence

**Outputs:**
- Regression test file
- Fix implementation
- `result.md` with before/after evidence

**Contract (Oracle writes before delegation):**
```yaml
contract:
  workflow: DEBUG
  phase: FIX
  agent: Builder
  root_cause: "<from Analyst result>"
  reproduction_steps: ["<step1>", "<step2>"]
  deliverable: "Regression test + minimal fix"
  tdd_required: true
  regression_test_must_fail_first: true
```

**Gate:** Regression test written AND passes after fix AND full suite passes.

---

## Phase 4: Validation (Janitor)

**Agent:** Janitor (`task(subagent_type="Janitor")`)

**Skills Used:**
- `verification-gate` — Evidence-based validation
- `silent-failure-hunter` — Ensure fix doesn't mask failures
- `traceability-linker` — Verify no requirements broken

**Inputs:**
- Fixed code + regression test
- Full test suite
- Original bug description (for variant coverage)

**Process:**

### Stage A: Regression Verification
- Regression test passes
- No new test failures introduced
- Fix doesn't mask silent failures

### Stage B: Full Harness
- TypeScript typecheck
- Lint
- Full test suite
- Variant coverage (edge cases related to the bug)

**Outputs:**
- `result.md` with PASS/FAIL per check

**Contract (Oracle writes before delegation):**
```yaml
validation_contract:
  workflow: DEBUG
  phase: VALIDATION
  agent: Janitor
  regression_test: "<test file path>"
  bug_description: "<original bug>"
  stages: ["regression_verification", "full_harness"]
```

**Gate:** All checks PASS. If FAIL → loop back to Builder.

---

## Phase 5: Closure (Librarian)

**Agent:** Librarian (`task(subagent_type="Librarian")`)

**Skills Used:**
- `post-mortem` — Session analysis, pattern detection
- `memory-update` — Refresh memory files

**Inputs:**
- Completed debug session
- Evidence and root cause from Analyst
- Fix implementation from Builder
- Validation results from Janitor

**Process:**
1. Run `post-mortem` skill
2. Update `patterns.md` with **Gotcha** entry for this bug type
3. Update `progress.md` with bug fix record
4. Update `active_context.md`
5. Present improvement proposals — **STOP FOR APPROVAL**

**Outputs:**
- Updated memory files
- Gotcha pattern documented
- Post-mortem findings

**No gate:** Closure is the final phase.

---

## Gate Summary

| From → To | Gate | Criteria |
|-----------|------|----------|
| Investigation → Triage | Evidence Gate | Evidence collected + root cause ≥80 confidence |
| Triage → Fix | Strategy Gate | Fix strategy determined, no escalation needed |
| Fix → Validation | Regression Gate | Regression test written + fails before fix + passes after |
| Validation → Closure | Harness Gate | All tests pass, no silent failures |

---

## 3-Fix Escalation Rule

If the same root cause area has been fixed 3 or more times:

1. **STOP** — Do not attempt fix #4
2. Oracle reviews the pattern across all 3 fixes
3. Likely indicates an **architectural problem**, not a bug
4. Escalate to user with recommendation for architectural refactor
5. May trigger a mini-BUILD workflow (REQ + TECHSPEC for the refactor)

---

## Variant Coverage Requirements

Ensure testing covers scenarios related to the bug:
- Empty/null/undefined input values
- Timeout and retry scenarios
- Concurrent access patterns
- Boundary conditions
- Error state transitions
- The specific user scenario that triggered the bug

---

## Task Delegation Pattern

```python
# Oracle → Analyst (Investigation)
task(
    subagent_type="Analyst",
    prompt="Read contract.md at .opencode/context/active_tasks/[bug]/contract.md. "
           "Investigate this bug using MODE B (Debug Investigation). "
           "Use LOG FIRST approach. Write result.md with evidence and root cause."
)

# Oracle → Builder (Fix)
task(
    subagent_type="Builder",
    prompt="Read contract.md at .opencode/context/active_tasks/[bug]/contract.md. "
           "Write regression test first (must fail). Implement minimal fix. "
           "Write result.md with before/after evidence."
)

# Oracle → Janitor (Validation)
task(
    subagent_type="Janitor",
    prompt="Read validation_contract.md at .opencode/context/active_tasks/[bug]/. "
           "Verify regression test + full harness. Write result.md."
)

# Oracle → Librarian (Closure)
task(
    subagent_type="Librarian",
    prompt="Run post-mortem for bug fix. Add Gotcha to patterns.md. "
           "Update progress.md. Write result.md."
)
```

---

## References

- Analyst Prompt (MODE B): `~/.config/opencode/nso/prompts/Analyst.md`
- Systematic Debugging Skill: `~/.config/opencode/nso/skills/systematic-debugging/SKILL.md`
- Bug Investigator Skill: `~/.config/opencode/nso/skills/bug-investigator/SKILL.md`
- Agent Reference: `~/.config/opencode/nso/docs/NSO-AGENTS.md`
- Configuration: `~/.config/opencode/opencode.json`
