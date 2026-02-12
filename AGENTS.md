# NSO Agent Roles (Quick Reference)

**Version:** 2.0.0  
**Date:** 2026-02-12

> **Note:** This is a quick reference. Full details in `docs/NSO-AGENTS.md`. Agent prompts in `prompts/*.md`. Universal rules in `instructions.md`.

---

## The 8 Agents

| Agent | Role | Primary Function | Workflows |
|-------|------|------------------|-----------|
| **Oracle** | System Architect | Architecture, orchestration, delegation | BUILD: Phase 0, 2, Accountability |
| **Analyst** | Mastermind | Requirements discovery, bug investigation | BUILD: Phase 1. DEBUG: Phase 1 |
| **Builder** | Software Engineer | Code implementation (TDD) | BUILD: Phase 3. DEBUG: Phase 3 |
| **Designer** | Frontend/UX | UI mockups, frontend components | BUILD: Phase 1 (UI), Phase 3 (frontend) |
| **Janitor** | QA Monitor | Spec compliance + automated validation | BUILD: Phase 4A. DEBUG: Phase 4 |
| **CodeReviewer** | Quality Auditor | Independent code quality review | BUILD: Phase 4B. REVIEW: Phases 1-3 |
| **Librarian** | Knowledge Manager | Memory, documentation, self-improvement | All workflows: Phase 5 (Closure) |
| **Scout** | Researcher | External research, technology evaluation | Any: Discovery (on demand) |

---

## The 3 Workflows

### BUILD (New Features)
```
Analyst → Oracle → Builder → Janitor → CodeReviewer → Oracle → Librarian
```
- **7 phases**, **3 approval gates** (after Discovery, after Architecture, after Quality Review)
- **Mandatory worktrees** for branch isolation

### DEBUG (Bug Fixes)
```
Analyst → Oracle → Builder → Janitor → Oracle → Librarian
```
- **LOG FIRST** approach (evidence before hypothesis)
- **3-fix escalation rule** (same area fails 3x → architectural problem)

### REVIEW (Code Quality)
```
CodeReviewer → Oracle → Librarian
```
- **Confidence scoring** (≥80 threshold to report)
- **Severity classification** (CRITICAL / IMPORTANT / MINOR)

---

## Critical Rules

1. **Phase gates are mandatory.** No skipping phases.
2. **No self-review.** Builder doesn't review own code. Janitor doesn't implement fixes.
3. **TDD mandatory.** RED → GREEN → REFACTOR. Regression test must fail before fix.
4. **Memory protocol.** LOAD at start, UPDATE at end. Every session.
5. **Anti-performative.** No "I think", "should", "probably" — only evidence.
6. **Worktrees for BUILD.** Mandatory branch isolation (opt-out for trivial changes only).

---

## Agent Boundaries

| Agent | Can Do | Cannot Do |
|-------|--------|-----------|
| **Oracle** | Design architecture, delegate, write docs | Implement code, review own decisions |
| **Analyst** | Discover requirements, investigate bugs | Implement solutions, review code |
| **Builder** | Write code, write tests, run tests | Review own code, skip TDD |
| **Janitor** | Validate against spec, run harness | Fix code, implement features |
| **CodeReviewer** | Review code, score confidence | Implement fixes, rubber-stamp |
| **Librarian** | Update memory, run post-mortem, git ops | Write implementation code |

---

## Skill Assignments (v2.0)

| Agent | Skills |
|-------|--------|
| **Oracle** | architectural-review, router, skill-creator |
| **Analyst** | rm-intent-clarifier, rm-validate-intent, rm-multi-perspective-audit, bug-investigator |
| **Builder** | tdd, minimal-diff-generator, verification-gate, systematic-debugging |
| **Designer** | ui-component-gen, accessibility-audit |
| **Janitor** | silent-failure-hunter, traceability-linker, integration-verifier, verification-gate |
| **CodeReviewer** | code-reviewer |
| **Librarian** | memory-update, archive-conversation, post-mortem |
| **Scout** | tech-radar-scan |

---

## Full Documentation

- **User Guide:** `USER_GUIDE.md`
- **Complete Agent Reference:** `docs/NSO-AGENTS.md`
- **Workflow Details:** `docs/workflows/{BUILD,DEBUG,REVIEW}.md`
- **Universal Instructions:** `instructions.md`
- **Configuration:** `~/.config/opencode/opencode.json`
