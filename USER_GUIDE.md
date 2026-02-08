# Neuro-Symbolic Orchestrator: User Guide (PROCESS)

| Version | Date | Status |
|---------|------|--------|
| 5.0.0 | 2026-02-07 | Fully Detailed with Internal Reviews |

## 1. Introduction
This guide defines the standard operating procedure for interacting with the Neuro-Symbolic Orchestrator (NSO). Unlike standard chatbot interactions, NSO requires following a specific **Feature Lifecycle** to ensure high reliability.

**The Golden Rule:** Never write code manually. Drive the agents via the `/new-feature` workflow and respect the Review Gates.

---

## 2. The Feature Lifecycle (Step-by-Step)

The lifecycle is strictly split into **4 Phases**. The Oracle will **STOP** after Phase 1 and Phase 2 to request your explicit approval.

### Phase 1: Discovery (Requirements)
**Trigger:** You type `/new-feature "Add Dark Mode"`

1.  **Agent Activation:** The **Oracle** wakes up.
2.  **Context Loading:** Oracle reads `docs/`, `context/00_meta/`, and LOADs `.opencode/context/01_memory/`.
3.  **Interview (Skill: `rm-intent-clarifier`):** The Oracle asks you clarifying questions until ambiguity is resolved.
4.  **Internal Review (Automated):**
    *   **Skill:** `rm-validate-intent` - Oracle compares draft requirements against your original prompt/chat history to ensure alignment.
    *   **Skill:** `rm-multi-perspective-audit` - Oracle role-plays as Security, SRE, and UX to find holes.
5.  **Artifact Generation:**
    *   `.opencode/docs/requirements/REQ-<Feature-Name>.md` (permanent)
    *   `.opencode/context/active_features/<feature>/requirements.md` (temporary, optional)
6.  **User Gate (STOP):** The Oracle pauses. You must review the requirements.
    *   *Command:* Type **"Approved"** to proceed to Phase 2.
7.  **Memory Update:** At phase end, Oracle UPDATEs `.opencode/context/01_memory/` with decisions and next steps.

### Phase 2: Architecture (Design)
**Trigger:** You approve Requirements (Phase 1).

1.  **Agent Activation:** The **Oracle** continues.
2.  **Design (Skill: `spec-architect`):** Oracle maps requirements to files, interfaces, and database schemas.
3.  **Conflict Check (Skill: `rm-conflict-resolver`):** Checks if the new design contradicts existing patterns.
4.  **Internal Review (Skill: `architectural-review`):** Oracle runs a checklist:
    *   *Simplicity:* Can this be done with fewer moving parts?
    *   *Modularity:* Are the boundaries clear?
    *   *Abstraction:* Are we leaking implementation details?
5.  **Artifact Generation:**
    *   `.opencode/docs/architecture/TECHSPEC-<Feature-Name>.md` (permanent)
    *   `.opencode/context/active_features/<feature>/tech_spec.md` (temporary, optional)
    *   `.opencode/context/active_features/<feature>/flight_plan.json`
6.  **User Gate (STOP):** The Oracle pauses. You must review the Architecture.
    *   *Command:* Type **"Approved"** to proceed to Phase 3.
7.  **Memory Update:** At phase end, Oracle UPDATEs `.opencode/context/01_memory/` with architecture decisions.

### Phase 3: Development (The Build)
**Trigger:** You approve the Flight Plan (Phase 2).

1.  **Spawning (Parallelism Mechanism):**
    *   The Oracle analyzes the Flight Plan. If tasks are independent (e.g., "Frontend CSS" and "Backend API"), it calls the `task` tool multiple times:
        *   `task(agent="Builder", prompt="Execute Task 1 in context feature-dark-mode")`
        *   `task(agent="Builder", prompt="Execute Task 2 in context feature-dark-mode")`
    *   These run as concurrent OpenCode sessions.
2.  **Memory Load:** Builder LOADs `.opencode/context/01_memory/` at the start.
3.  **The Micro-Loop (Per Builder):**
    *   **Step A (Test):** Builder writes a failing test.
    *   **Step B (Code):** Builder implements logic.
    *   **Step C (Auto-Check):** `write` tool triggers `scripts/validate.py --fast` (Lint/Typecheck).
    *   **Step D (Refactor):** Fix issues.
4.  **Exit Gate (The Full Harness):**
    *   Before marking a task complete, the Builder runs `scripts/validate.py --full`.
    *   **Includes:** Linting + Type Checking + Unit Tests + E2E Tests.
    *   *Constraint:* If this fails, the Builder loops back to Step B.
5.  **Memory Update:** At phase end, Builder UPDATEs `.opencode/context/01_memory/` with verified deliverables.

### Phase 4: Closure (Release)
**Trigger:** All Flight Plan tasks marked "Complete".

1.  **Agent Activation:** The **Janitor** and **Librarian**.
2.  **Skill Execution:**
    *   `traceability-linker`: Janitor scans code for `@implements` tags matching the Requirements.
    *   `silent-failure-hunter`: Janitor greps for empty `catch` blocks.
3.  **Artifact Transition (Librarian):**
    *   Moves artifacts to `docs/requirements/` and `docs/architecture/`.
    *   Updates `.opencode/context/context_map.json`.
4.  **Git Commit:** Librarian runs `git commit` with a message referencing the Feature ID.
5.  **User Gate:** Librarian asks "Ready to Push?". You type **"Yes"**.

### Debug & Review Workflows
- **Debug End:** After root cause confirmed + regression test, UPDATE `.opencode/context/01_memory/`.
- **Review End:** After review completion, UPDATE `.opencode/context/01_memory/`.

---

## 3. System Components Reference

### Active Skills
| Agent | Skill | Purpose |
|-------|-------|---------|
| **Oracle** | `rm-intent-clarifier` | Interview user & extract requirements. |
| **Oracle** | `rm-validate-intent` | Check draft against conversation history. |
| **Oracle** | `rm-multi-perspective-audit` | Security/SRE/UX review. |
| **Oracle** | `architectural-review` | Self-critique (Modularity/Simplicity). |
| **Builder** | `tdflow-unit-test` | Enforce TDD. |
| **Builder** | `minimal-diff-generator` | Surgical code edits. |
| **Janitor** | `silent-failure-hunter` | Find empty catches/swallowed errors. |
| **Scout** | `tech-radar-scan` | Find external best practices. |

### Active Scripts
| Script | Trigger | Purpose |
|--------|---------|---------|
| `scripts/validate.py` | Builder Save | Runs Lint (`ruff`/`biome`), Typecheck (`mypy`/`tsc`), Tests (`pytest`/`bun test`). |
| `hooks/pre_tool_use/validate_intent.py` | Before `write` | Safety check (e.g., prevents editing `.env`). |
| `hooks/post_tool_use/profiler.py` | After `write` | Logging & Stall Detection. |

---

## 4. Summary: Addressing the 8 Pillars

| Pillar | Implementation in NSO |
|--------|-----------------------|
| **1. Quality Code** | Enforced by the **Complete Harness** (`validate.py --full`) running before exit. No code exists without a test. |
| **2. Solid Processes** | The **Feature Lifecycle** has explicit **Internal Review Skills** (Audit, Checklist) *before* User Approval. |
| **3. Multi-Agent** | **6 Specialized Roles** defined in `opencode.json` with specific skills. |
| **4. Parallelism** | **Task Spawning**: Oracle calls `task()` multiple times. **Heartbeat**: Agents report to `task_status.json`. |
| **5. Self-Improving** | The **Scout** searches for updates. The **Janitor** updates `patterns.md` based on failure logs. |
| **6. Profiling** | **Profiler Hook** logs token usage/errors. **Stall Detector** alerts on repeated failures. |
| **7. Self-Healing** | **Compiler Feedback Loop**: Hooks catch syntax errors instantly and force the Builder to fix them. |
| **8. Lightweight** | **Zero Manual Paperwork**. Agents generate the PRDs/Specs. System uses fast Python/Bun scripts. |
