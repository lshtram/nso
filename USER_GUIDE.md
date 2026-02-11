# NSO User Guide

| Version | Date |
|---------|------|
| 6.0.0 | 2026-02-10 |

## How It Works

Just describe what you want in natural language. NSO detects your intent and activates the right workflow automatically.

- **"Add a feed scheduler service"** → BUILD workflow
- **"The RSS parser crashes on empty feeds"** → DEBUG workflow
- **"Review the storage module"** → REVIEW workflow

No special commands needed. NSO always follows its process.

---

## The BUILD Workflow

When you ask for a new feature, NSO runs 5 phases. It **stops twice** for your approval.

### Phase 1: Discovery
The Oracle interviews you, clarifies ambiguity, and produces a requirements document (`REQ-*.md`).

**→ STOP. You review and say "Approved" to continue.**

### Phase 2: Architecture
The Oracle designs the technical solution and produces a tech spec (`TECHSPEC-*.md`).

**→ STOP. You review and say "Approved" to continue.**

### Phase 3: Implementation
The Builder writes code using TDD (test first, then implement, then refactor).

### Phase 4: Validation
The Janitor reviews the code (score ≥ 80 to pass) and runs quality checks.

### Phase 5: Closure
The Librarian updates memory files and handles git operations.

---

## The DEBUG Workflow

Report a bug → Janitor investigates → Builder fixes → Janitor validates → Librarian closes.

## The REVIEW Workflow

Request a review → Janitor scopes and analyzes → Janitor reports → Librarian closes.

---

## What You Need to Know

1. **Approval gates are real.** NSO will not start coding until you approve requirements AND architecture.
2. **Agents have boundaries.** The Oracle designs but doesn't code. The Builder codes but doesn't review. The Janitor reviews but doesn't fix.
3. **Memory persists across sessions.** Decisions, patterns, and progress are saved in `.opencode/context/01_memory/`.
4. **Project context lives in `AGENTS.md`.** Tech stack, coding standards, and architecture — not process (NSO handles process).
