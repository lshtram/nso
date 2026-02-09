# TASK ISOLATION HEADER TEMPLATE
# This content is automatically injected at the beginning of agent instructions during parallel execution

## CRITICAL: TASK ISOLATION RULES (MUST READ)

**You are operating in PARALLEL EXECUTION MODE with TASK ISOLATION.** 

### Task Information:
- **Your Task ID:** `{{task_id}}`
- **Your Task Type:** `{{task_type}}`
- **Your Isolated Context Path:** `{{task_context_path}}`
- **Your Agent Role:** `{{agent_role}}`

### Isolation Rules (ABSOLUTE REQUIREMENTS):

1. **File Naming Convention**: ALL files you create or modify MUST include your task ID prefix.
   - ✅ **CORRECT**: `{{task_id}}_requirements.md`, `{{task_id}}_active_context.md`, `{{task_id}}_feature_implementation.py`
   - ❌ **WRONG**: `requirements.md`, `active_context.md`, `feature_implementation.py`
   - **Pattern**: `{{task_id}}_filename.ext` OR `filename_{{task_id}}.ext`

2. **Context Boundaries**: You MUST work ONLY within your isolated context:
   - ✅ **ALLOWED**: `{{task_context_path}}/*` (your task directory)
   - ✅ **ALLOWED**: `.opencode/context/00_meta/*` (read-only global templates)
   - ❌ **FORBIDDEN**: `.opencode/context/01_memory/*` (global memory - use task memory instead)
   - ❌ **FORBIDDEN**: Any other task's directory

3. **Task Memory Files**: Use these files within your task context:
   - `{{task_id}}_active_context.md` - Your task's active decisions and focus
   - `{{task_id}}_progress.md` - Your task's progress tracking
   - `{{task_id}}_patterns.md` - Patterns discovered during your task
   - `{{task_id}}_REQ-*.md` - Requirements files for your task
   - `{{task_id}}_TECHSPEC-*.md` - Technical specifications for your task

4. **Communication with Other Tasks**: 
   - NO DIRECT INTERACTION with other parallel tasks
   - Use shared message queues if configured
   - Report results to coordinator (Oracle) via task completion files

5. **Contamination Prevention**:
   - Always verify file paths contain `{{task_id}}`
   - If you accidentally create a file without task ID, delete it immediately
   - Report contamination detection to coordinator via `{{task_id}}_contamination_report.md`

### Failure Consequences:
- **Contamination Detected**: Task will be automatically terminated
- **Cross-Task Interference**: All affected tasks will be rolled back
- **Isolation Violation**: Fallback to sequential execution for entire workflow

### Success Requirements:
- ✅ All files properly prefixed with `{{task_id}}_`
- ✅ Working within isolated context `{{task_context_path}}`
- ✅ No references to other task IDs (except via coordinator)
- ✅ Task completion reported via `{{task_id}}_task_complete.json`

---
**Remember**: You are ONE agent in a PARALLEL workflow. Your isolation ensures the entire system works correctly.