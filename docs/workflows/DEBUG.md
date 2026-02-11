# DEBUG Workflow

**Purpose:** Investigate and fix bugs/issues systematically with LOG FIRST approach.

**Trigger:** Router detects DEBUG intent or user invokes `/router --workflow=debug`.

---

## Agent Chain

```
Janitor (Investigation, using Bug-Investigator skill) → Builder (Fix) → Janitor (Validation) → Librarian (Closure)
```

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| Investigation | Janitor | Evidence gathering, root cause analysis |
| Fix | Builder | Bug fixes, regression tests |
| Validation | Janitor | Quality assurance |
| Closure | Librarian | Memory persistence |

**Note:** Bug-Investigator is a **skill** used by the Janitor, not a separate agent.

---

## Key Principles

- **LOG FIRST:** Gather evidence before hypothesizing
- **Regression Tests:** MUST write test that fails before fix
- **Variant Coverage:** Test edge cases and non-default scenarios
- **Debug Attempt Tracking:** Document all attempts

---

## Phase 1: Investigation (Janitor)

**Agent:** The Janitor

**Skills Used:**
- `bug-investigator` - LOG FIRST debugging approach

**Inputs:**
- User description of the issue
- Existing memory (patterns.md for similar issues)
- Logs, error messages, stack traces
- Git context (recent changes)

**Outputs:**
- Evidence summary
- Root cause hypothesis
- Reproduction steps

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: DEBUG
  phase: INVESTIGATION
  agent: Janitor
  evidence_collected:
    - "Error: Connection refused in auth.py:42"
    - "Stack trace: TimeoutException at network.py:100"
  root_cause: "Network timeout due to missing retry logic"
  reproduction_steps:
    - "1. Start the server"
    - "2. Send 100 concurrent requests"
    - "3. Observe connection refused errors"
  next_phase: FIX
```

**Gate:** Evidence collected AND root cause identified before proceeding to Fix.

---

## Phase 2: Fix (Builder)

**Agent:** The Builder

**Skills Used:**
- `tdflow-unit-test` - Regression test writing
- `minimal-diff-generator` - Focused fix implementation

**Inputs:**
- Root cause from Investigation
- Reproduction steps
- Approved Tech Spec (if modifying architecture)

**Outputs:**
- Regression test (MUST fail before fix)
- Fix implementation
- Tests pass after fix

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: DEBUG
  phase: FIX
  agent: Builder
  regression_test: tests/test_<issue>_regression.py
  fix_applied: true
  test_status: PASS
  previous_phase: INVESTIGATION
  next_phase: VALIDATION
```

**Gate:** Regression test written AND fix applied AND test passes before Validation.

---

## Phase 3: Validation (Janitor)

**Agent:** The Janitor

**Skills Used:**
- `silent-failure-hunter` - Detect silent failures
- `traceability-linker` - Requirements mapping

**Inputs:**
- Fixed code + regression test
- Full test suite

**Outputs:**
- Regression test: PASS
- Full test suite: PASS
- No new failures

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: DEBUG
  phase: VALIDATION
  agent: Janitor
  regression_test: PASS
  full_test_suite: PASS
  variant_coverage: PASS
  previous_phase: FIX
  next_phase: CLOSURE
```

**Gate:** All tests pass before Closure.

---

## Phase 4: Closure (Librarian)

**Agent:** The Librarian

**Skills Used:**
- `memory-update` - Refresh memory files
- `context-manager` - Organize memory

**Inputs:**
- Completed debug session
- Evidence and root cause
- Fix implementation

**Outputs:**
- Memory update: patterns.md (Gotchas)
- Memory update: progress.md (verified deliverables)
- Git commit (optional)

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: DEBUG
  phase: CLOSURE
  agent: Librarian
  memory_updated: true
  patterns_updated: true
  git_commit: optional
  previous_phase: VALIDATION
  next_action: none
```

**No gate:** Closure is the final phase.

---

## Gate Summary

| From → To | Gate | Criteria |
|-----------|------|----------|
| Investigation → Fix | Evidence Gate | Evidence collected + root cause identified |
| Fix → Validation | Regression Gate | Regression test written + fix applied + test passes |
| Validation → Closure | Test Gate | All tests pass |

---

## Task Delegation Pattern

```python
# Oracle delegates to Janitor (Investigation)
task(
    agent="Janitor",
    prompt="Investigate the authentication bug. Use LOG FIRST approach. Document evidence, root cause, and reproduction steps."
)

# Oracle delegates to Builder (Fix)
task(
    agent="Builder",
    prompt="Fix the authentication bug. Write regression test first. Implement minimal fix."
)

# Oracle delegates to Janitor (Validation)
task(
    agent="Janitor",
    prompt="Validate the authentication bug fix. Run full test suite. Verify no regressions."
)

# Oracle delegates to Librarian (Closure)
task(
    agent="Librarian",
    prompt="Update memory after bug fix. Add findings to patterns.md (Gotchas) and progress.md."
)
```

---

## Variant Coverage Requirements

Ensure testing covers:
- Empty input values
- Null/undefined values
- Timeout scenarios
- Concurrent access
- Network partitions
- Boundary conditions
- Error states

---

## References

- Requirements: `docs/requirements/REQ-NSO-BUILD-Workflow.md`
- Tech Spec: `docs/architecture/TECHSPEC-NSO-WorkflowSystem.md`
- Bug-Investigator Skill: `.opencode/skills/bug-investigator/SKILL.md`
- Router: `.opencode/skills/router/scripts/router_logic.py`
- Agents: `.opencode/AGENTS.md`
