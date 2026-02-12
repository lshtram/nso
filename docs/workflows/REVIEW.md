# REVIEW Workflow

**Purpose:** Review code for quality, security, and correctness with confidence scoring.

**Trigger:** User requests a code review, or Oracle detects REVIEW intent.

---

## Agent Chain

```
CodeReviewer (Scope → Analysis → Report) → Oracle (Summary) → Librarian (Closure)
```

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| 1. Scope | CodeReviewer | Define review boundaries |
| 2. Analysis | CodeReviewer | Code analysis, issue identification |
| 3. Report | CodeReviewer | Generate review report with verdict |
| 4. Closure | Librarian | Memory persistence |

**Note:** CodeReviewer is the PRIMARY agent for REVIEW workflow. It is a dedicated agent (not a skill on Janitor).

---

## Key Principles

- **Confidence Scoring:** Only report issues with ≥80 confidence
- **Two-Stage Review:** Spec compliance → Code quality
- **CRITICAL Blocking:** Security/correctness issues block shipping
- **Anti-Performative Agreement:** Technical acknowledgment only, no rubber-stamping
- **Mandatory Positive Findings:** Every review MUST include what was done well

---

## Phase 1: Scope (CodeReviewer)

**Agent:** CodeReviewer (`task(subagent_type="CodeReviewer")`)

**Skills Used:**
- `code-reviewer` — Scope definition, focus area identification

**Inputs:**
- User request (files, PR, or general scope)
- Git context (recent changes, blame, diff)
- TECHSPEC if available (for spec compliance)

**Process:**
1. Identify files to review (from user request or git diff)
2. Determine focus areas (security, performance, maintainability, etc.)
3. Load TECHSPEC if referenced for spec compliance stage
4. Define blocking threshold

**Outputs:**
- Review scope (files + focus areas)

---

## Phase 2: Analysis (CodeReviewer)

**Skills Used:**
- `code-reviewer` — Confidence scoring, issue identification

**Inputs:**
- Code files within scope
- Git context (blame, history)
- TECHSPEC (if available)

**Process:**

### Stage 1: Spec Compliance (if TECHSPEC available)
- Every TECHSPEC requirement maps to implementation
- Identify any unmet requirements
- Flag any deviations from architecture

### Stage 2: Code Quality
- Security review (injection, auth bypass, data exposure)
- Correctness review (logic errors, edge cases, error handling)
- Performance review (N+1 queries, unnecessary allocations, blocking I/O)
- Maintainability review (naming, complexity, coupling)

**Confidence Scoring:**
| Evidence Type | Confidence Points |
|--------------|-------------------|
| Clear error/exception path | 30 |
| Test failure reproduction | 25 |
| Static analysis finding | 20 |
| Code inspection (provable) | 15 |
| Heuristic/pattern match | 10 |

**Reporting Threshold:** ≥80 points. Issues below threshold are NOT reported.

---

## Phase 3: Report (CodeReviewer)

**Inputs:**
- Analysis results from Stage 1 and Stage 2

**Verdict Logic:**
```
IF critical_issues > 0:
    verdict = BLOCK
ELIF important_issues > 0:
    verdict = CHANGES_REQUESTED
ELIF minor_issues > 0:
    verdict = APPROVE_WITH_NOTES
ELSE:
    verdict = APPROVE
```

**Output Format (`result.md`):**
```yaml
review_result:
  verdict: APPROVE | APPROVE_WITH_NOTES | CHANGES_REQUESTED | BLOCK
  files_reviewed: ["src/auth.ts", "src/login.ts"]
  spec_compliance: PASS | FAIL | N/A
  critical_issues:
    - file: "src/auth.ts"
      line: 42
      severity: CRITICAL
      type: "security"
      message: "SQL injection vulnerability via unparameterized query"
      confidence: 95
      recommendation: "Use parameterized queries"
  important_issues:
    - file: "src/session.ts"
      line: 15
      severity: IMPORTANT
      type: "performance"
      message: "N+1 query pattern in user loading"
      confidence: 85
      recommendation: "Use eager loading or batch query"
  minor_issues:
    - file: "src/auth.ts"
      line: 100
      severity: MINOR
      type: "maintainability"
      message: "Variable name 'x' is unclear"
      confidence: 82
      recommendation: "Rename to 'authToken'"
  positive_findings:
    - "Good test coverage (>80%)"
    - "Clean separation of concerns in auth module"
    - "Proper error handling in session management"
```

---

## Phase 4: Closure (Librarian)

**Agent:** Librarian (`task(subagent_type="Librarian")`)

**Skills Used:**
- `memory-update` — Refresh memory files
- `post-mortem` — Pattern detection from review findings

**Inputs:**
- Completed review report
- Issues found and patterns identified

**Process:**
1. Update `patterns.md` with any new patterns discovered
2. Update `progress.md` with review record
3. If recurring issues found, propose NSO improvement

**Outputs:**
- Updated memory files

**No gate:** Closure is the final phase.

---

## Gate Summary

| From → To | Gate | Criteria |
|-----------|------|----------|
| Scope → Analysis | Scope Gate | Files and focus areas defined |
| Analysis → Report | Analysis Gate | All files analyzed, confidence scores calculated |
| Report → Closure | Verdict Gate | Verdict determined, report written |

---

## Issue Categories

### CRITICAL (Blocks Shipping)
- Security vulnerabilities (injection, XSS, auth bypass)
- Correctness bugs (data corruption, crashes, data loss)
- Compliance violations
- Authentication/authorization bypasses

### IMPORTANT (Should Fix)
- Performance concerns (N+1 queries, blocking I/O, memory leaks)
- Maintainability issues (high complexity, tight coupling)
- Resource leaks (connections, file handles, event listeners)
- Error handling gaps (empty catches, swallowed errors)

### MINOR (Nice to Fix)
- Code style inconsistencies
- Minor documentation gaps
- Deprecated API usage
- Naming improvements

---

## Task Delegation Pattern

```python
# Oracle → CodeReviewer (full REVIEW workflow)
task(
    subagent_type="CodeReviewer",
    prompt="Read review_contract.md at .opencode/context/active_tasks/[review]/. "
           "Review the specified code. Apply two-stage review (spec compliance → quality). "
           "Use confidence scoring. Write result.md with verdict and findings."
)

# Oracle → Librarian (Closure)
task(
    subagent_type="Librarian",
    prompt="Update memory after code review. Add patterns to patterns.md. "
           "Update progress.md with review record. Write result.md."
)
```

---

## References

- CodeReviewer Prompt: `~/.config/opencode/nso/prompts/CodeReviewer.md`
- Code Reviewer Skill: `~/.config/opencode/nso/skills/code-reviewer/SKILL.md`
- Agent Reference: `~/.config/opencode/nso/docs/NSO-AGENTS.md`
- Configuration: `~/.config/opencode/opencode.json`
