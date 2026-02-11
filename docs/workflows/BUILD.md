# BUILD Workflow

**Purpose:** Implement new features from requirements to deployment.

**Trigger:** Router detects BUILD intent or user invokes `/router --workflow=build`.

---

## Agent Chain

```
Oracle (Discovery) → Oracle (Architecture) → Builder (Implementation) → Janitor (Validation) → Librarian (Closure)
```

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| Discovery | Oracle | Requirements gathering |
| Architecture | Oracle | Technical design |
| Implementation | Builder | Code development (TDD) |
| Validation | Janitor | Quality assurance |
| Closure | Librarian | Memory persistence |

---

## Phase 1: Discovery (Oracle)

**Agent:** The Oracle

**Inputs:**
- User request (from router or direct invocation)
- Existing memory files (`.opencode/context/01_memory/`)
- Context files (`.opencode/context/00_meta/`)

**Outputs:**
- Requirements document: `docs/requirements/REQ-<Feature-Name>.md`
- Approval: User must approve before Architecture

**Skills Used:**
- `requirement-elicitation` - Transform vague requests into structured PRDs with traceability matrix
- `rm-validate-intent` - Verify requirements match intent
- `rm-multi-perspective-audit` - Multi-perspective review

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: DISCOVERY
  agent: Oracle
  artifact: REQ-<Feature-Name>.md
  approval: pending
  next_phase: ARCHITECTURE
```

**Gate:** User must approve REQ-*.md before proceeding to Architecture.

---

## Phase 2: Architecture (Oracle)

**Agent:** The Oracle

**Inputs:**
- Approved requirements (REQ-*.md)
- Context files (`.opencode/context/00_meta/`)

**Outputs:**
- Tech Spec: `docs/architecture/TECHSPEC-<Feature-Name>.md`
- Approval: User must approve before Implementation

**Skills Used:**
- `architectural-review` - Self-critique of architecture
- `brainstorming-bias-check` - Detect cognitive bias
- `rm-conflict-resolver` - Check for conflicts

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: ARCHITECTURE
  agent: Oracle
  artifact: TECHSPEC-<Feature-Name>.md
  approval: pending
  previous_phase: DISCOVERY
  next_phase: IMPLEMENTATION
```

**Gate:** User must approve TECHSPEC-*.md before proceeding to Implementation.

---

## Phase 3: Implementation (Builder)

**Agent:** The Builder

**Inputs:**
- Approved Tech Spec (TECHSPEC-*.md)
- Context files

**Outputs:**
- Code implementation
- Unit tests (TDD: RED → GREEN → REFACTOR)
- Verification: `validate.py --fast` passes

**Skills Used:**
- `tdflow-unit-test` - TDD cycle enforcement
- `minimal-diff-generator` - Small focused changes
- `code-generation` - Expert code writing

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: IMPLEMENTATION
  agent: Builder
  artifact: src/
  test_status: PASS
  validation_status: pending
  previous_phase: ARCHITECTURE
  next_phase: VALIDATION
```

**Gate:** Code complete + tests pass + `validate.py --fast` passes before Validation.

---

## Phase 4: Validation (Janitor)

**Agent:** The Janitor

**Inputs:**
- Implemented code + tests
- Validation harness (`validate.py --full`)
- Integration-Verifier skill (optional for E2E scenarios)

**Outputs:**
- Lint: PASS
- Type check: PASS
- Pytest: PASS
- Naming conventions: PASS
- Memory validation: PASS
- Integration tests: PASS (optional)
- E2E scenarios: PASS (optional)

**Skills Used:**
- `traceability-linker` - Requirements to code mapping
- `silent-failure-hunter` - Detect silent failures
- `integration-verifier` - Run integration tests and E2E scenarios

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: VALIDATION
  agent: Janitor
  lint_status: PASS
  type_status: PASS
  test_status: PASS
  naming_status: PASS
  memory_status: PASS
  integration_status: pending  # If integration-verifier used
  e2e_status: pending          # If integration-verifier used
  previous_phase: IMPLEMENTATION
  next_phase: CLOSURE
```

**Gate:** `validate.py --full` must pass before Closure.

---

## Phase 5: Closure (Librarian)

**Agent:** The Librarian

**Inputs:**
- Completed workflow
- All artifacts

**Outputs:**
- Memory update: `.opencode/context/01_memory/` updated
- Self-improvement analysis: Patterns detected and reviewed
- Git commit (optional)

**Skills Used:**
- `memory-update` - Refresh memory files
- `context-manager` - Organize memory
- `self-improve` - Run self-improvement workflow using agent skills

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: CLOSURE
  agent: Librarian
  memory_updated: true
  self_improve_completed: true
  git_commit: optional
  previous_phase: VALIDATION
  next_action: none
```

**Self-Improvement Directive:**
At the start of Closure, the Librarian performs self-improvement using agent skills:

1. **Copy Session:** Runs `copy_session.py` to extract OpenCode session messages
2. **Analyze Patterns:** Uses the Janitor's pattern-detection skills to identify recurring patterns
3. **Deduplicate:** Uses `deduplicate_patterns.py` to group identical patterns
4. **Present & Approve:** Uses judgment to present findings and get user approval
5. **Implement:** Uses pattern-implementer skill to apply approved changes

**No gate:** Closure is the final phase, but self-improvement is encouraged.

---

## Gate Summary

| From → To | Gate | Criteria |
|-----------|------|-----------|
| Discovery → Architecture | User Approval | User approves REQ-*.md |
| Architecture → Implementation | User Approval | User approves TECHSPEC-*.md |
| Implementation → Validation | Test Gate | Tests pass, validate.py --fast passes |
| Validation → Closure | Harness Gate | validate.py --full passes |

---

## Task Delegation Pattern

```python
# Oracle delegates to Builder
task(
    agent="Builder",
    prompt="Implement feature X per TECHSPEC-X.md. Use TDD. Report completion."
)

# Oracle delegates to Janitor
task(
    agent="Janitor",
    prompt="Validate feature X implementation. Run validate.py --full. Report findings."
)

# Oracle delegates to Librarian
task(
    agent="Librarian",
    prompt="Update memory after feature X completion. Add to progress.md and patterns.md."
)
```

---

## References

- Requirements: `docs/requirements/REQ-NSO-BUILD-Workflow.md`
- Tech Spec: `docs/architecture/TECHSPEC-NSO-WorkflowSystem.md`
- Router: `.opencode/skills/router/scripts/router_logic.py`
- Validation: `.opencode/scripts/validate.py`
- Agents: `.opencode/AGENTS.md`
