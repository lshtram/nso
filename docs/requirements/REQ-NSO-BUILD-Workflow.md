# Requirements: NSO Workflow System (BUILD + DEBUG + REVIEW)

## 1. Background
NSO already has a complete BUILD workflow implemented through the Feature Lifecycle:
- Discovery (Oracle) → Requirements (REQ-*.md)
- Architecture (Oracle) → Tech Spec (TECHSPEC-*.md)
- Implementation (Builder) → Code + Tests
- Validation (Harness) → `validate.py --full`
- Closure (Librarian) → Memory update + Git

We need to **formalize this as BUILD** and **add two new workflows**:
- **DEBUG** — For investigating and fixing bugs/issues
- **REVIEW** — For code review and quality assessment

The **PLAN** workflow is handled separately (planning happens before BUILD via `/new-feature`).

## 2. Goals
1) **Formalize the existing BUILD workflow** as a documented, reusable template with YAML contracts and gates.
2) **Add DEBUG workflow** for systematic debugging with LOG FIRST approach.
3) **Add REVIEW workflow** for code review with confidence scoring.
4) **Integrate all workflows with Router** so `/router` can invoke the appropriate workflow.
5) **Document phase templates** that agents can follow.

## 3. Non-Goals
- No parallel execution (review + silent-failure-hunter) in this phase (deferred).
- No circuit breaker for remediation (deferred).
- No PLAN workflow in this phase (handled separately before BUILD).
- No changes to existing tools (validate.py, memory system, etc.).

## 4. Workflow Definitions (Authoritative)

### 4.1 BUILD Workflow
**Purpose:** Implement new features from requirements to deployment.

**Trigger:** Router detects BUILD intent or user invokes directly via `/new-feature` or `/router --workflow=build`.

**Agent Chain:**
```
Oracle (Discovery) → Oracle (Architecture) → Builder (Implementation) → Harness (Validation) → Librarian (Closure)
```

**Key Features:**
- TDD enforcement (Builder)
- Validation harness gates (lint, type, pytest)
- Memory persistence (LOAD at start, UPDATE at end)
- Approval gates between phases

#### BUILD Phase 1: Discovery (Oracle)
**Purpose:** Capture requirements from user intent.

**Inputs:**
- User request (from router or direct invocation)
- Existing memory files (if loaded)
- Context files (tech-stack, patterns, glossary)

**Outputs:**
- Requirements document: `docs/requirements/REQ-<Feature-Name>.md`
- Approval: User must approve before Architecture

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: DISCOVERY
  artifact: REQ-<Feature-Name>.md
  approval: pending
  next_phase: ARCHITECTURE
```

#### BUILD Phase 2: Architecture (Oracle)
**Purpose:** Design solution based on approved requirements.

**Inputs:**
- Approved requirements (REQ-*.md)
- Context files

**Outputs:**
- Tech Spec: `docs/architecture/TECHSPEC-<Feature-Name>.md`
- Approval: User must approve before Implementation

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: ARCHITECTURE
  artifact: TECHSPEC-<Feature-Name>.md
  approval: pending
  previous_phase: DISCOVERY
  next_phase: IMPLEMENTATION
```

#### BUILD Phase 3: Implementation (Builder)
**Purpose:** Implement solution using TDD cycle.

**Inputs:**
- Approved Tech Spec (TECHSPEC-*.md)
- Context files

**Outputs:**
- Code implementation
- Unit tests (TDD: RED → GREEN → REFACTOR)
- Verification: `validate.py --fast` passes

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: IMPLEMENTATION
  artifact: src/
  test_status: PASS
  validation_status: pending
  previous_phase: ARCHITECTURE
  next_phase: VALIDATION
```

#### BUILD Phase 4: Validation (Harness)
**Purpose:** Verify implementation meets quality standards.

**Inputs:**
- Implemented code + tests
- Validation harness (`validate.py --full`)

**Outputs:**
- Lint: PASS
- Type check: PASS
- Pytest: PASS
- Naming conventions: PASS
- Memory validation: PASS

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: VALIDATION
  lint_status: PASS
  type_status: PASS
  test_status: PASS
  naming_status: PASS
  memory_status: PASS
  previous_phase: IMPLEMENTATION
  next_phase: CLOSURE
```

#### BUILD Phase 5: Closure (Librarian)
**Purpose:** Persist context and finalize.

**Inputs:**
- Completed workflow
- All artifacts

**Outputs:**
- Memory update: `.opencode/context/01_memory/` updated
- Git commit (optional)

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: CLOSURE
  memory_updated: true
  git_commit: optional
  previous_phase: VALIDATION
  next_action: none
```

---

### 4.2 DEBUG Workflow
**Purpose:** Investigate and fix bugs/issues systematically with LOG FIRST approach.

**Trigger:** Router detects DEBUG intent or user invokes via `/router --workflow=debug`.

**Agent Chain:**
```
Bug-Investigator (Investigation) → Builder (Fix) → Harness (Validation) → Librarian (Closure)
```

**Key Features:**
- LOG FIRST (evidence before hypothesizing)
- Regression test enforcement
- Variant coverage (non-default cases)
- Debug attempt tracking

#### DEBUG Phase 1: Investigation (Bug-Investigator)
**Purpose:** Gather evidence and identify root cause.

**Inputs:**
- User description of the issue
- Existing memory (patterns.md for similar issues)
- Logs, error messages, stack traces

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
  evidence_collected: list[str]
  root_cause: str
  reproduction_steps: list[str]
  next_phase: FIX
```

#### DEBUG Phase 2: Fix (Builder)
**Purpose:** Implement fix with regression test.

**Inputs:**
- Root cause from Investigation
- Reproduction steps

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
  regression_test: path/to/test
  fix_applied: true
  test_status: PASS
  previous_phase: INVESTIGATION
  next_phase: VALIDATION
```

#### DEBUG Phase 3: Validation (Harness)
**Purpose:** Verify fix works and doesn't break anything.

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
  regression_test: PASS
  full_test_suite: PASS
  previous_phase: FIX
  next_phase: CLOSURE
```

#### DEBUG Phase 4: Closure (Librarian)
**Purpose:** Document findings and update memory.

**Inputs:**
- Completed debug session
- Evidence and root cause

**Outputs:**
- Memory update: Add to patterns.md (Gotchas)
- Git commit (optional)

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: DEBUG
  phase: CLOSURE
  memory_updated: true
  patterns_updated: true
  git_commit: optional
  previous_phase: VALIDATION
  next_action: none
```

---

### 4.3 REVIEW Workflow
**Purpose:** Review code for quality, security, and correctness with confidence scoring.

**Trigger:** Router detects REVIEW intent or user invokes via `/router --workflow=review`.

**Agent Chain:**
```
Code-Reviewer (Single Agent)
```

**Key Features:**
- Confidence scoring (≥80 to report)
- Two-stage review (spec compliance → quality)
- CRITICAL issues block shipping

#### REVIEW Phase 1: Scope (Code-Reviewer)
**Purpose:** Clarify review scope with user if needed.

**Inputs:**
- User request
- Code to review (files or PR)

**Outputs:**
- Review scope definition (files, focus areas)

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: SCOPE
  files_reviewed: list[str]
  focus_areas: list[str]
  next_phase: ANALYSIS
```

#### REVIEW Phase 2: Analysis (Code-Reviewer)
**Purpose:** Analyze code for issues.

**Inputs:**
- Code files
- Review scope
- Git context (recent changes, blame)

**Outputs:**
- Issues found (with confidence scores)
- CRITICAL issues identified

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: ANALYSIS
  critical_issues: int
  important_issues: int
  minor_issues: int
  confidence_threshold: 80
  blocking: true | false
  next_phase: REPORT
```

#### REVIEW Phase 3: Report (Code-Reviewer)
**Purpose:** Generate review report.

**Inputs:**
- Analysis results

**Outputs:**
- Review report with:
  - Summary (functionality, verdict)
  - CRITICAL issues (≥80 confidence)
  - Important issues (≥80 confidence)
  - Findings

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: REPORT
  verdict: APPROVE | CHANGES_REQUESTED | BLOCK
  issues_reported: int
  critical_blocking: true | false
  previous_phase: ANALYSIS
  next_action: none
```

---

### 4.4 Gate Enforcement

| Gate | Required Before | Criteria |
|------|-----------------|----------|
| **BUILD Discovery Gate** | Architecture | User approves REQ-*.md |
| **BUILD Architecture Gate** | Implementation | User approves TECHSPEC-*.md |
| **BUILD Implementation Gate** | Validation | Code complete + tests pass |
| **BUILD Validation Gate** | Closure | `validate.py --full` passes |
| **DEBUG Investigation Gate** | Fix | Evidence collected + root cause identified |
| **DEBUG Fix Gate** | Validation | Regression test written + fix applied |
| **DEBUG Validation Gate** | Closure | All tests pass |
| **REVIEW Scope Gate** | Analysis | Scope defined |
| **REVIEW Analysis Gate** | Report | Analysis complete |
| **REVIEW Report Gate** | Done | Report generated |

## 5. Functional Requirements

### FR-1: BUILD Workflow Template
Formalize the existing BUILD workflow with all 5 phases.

**Acceptance:**
- Workflow definition exists in `docs/workflows/BUILD.md`.
- Template includes all 5 phases with inputs, outputs, and contracts.

### FR-2: DEBUG Workflow Template
Create DEBUG workflow with Investigation → Fix → Validation → Closure.

**Acceptance:**
- Workflow definition exists in `docs/workflows/DEBUG.md`.
- LOG FIRST approach enforced (evidence before fix).
- Regression test required before fix.

### FR-3: REVIEW Workflow Template
Create REVIEW workflow with Scope → Analysis → Report.

**Acceptance:**
- Workflow definition exists in `docs/workflows/REVIEW.md`.
- Confidence scoring (≥80 to report).
- CRITICAL issues block shipping.

### FR-4: Phase Contracts
Each phase outputs a YAML contract per the spec above.

**Acceptance:**
- BUILD: Oracle (Discovery), Oracle (Architecture), Builder (Implementation), Harness (Validation), Librarian (Closure) all output contracts.
- DEBUG: Bug-Investigator (Investigation), Builder (Fix), Harness (Validation), Librarian (Closure) all output contracts.
- REVIEW: Code-Reviewer (Scope), Code-Reviewer (Analysis), Code-Reviewer (Report) all output contracts.

### FR-5: Gate Enforcement
Gates prevent progression until criteria are met.

**Acceptance:**
- BUILD: Discovery → Architecture (user approval), Architecture → Implementation (user approval), Implementation → Validation (tests pass), Validation → Closure (validate.py --full passes).
- DEBUG: Investigation → Fix (evidence + root cause), Fix → Validation (regression test), Validation → Closure (all tests pass).
- REVIEW: Scope → Analysis (scope defined), Analysis → Report (analysis complete).

### FR-6: Router Integration
Router can invoke BUILD, DEBUG, and REVIEW workflows.

**Acceptance:**
- Router detects BUILD intent → outputs BUILD workflow.
- Router detects DEBUG intent → outputs DEBUG workflow.
- Router detects REVIEW intent → outputs REVIEW workflow.
- `/router --workflow=build|debug|review` works.

### FR-7: Memory Integration
Memory is LOADed at workflow start and UPDATED at workflow end.

**Acceptance:**
- At workflow start: READ `.opencode/context/01_memory/*`
- At workflow end: UPDATE `.opencode/context/01_memory/*`
- DEBUG workflow adds findings to patterns.md (Gotchas).

### FR-8: Workflow Documentation
All workflows are documented in `docs/workflows/`.

**Acceptance:**
- `docs/workflows/BUILD.md` exists.
- `docs/workflows/DEBUG.md` exists.
- `docs/workflows/REVIEW.md` exists.

## 6. Constraints & Standards
- All workflow artifacts under `.opencode/`.
- Follow existing naming conventions (REQ-*, TECHSPEC-*).
- Memory files follow existing structure.
- No new libraries without RFC.
- Parallel execution deferred to Phase 2.
- Circuit breaker deferred to Phase 2.

## 7. Acceptance Criteria
1) BUILD, DEBUG, and REVIEW workflow templates exist and are documented.
2) YAML contracts for all phases exist.
3) Gate enforcement prevents phase skipping.
4) Router can invoke all three workflows.
5) Memory LOAD at start / UPDATE at end.
6) DEBUG workflow enforces LOG FIRST and regression tests.
7) REVIEW workflow enforces confidence scoring (≥80).
8) Validation harness passes.

## 8. Risks & Open Issues
- **Complexity:** Adding contracts/gates may slow down simple workflows.
- **User friction:** Gates require explicit approval; users may find this tedious.
- **Tooling:** Existing tools (validate.py) must output contracts.

## 9. Risks & Mitigations (Multi-Perspective Audit)
### User Perspective
- **Risk:** Gates feel bureaucratic for small tasks.  
  **Mitigation:** Allow bypass flag for trivial changes (e.g., `/router --workflow=build --bypass-gates`).

### Security Perspective
- **Risk:** Contract validation could be bypassed.  
  **Mitigation:** Contracts are read-only outputs; gates check file existence.

### SRE Perspective
- **Risk:** Contract generation fails, blocking workflow.  
  **Mitigation:** Fallback to "manual approval" if contract generation fails.

### Legal/Compliance Perspective
- **Risk:** None identified. Workflow is internal orchestration only.

## 10. Intent Alignment Notes (rm-validate-intent)
- Confirmed: Formalize existing BUILD workflow with contracts and gates.
- Confirmed: Add DEBUG workflow (LOG FIRST, regression tests).
- Confirmed: Add REVIEW workflow (confidence scoring ≥80).
- Confirmed: Integrate all workflows with Router.
- Confirmed: Memory LOAD/UPDATE at workflow boundaries.
- Deferred: Parallel execution (future phase).
- Deferred: Circuit breaker (future phase).
