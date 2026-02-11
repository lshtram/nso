# REVIEW Workflow

**Purpose:** Review code for quality, security, and correctness with confidence scoring.

**Trigger:** Router detects REVIEW intent or user invokes `/router --workflow=review`.

---

## Agent Chain

```
Janitor (Scope, Analysis, Report, using Code-Reviewer skill)
```

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| Scope | Janitor | Define review boundaries |
| Analysis | Janitor | Code analysis, issue identification |
| Report | Janitor | Generate review report |
| Closure | Librarian | Memory persistence |

**Note:** Code-Reviewer is a **skill** used by the Janitor, not a separate agent.

---

## Key Principles

- **Confidence Scoring:** Only report issues with ≥80 confidence
- **Two-Stage Review:** Spec compliance → Quality
- **CRITICAL Blocking:** Security/correctness issues block shipping
- **Git Context:** Recent changes and blame inform review

---

## Phase 1: Scope (Janitor)

**Agent:** The Janitor

**Skills Used:**
- `code-reviewer` - Scope definition

**Inputs:**
- User request
- Code to review (files or PR)
- Git context (recent changes, blame)

**Outputs:**
- Review scope definition (files, focus areas)

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: SCOPE
  agent: Janitor
  files_reviewed:
    - "src/auth.py"
    - "src/login.py"
  focus_areas:
    - "security"
    - "performance"
  blocking_threshold: "CRITICAL" | "ALL"
  next_phase: ANALYSIS
```

**Gate:** Scope defined (files + focus areas) before proceeding to Analysis.

---

## Phase 2: Analysis (Janitor)

**Agent:** The Janitor

**Skills Used:**
- `code-reviewer` - Confidence scoring, issue identification

**Inputs:**
- Code files
- Review scope
- Git context (recent changes, blame)

**Outputs:**
- Issues found (with confidence scores)
- CRITICAL issues identified

**Confidence Scoring:**
| Evidence Type | Confidence Points |
|--------------|-------------------|
| Clear error/exception | 30 |
| Test failure | 25 |
| Static analysis finding | 20 |
| Code inspection | 15 |
| Heuristic/pattern match | 10 |

**Reporting threshold:** ≥80 points

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: ANALYSIS
  agent: Janitor
  files_reviewed:
    - "src/auth.py"
    - "src/login.py"
  critical_issues: 1
  important_issues: 3
  minor_issues: 5
  confidence_threshold: 80
  blocking: true | false
  next_phase: REPORT
```

**Gate:** Analysis complete before proceeding to Report.

---

## Phase 3: Report (Janitor)

**Agent:** The Janitor

**Skills Used:**
- `code-reviewer` - Report generation

**Inputs:**
- Analysis results

**Outputs:**
- Review report with verdict and findings

**Verdict Logic:**
```
IF critical_issues > 0:
    verdict = BLOCK
    blocking = true
ELIF important_issues > 0 OR minor_issues > 0:
    verdict = CHANGES_REQUESTED
    blocking = false
ELSE:
    verdict = APPROVE
    blocking = false
```

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: REPORT
  agent: Janitor
  verdict: APPROVE | CHANGES_REQUESTED | BLOCK
  issues_reported: 9
  critical_blocking: true | false
  summary: "Code review for authentication module"
  critical_issues:
    - file: "src/auth.py"
      line: 42
      type: "security"
      message: "SQL injection vulnerability"
      confidence: 95
      recommendation: "Use parameterized queries"
  important_issues:
    - file: "src/session.py"
      line: 15
      type: "performance"
      message: "N+1 query pattern"
      confidence: 85
      recommendation: "Use eager loading"
  minor_issues:
    - file: "src/auth.py"
      line: 100
      type: "style"
      message: "Variable naming could be improved"
      confidence: 70
  positive_findings:
    - "Good test coverage (>80%)"
    - "Clean separation of concerns"
  next_action: none
```

**Gate:** Report generated with verdict before completion.

---

## Phase 4: Closure (Librarian)

**Agent:** The Librarian

**Skills Used:**
- `memory-update` - Refresh memory files

**Inputs:**
- Completed review
- Issues found
- Patterns identified

**Outputs:**
- Memory update: patterns.md (new patterns)
- Memory update: progress.md (review completed)

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: REVIEW
  phase: CLOSURE
  agent: Librarian
  memory_updated: true
  patterns_updated: true
  previous_phase: REPORT
  next_action: none
```

**No gate:** Closure is the final phase.

---

## Gate Summary

| From → To | Gate | Criteria |
|-----------|------|----------|
| Scope → Analysis | Scope Gate | Scope defined (files + focus areas) |
| Analysis → Report | Analysis Gate | Analysis complete |
| Report → Closure | Report Gate | Report generated with verdict |

---

## Task Delegation Pattern

```python
# Oracle delegates to Janitor (full REVIEW workflow)
task(
    agent="Janitor",
    prompt="Review the authentication module code. Focus on security and performance. Generate a review report with confidence scoring."
)

# Oracle delegates to Librarian (Closure)
task(
    agent="Librarian",
    prompt="Update memory after code review. Add any new patterns to patterns.md and add review to progress.md."
)
```

---

## Issue Categories

### CRITICAL (Blocks Shipping)
- Security vulnerabilities (SQL injection, XSS, etc.)
- Correctness bugs (data corruption, crashes)
- Compliance violations
- Authentication/authorization bypasses

### IMPORTANT (Should Fix)
- Performance concerns (N+1 queries, inefficient algorithms)
- Maintainability issues (complex code, poor naming)
- Resource leaks (connections, file handles)
- Error handling gaps

### MINOR (Nice to Fix)
- Code style violations
- Minor documentation issues
- Cosmetic improvements
- Deprecated API usage

---

## References

- Requirements: `docs/requirements/REQ-NSO-BUILD-Workflow.md`
- Tech Spec: `docs/architecture/TECHSPEC-NSO-WorkflowSystem.md`
- Code-Reviewer Skill: `.opencode/skills/code-reviewer/SKILL.md`
- Router: `.opencode/skills/router/scripts/router_logic.py`
- Agents: `.opencode/AGENTS.md`
