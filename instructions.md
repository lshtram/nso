# NSO Operational Instructions

## Session Start Protocol (AUTOMATIC ✅)

**Session initialization now runs automatically!**

### How It Works
The NSO plugin (`~/.config/opencode/nso/nso-plugin.js`) automatically runs `init_session.py` on the **first tool call** of each new session.

**What happens automatically:**
1. ✅ Loads project context (Tier 2) from `.opencode/context/00_meta/`
2. ✅ Loads project memory (Tier 2) from `.opencode/context/01_memory/`
3. ✅ Verifies NSO system availability (Tier 1)
4. ✅ Checks for active workflows
5. ✅ Generates session summary

**You don't need to do anything** - just start your session and the Oracle will be fully initialized!

### Manual Initialization (Optional)
If you want to manually check initialization status:
```bash
python3 ~/.config/opencode/nso/scripts/init_session.py
```

### For New Projects (without .opencode/):
```bash
python3 ~/.config/opencode/nso/scripts/project_init.py "Project Name" [project_type]
```

This creates the complete structure:
- `.opencode/context/00_meta/` - Tech stack, patterns, glossary
- `.opencode/context/01_memory/` - Active context, patterns, progress
- `.opencode/docs/` - Architecture and requirements structure
- `.opencode/nso-config.json` - Project configuration

**After initialization, automatic loading will work on next session.**

---

## Project Structure (Two-Tier Architecture)

### Tier 1 (System-Wide): `~/.config/opencode/nso/`
- **Global NSO system** - Agents, skills, workflows, scripts
- Shared across all projects
- **DO NOT MODIFY** without permission

### Tier 2 (Project-Specific): `./.opencode/`
- **Project context** - Tech stack, patterns, glossary
- **Project memory** - Active context, progress, decisions
- **Project docs** - Requirements, architecture

**Oracle MUST read Tier 2 files at every session start.**

---

## Mandatory Memory Protocol
At the start of every session:
1. **RUN** `init_session.py` to load all context
2. **READ** `.opencode/context/00_meta/tech-stack.md`
3. **READ** `.opencode/context/00_meta/patterns.md`
4. **LOAD** `.opencode/context/01_memory/active_context.md`
5. **VERIFY** current workflow state

At the end of every session:
1. **RUN** `close_session.py` or use `/close-session` command
2. **Script will automatically:**
   - Update memory files (active_context.md → Status: COMPLETE)
   - Check for code changes via git status
   - Run validation/tests if code changes exist
   - **Only commit+push if:** ✅ Code changes exist AND ✅ All tests pass
   - **Otherwise:** Ask user for intention (fix tests, commit only memory, or force)
3. **Review** what the script will do before confirming
4. **Script creates commit** with session summary

---

## Session Closure Command

### Command: `/close-session`

**Purpose**: Properly close a session with validation and safe git operations.

**Usage**:
```bash
# Command line:
python3 ~/.config/opencode/nso/scripts/close_session.py

# Or via OpenCode:
/close-session
/close-session --message "Custom commit message"
/close-session --no-push  # Commit but don't push
/close-session --dry-run  # Preview what would happen
```

**What it does**:
1. **Checks git status** - Identifies modified/new/deleted files
2. **Runs validation** - Executes tests (npm run check, pytest, etc.)
3. **Updates memory** - Marks active_context.md as COMPLETE
4. **Smart git operations**:
   - **If code changes + tests pass**: Stages everything, commits, pushes
   - **If code changes + tests fail**: Asks user what to do
   - **If no code changes**: Commits only memory file updates
   - **If nothing changed**: Skips commit

**Safety Features**:
- ✅ Only commits+push if tests pass
- ✅ Confirms with user if tests fail
- ✅ Can commit only memory files (skip failing code)
- ✅ Dry-run mode to preview actions
- ✅ Never force-pushes or bypasses validation

**Examples**:

**Scenario 1: All Good**
```
User: /close-session
System: Found 3 code changes, all tests pass ✅
        Stage memory files? Yes
        Stage code changes? Yes
        Create commit? Yes
        Push? Yes
Result: ✅ Session closed, changes committed and pushed
```

**Scenario 2: Tests Failing**
```
User: /close-session
System: Found 5 code changes, but tests failing ❌
        
        What would you like to do?
        [1] Fix tests first (recommended)
        [2] Commit only memory files (skip code)
        [3] Commit everything anyway (not recommended)
        [4] Cancel
        
User: 2
Result: ✅ Only memory files committed, code changes remain unstaged
```

**Scenario 3: No Changes**
```
User: /close-session
System: No code changes detected
        Update memory files only
Result: ✅ Memory updated and committed
```

At the end of every session:
1. **UPDATE** project-specific memory.
2. **COMMIT** changes with clear, descriptive messages.

## Automatic Router Monitoring (NEW)

The NSO now uses **automatic router monitoring** on every user message. The Oracle must follow this protocol:

### ⚠️ CRITICAL SAFETY CHECKS:

**Only run router monitor IF:**
1. ✅ **You are the Oracle** (not Builder, Janitor, etc.)
2. ✅ **NOT currently in an active workflow** (check active_context.md)
3. ✅ **Message is from the user** (not internal agent communication)

**Do NOT route if:**
- ❌ Currently in BUILD workflow (Discovery, Architecture, Implementation, Validation phases)
- ❌ Currently in DEBUG workflow (Investigation, Fix, Validation phases)
- ❌ Currently in REVIEW workflow (Scope, Analysis phases)
- ❌ You're acting as Builder, Janitor, or Librarian
- ❌ The message is a workflow phase continuation (e.g., user responding to requirement questions)

### Before Responding to ANY User Message:

1. **Check if in active workflow:**
   - Read `.opencode/context/01_memory/active_context.md`
   - If Status shows "IN_PROGRESS", "PENDING", or a phase name → **SKIP routing**
   - If Current Focus shows active workflow → **SKIP routing**

2. **Only if NOT in workflow, run Router Monitor:**
   ```bash
   python3 ~/.config/opencode/nso/scripts/router_monitor.py "user message"
   ```

3. **Decision Logic:**

   **IF** `should_route: true` (confidence ≥ 20%):
   - **Activate the detected workflow** (BUILD/DEBUG/REVIEW/PLAN)
   - **Do NOT** respond with casual chat
   - **Proceed directly** to the workflow's Discovery/Investigation/Scope phase
   - Use the `suggested_response` as your opening line

   **IF** `should_route: false` (confidence < 20%):
   - **Continue normal conversation**
   - Answer questions, provide explanations, discuss ideas
   - **No workflow activation**

### Examples:

**Example 1 - Start New Workflow:**
```
User: "build a new feature for user authentication"
[Check: NOT in workflow ✓]
Router: {"should_route": true, "workflow": "BUILD", "confidence": 0.8}
Oracle: "I'll help you build this. Let me gather requirements first."
[Activate BUILD workflow]
```

**Example 2 - During Workflow (SKIP):**
```
User: "yes, that requirement looks good"
[Check: IN BUILD workflow, Discovery phase]
Oracle: [Continue current workflow, do NOT run router]
```

**Example 3 - Chat Mode:**
```
User: "hello, how are you?"
[Check: NOT in workflow ✓]
Router: {"should_route": false, "confidence": 0.0}
Oracle: "Hello! I'm doing well, thank you. How can I help you today?"
```

### Confidence Thresholds:
- **≥ 20%**: Route to workflow (low threshold to catch intent)
- **< 20%**: Treat as chat (avoid false positives)

### Router Priority (Tie-Breaking):
DEBUG > REVIEW > PLAN > BUILD

When multiple workflows match, DEBUG takes highest priority (bugs are urgent), followed by REVIEW, PLAN, then BUILD.

### When to Skip Routing (Quick Reference):

**SKIP routing when:**
- Active workflow in progress (check active_context.md Status field)
- You're delegating to another agent
- User is responding to workflow questions
- You're in the middle of requirement elicitation
- You're in the middle of architecture review
- You're in implementation phase
- You're debugging an issue
- You're reviewing code

**DO route when:**
- Fresh user request with no active workflow
- User explicitly starts new topic
- Current workflow completed (Status: COMPLETE)
- User says "let's start something new"
