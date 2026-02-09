# TECHSPEC: Phase 1C — Agent Communication & NSO Cleanup

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2026-02-08 | DRAFT — Awaiting User Approval |

---

## 0. Executive Summary

This spec addresses three problems and one cleanup:

1. **The NSO codebase is broken** — Hardcoded paths, dead files, duplicate code, unimplemented functions
2. **Agents can't talk to each other properly** — Oracle can't distinguish user vs agent messages
3. **Oracle blocks during delegation** — User can't talk while Builder works
4. **Init session doesn't fire reliably** — Plugin points to wrong project

The solution follows the user's principles: **files over code, simplicity over features, nothing to break**.

---

## 1. Architecture Review: The Honest State of NSO

### 1.1 What Actually Works (Proven)

| Component | Status | Evidence |
|-----------|--------|----------|
| `router_monitor.py` | ✅ Works | Keyword matching, confidence scoring, workflow detection |
| `init_session.py` | ✅ Works | Loads context files, generates session summary |
| `session_state.py` | ✅ Works | DelegationState tracking, JSON persistence |
| Memory files | ✅ Works | active_context.md, progress.md, patterns.md |
| Agent templates | ✅ Works | task_aware_builder.md, etc. with `{{task_id}}` vars |
| Task isolation config | ✅ Works | YAML configs define isolation rules |

### 1.2 What Is Broken

| Component | Bug | Impact |
|-----------|-----|--------|
| `nso-plugin.js` line 8, 68, 96 | Hardcoded `/Users/Shared/dev/openspace/` (WRONG project) | ALL hooks broken for dream-news. validate_intent.py and profiler.py never fire. |
| `system_telemetry.py` line 26 | Hardcoded `project_root = Path("/Users/Shared/dev/openspace")` | Telemetry data writes to wrong location |
| `copy_session.py` lines 11-12 | Hardcoded `workspace_root = "/Users/Shared/dev/openspace"` | Session copies go nowhere |
| `validate.py` fast mode | `fast_validate()` prints "not yet implemented" and returns | `profiler.py` hook calls it on EVERY file write — does nothing |
| `monitor_tasks.py` line 38 | Typo: `"ww🟡 LAGGING"` | Cosmetic but sloppy |
| `router_monitor.py` | No `source` parameter | Oracle can't distinguish user vs agent messages → Bug #2 |

### 1.3 What Is Dead Code

| File | Lines | Why Dead |
|------|-------|----------|
| `router.py` | 20 | Stub. `router_monitor.py` (314 lines) is the real router. Nothing imports `router.py`. |
| `stall_demo_simple.py` | 333 | Demo. 4 variants of same demo exist. |
| `stall_demo_final_working.py` | 367 | Demo variant. |
| `stall_demo_working.py` | 356 | Demo variant. |
| `stall_demo_final.py` | 763 | Demo variant. |
| `stall_detection_demo.py` | 972 | Demo variant. LARGEST file in project. |
| `parallel_executor_final.py` | 655 | Standalone. Never imported. |
| `parallel_executor_with_monitoring.py` | 735 | Standalone. Never imported. |
| `test_parallel_build_workflow.py` | 598 | Standalone test. |
| `heartbeat_api.py` | 171 | HTTP server. Nothing starts it. Nothing connects to it. |
| **Total dead code** | **~4,970 lines** | |

### 1.4 What Is Duplicate

| Duplication | Copies | Where |
|------------|--------|-------|
| `HeartbeatMonitor` class | 4 | stall_demo_final, stall_detection_demo, parallel_executor_final, parallel_executor_with_monitoring |
| `TaskAwareAgent` class | 4 | Same 4 files |
| `TaskIDGenerator` | 2 | `task_id_generator.py` (Tier 2) AND `parallel_oracle_integration.py` (Tier 1) |
| Router | 2 | `router.py` (dead stub) AND `router_monitor.py` (real) |
| Task monitoring | 2 | `heartbeat_api.py` (HTTP server) AND `monitor_tasks.py` (CLI) |

### 1.5 What Is Aspirational (Built But Never Connected)

| Component | Lines | Reality |
|-----------|-------|---------|
| `parallel_coordinator.py` | 841 | Line 415: `"In a real implementation, this would launch the agent process"`. Simulates agents with file markers. |
| `parallel_oracle_integration.py` | 631 | Plans parallel execution but never calls `task()`. |
| `context_contamination_detector.py` | 450 | Scans for violations but no real parallel tasks exist to contaminate each other. |
| `task_context_manager.py` | 524 | Creates isolated folders but nothing uses them in production. |
| **Total aspirational code** | **~2,446 lines** | |

### 1.6 The Hard Truth About `task()`

After deep investigation, here are the confirmed constraints of OpenCode's `task()` tool:

| Constraint | Implication |
|-----------|-------------|
| **`task()` is synchronous** | Oracle BLOCKS until sub-agent returns. User cannot interact. |
| **Returns a string** | Sub-agent's final text response. No streaming, no partial results. |
| **No mid-execution communication** | Builder cannot ask Oracle a question during execution. |
| **Sub-agent gets fresh context** | Everything needed must be in the `prompt` string or on filesystem. |
| **Only Oracle has `task` tool** | No nested delegation (Builder can't spawn Janitor). |
| **Multiple `task()` calls in one response may run concurrently** | Unproven but architecturally possible (like batched tool calls). |

**Key insight:** The `task()` tool is a **fire-and-forget-then-receive** mechanism. There is no back-channel. All "communication" between agents must happen through the **filesystem**.

---

## 2. The Cleanup: What Gets Deleted, Moved, or Fixed

### 2.1 Files to DELETE (dead code)

```
# Tier 2: dream-news/.opencode/scripts/
DELETE: stall_demo_simple.py           (333 lines, demo)
DELETE: stall_demo_final_working.py    (367 lines, demo)
DELETE: stall_demo_working.py          (356 lines, demo)
DELETE: stall_demo_final.py            (763 lines, demo)
DELETE: stall_detection_demo.py        (972 lines, demo)
DELETE: parallel_executor_final.py     (655 lines, standalone)
DELETE: parallel_executor_with_monitoring.py (735 lines, standalone)
DELETE: test_parallel_build_workflow.py (598 lines, standalone test)

# Tier 1: nso/scripts/
DELETE: router.py                      (20 lines, dead stub)
DELETE: heartbeat_api.py               (171 lines, unused HTTP server)
```

**Total deleted: ~4,970 lines of dead/demo code.**

### 2.2 Files to MOVE (Tier 2 → Tier 1)

Core NSO scripts that belong in the system-wide directory:

```
MOVE: .opencode/scripts/task_id_generator.py          → nso/scripts/
MOVE: .opencode/scripts/task_context_manager.py        → nso/scripts/
MOVE: .opencode/scripts/context_contamination_detector.py → nso/scripts/
MOVE: .opencode/scripts/parallel_coordinator.py        → nso/scripts/
```

### 2.3 Files to FIX

#### `nso-plugin.js` — Make paths project-aware

```javascript
// BEFORE (hardcoded to wrong project):
$`python3 /Users/Shared/dev/openspace/.opencode/hooks/pre_tool_use/validate_intent.py`

// AFTER (use cwd — the project directory OpenCode is running in):
$`python3 ${process.cwd()}/.opencode/hooks/pre_tool_use/validate_intent.py`
```

Apply same fix to all 3 hardcoded paths (lines 8, 68, 96).

#### `system_telemetry.py` — Remove hardcoded project root

```python
# BEFORE:
project_root = Path("/Users/Shared/dev/openspace")

# AFTER:
project_root = Path.cwd()
```

#### `copy_session.py` — Remove hardcoded workspace root

```python
# BEFORE:
workspace_root = "/Users/Shared/dev/openspace"

# AFTER:
workspace_root = str(Path.cwd())
```

#### `validate.py` — Either implement fast_validate() or remove the call

Decision: **Remove the profiler.py call to validate.py** for now. The fast mode isn't implemented and calling a no-op on every file write is misleading.

#### `monitor_tasks.py` line 38 — Fix typo

```python
# BEFORE: "ww🟡 LAGGING"
# AFTER:  "🟡 LAGGING"
```

#### `parallel_oracle_integration.py` — Remove hardcoded sys.path

```python
# BEFORE:
sys.path.insert(0, "/Users/Shared/dev/dream-news/.opencode/scripts")

# AFTER:
# Imports handled by standard Python imports since files will be in nso/scripts/
```

### 2.4 Files to KEEP (Tier 2, project-specific)

```
KEEP: .opencode/scripts/test_oracle_integration.py    (test/demo)
KEEP: .opencode/scripts/test_parallel_isolation.py     (test)
KEEP: .opencode/config/parallel-config.yaml            (project config)
KEEP: .opencode/config/task-isolation.yaml             (project config)
KEEP: .opencode/agent_templates/*                       (agent templates)
KEEP: .opencode/context/*                              (memory & context)
KEEP: .opencode/docs/*                                 (documentation)
```

### 2.5 Post-Cleanup File Count

| Location | Before | After | Reduction |
|----------|--------|-------|-----------|
| Tier 2 scripts/ | 14 files (~8,200 lines) | 2 files (~500 lines) | -86% |
| Tier 1 scripts/ | 17 files | 20 files (gained 4 moves, lost 2 deletes) | net +2 |
| **Total lines removed** | | | **~4,970** |

---

## 3. Agent Messaging System

### 3.1 Design Principles (from user)

1. **Files over code** — Markdown files, not Python message queues
2. **Stupid simple** — Robust because nothing to break
3. **Human-readable** — Open a folder, see what's happening
4. **Zero background processes** — No polling daemons
5. **Folders ARE the state machine** — File location = task state

### 3.2 The Reality Constraint

OpenCode agents communicate via `task()`. They don't watch directories. They execute and return. So:

- **The "polling" concept doesn't apply.** Agents don't loop waiting for messages.
- **The `task()` prompt IS the message.** Everything the sub-agent needs goes in the prompt or on disk.
- **The return value IS the response.** Sub-agent's final output goes back to Oracle.
- **Mid-execution questions are impossible.** Builder can't pause and ask Oracle something.

### 3.3 The Hybrid Solution: Files for State, Prompts for Messages

Given these constraints, the messaging system is simple:

#### Layer 1: Source Tagging (Fix Bug #2)

Add a `source` parameter to `router_monitor.py`:

```python
def should_route(message: str, source: str = "user", agent: str = "Oracle", check_state: bool = True) -> dict:
    """
    SAFETY: Only route USER messages through intent detection.
    Agent messages and system messages bypass the router entirely.
    """
    # Agent messages: DON'T route through intent detection
    if source != "user":
        return {
            "should_route": False,
            "reason": f"Message from {source}, not user intent",
            "handler": "agent_response_handler"
        }
    
    # Existing routing logic for user messages...
```

This is a **1-line fix** to the function signature + a **3-line guard clause**. That's it.

#### Layer 2: Task Contract Files (Structured Handoffs)

When Oracle delegates to Builder via `task()`, Oracle ALSO writes a contract file:

```
.opencode/context/active_tasks/
└── {task_id}/
    ├── contract.md          # What Oracle wants Builder to do
    ├── status.md            # Builder updates this as it works  
    └── result.md            # Builder writes final result here
```

**contract.md** (written by Oracle BEFORE calling `task()`):
```markdown
# Task Contract

- Task ID: build_20260208_auth_abc123
- Agent: Builder
- Workflow: BUILD
- Phase: IMPLEMENTATION
- Created: 2026-02-08T14:30:00Z

## Objective
Implement user authentication feature per TECHSPEC-Auth.md

## Requirements Reference
REQ-Auth.md sections 1-4

## Success Criteria
- [ ] Login endpoint works
- [ ] Tests pass
- [ ] No lint errors

## Context Files
- .opencode/docs/requirements/REQ-Auth.md
- .opencode/docs/architecture/TECHSPEC-Auth.md
```

**status.md** (written by Builder DURING execution — as part of its prompt instructions):
```markdown
# Task Status

- Status: IN_PROGRESS
- Last Update: 2026-02-08T14:35:00Z
- Progress: Writing login endpoint tests

## Completed Steps
- [x] Read requirements
- [x] Created test file

## Current Step
- Writing login endpoint

## Artifacts Created
- src/auth/login.test.ts
- src/auth/login.ts (in progress)
```

**result.md** (written by Builder at completion):
```markdown
# Task Result

- Status: COMPLETE
- Completed: 2026-02-08T15:00:00Z

## Deliverables
- src/auth/login.ts
- src/auth/login.test.ts (4 tests, all passing)

## Validation
- Lint: ✅ Pass
- Tests: ✅ 4/4
- Type check: ✅ Pass

## Notes
Had to add bcrypt dependency for password hashing.
```

**Why this works:**
- Oracle writes contract.md → calls `task()` with prompt that says "read your contract at {path}"
- Builder reads contract.md, does the work, writes status.md and result.md
- When `task()` returns, Oracle reads result.md to understand what happened
- Human can open the folder at any time to see state
- No background processes. No polling. Just files.

#### Layer 3: Question Protocol (Handling Builder Questions)

Since Builder can't ask Oracle mid-execution, we use a **pre-flight check pattern**:

**Builder's prompt includes:**
```
Before starting work:
1. Read your contract at .opencode/context/active_tasks/{task_id}/contract.md
2. Read all referenced context files
3. If ANYTHING is unclear or missing, write your questions to 
   .opencode/context/active_tasks/{task_id}/questions.md and STOP.
   Do NOT proceed with assumptions.
4. If everything is clear, proceed with implementation.
```

**Oracle's post-delegation check:**
```
When task() returns:
1. Check if questions.md exists in the task folder
2. If YES → Present questions to user, get answers, re-delegate with answers
3. If NO → Read result.md, validate, proceed to next phase
```

This creates a **retry loop** instead of a back-channel:
```
Oracle → Builder (attempt 1)
  Builder: "I have questions" → writes questions.md → STOPS
Oracle reads questions.md → asks user → gets answers
Oracle → Builder (attempt 2, with answers in prompt)
  Builder: "All clear" → does the work → writes result.md
Oracle reads result.md → done
```

**Maximum 2-3 retries.** If Builder still can't proceed, Oracle escalates to user directly.

### 3.4 What We DON'T Build

| Concept | Why Not |
|---------|---------|
| Message queue (Python) | Background process. Violates "nothing to break" principle. |
| Inbox/Outbox polling | Agents don't poll. They execute and return. |
| WebSocket communication | Over-engineered. Would need a server. |
| `asyncio` message buffer | Python process would need to stay alive between `task()` calls. |
| Agent-to-agent direct messaging | `task()` is Oracle-only. Builder can't call Janitor. |

---

## 4. Async Delegation Architecture

### 4.1 The Problem

When Oracle calls `task(agent="Builder", ...)`, Oracle blocks. The user stares at a spinning cursor until Builder finishes. This could be minutes.

### 4.2 The Constraint We Can't Change

`task()` IS synchronous from Oracle's perspective. We cannot make it async without modifying OpenCode itself.

### 4.3 What We CAN Do: Batch Delegation

OpenCode allows **multiple tool calls in a single response**. This means Oracle can potentially:

```
# Oracle's single response contains:
task(agent="Builder", prompt="Implement auth feature...")
task(agent="Janitor", prompt="Prepare review criteria for auth...")
```

If OpenCode processes these concurrently (like it does with multiple `read()` calls), then Builder and Janitor run in parallel. Oracle still blocks until BOTH return, but the total time is `max(builder_time, janitor_time)` instead of `builder_time + janitor_time`.

**This is the ONLY form of parallelism we can achieve without modifying OpenCode.**

### 4.4 What We Can't Do (Honestly)

| Desired Behavior | Why Impossible |
|-----------------|---------------|
| Oracle talks to user while Builder works | `task()` blocks Oracle. No workaround within OpenCode. |
| User sends message to running Builder | `task()` sub-agent has no input channel. |
| Builder interrupts Oracle with question | No back-channel exists during `task()` execution. |
| Oracle monitors Builder progress in real-time | Oracle is suspended during `task()`. |

### 4.5 The Pragmatic Architecture: Pre-Flight + Batch + Post-Check

Instead of async delegation, we use a **three-phase delegation model**:

```
PHASE 1: PRE-FLIGHT (Oracle, interactive with user)
├── Gather all requirements
├── Write complete contract files
├── Resolve all ambiguities WITH the user
├── Ensure sub-agent has EVERYTHING it needs
└── User confirms: "Go ahead"

PHASE 2: BATCH EXECUTION (Oracle blocked, sub-agents running)
├── Oracle calls task() for each agent (batched if independent)
├── Each agent reads its contract, does the work, writes result
├── User sees "Working..." (cannot interact)
└── Duration: typically 30-120 seconds per agent

PHASE 3: POST-CHECK (Oracle, interactive with user)
├── Oracle reads all result.md files
├── Checks for questions.md (retry if needed)
├── Validates deliverables
├── Reports to user: "Here's what was done"
└── User reviews and approves
```

**Why this works better than "async":**
- Pre-flight eliminates 90% of mid-execution questions
- Batch execution is as fast as possible (parallel where independent)
- Post-check gives user full control over the result
- No background processes, no polling, no complexity

### 4.6 User Experience

```
User: "Build user authentication"

Oracle: "I'll help you build this. Let me gather requirements first."
[...Discovery phase, interactive Q&A...]

Oracle: "Here's the plan:
  1. Builder implements login/register endpoints
  2. Janitor reviews code quality
  
  All context is prepared. Ready to delegate? [Y/N]"

User: "Y"

Oracle: [calls task(Builder) and task(Janitor) in batch]
[User sees "Working..." for 30-120 seconds]

Oracle: "Done! Here's what happened:
  - Builder created 4 files, all tests passing
  - Janitor scored 87/100, found 2 minor issues
  
  Want me to fix the issues or proceed?"

User: "Fix the issues"

Oracle: [calls task(Builder) with fix instructions]
```

---

## 5. Init Session Fix

### 5.1 Root Cause

`nso-plugin.js` has 3 hardcoded paths pointing to `/Users/Shared/dev/openspace/`:

```javascript
// Line 8: Debug log
'/Users/Shared/dev/openspace/.opencode/logs/plugin_alive.log'

// Line 68: Pre-tool hook  
'python3 /Users/Shared/dev/openspace/.opencode/hooks/pre_tool_use/validate_intent.py'

// Line 96: Post-tool hook
'python3 /Users/Shared/dev/openspace/.opencode/hooks/post_tool_use/profiler.py'
```

The `session.created` handler (line 41-53) correctly uses the NSO path for `init_session.py`, so init SHOULD fire. But:

1. The debug log writes to wrong directory (may silently fail)
2. Every `tool.execute.before` tries to run validate_intent.py from wrong path → fails → error may cascade
3. Every `tool.execute.after` tries to run profiler.py from wrong path → fails → output gets garbled

### 5.2 Fix

Replace all hardcoded project paths with `process.cwd()`:

```javascript
// Debug log
fs.appendFileSync(`${process.cwd()}/.opencode/logs/plugin_alive.log`, ...);

// Hook paths  
$`python3 ${process.cwd()}/.opencode/hooks/pre_tool_use/validate_intent.py`
$`python3 ${process.cwd()}/.opencode/hooks/post_tool_use/profiler.py`
```

Also add graceful fallback if `.opencode/hooks/` doesn't exist (not all projects will have hooks).

### 5.3 Init Session Enhancement

Add a simple "did init run?" marker that the Oracle can check:

```python
# At the end of init_session.py, write a marker:
Path(".opencode/logs/session_init_marker.txt").write_text(
    f"initialized: {datetime.now().isoformat()}"
)
```

Oracle's instructions say: "If `.opencode/logs/session_init_marker.txt` doesn't exist, run init_session.py manually."

No complex verification system. Just a file.

---

## 6. Enhanced Router Monitor

### 6.1 Changes to `router_monitor.py`

Minimal changes:

```python
def should_route(
    message: str, 
    source: str = "user",          # NEW: "user" | "builder" | "janitor" | etc.
    agent: str = "Oracle", 
    check_state: bool = True
) -> dict:
    """
    Route ONLY user messages. Agent messages are passed through.
    """
    # NEW: Agent messages bypass routing entirely
    if source != "user":
        return {
            "should_route": False,
            "workflow": None,
            "confidence": 0.0,
            "reason": f"Message from {source} agent, not user intent",
            "handler": "pass_through",
            "safety_check": "AGENT_SOURCE"
        }
    
    # ... rest of existing logic unchanged ...
```

### 6.2 How Oracle Uses It

In Oracle's instructions/prompt, add:

```markdown
## Message Source Protocol

When you receive a response from a `task()` call:
- This is an AGENT message, not a user message
- Do NOT run router_monitor.py on it
- Read the response, process it, and continue your workflow

When you receive a message from the user (human):
- This IS a user message
- Run router_monitor.py if not in active workflow
- Follow routing decision
```

This is **prompt engineering, not code**. The Oracle already knows when it called `task()` and when the user is talking. We just need to make the instructions explicit.

---

## 7. Implementation Plan

### Phase 1C.1: Cleanup (Day 1) — Estimated 2 hours

| Step | Action | Files |
|------|--------|-------|
| 1 | Delete dead code | 10 files, ~4,970 lines |
| 2 | Move core scripts to Tier 1 | 4 files |
| 3 | Fix hardcoded paths in nso-plugin.js | 3 lines |
| 4 | Fix hardcoded paths in system_telemetry.py | 1 line |
| 5 | Fix hardcoded paths in copy_session.py | 1 line |
| 6 | Fix hardcoded paths in parallel_oracle_integration.py | 2 lines |
| 7 | Remove profiler.py → validate.py fast-mode call | 1 section |
| 8 | Delete router.py stub | 1 file |
| 9 | Fix monitor_tasks.py typo | 1 line |
| 10 | Update all imports after file moves | Multiple files |
| 11 | Run tests to verify nothing broke | test_parallel_isolation.py, test_oracle_integration.py |

### Phase 1C.2: Source Tagging (Day 1) — Estimated 1 hour

| Step | Action | Files |
|------|--------|-------|
| 1 | Add `source` parameter to router_monitor.py | 1 file, ~10 lines |
| 2 | Add agent message bypass logic | 1 file, ~5 lines |
| 3 | Update Oracle instructions with Message Source Protocol | instructions.md |
| 4 | Test with sample agent messages | Manual test |

### Phase 1C.3: Task Contract System (Day 2) — Estimated 3 hours

| Step | Action | Files |
|------|--------|-------|
| 1 | Create `active_tasks/` directory structure | Directory setup |
| 2 | Write contract.md template | 1 template file |
| 3 | Write status.md template | 1 template file |
| 4 | Write result.md template | 1 template file |
| 5 | Write questions.md template | 1 template file |
| 6 | Create `task_contract_writer.py` — single script to write contracts | 1 file, ~100 lines |
| 7 | Update agent templates with contract-reading instructions | 3 files |
| 8 | Update Oracle template with post-check instructions | 1 file |
| 9 | Test full delegation flow manually | Manual test |

### Phase 1C.4: Init Session Fix (Day 2) — Estimated 30 minutes

| Step | Action | Files |
|------|--------|-------|
| 1 | Fix nso-plugin.js paths (done in 1C.1) | Already done |
| 2 | Add graceful fallback for missing hooks directory | nso-plugin.js |
| 3 | Add init marker to init_session.py | 1 line |
| 4 | Add "check for marker" instruction to Oracle | instructions.md |

### Phase 1C.5: Deduplicate patterns.md (Day 2) — Estimated 30 minutes

| Step | Action | Files |
|------|--------|-------|
| 1 | Run deduplicate_patterns.py on memory patterns.md | patterns.md |
| 2 | Trim patterns.md to <200 lines (MVI principle) | patterns.md |

---

## 8. What We're NOT Doing (And Why)

| Feature | Reason |
|---------|--------|
| Async delegation (Oracle talks while Builder works) | `task()` is synchronous. Can't change OpenCode internals. Pre-flight + batch + post-check is better UX anyway. |
| Message queue system | Background process. Violates simplicity principle. |
| Heartbeat HTTP server | Nothing connects to it. Monitoring via files is enough. |
| WebSocket agent communication | Over-engineered for file-based system. |
| Real-time progress dashboard | Oracle is blocked during task(). Nobody to update the dashboard. Agent writes status.md instead. |
| Remaining agent templates (designer, scout, librarian) | Not needed until those agents are actually used in parallel workflows. YAGNI. |

---

## 9. Success Criteria

### Must Pass (Gate Check)

- [ ] Zero hardcoded project paths in Tier 1 (nso/) files
- [ ] `nso-plugin.js` hooks work for ANY project directory
- [ ] `router_monitor.py` correctly rejects non-user messages
- [ ] Oracle instructions explicitly cover message source protocol
- [ ] Task contract files are human-readable Markdown
- [ ] `init_session.py` writes a marker file
- [ ] Dead code deleted (~4,970 lines removed)
- [ ] Core scripts live in Tier 1 (nso/scripts/)

### Should Pass

- [ ] Full delegation flow works: Oracle → writes contract → calls task(Builder) → Builder reads contract, writes result → Oracle reads result
- [ ] Question retry loop works: Builder writes questions.md → Oracle re-delegates with answers
- [ ] patterns.md is <200 lines

### Stretch

- [ ] Batch delegation (2+ agents in single Oracle response) tested
- [ ] All tests still pass after cleanup

---

## 10. Risks

| Risk | Mitigation |
|------|-----------|
| Deleting files breaks something | All dead files are standalone (no imports). Safe to delete. |
| Moving files breaks imports | Update imports + run tests. Core scripts use dynamic imports. |
| Plugin fix breaks other projects | `process.cwd()` makes it project-aware. If hooks dir doesn't exist, skip gracefully. |
| Contract system adds ceremony | Templates are simple. Oracle writes them automatically. |
| Batch task() calls don't run in parallel | Falls back to sequential. Same correctness, just slower. |

---

## 11. File Inventory After Phase 1C

### Tier 1: `/Users/opencode/.config/opencode/nso/scripts/`
```
scripts/
├── init_session.py              ✅ Existing (add marker)
├── close_session.py             ✅ Existing
├── router_monitor.py            ✅ Existing (add source param)
├── project_init.py              ✅ Existing
├── validate.py                  ✅ Existing (fast mode: remove no-op)
├── gate_check.py                ✅ Existing
├── session_state.py             ✅ Existing
├── system_telemetry.py          ✅ Existing (fix path)
├── copy_session.py              ✅ Existing (fix path)
├── monitor_tasks.py             ✅ Existing (fix typo)
├── memory_validator.py          ✅ Existing
├── deduplicate_patterns.py      ✅ Existing
├── test_mcps.py                 ✅ Existing
├── parallel_oracle_integration.py ✅ Existing (fix paths)
├── task_id_generator.py         📦 Moved from Tier 2
├── task_context_manager.py      📦 Moved from Tier 2
├── context_contamination_detector.py 📦 Moved from Tier 2
├── parallel_coordinator.py      📦 Moved from Tier 2
├── task_contract_writer.py      🆕 NEW (~100 lines)
└── __init__.py                  ✅ Existing
```

### Tier 2: `/Users/Shared/dev/dream-news/.opencode/`
```
scripts/
├── test_oracle_integration.py   ✅ Kept (test)
└── test_parallel_isolation.py   ✅ Kept (test)

config/
├── parallel-config.yaml         ✅ Kept
└── task-isolation.yaml          ✅ Kept

context/
├── 00_meta/                     ✅ Kept
├── 01_memory/                   ✅ Kept
├── 03_proposals/                ✅ Kept
└── active_tasks/                🆕 NEW (contract system)
    └── {task_id}/
        ├── contract.md
        ├── status.md
        ├── result.md
        └── questions.md         (optional)

agent_templates/                 ✅ Kept (6 files)
docs/                            ✅ Kept
logs/                            ✅ Kept
```

---

## 12. Appendix: Contract Templates

### contract.md
```markdown
# Task Contract: {{task_id}}

| Field | Value |
|-------|-------|
| Agent | {{agent}} |
| Workflow | {{workflow}} |
| Phase | {{phase}} |
| Created | {{timestamp}} |
| Delegated By | Oracle |

## Objective
{{objective}}

## Requirements
{{requirements_reference}}

## Success Criteria
{{criteria_list}}

## Context Files
{{file_list}}

## Instructions
1. Read all context files listed above
2. If anything is unclear, write questions to `questions.md` in this folder and STOP
3. Update `status.md` as you work  
4. Write final results to `result.md`
5. Ensure all success criteria are met before completing
```

### status.md
```markdown
# Task Status: {{task_id}}

- Status: {{PENDING | IN_PROGRESS | BLOCKED | COMPLETE | FAILED}}
- Last Update: {{timestamp}}
- Current Step: {{description}}

## Completed
{{completed_items}}

## Remaining
{{remaining_items}}

## Artifacts
{{files_created_or_modified}}
```

### result.md
```markdown
# Task Result: {{task_id}}

- Status: {{COMPLETE | FAILED}}
- Completed: {{timestamp}}
- Duration: {{duration}}

## Deliverables
{{file_list}}

## Validation
{{test_results}}

## Notes
{{any_notes_for_oracle}}
```

### questions.md
```markdown
# Questions: {{task_id}}

Agent {{agent}} needs clarification before proceeding.

## Questions
1. {{question_1}}
2. {{question_2}}

## What I Understood
{{agent_understanding}}

## What Is Unclear
{{specific_ambiguity}}
```
