# NSO User Guide v2.0

**Version:** 2.0.0  
**Date:** 2026-02-12  
**NSO System:** 8 agents, 20 skills, 3 workflows

---

## Quick Start

Just describe what you want in natural language. NSO detects your intent and runs the right workflow automatically.

**Examples:**
- *"Add a feed scheduler service"* → **BUILD** workflow
- *"The RSS parser crashes on empty feeds"* → **DEBUG** workflow  
- *"Review the storage module for security issues"* → **REVIEW** workflow

No special commands needed. NSO follows its process automatically.

---

## The Three Workflows

### 🏗️ BUILD Workflow (New Features)

When you ask for a new feature, NSO runs **7 phases** with **3 approval gates**.

```
Analyst → Oracle → Builder → Janitor → CodeReviewer → Oracle → Librarian
```

#### Phase 0: Worktree Setup (Oracle)
- Creates isolated git branch in `.worktrees/[feature-name]/`
- **Mandatory** for BUILD (unless you say "no worktree" or it's trivial)
- Runs safety checks: `.gitignore` check, base branch up-to-date, baseline tests pass

#### Phase 1: Discovery (Analyst)
- **Agent:** Analyst (new in v2.0!)
- Interviews you **one question at a time** (200-300 words each)
- Applies YAGNI check to each requirement
- Produces `REQ-<Feature-Name>.md`
- **🛑 STOP → You approve the requirements**

#### Phase 2: Architecture (Oracle)
- **Agent:** Oracle
- Drafts `TECHSPEC-<Feature-Name>.md`
- Runs self-critique via `architectural-review` skill
- **🛑 STOP → You approve the architecture**

#### Phase 3: Implementation (Builder)
- **Agent:** Builder
- Asks clarifying questions before coding (Question Gate)
- Follows strict **TDD**: RED (failing test) → GREEN (make it pass) → REFACTOR
- Uses `verification-gate` skill — no "I think it works", only evidence

#### Phase 4A: Validation (Janitor)
- **Agent:** Janitor
- **Stage A:** Spec compliance (every TECHSPEC requirement → code). Binary PASS/FAIL.
- **Stage B:** Automated harness (typecheck, lint, tests, TDD compliance, silent failure scan)
- If FAIL → loops back to Builder

#### Phase 4B: Code Review (CodeReviewer)
- **Agent:** CodeReviewer (new in v2.0!)
- Independent quality review (read-only, doesn't fix code)
- **Confidence scoring** — only reports issues ≥80 confidence
- **Severity**: CRITICAL (blocks shipping) / IMPORTANT (should fix) / MINOR (nice to fix)
- **Verdict**: BLOCK | CHANGES_REQUESTED | APPROVE_WITH_NOTES | APPROVE

#### Accountability Gate (Oracle)
- Oracle presents summary: achievements + Janitor results + CodeReviewer findings
- **🛑 STOP → You approve to commit**

#### Phase 5: Closure (Librarian)
- **Agent:** Librarian
- Merges worktree → main, pushes to remote, cleans up branch
- Runs **post-mortem** skill — analyzes session, detects patterns, proposes improvements
- **🛑 STOP → You approve any NSO improvements** before they're applied

---

### 🐛 DEBUG Workflow (Bug Fixes)

Report a bug → investigate → fix → validate → close.

```
Analyst → Oracle → Builder → Janitor → Oracle → Librarian
```

#### Phase 1: Investigation (Analyst)
- **Agent:** Analyst (MODE B: Debug Investigation)
- **LOG FIRST approach** — adds diagnostic logging before hypothesizing
- **Backward data flow trace** — follows error backward to source
- Confidence scoring (≥80 required for root cause)
- Produces evidence summary + root cause + reproduction steps

#### Phase 2: Triage (Oracle)
- Reviews evidence, assesses scope
- Checks for **3-fix escalation** — if same area failed 3+ times → architectural problem, not a bug
- Decides fix strategy

#### Phase 3: Fix (Builder)
- **Regression test FIRST** (must fail before fix)
- Implements minimal fix
- Verifies regression test now passes + full suite passes

#### Phase 4: Validation (Janitor)
- Regression verification + full harness
- Variant coverage (edge cases related to the bug)

#### Phase 5: Closure (Librarian)
- Updates `patterns.md` with **Gotcha** entry
- Runs post-mortem

---

### 🔍 REVIEW Workflow (Code Quality)

Request a review → scope → analyze → report → close.

```
CodeReviewer → Oracle → Librarian
```

#### Phases 1-3: CodeReviewer (Primary Agent)
- **Scope:** Define files + focus areas (security, performance, etc.)
- **Analysis:** Two-stage review (spec compliance → code quality)
- **Report:** Verdict + issues with confidence scores + **mandatory positive findings**

#### Phase 4: Closure (Librarian)
- Updates `patterns.md` with any new patterns found

---

## Key Changes in NSO v2.0

### New Agents
1. **Analyst** — Mastermind/analytical agent
   - Handles Phase 1 Discovery (BUILD)
   - Handles Phase 1 Investigation (DEBUG)
   - Replaces Oracle's discovery role

2. **CodeReviewer** — Independent quality auditor
   - Handles Phase 4B (BUILD)
   - Handles entire REVIEW workflow
   - Replaces Janitor's code review role

### New Skills (4 created)
- `tdd` — TDD enforcement with rationalization prevention (~300 lines)
- `systematic-debugging` — 4-phase debugging methodology (~300 lines)
- `verification-gate` — Evidence-based completion claims (~250 lines)
- `post-mortem` — Session analysis + pattern detection (~280 lines)

### Deleted Skills (12 removed)
- Superseded: `tdflow-unit-test`, `debugging-patterns`, `verification-before-completion`, `code-review-patterns`, `brainstorming-bias-check`, `code-generation`, `planning-patterns`, `session-memory`
- Consolidated: `self-improve`, `pattern-detector`, `intelligent-pattern-detector`, `pattern-implementer` → all merged into `post-mortem`

### Agent Count
- **Before:** 6 agents (Oracle, Builder, Designer, Janitor, Librarian, Scout)
- **After:** 8 agents (+ Analyst, + CodeReviewer)

### Validation Split
- **Phase 4A (Janitor):** Spec compliance + automated harness
- **Phase 4B (CodeReviewer):** Independent quality review

### Anti-Performative Protocol
- Forbidden language table in `instructions.md`
- No "I think", "should", "probably" — only evidence
- See: `~/.config/opencode/nso/instructions.md` for full list

---

## What You Need to Know

1. **Approval gates are real.** NSO will not start coding until you approve requirements AND architecture. It will not commit until you approve quality.

2. **Agents have boundaries.**
   - Oracle designs, doesn't code
   - Analyst discovers, doesn't implement
   - Builder codes, doesn't review own work
   - Janitor validates, doesn't fix
   - CodeReviewer reviews, doesn't implement

3. **Memory persists across sessions.**
   - Decisions, patterns, progress saved in `.opencode/context/01_memory/`
   - Every workflow ends with memory update

4. **Worktrees for BUILD only.**
   - Mandatory for BUILD workflow (isolates changes)
   - Optional for DEBUG/REVIEW
   - Never for conversation/planning

5. **3-Fix Escalation Rule.**
   - If same root cause area fixed 3+ times → architectural problem
   - Oracle escalates to user for refactor discussion

---

## Commands

| Command | What It Does |
|---------|--------------|
| `/new-feature [description]` | Start BUILD workflow |
| `/nso-init` | Initialize NSO for current project |
| `/scout [topic]` | Research a technology or pattern |
| `/memory-update` | Force update memory files |
| `/close-session` | Close session with memory update |

---

## File Structure

```
Your Project/
├── docs/
│   ├── requirements/      # REQ-*.md files
│   ├── architecture/      # TECHSPEC-*.md files
│   └── analysis/          # Analysis docs
├── .opencode/
│   ├── context/
│   │   ├── 01_memory/        # active_context.md, patterns.md, progress.md
│   │   └── active_tasks/     # Per-feature workspaces (contract.md, result.md)
│   ├── templates/            # REQ and TECHSPEC templates
│   └── logs/                 # Plugin and telemetry logs
└── .worktrees/               # Isolated branches for BUILD (auto-created)
```

---

## References

| Document | Purpose |
|----------|---------|
| `~/.config/opencode/nso/USER_GUIDE.md` | This document |
| `~/.config/opencode/nso/docs/NSO-AGENTS.md` | Complete agent reference (SSOT) |
| `~/.config/opencode/nso/docs/workflows/BUILD.md` | BUILD workflow details |
| `~/.config/opencode/nso/docs/workflows/DEBUG.md` | DEBUG workflow details |
| `~/.config/opencode/nso/docs/workflows/REVIEW.md` | REVIEW workflow details |
| `~/.config/opencode/nso/instructions.md` | Universal NSO instructions |
| `~/.config/opencode/opencode.json` | Runtime configuration |

---

**Ready to start? Just describe what you want.**
