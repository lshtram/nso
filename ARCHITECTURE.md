# Neuro-Symbolic Orchestrator: System Architecture

| Version | Date | Status |
|---------|------|--------|
| 7.0.0 | 2026-02-07 | Full Reliability Spec |

## 1. Core Philosophy: The 8 Pillars of Reliability

### 1. Generating Quality Code
**Definition:** A rigorous loop of *Requirements → Code → Test → Iteration* until all requirements are satisfied with full coverage.
**Implementation:**
-   **Deep Context:** The Oracle reads not just the tech stack, but *all* existing Architecture (`.opencode/docs/architecture/`), Requirements (`.opencode/docs/requirements/`), and the Codebase Index before defining new work.
-   **The Complete Harness:** Development cannot close until `scripts/validate.py` passes ALL checks (Lint, Types, Unit, E2E).

### 2. Solid Processes (The Feature Lifecycle)
**Definition:** Quality assurance via defined stages, reviews, and approvals.
**Implementation:**
-   **Internal Review Loops:** Before asking the user, the Oracle runs a "Self-Review" skill (Checklist) to challenge its own architecture (Simplification, Modularity).
-   **Gated Stages:** Discovery → Architecture (Internal Review + User Gate) → Development → Closure (Git + Docs).

#### 2.1 Artifact Naming Conventions
- **Requirements (permanent):** `.opencode/docs/requirements/REQ-<Feature-Name>.md`
- **Tech Specs (permanent):** `.opencode/docs/architecture/TECHSPEC-<Feature-Name>.md`
- **Temporary (optional, for active feature):**
  - `.opencode/context/active_features/<feature>/requirements.md`
  - `.opencode/context/active_features/<feature>/tech_spec.md`

### 3. Multi-Agent Capabilities
**Definition:** Leveraging OpenCode's native ability to spawn sub-agents.
**Implementation:**
-   **Native Integration:** Agents are defined in `opencode.json` as `custom_agents` (or tasks), each with a specific `system_prompt` and `tools` allowlist.
-   **Role Specialization:** Oracle (Planner), Builder (Coder), Janitor (QA), Scout (Researcher).

### 4. Parallel Execution
**Definition:** Running multiple work streams simultaneously.
**Implementation:**
-   **Mechanism:** The Oracle uses the `task` tool to spawn independent sessions.
    -   *Command:* `task(agent="Builder", prompt="Implement Feature A Context...")`
-   **Heartbeat:** Background agents write status to `.opencode/logs/task_status.json`. The user checks this via `/status`.

### 5. Self-Improving (Evolution)
**Definition:** Proactive learning from failures and the community.
**Implementation:**
-   **Pattern Detection:** The `profiler.py` hook analyzes logs for repeated errors (e.g., "Agent failed to run npm dev 3 times").
-   **Auto-Correction:** If a pattern is detected, the Janitor creates an update to `.opencode/context/00_meta/patterns.md` (e.g., "Always run commands in root").
-   **The Scout:** Triggered via `/scout` or schedule, looks for external updates.

### 6. Profiling & Observability
**Definition:** Detecting stalls and inefficiencies.
**Implementation:**
-   **Telemetry:** `PostToolUse` hook captures every action.
-   **Stall Detector:** The hook counts consecutive failures. If > 3, it injects a "STOP AND THINK" directive into the agent's context.

### 7. Self-Healing
**Definition:** Automatic error correction.
**Implementation:**
-   **Micro-Correction:** `validate.py` (Fast Mode) runs on every write to catch syntax errors immediately.
-   **Macro-Correction:** The Builder cannot exit the loop until the Full Harness passes.

### 8. Lightweight (Low Friction)
**Definition:** Minimum overhead for User AND System.
**Implementation:**
-   **User:** Simple slash commands (`/new-feature`). No manual doc writing.
-   **System:** Scripts are fast (Python/Bun). No heavy VMs. Docs live in standard `docs/` folders, not hidden contexts.

---

## 2. Directory Structure

```
.
├── opencode.json              # NATIVE Integration (Agents & Commands)
├── docs/                      # Project Documentation (The Truth)
│   ├── requirements/          # Archived requirements
│   ├── architecture/          # System Architecture
│   └── api/                   # API Contracts
├── .opencode/
│   ├── context/               # Active Context Engine
│   │   ├── 00_meta/           # Stack, Patterns, Glossary
│   │   ├── 01_memory/          # Persistent memory (active_context, patterns, progress)
│   │   └── active_features/   # Isolation for running tasks
│   ├── hooks/                 # Automation Scripts
│   ├── scripts/               # Validation & Monitoring
│   ├── skills/                # Skills (`skills/<name>/SKILL.md`)
│   └── logs/                  # Telemetry
```

---

## 3. Mechanisms & Workflows

### 3.1 The Feature Lifecycle

**Trigger:** `/new-feature "Add Dark Mode"` (Defined in `opencode.json`)

**Stage 1: Discovery (Oracle)**
-   **Context:** Reads `.opencode/docs/requirements`, `.opencode/docs/architecture`, `.opencode/context/00_meta`, and LOADs `.opencode/context/01_memory`.
-   **Action:** Interview User → Draft `REQ-<Feature-Name>.md` in `.opencode/docs/requirements/` (or a temporary `requirements.md` under `.opencode/context/active_features/<feature>/`).
-   **Internal Review:** Oracle runs `rm-validate-intent` (History Check) and `rm-multi-perspective-audit` (Security/SRE/UX).
-   **Gate:** User Approval.
-   **Memory:** UPDATE memory files at phase end.

**Stage 2: Architecture (Oracle)**
-   **Action:** Draft `TECHSPEC-<Feature-Name>.md` in `.opencode/docs/architecture/` (or a temporary `tech_spec.md` under `.opencode/context/active_features/<feature>/`).
-   **Internal Review:** Oracle runs `architectural-review` (Complexity check, Modularity check). *Iterates until satisfied.*
-   **Gate:** User Approval.
-   **Memory:** LOAD at start, UPDATE at phase end.

**Stage 3: Development (Builder)**
-   **Trigger:** Oracle spawns Builder(s).
-   **Micro-Loop:**
    1.  Write Test (Red).
    2.  Write Code (Green).
    3.  **Auto-Check:** Hook runs `validate.py --fast` (Syntax/Lint).
    4.  **Refactor.**
-   **Exit Condition:** Builder runs `validate.py --full` (All Tests + E2E). If Pass → Done.
-   **Memory:** LOAD at start, UPDATE at phase end with verified deliverables.

**Debug & Review Workflows**
-   **Debug End:** After root cause confirmation + regression test, UPDATE memory files.
-   **Review End:** After review completion, UPDATE memory files.

**Stage 4: Closure (Librarian)**
-   **Action:**
    1.  Move/confirm artifacts in `.opencode/docs/`.
    2.  **Git:** Run `git add . && git commit -m "feat: ..."`
    3.  **Gate:** Ask User "Ready to Push?".
    4.  **Action:** `git push`.

### 3.2 The Self-Healing & Profiling Loop

**The Hook (`hooks/post_tool_use/profiler.py`):**
1.  **Log:** Writes to `logs/sessions/current.json`.
2.  **Analyze:**
    -   *Is this the 3rd time the same tool failed?* -> **Trigger:** "Pause Strategy".
    -   *Did `npm run dev` fail on directory?* -> **Trigger:** Janitor Update "Always run in root".
3.  **Feedback:** Returns standard output + "System Guidance" if needed.

### 3.3 Parallelism Mechanism

**The Spawning Protocol:**
1.  **Orchestrator:** Oracle identifies tasks in `flight_plan.json`.
2.  **Execution:** Oracle calls `task()` tool multiple times.
    *   *Input:* `agent="Builder"`, `prompt="Execute Task 1 in context feature-dark-mode"`.
3.  **Isolation:** Each Builder receives a pointer to `.opencode/context/active_features/feature-X/`. They do not see each other's active scratchpads.
4.  **Monitoring:** Each Builder writes status to `task_status.json`. User runs `/status` to view this aggregation.

---

## 4. The Hexagon Squad: Skills & Configuration

| Agent | System Prompt Focus | Key Skills |
|-------|---------------------|------------|
| **Oracle** | "You are the Architect. Look at the whole system. Challenge assumptions." | `rm-intent-clarifier`, `rm-validate-intent`, `rm-multi-perspective-audit`, `architectural-review`, `router` |
| **Builder** | "You are the Implementer. TDD is law. Fix errors before asking." | `tdflow-unit-test`, `minimal-diff-generator`, `code-generation`, `debugging-patterns`, `verification-before-completion` |
| **Janitor** | "You are Quality. Nothing passes without traceability." | `traceability-linker`, `silent-failure-hunter`, `code-review-patterns` |
| **Scout** | "You are the Explorer. Look outside." | `tech-radar-scan` |

---

## 5. Summary
This architecture is **integrated** (via `opencode.json`), **reliable** (via Hooks/Harness), and **intelligent** (via Context/Self-Improvement).
