# TASK ISOLATION RULES TEMPLATE
# Injected after tools section in agent instructions

## TOOL USAGE WITH TASK ISOLATION

When using tools in parallel execution mode, you MUST apply task isolation rules:

### Read/Write/Edit Tools:
- **Before reading/writing/editing ANY file**, check if it's in your task context
- **Example**: `read("{{task_context_path}}/{{task_id}}_requirements.md")` ✅
- **Example**: `read(".opencode/context/requirements.md")` ❌ (missing task ID)
- **Example**: `write("{{task_context_path}}/{{task_id}}_active_context.md", content)` ✅
- **Example**: `write(".opencode/context/active_context.md", content)` ❌ (global contamination)

### Bash/Command Tools:
- **DO NOT** use `cd` to navigate outside your task context
- **DO NOT** modify files without `{{task_id}}_` prefix
- **ALWAYS** verify working directory is within `{{task_context_path}}`
- **Example**: `bash(workdir="{{task_context_path}}", command="ls")` ✅
- **Example**: `bash(workdir=".", command="ls")` ❌ (ambiguous, could be wrong directory)

### Task Tool (Agent Delegation):
- **ALWAYS** include task ID when delegating to other agents
- **Example**: `task(description="Implement feature", prompt="Task ID: {{task_id}} - {{prompt}}", subagent_type="builder")` ✅
- **Example**: `task(description="Implement feature", prompt="{{prompt}}", subagent_type="builder")` ❌ (missing task ID)

### Grep/Glob Tools:
- **CONSTRAIN** searches to your task context when possible
- **Example**: `grep(path="{{task_context_path}}", pattern="TODO")` ✅
- **Example**: `grep(path=".", pattern="TODO")` ❌ (could search other tasks)

### Task-Specific Environment Variables:
- **TASK_ID**: `{{task_id}}` (your unique task identifier)
- **TASK_CONTEXT_PATH**: `{{task_context_path}}` (your isolated workspace)
- **TASK_TYPE**: `{{task_type}}` (BUILD/DEBUG/REVIEW/PLAN)
- **AGENT_ROLE**: `{{agent_role}}` (builder/janitor/designer/scout/librarian)

## ISOLATION CHECKLIST (RUN BEFORE EVERY OPERATION)

**BEFORE EACH TOOL CALL, ASK YOURSELF:**

1. ✅ **File Path Check**: Does the file path contain `{{task_id}}_` or is it in `{{task_context_path}}`?
2. ✅ **Directory Check**: Am I working within `{{task_context_path}}` or `.opencode/context/00_meta/` (read-only)?
3. ✅ **Cross-Task Check**: Am I referencing files from other tasks? (FORBIDDEN)
4. ✅ **Global Memory Check**: Am I trying to modify `.opencode/context/01_memory/`? (USE TASK MEMORY INSTEAD)

## SAFE PATTERNS FOR COMMON OPERATIONS

### Reading Global Templates (ALLOWED):
```python
read(".opencode/context/00_meta/tech-stack.md")  # ✅ Read-only global template
read(".opencode/context/00_meta/patterns.md")     # ✅ Read-only global template
```

### Working with Task Files (REQUIRED):
```python
# ✅ CORRECT - Task-prefixed files in task context
write("{{task_context_path}}/{{task_id}}_requirements.md", content)
read("{{task_context_path}}/{{task_id}}_active_context.md")
edit("{{task_context_path}}/{{task_id}}_patterns.md", old_string, new_string)

# ❌ WRONG - No task ID, potential contamination
write("requirements.md", content)  # Could overwrite other task!
read("active_context.md")          # Could read wrong task!
```

### Running Tests/Commands (SAFE):
```python
# ✅ CORRECT - Explicit task context
bash(workdir="{{task_context_path}}", command="npm test")
bash(workdir="{{task_context_path}}", command="python test_{{task_id}}.py")

# ❌ WRONG - Ambiguous context
bash(workdir=".", command="npm test")  # Which "."? Could be wrong task!
```

## CONTAMINATION RESPONSE PROTOCOL

If you accidentally create a file without task ID:

1. **IMMEDIATELY DELETE IT**: Use bash tool to remove the contaminated file
2. **CREATE CORRECT FILE**: Create the properly prefixed version
3. **REPORT INCIDENT**: Create `{{task_id}}_contamination_incident.md` with details
4. **CONTINUE WORK**: Resume with proper isolation

**Example cleanup**:
```python
# Delete contaminated file
bash(workdir="{{task_context_path}}", command="rm -f requirements.md")

# Create correct file  
write("{{task_context_path}}/{{task_id}}_requirements.md", content)

# Report incident
write("{{task_context_path}}/{{task_id}}_contamination_incident.md", 
       "Accidentally created requirements.md without task ID. Fixed.")
```

## TASK COMPLETION PROTOCOL

When your task is complete:

1. **CREATE COMPLETION FILE**: `{{task_id}}_task_complete.json`
2. **INCLUDE RESULTS**: Task output, success status, any issues
3. **VALIDATE ISOLATION**: Verify all files have proper task ID prefix
4. **ARCHIVE IF NEEDED**: Coordinator will handle archival

**Example completion file**:
```json
{
  "task_id": "{{task_id}}",
  "status": "completed",
  "completion_time": "2026-02-08T10:30:00Z",
  "output_files": [
    "{{task_id}}_requirements.md",
    "{{task_id}}_implementation.py",
    "{{task_id}}_tests.py"
  ],
  "validation_passed": true,
  "contamination_incidents": 0,
  "agent_role": "{{agent_role}}"
}
```