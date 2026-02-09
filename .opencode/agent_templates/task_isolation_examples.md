# TASK ISOLATION EXAMPLES TEMPLATE
# Injected at the end of agent instructions

## REAL-WORLD EXAMPLES WITH TASK ISOLATION

### Example 1: Builder Agent Implementing a Feature

**WRONG (Contamination Risk)**:
```python
# ❌ NO TASK ISOLATION
write("requirements.md", "# User Authentication Requirements")
write("implementation.py", "def authenticate_user(): ...")
bash(workdir=".", command="python test_auth.py")
```

**CORRECT (Task-Isolated)**:
```python
# ✅ WITH TASK ISOLATION
write("{{task_context_path}}/{{task_id}}_requirements.md", "# User Authentication Requirements")
write("{{task_context_path}}/{{task_id}}_implementation.py", "def authenticate_user(): ...")
bash(workdir="{{task_context_path}}", command="python {{task_id}}_test_auth.py")
task(description="Review authentication code", 
     prompt="Task ID: {{task_id}} - Please review the authentication implementation",
     subagent_type="janitor")
```

### Example 2: Janitor Agent Reviewing Code

**WRONG (Cross-Task Interference)**:
```python
# ❌ READING WRONG TASK'S FILES
read("requirements.md")  # Which task? Could be task_123 or task_456!
edit("active_context.md", "old", "new")  # Modifying global memory!
```

**CORRECT (Task-Aware)**:
```python
# ✅ READING SPECIFIC TASK FILES
read("{{task_context_path}}/{{task_id}}_requirements.md")  # Clear which task
read("{{task_context_path}}/{{task_id}}_implementation.py")
edit("{{task_context_path}}/{{task_id}}_active_context.md", "old", "new")  # Task memory only
write("{{task_context_path}}/{{task_id}}_review_report.md", "Code review complete")
```

### Example 3: Designer Agent Creating UI Components

**WRONG (Global Contamination)**:
```python
# ❌ MESSING WITH GLOBAL FILES
write("components/Button.tsx", "export default Button")  # Global component dir!
read("styles/theme.css")  # Global styles!
```

**CORRECT (Task-Scoped)**:
```python
# ✅ TASK-SCOPED COMPONENTS
write("{{task_context_path}}/{{task_id}}_Button.tsx", "export default Button")
read(".opencode/context/00_meta/design_tokens.md")  # ✅ Read-only global reference
write("{{task_context_path}}/{{task_id}}_theme_overrides.css", "Custom theme for task")
```

### Example 4: Scout Agent Researching Technology

**WRONG (Polluting Shared Space)**:
```python
# ❌ SHARING RESEARCH GLOBALLY
write("research_findings.md", "# New Database Technology")
bash(workdir=".", command="npm install new-db-library")  # Global install!
```

**CORRECT (Task-Containerized)**:
```python
# ✅ TASK-CONTAINERIZED RESEARCH
write("{{task_context_path}}/{{task_id}}_research_findings.md", "# New Database Technology")
bash(workdir="{{task_context_path}}", command="npm init -y && npm install new-db-library")  # Local to task
write("{{task_context_path}}/{{task_id}}_rfc.md", "# RFC: Adopt New Database")
```

### Example 5: Librarian Agent Managing Knowledge

**WRONG (Centralized Memory Pollution)**:
```python
# ❌ DIRECT GLOBAL MEMORY MODIFICATION
write(".opencode/context/01_memory/active_context.md", "Task completed")  # Overwrites others!
read(".opencode/context/01_memory/progress.md")  # Reads ALL progress
```

**CORRECT (Task Memory + Coordinator)**:
```python
# ✅ TASK MEMORY + COORDINATOR SYNCHRONIZATION
# 1. Update task memory
write("{{task_context_path}}/{{task_id}}_active_context.md", "Task {{task_id}} completed")
write("{{task_context_path}}/{{task_id}}_progress.md", "All milestones complete")

# 2. Signal coordinator for global update
write("{{task_context_path}}/{{task_id}}_task_complete.json", 
      '{"task_id": "{{task_id}}", "status": "completed", "ready_for_global_sync": true}')

# 3. Coordinator will merge into global memory (NOT your responsibility)
```

## COMMON PITFALLS AND SOLUTIONS

### Pitfall 1: Forgetting Task ID Prefix
**Symptom**: Creating `requirements.md` instead of `{{task_id}}_requirements.md`
**Solution**: Always use `{{task_id}}_` prefix pattern

### Pitfall 2: Working in Wrong Directory  
**Symptom**: Using `workdir="."` without specifying task context
**Solution**: Always use `workdir="{{task_context_path}}"`

### Pitfall 3: Reading Global Memory Directly
**Symptom**: Reading `.opencode/context/01_memory/active_context.md`
**Solution**: Read task memory: `{{task_context_path}}/{{task_id}}_active_context.md`

### Pitfall 4: Delegating Without Task ID
**Symptom**: `task(prompt="Do something", subagent_type="builder")`
**Solution**: `task(prompt="Task ID: {{task_id}} - Do something", subagent_type="builder")`

## VERIFICATION SCRIPTS (FOR SELF-CHECK)

### Quick Isolation Check:
```python
# Run this to verify your isolation
bash(workdir="{{task_context_path}}", 
     command='find . -type f -name "*.md" -o -name "*.json" -o -name "*.py" | grep -v "{{task_id}}" | wc -l')
# Should return 0 (no files without task ID)
```

### Context Boundary Check:
```python
# Verify you're not accessing other tasks
bash(workdir="{{task_context_path}}", 
     command='pwd | grep "{{task_context_path}}" && echo "✅ In correct context" || echo "❌ WRONG CONTEXT"')
```

### Completion Validation:
```python
# Create completion validation
write("{{task_context_path}}/{{task_id}}_validation.json",
      '{"task_id": "{{task_id}}", "files_created": ["list", "your", "files", "here"], "all_prefixed": true}')
```

## REMEMBER: ISOLATION = SAFETY

**Without isolation**: One agent's mistake breaks ALL parallel tasks.
**With isolation**: One agent's mistake is contained to their task only.

Your careful adherence to these rules enables the entire system to run multiple agents in parallel safely and efficiently.