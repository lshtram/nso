# Neuro-Symbolic Orchestrator: System Architecture v2.0

**Version:** 2.0.0  
**Date:** 2026-02-12  
**Status:** Production Ready

---

## Executive Summary

NSO v2.0 is a **8-agent orchestration system** built on OpenCode that enforces:
- **Quality:** TDD + spec compliance + independent code review
- **Process:** 3 workflows (BUILD/DEBUG/REVIEW) with mandatory gates
- **Evolution:** Post-mortem analysis + pattern detection + self-improvement

**Key Innovation:** Split validation into two stages:
1. **Janitor** validates spec compliance + automated harness
2. **CodeReviewer** independently reviews code quality

---

## 1. Core Philosophy: Quality Through Process

### 1.1 Test-Driven Development (TDD)
- **RED** → Write failing test
- **GREEN** → Make it pass
- **REFACTOR** → Improve code
- **Enforced by:** `tdd` skill, Builder prompt, Janitor validation

### 1.2 Evidence-Based Completion
- No "I think it works" or "should pass"
- All claims backed by test output or tool evidence
- **Enforced by:** `verification-gate` skill, anti-performative protocol

### 1.3 Systematic Debugging
- **LOG FIRST** — Add diagnostic logging before hypothesizing
- **Backward data flow** — Trace from symptom to root cause
- **3-fix escalation** — Same area fails 3x → architectural problem
- **Enforced by:** `systematic-debugging` and `bug-investigator` skills

### 1.4 Independent Validation
- Builder writes code → Janitor validates spec → CodeReviewer audits quality
- No self-review
- **Enforced by:** Agent boundaries in `instructions.md`

### 1.5 Continuous Improvement
- Every workflow ends with post-mortem analysis
- Pattern detection and learning
- User approval before applying improvements
- **Enforced by:** `post-mortem` skill, Librarian closure protocol

---

## 2. Architecture Components

### 2.1 The 8 Agents

```
Oracle ────────────┐
   ├── Analyst     │ Discovery & Investigation
   ├── Builder     │ Implementation
   ├── Designer    │ Frontend/UX
   ├── Janitor     │ Validation (Stage A: Spec, Stage B: Harness)
   ├── CodeReviewer│ Quality Audit (Stage: Independent Review)
   ├── Librarian   │ Knowledge Management
   └── Scout       │ External Research
```

**Role Separation:**
- **Oracle** = Architect (designs, doesn't code)
- **Analyst** = Mastermind (discovers, doesn't implement)
- **Builder** = Engineer (codes, doesn't review)
- **Janitor** = QA (validates, doesn't fix)
- **CodeReviewer** = Auditor (reviews, doesn't implement)

### 2.2 The 20 Skills

**New in v2.0 (4):**
- `tdd` — TDD enforcement with rationalization prevention
- `systematic-debugging` — 4-phase debugging methodology
- `verification-gate` — Evidence-based completion
- `post-mortem` — Session analysis + pattern detection

**Kept (16):**
- Requirements: `rm-intent-clarifier`, `rm-validate-intent`, `rm-multi-perspective-audit`
- Architecture: `architectural-review`, `router`, `skill-creator`
- Code: `minimal-diff-generator`
- Quality: `silent-failure-hunter`, `traceability-linker`, `integration-verifier`, `code-reviewer`
- Debug: `bug-investigator`
- Memory: `memory-update`, `archive-conversation`
- Research: `tech-radar-scan`

**Deleted (12):**
- Superseded by new skills or consolidated into `post-mortem`

### 2.3 The 3 Workflows

#### BUILD: Feature Development (7 phases)
```
Phase 0: Worktree (Oracle) → isolation
Phase 1: Discovery (Analyst) → REQ document → USER APPROVAL
Phase 2: Architecture (Oracle) → TECHSPEC → USER APPROVAL
Phase 3: Implementation (Builder) → TDD code + tests
Phase 4A: Validation (Janitor) → spec compliance + harness
Phase 4B: Code Review (CodeReviewer) → quality audit
Accountability: Oracle presents results → USER APPROVAL
Phase 5: Closure (Librarian) → post-mortem + memory
```

#### DEBUG: Bug Fixing (5 phases)
```
Phase 1: Investigation (Analyst) → LOG FIRST, evidence collection
Phase 2: Triage (Oracle) → assess scope, check 3-fix escalation
Phase 3: Fix (Builder) → regression test (must fail) → minimal fix
Phase 4: Validation (Janitor) → regression verification + harness
Phase 5: Closure (Librarian) → Gotcha documentation + post-mortem
```

#### REVIEW: Code Quality (4 phases)
```
Phase 1: Scope (CodeReviewer) → define files + focus areas
Phase 2: Analysis (CodeReviewer) → spec compliance + quality check
Phase 3: Report (CodeReviewer) → verdict + confidence scores
Phase 4: Closure (Librarian) → pattern documentation
```

---

## 3. Quality Gates

### 3.1 User Approval Gates (3)
1. **After Discovery** — User approves REQ document
2. **After Architecture** — User approves TECHSPEC
3. **After Quality Review** — User approves code quality before commit

### 3.2 Process Gates (4)
1. **Worktree Safety** — `.gitignore` check, base branch up-to-date, baseline tests pass
2. **Test Gate (Builder → Janitor)** — All tests pass, Builder shows evidence
3. **Validation Gate (Janitor → CodeReviewer)** — Spec compliance PASS + harness PASS
4. **Quality Gate (CodeReviewer → Closure)** — No CRITICAL issues

### 3.3 Escalation Rules
- **3-Fix Rule:** Same area fails 3+ times → escalate to architectural review
- **Confidence Threshold:** Issues below 80 confidence not reported
- **CRITICAL Severity:** Blocks shipping (security, correctness, compliance)

---

## 4. Directory Structure

```
Project Root/
├── docs/
│   ├── requirements/      # REQ-*.md (permanent)
│   ├── architecture/      # TECHSPEC-*.md (permanent)
│   └── analysis/          # Analysis docs
├── .opencode/
│   ├── context/
│   │   ├── 01_memory/        # active_context.md, patterns.md, progress.md
│   │   └── active_tasks/     # Per-feature workspaces
│   │       └── [feature]/
│   │           ├── contract.md      # Input to agent
│   │           ├── result.md        # Output from agent
│   │           ├── validation_contract.md
│   │           └── review_contract.md
│   ├── templates/            # REQ and TECHSPEC templates
│   └── logs/                 # Plugin and telemetry logs
├── .worktrees/               # Isolated branches (BUILD only)
│   └── feat-[name]/         # Active feature branch
└── .gitignore                # Must include .worktrees/

NSO Config (Global):
~/.config/opencode/
├── opencode.json             # Agent configuration (PARENT of nso/)
└── nso/
├── instructions.md           # Universal rules
├── prompts/                  # Agent prompts (8 files)
│   ├── Oracle.md
│   ├── Analyst.md
│   ├── Builder.md
│   ├── Designer.md
│   ├── Janitor.md
│   ├── CodeReviewer.md
│   ├── Librarian.md
│   └── Scout.md
├── scripts/                  # NSO scripts (all agents read from here)
├── skills/                   # Skill definitions (20 skills)
├── docs/                     # System documentation
│   ├── NSO-AGENTS.md         # Complete agent reference
│   └── workflows/            # Workflow details
│       ├── BUILD.md
│       ├── DEBUG.md
│       └── REVIEW.md
├── templates/                # REQ and TECHSPEC templates
└── nso-plugin.js             # Event hooks (session init, tool validation)
```

---

## 5. Key Mechanisms

### 5.1 Worktree Isolation (BUILD only)
```bash
# Oracle creates:
git worktree add -b feat/[name] .worktrees/feat/[name] [base]

# Safety checks:
- .worktrees/ in .gitignore? ✓
- Base branch up to date? ✓
- Baseline tests pass? ✓

# All agents work in .worktrees/feat/[name]/

# Oracle closes:
git merge --squash feat/[name]
git push origin main
git worktree remove .worktrees/feat/[name]
git branch -d feat/[name]
```

### 5.2 Contract-Based Delegation
```yaml
# Oracle writes contract.md before delegating:
contract:
  workflow: BUILD
  phase: IMPLEMENTATION
  agent: Builder
  techspec: "docs/architecture/TECHSPEC-Feature.md"
  worktree_path: ".worktrees/feat-feature/"
  deliverable: "Working code with passing tests"
  tdd_required: true

# Builder reads contract, implements, writes result.md:
result:
  status: COMPLETE
  tests_pass: true
  evidence: "npm test output shows 47/47 passing"
  files_changed: ["src/feature.ts", "tests/feature.test.ts"]
```

### 5.3 Two-Stage Validation
```
Stage A (Janitor): Spec Compliance
├─ Every TECHSPEC requirement → implemented code?
└─ Binary: PASS or FAIL (if FAIL → STOP, back to Builder)

Stage B (Janitor): Automated Harness
├─ TypeScript typecheck
├─ Lint
├─ Tests (unit + integration)
├─ TDD compliance check
└─ Silent failure scan

Stage C (CodeReviewer): Quality Review
├─ Confidence scoring (≥80 to report)
├─ Severity: CRITICAL / IMPORTANT / MINOR
├─ Verdict: BLOCK / CHANGES_REQUESTED / APPROVE_WITH_NOTES / APPROVE
└─ Mandatory positive findings
```

### 5.4 Post-Mortem & Evolution
```
Librarian runs post-mortem skill:
1. Analyze session logs
2. Detect patterns (real issues vs normal development)
3. Classify by severity
4. Present findings to user
5. User approves/rejects improvements
6. Apply approved improvements to NSO or project
```

---

## 6. Anti-Performative Protocol

### Forbidden Language
| Phrase | Why Forbidden | Correct Alternative |
|--------|---------------|---------------------|
| "I've verified this works" | No evidence shown | Show test output |
| "Tests should pass" | "Should" is not proof | Run them, show output |
| "I believe this is correct" | Belief ≠ proof | Prove with tests/evidence |
| "This looks good" | Vague, non-actionable | Specify what was checked |

### The 1% Rule
If there is even a 1% chance a skill applies, invoke it. Skills are cheap. Missing a quality check is expensive.

---

## 7. Integration with OpenCode

### 7.1 Native Agent System
- Agents defined in `opencode.json` → `agent` section
- Each agent has: `name`, `description`, `prompt`, `skill` array
- OpenCode's `task()` tool spawns agents

### 7.2 Plugin Hooks
```javascript
// nso-plugin.js provides:
- event: "session.created" → init_session.py
- tool.execute.before → validate_intent.py (security checks)
```

### 7.3 MCP Integration
- Memory MCP: Persistent knowledge graph
- Filesystem MCP: File access
- Playwright/Chrome DevTools: Browser automation (Designer)
- Parallel/Context7/Tavily: Research (Scout, Oracle)

---

## 8. Evolution & History

### v1.0 (Pre-2026-02-12)
- 6 agents
- 32 skills
- Janitor handled both validation AND code review
- Oracle handled discovery

### v2.0 (2026-02-12)
- 8 agents (+ Analyst, + CodeReviewer)
- 20 skills (deleted 12, created 4)
- Split validation: Janitor (spec+harness) + CodeReviewer (quality)
- Analyst handles discovery (BUILD) and investigation (DEBUG)
- Post-mortem skill consolidates 4 old skills
- Anti-performative protocol enforced system-wide

---

## References

- **User Guide:** `USER_GUIDE.md`
- **Agent Reference:** `docs/NSO-AGENTS.md`
- **Workflows:** `docs/workflows/{BUILD,DEBUG,REVIEW}.md`
- **Configuration:** `~/.config/opencode/opencode.json`
- **Universal Instructions:** `instructions.md`
