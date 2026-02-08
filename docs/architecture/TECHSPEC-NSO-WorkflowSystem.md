# Tech Spec: NSO Workflow System (BUILD + DEBUG + REVIEW)

## 1. Scope
Implement a unified workflow system with three workflows: BUILD (formalized), DEBUG (new), and REVIEW (new). Each workflow has defined phases, YAML contracts, gate enforcement, and router integration. Parallel execution and circuit breaker are deferred to Phase 2.

## 2. Architecture Overview

### 2.1 Workflow Directory Structure
```
.opencode/docs/workflows/
  ├── BUILD.md         # BUILD workflow definition
  ├── DEBUG.md         # DEBUG workflow definition
  └── REVIEW.md        # REVIEW workflow definition

.opencode/skills/
  ├── router/          # Router (already implemented)
  │   └── scripts/
  │       └── router_logic.py
  ├── bug-investigator/    # DEBUG workflow agent (new)
  │   └── SKILL.md
  └── code-reviewer/       # REVIEW workflow agent (new)
      └── SKILL.md
```

### 2.2 Workflow Execution Model
```
User Request
    ↓
Router (Intent Detection)
    ↓
┌─────────────────────────────┐
│ BUILD Workflow             │ ← build, implement, create, feature, etc.
│ DEBUG Workflow             │ ← debug, fix, error, bug, etc.
│ REVIEW Workflow           │ ← review, audit, check, analyze, etc.
└─────────────────────────────┘
    ↓
Phase Execution (Sequential)
    ↓
YAML Contract Output
    ↓
Gate Validation
    ↓
Memory LOAD → UPDATE
    ↓
Workflow Complete
```

## 3. Component Specification

### 3.1 BUILD Workflow Template

**File:** `.opencode/docs/workflows/BUILD.md`

```markdown
# BUILD Workflow

**Purpose:** Implement new features from requirements to deployment.

**Trigger:** Router detects BUILD intent or user invokes `/router --workflow=build`.

## Phase 1: Discovery (Oracle)
**Inputs:** User request, memory files, context files
**Outputs:** REQ-*.md, user approval required

## Phase 2: Architecture (Oracle)
**Inputs:** Approved REQ-*.md, context files
**Outputs:** TECHSPEC-*.md, user approval required

## Phase 3: Implementation (Builder)
**Inputs:** Approved TECHSPEC-*.md
**Outputs:** Code, tests (TDD: RED → GREEN → REFACTOR)

## Phase 4: Validation (Harness)
**Inputs:** Implemented code + tests
**Outputs:** validate.py --full passes

## Phase 5: Closure (Librarian)
**Inputs:** Completed workflow
**Outputs:** Memory updated, git commit (optional)

## Gates
| From → To | Gate |
|-----------|------|
| Discovery → Architecture | User approves REQ-*.md |
| Architecture → Implementation | User approves TECHSPEC-*.md |
| Implementation → Validation | Tests pass, validate.py --fast passes |
| Validation → Closure | validate.py --full passes |

## Contract Template
```yaml
router_contract:
  status: IN_PROGRESS | COMPLETE | BLOCKED
  workflow: BUILD
  phase: DISCOVERY | ARCHITECTURE | IMPLEMENTATION | VALIDATION | CLOSURE
  artifact: REQ-*.md | TECHSPEC-*.md | src/ | validate.py output
  approval: pending | approved
  test_status: pending | PASS
  validation_status: pending | PASS
  memory_updated: false | true
```
```

### 3.2 DEBUG Workflow Template

**File:** `.opencode/docs/workflows/DEBUG.md`

```markdown
# DEBUG Workflow

**Purpose:** Investigate and fix bugs/issues systematically with LOG FIRST approach.

**Trigger:** Router detects DEBUG intent or user invokes `/router --workflow=debug`.

## Phase 1: Investigation (Bug-Investigator)
**Inputs:** User description, logs, error messages, memory (patterns.md)
**Outputs:** Evidence summary, root cause hypothesis, reproduction steps

**Key Requirements:**
- LOG FIRST: Gather evidence before hypothesizing
- Check memory for similar issues
- Document all evidence

## Phase 2: Fix (Builder)
**Inputs:** Root cause, reproduction steps
**Outputs:** Regression test (MUST fail before fix), fix implementation

**Key Requirements:**
- Write regression test first (MUST fail)
- Implement minimal fix
- Verify test passes after fix

## Phase 3: Validation (Harness)
**Inputs:** Fixed code, regression test
**Outputs:** All tests pass, no new failures

**Key Requirements:**
- Run full test suite
- Verify no regressions
- Document findings

## Phase 4: Closure (Librarian)
**Inputs:** Completed debug session
**Outputs:** Memory updated (patterns.md), git commit (optional)

**Key Requirements:**
- Add findings to patterns.md (Gotchas)
- Update progress.md
- Optionally commit fix

## Gates
| From → To | Gate |
|-----------|------|
| Investigation → Fix | Evidence collected + root cause identified |
| Fix → Validation | Regression test written + fix applied + test passes |
| Validation → Closure | All tests pass |

## Contract Template
```yaml
router_contract:
  status: IN_PROGRESS | COMPLETE | BLOCKED
  workflow: DEBUG
  phase: INVESTIGATION | FIX | VALIDATION | CLOSURE
  evidence_collected: list[str]
  root_cause: str
  reproduction_steps: list[str]
  regression_test: path/to/test
  fix_applied: false | true
  test_status: pending | PASS
  memory_updated: false | true
  patterns_updated: false | true
```
```

### 3.3 REVIEW Workflow Template

**File:** `.opencode/docs/workflows/REVIEW.md`

```markdown
# REVIEW Workflow

**Purpose:** Review code for quality, security, and correctness with confidence scoring.

**Trigger:** Router detects REVIEW intent or user invokes `/router --workflow=review`.

## Phase 1: Scope (Code-Reviewer)
**Inputs:** User request, code to review
**Outputs:** Review scope definition (files, focus areas)

**Key Requirements:**
- Clarify scope with user if needed
- Define focus areas (security, quality, performance, all)

## Phase 2: Analysis (Code-Reviewer)
**Inputs:** Code files, review scope, git context
**Outputs:** Issues found with confidence scores

**Key Requirements:**
- Confidence scoring: Only report issues ≥80
- Two-stage review: Spec compliance → Quality
- Check git context (recent changes, blame)

## Phase 3: Report (Code-Reviewer)
**Inputs:** Analysis results
**Outputs:** Review report

**Key Requirements:**
- CRITICAL issues block shipping
- Report only issues with ≥80 confidence
- Include findings summary

## Gates
| From → To | Gate |
|-----------|------|
| Scope → Analysis | Scope defined |
| Analysis → Report | Analysis complete |
| Report → Done | Report generated |

## Contract Template
```yaml
router_contract:
  status: IN_PROGRESS | COMPLETE | BLOCKED
  workflow: REVIEW
  phase: SCOPE | ANALYSIS | REPORT
  files_reviewed: list[str]
  focus_areas: list[str]
  critical_issues: int
  important_issues: int
  minor_issues: int
  confidence_threshold: 80
  verdict: APPROVE | CHANGES_REQUESTED | BLOCK
  blocking: false | true
```
```

### 3.4 Bug-Investigator Skill

**File:** `.opencode/skills/bug-investigator/SKILL.md`

```yaml
---
name: bug-investigator
description: Investigate bugs with LOG FIRST approach, regression tests, and variant coverage.
---

# Role
Debug Agent

# Trigger
- User invokes DEBUG workflow.
- Router routes DEBUG intent to bug-investigator.

# Inputs
- User description of the issue
- Logs, error messages, stack traces
- Existing memory (patterns.md)
- Git context (recent changes)

# Outputs
- Evidence summary
- Root cause hypothesis
- Reproduction steps
- Router contract (YAML)

# Steps
## 1. LOAD Memory
Read `.opencode/context/01_memory/patterns.md` for similar issues.

## 2. Gather Evidence
Collect:
- Error messages
- Stack traces
- Log files
- Reproduction steps from user

## 3. Identify Root Cause
Analyze evidence to identify root cause.

## 4. Create Reproduction Steps
Write minimal reproduction steps.

## 5. Output Contract
Generate YAML contract with:
- evidence_collected
- root_cause
- reproduction_steps
```

### 3.5 Code-Reviewer Skill

**File:** `.opencode/skills/code-reviewer/SKILL.md`

```yaml
---
name: code-reviewer
description: Review code with confidence scoring (≥80), two-stage review, and CRITICAL issue blocking.
---

# Role
Review Agent

# Trigger
- User invokes REVIEW workflow.
- Router routes REVIEW intent to code-reviewer.

# Inputs
- User request for review
- Code files or PR
- Git context (recent changes, blame)

# Outputs
- Review report
- Issues found (with confidence scores)
- Router contract (YAML)

# Steps
## 1. Clarify Scope (if needed)
Ask user for:
- Files to review
- Focus areas (security, quality, performance, all)
- Blocking threshold (all issues or only CRITICAL)

## 2. Analyze Code
Two-stage review:
- Stage 1: Spec compliance (does it meet requirements?)
- Stage 2: Code quality (readability, performance, security)

## 3. Score Issues
Confidence scoring:
- Only report issues ≥80 confidence
- CRITICAL issues (security, correctness) block shipping
- IMPORTANT issues (performance, maintainability)
- MINOR issues (style, minor bugs)

## 4. Generate Report
Output review report with:
- Verdict (APPROVE | CHANGES_REQUESTED | BLOCK)
- Issues found (grouped by severity)
- Recommendations
```

## 4. Router Integration

### 4.1 Updated Router Logic
The router already exists (`.opencode/skills/router/scripts/router_logic.py`). Update to support workflow selection:

```python
# Updated route_request function to return workflow
def route_request(request: str) -> RoutingDecision:
    workflow = detect_workflow(request)
    # ... existing logic ...
    return RoutingDecision(
        workflow=workflow,
        # ...
    )
```

### 4.2 Router Command Update
```json
{
  "command": {
    "router": {
      "description": "Activate the Intelligent Router for workflow selection",
      "template": "Activate router skill with the following request: {{args}}",
      "agent": "Oracle"
    }
  }
}
```

## 5. Memory Integration

### 5.1 Memory LOAD Protocol
```python
def load_memory() -> dict[str, str]:
    """Load existing memory files for workflow context."""
    memory_dir = Path(".opencode/context/01_memory")
    memory = {}
    
    for filename in ["active_context.md", "patterns.md", "progress.md"]:
        filepath = memory_dir / filename
        if filepath.exists():
            memory[filename] = filepath.read_text()
    
    return memory
```

### 5.2 Memory UPDATE Protocol
```python
def update_memory(workflow: str, phase: str, outcome: dict):
    """Update memory files after workflow completion."""
    # Add to active_context.md
    # Add to patterns.md (if DEBUG, add to Gotchas)
    # Add to progress.md (verified deliverables)
```

## 6. Gate Enforcement

### 6.1 Gate Check Logic
```python
def check_gate(workflow: str, phase: str, contract: dict) -> tuple[bool, str]:
    """
    Check if gate criteria are met.
    
    Returns:
        Tuple of (gate_passed: bool, reason: str)
    """
    gates = {
        ("BUILD", "DISCOVERY"): lambda c: c.get("approval") == "approved",
        ("BUILD", "ARCHITECTURE"): lambda c: c.get("approval") == "approved",
        ("BUILD", "VALIDATION"): lambda c: c.get("test_status") == "PASS",
        ("DEBUG", "FIX"): lambda c: c.get("regression_test") and c.get("fix_applied"),
        ("REVIEW", "ANALYSIS"): lambda c: c.get("files_reviewed"),
    }
    
    gate_func = gates.get((workflow, phase))
    if gate_func:
        return gate_func(contract), f"Gate check for {workflow}/{phase}"
    
    return True, "No gate for this phase"
```

## 7. Testing Strategy

### 7.1 Unit Tests
| Test | Coverage Target |
|------|----------------|
| Workflow detection (BUILD/DEBUG/REVIEW) | 100% |
| Gate enforcement logic | 100% |
| Contract generation | 100% |
| Memory LOAD/UPDATE | 100% |
| Bug-investigator logic | 100% |
| Code-reviewer logic | 100% |

### 7.2 Integration Tests
| Test | Coverage Target |
|------|----------------|
| Full BUILD workflow | Mocked phases |
| Full DEBUG workflow | Mocked phases |
| Full REVIEW workflow | Mocked phases |
| Router → Workflow routing | Full path |

## 8. Validation & Acceptance
1) BUILD, DEBUG, and REVIEW workflow templates exist.
2) YAML contracts for all phases exist.
3) Gate enforcement prevents phase skipping.
4) Router can invoke all three workflows.
5) Memory LOAD at start / UPDATE at end.
6) DEBUG workflow enforces LOG FIRST and regression tests.
7) REVIEW workflow enforces confidence scoring (≥80).
8) Validation harness passes.

## 9. Risks & Mitigations
- **Complexity:** Multiple workflows increase system complexity.  
  **Mitigation:** Keep workflows simple and well-documented.

- **Tooling:** Existing tools must output contracts.  
  **Mitigation:** Contracts are simple YAML; easy to generate.

- **User friction:** Gates may slow down simple workflows.  
  **Mitigation:** Allow bypass flag for trivial changes (future).

## 10. Architecture Review Log (Checklist)
**Simplicity:** Three simple workflows with clear phases. ✔️

**Modularity:** Workflows are isolated; easy to modify. ✔️

**Abstraction Boundaries:** Router → Workflow → Phase → Agent. ✔️

**YAGNI:** No parallel execution or circuit breaker in Phase 1. ✔️
