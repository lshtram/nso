# Progress

## Current Milestones

### M1: RSS Feed Collector Service (Backend)
- [x] Discovery, Architecture, Implementation, Validation
- 16 tests passing, ~17ms benchmark

### M2: NSO v2 Corrective Fixes (Post-Mortem)
- [x] Oracle template rewrite, gate_check.py, close_session.py, workflow_orchestrator.py

### M3: Quality Gate Enrichment (All Workflows)
- [x] 10 quality-enriched gates (BUILD:4, DEBUG:3, REVIEW:3)
- [x] Oracle/Builder/Janitor templates with mandatory result formats

### M4: Article Storage Service (In-Memory)
- [x] REQ + TECHSPEC + Implementation + Validation (score 95)
- 7 tests passing (dedup, search, date range)

### M5: NSO Directive Architecture Redesign
- [x] **Compliance audit** — Found 34% compliance (15/44). Root cause: 875+ lines of contradicting directives loaded per agent.
- [x] **Layer 1: instructions.md** — Rewritten from 267→68 lines. Universal, all agents.
- [x] **Layer 2: opencode.json** — Per-agent prompts with enforcement rules. Removed AGENTS.md from instructions array.
- [x] **Layer 3: Project AGENTS.md** — Rewritten to context-only (no process). 65→55 lines.
- [x] **nso_init.py** — Created. Conflict detection, template generation.
- [x] **REQ & TECHSPEC templates** — Created in `.opencode/templates/`.
- [x] **Archived .agent/** — 48-file competing SDLC moved to `_archive/.agent/`.
- [x] **USER_GUIDE.md** — Rewritten from 126→53 lines. Natural language start, no /new-feature command.
- [x] **NSO AGENTS.md** — Slimmed from 399→48 lines. Reference doc only.
- [x] **Memory files updated** — This file.

### M6: Feed Scheduler Service
- [x] Discovery, Architecture, Implementation, Validation (score 95)
- 8 tests passing, TTL & concurrency handled

## Validation Status

- Feed Scheduler: 8 tests passing (score 95)
- Article Storage: 7 tests passing
- RSS Feed Collector: 16 tests passing
- NSO directive total per agent: ~160-180 lines (was 875+)

## Next Up

- Test with a real BUILD workflow in a fresh session (e.g., Feed Scheduler Service)
- Verify Oracle stops for approval and delegates to Builder/Janitor/Librarian
