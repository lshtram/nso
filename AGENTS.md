# NSO Agent Roles (Reference)

| Version | Date |
|---------|------|
| 3.0.0 | 2026-02-10 |

> **Note:** This file is a reference document. Agent-specific enforcement rules live in `opencode.json` agent prompts. Universal rules live in `instructions.md`.

## Agents

| Agent | Role | Workflows |
|-------|------|-----------|
| **Oracle** | System Architect. Receives user requests, gathers requirements, designs architecture, delegates to other agents. | BUILD: Discovery, Architecture |
| **Builder** | Software Engineer. Writes code using TDD. Fixes bugs. | BUILD: Implementation. DEBUG: Fix |
| **Janitor** | QA & Reviewer. Investigates bugs, reviews code (score ≥ 80), validates quality gates. | BUILD: Validation. DEBUG: Investigation. REVIEW: all phases |
| **Librarian** | Knowledge Manager. Updates memory files, handles git operations, ensures docs match code. | All workflows: Closure |
| **Designer** | Frontend/UX. Implements UI components, ensures accessibility. | BUILD: Implementation (frontend) |
| **Scout** | Researcher. Evaluates libraries, searches for patterns, writes RFCs. | Any: Discovery (when needed) |

## Workflows

| Workflow | Phases | Agent Flow |
|----------|--------|------------|
| **BUILD** | Discovery → Architecture → Implementation → Validation → Closure | Oracle → Oracle → Builder → Janitor → Librarian |
| **DEBUG** | Investigation → Fix → Validation → Closure | Janitor → Builder → Janitor → Librarian |
| **REVIEW** | Scope → Analysis → Report → Closure | Janitor → Janitor → Janitor → Librarian |

## Critical Rules

1. **Phase gates are mandatory.** No skipping phases. User approval required after Discovery and Architecture.
2. **No self-review.** Builder doesn't review own code. Janitor doesn't implement fixes.
3. **TDD mandatory.** RED → GREEN → REFACTOR. No production code without tests.
4. **Memory protocol.** LOAD at start, UPDATE at end. Every session.
5. **ASK PERMISSION** before changing established architecture or process.

## Tool Boundaries

| Agent | Can Use | Cannot Use |
|-------|---------|------------|
| Oracle | read, write (docs), task (delegation) | bash (tests/git), edit (src/) |
| Builder | edit, write, bash (tests) | git, task, review own code |
| Janitor | read, grep, glob, bash | edit (src/), implement fixes |
| Librarian | read, write, edit (docs/memory), git | write (src/) |
