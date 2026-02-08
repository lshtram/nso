# Development Plan: Neuro-Symbolic Orchestrator

| Version | Date | Status |
|---------|------|--------|
| 3.0.0 | 2026-02-07 | Status Update |

## Phase 1: The Kernel (Foundation)
**Goal:** Establish the directory structure and the "Context Engine".
- [x] **1.1** Initialize Directory Structure (`context`, `docs`, `hooks`, `agents`, `logs`).
- [x] **1.2** Create `context/00_meta/` files (`tech-stack.md`, `patterns.md`, `glossary.md`).
- [x] **1.3** Create `docs/` structure (`requirements/`, `architecture/`, `api/`).
- [x] **1.4** Establish `context_map.json` and `logs/task_status.json`.

## Phase 2: The Nervous System (Hooks)
**Goal:** Automate quality gates and telemetry.
- [x] **2.1** Create `scripts/validate.py` (Universal validator wrapper).
- [x] **2.2** Implement `PreToolUse` hook (Intent Guard).
- [x] **2.3** Implement `PostToolUse` hook (Profiling & Auto-Test Spawning).
- [x] **2.4** Implement "Heartbeat" mechanism for background agents.

## Phase 3: The Squad (Agents & Skills)
**Goal:** Define and prompt the specialized agents.
- [x] **3.1** Define System Prompts for 6 Roles (Oracle, Builder, Designer, Librarian, Janitor, Scout).
- [x] **3.2** Implement Oracle Skills: `rm-intent-clarifier`, `rm-conflict-resolver`, `architectural-review`.
- [x] **3.3** Implement Builder Skills: `tdflow-unit-test`, `minimal-diff-generator`.
- [x] **3.4** Implement Scout Skills: `tech-radar-scan`, `rfc-generator`.
- [x] **3.5** Implement Janitor Skills: `silent-failure-hunter`, `traceability-linker`.

## Phase 4: Integration & Workflows
**Goal:** Connect the loops and enabling parallel work.
- [ ] **4.1** Implement `flight_plan.json` schema and validation.
- [ ] **4.2** Create `task` tool wrapper to support "Spawning with Feature Context".
- [ ] **4.3** Implement "Context Isolation" logic (ensure agents only see their feature folder).

## Phase 5: Self-Improvement & Production
**Goal:** Final polish and meta-loops.
- [ ] **5.1** Implement Janitor's "Meta-Loop" (Log Analysis -> Pattern Update).
- [ ] **5.2** Dashboarding script for `profile.json` and `task_status.json`.
- [ ] **5.3** Documentation and "User Manual".
