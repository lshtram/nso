# NSO Troubleshooting Guide

**Version:** 1.0.0  
**Last Updated:** 2026-02-09

---

## Quick Diagnostics

### Check System Health
```bash
# 1. NSO system installed?
ls ~/.config/opencode/nso/
# Should show: AGENTS.md, instructions.md, nso-plugin.js, scripts/, skills/

# 2. Project initialized?
ls .opencode/
# Should show: context/, docs/, agent_templates/, config/, scripts/

# 3. Active tasks directory?
ls .opencode/context/active_tasks/
# Shows current parallel tasks (or empty if none running)

# 4. Check for errors in last session
cat .opencode/logs/session_init.json | grep -i error
```

---

## Common Issues & Solutions

### 1. "Parallel execution not detected"

**Symptoms:**
- You request work but Oracle runs everything sequentially
- No task IDs generated
- No `active_tasks/` directories created

**Causes & Solutions:**

#### Cause A: Request too vague
```
❌ "Build a feature"
✅ "Build a feature with tests and UI mockup"
```
**Solution:** Be explicit about different aspects (code, tests, UI, docs)

#### Cause B: Parallel disabled in config
```bash
# Check config
cat .opencode/config/parallel-config.yaml | grep enabled
# Should show: enabled: true
```
**Solution:** Enable parallel in config or create default config:
```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 5
```

#### Cause C: Router confidence too low
```bash
# Check router output
python3 ~/.config/opencode/nso/scripts/router_monitor.py "your request"
# Look for: parallel_potential: 0
```
**Solution:** Rephrase request to emphasize different tasks:
```
❌ "fix the bug"
✅ "investigate the bug, fix it, and add regression tests"
```

---

### 2. "Agent timeout / not responding"

**Symptoms:**
```
⏰ AGENT TIMEOUT DETECTED
Agent: Builder
Last activity: 6 minutes ago
```

**Causes & Solutions:**

#### Cause A: Agent working on complex task (NORMAL)
**Indicators:**
- Status file shows recent updates
- Task is genuinely complex (e.g., large refactor)

**Solution:** Wait longer or increase timeout:
```yaml
# .opencode/config/parallel-config.yaml
parallel:
  timeouts:
    agent_status_update_seconds: 600  # 10 minutes instead of 5
```

#### Cause B: Agent actually stuck
**Indicators:**
- No status file updates for >10 minutes
- No new files created
- CPU idle

**Solution:**
```bash
# 1. Check agent status
cat .opencode/context/active_tasks/task_*/status.md

# 2. Check for errors
cat .opencode/context/active_tasks/task_*/error.log 2>/dev/null

# 3. Terminate and retry
# Oracle will prompt you with options:
#   [1] Wait longer
#   [2] Terminate and retry  ← Choose this
#   [3] Investigate manually
```

#### Cause C: Resource exhaustion
**Indicators:**
```bash
# Check disk space
df -h .
# If >90% full, this is the cause

# Check memory
top -l 1 | grep PhysMem
# If high usage, this is the cause
```

**Solution:**
```bash
# Free up space
rm -rf tmp/ .opencode/context/active_tasks/*/quarantine/

# Or pause parallel execution
echo "Paused due to resource constraints" > .opencode/context/PARALLEL_EXECUTION_PAUSED
```

---

### 3. "Questions loop timeout"

**Symptoms:**
```
🔄 CLARIFICATION LOOP TIMEOUT
The agent has asked for clarification 3 times but still cannot proceed.
```

**Causes & Solutions:**

#### Cause A: Requirements genuinely unclear
**Example:**
```
User: "Build authentication"
Agent: "What auth method?" (Question 1)
User: "Use OAuth"
Agent: "Which OAuth flow?" (Question 2)
User: "The secure one"
Agent: "PKCE, implicit, or code flow?" (Question 3)
→ TIMEOUT
```

**Solution:** Provide detailed requirements upfront:
```
✅ "Build authentication using OAuth 2.0 with PKCE flow, integrate with Auth0"
```

#### Cause B: Agent confused by conflicting info
**Example:**
```
REQ-Auth.md says: "Use basic auth"
TECHSPEC-Auth.md says: "Use OAuth 2.0"
→ Agent asks: "Which one?" (loop continues)
```

**Solution:**
```bash
# 1. Check for conflicts
grep -r "authentication" .opencode/docs/

# 2. Fix conflicts in requirements
# Edit REQ-Auth.md to be consistent with TECHSPEC-Auth.md

# 3. Retry with clean contract
```

#### Cause C: Missing context files
**Example:**
```
Contract references: "REQ-Auth.md"
But file doesn't exist
→ Agent asks: "Where is REQ-Auth.md?"
```

**Solution:**
```bash
# 1. Create missing files
# Oracle should have created these during Discovery/Architecture phases

# 2. If files exist but in wrong location:
ls .opencode/docs/requirements/
# Move to task directory with proper prefix:
cp REQ-Auth.md .opencode/context/active_tasks/task_*/task_*_REQ-Auth.md
```

---

### 4. "Contamination detected"

**Symptoms:**
```
🚨 CONTEXT CONTAMINATION DETECTED
Files were created without proper task ID prefix.
Violating files moved to quarantine/
```

**Causes & Solutions:**

#### Cause A: Agent didn't follow naming convention (RARE)
**Example:**
```
Expected: task_20260209_103045_build_abc123_001_implementation.py
Found:    implementation.py  ← Missing task ID prefix
```

**Solution:** This is usually caught automatically:
```bash
# 1. Check quarantined files
ls .opencode/context/active_tasks/task_*/quarantine/

# 2. Rename and restore
cd .opencode/context/active_tasks/task_*/quarantine/
mv implementation.py ../task_*_implementation.py

# 3. Update result.md to reference new filename
```

#### Cause B: Manual file creation during development
**Example:**
```
Developer manually creates: test_feature.py
While agent is working: task_*_test_feature.py
→ Contamination detector flags manual file
```

**Solution:**
```bash
# 1. Either rename manual file to match convention
mv test_feature.py task_*_test_feature.py

# 2. Or move manual file out of task directory
mv test_feature.py ../../manual_files/
```

---

### 5. "Fallback to sequential mode"

**Symptoms:**
```
⚠️  PARALLEL EXECUTION FAILED - FALLING BACK TO SEQUENTIAL MODE
Reason: Agent timeout
Impact: Tasks will run one at a time
```

**This is NORMAL and NOT an error** - it's a safety mechanism.

**When it happens:**
- Agent timeout (>5 min without status update)
- Agent crash (uncaught exception)
- Resource exhaustion (disk/memory)
- Too many failed question loops

**What to do:**
✅ **Nothing** - Oracle will retry in sequential mode automatically

**Optional: Investigate why**
```bash
# Check failure report
cat .opencode/context/active_tasks/task_*/parallel_failure.md

# Common reasons:
# - Task was more complex than expected (normal)
# - Resource constraints (disk full)
# - Bug in agent template (rare, report to maintainer)
```

---

### 6. "Cannot find task directory"

**Symptoms:**
```
Error: .opencode/context/active_tasks/task_XYZ not found
```

**Causes & Solutions:**

#### Cause A: Task already completed and cleaned up
```bash
# Check completed tasks archive
ls .opencode/context/completed_tasks/
# Old tasks are moved here after 7 days
```

**Solution:** This is normal cleanup. If you need the files:
```bash
# Restore from archive
cp -r .opencode/context/completed_tasks/task_XYZ .opencode/context/active_tasks/
```

#### Cause B: Wrong task ID in command
```bash
# List active tasks
ls .opencode/context/active_tasks/

# Use correct task ID from list
```

---

### 7. "Agent creates duplicate files"

**Symptoms:**
```
.opencode/context/active_tasks/task_123/
├── task_123_implementation.py
└── task_123_implementation_v2.py  ← Duplicate
```

**Causes & Solutions:**

#### Cause A: Agent retried after questions loop
**This is NORMAL** - Agent may create new version after clarification

**Solution:**
```bash
# Check result.md to see which is the final version
cat .opencode/context/active_tasks/task_123/result.md

# Usually the latest (highest version number or timestamp)
```

#### Cause B: Agent didn't realize file already exists
**Solution:**
```bash
# Keep the latest version, delete old ones
cd .opencode/context/active_tasks/task_123/
ls -lt task_123_implementation*.py  # Sort by time
# Keep the newest, delete the rest
```

---

### 8. "Memory files not updating"

**Symptoms:**
- `.opencode/context/01_memory/progress.md` shows old status
- Task completed but memory not updated

**Causes & Solutions:**

#### Cause A: Librarian not invoked yet
**Normal** - Librarian runs at workflow CLOSURE phase

**Solution:** Wait for workflow to complete, or manually trigger:
```bash
# Manually invoke Librarian for closure
python3 ~/.config/opencode/nso/scripts/close_session.py
```

#### Cause B: Task-specific memory not merged into global
**Expected** - Task memory stays in task directory until completion

**Solution:**
```bash
# Check task memory
cat .opencode/context/active_tasks/task_*/task_*_progress.md

# After task completes, Librarian merges into:
cat .opencode/context/01_memory/progress.md
```

---

### 9. "Git conflicts during session closure"

**Symptoms:**
```
Error: Cannot commit - merge conflicts in progress.md
```

**Causes & Solutions:**

#### Cause A: Multiple sessions running simultaneously
**Solution:**
```bash
# 1. Resolve conflicts manually
git status
git diff progress.md

# 2. Edit .opencode/context/01_memory/progress.md
# Keep both changes (merge manually)

# 3. Mark as resolved
git add .opencode/context/01_memory/progress.md
git commit -m "Merge session updates"
```

#### Cause B: Parallel tasks updating same memory file
**Solution:**
```bash
# This shouldn't happen (tasks use isolated memory)
# If it does, it's a bug - report to maintainer

# Workaround: Use task-specific memory files only
# Let Librarian merge at the end
```

---

### 10. "Router not detecting workflow type"

**Symptoms:**
```
Router output: {workflow: "UNKNOWN", confidence: 0.0}
Oracle treats as chat instead of work request
```

**Causes & Solutions:**

#### Cause A: Ambiguous request
```
❌ "Can you help me?"
✅ "Build a new feature for X"
```

**Solution:** Be explicit about action verbs:
- BUILD: "build", "implement", "create", "develop"
- DEBUG: "fix", "debug", "investigate", "troubleshoot"
- REVIEW: "review", "audit", "analyze", "check"

#### Cause B: Already in active workflow
```bash
# Check active context
cat .opencode/context/01_memory/active_context.md
# If Status: IN_PROGRESS, router is skipped (correct behavior)
```

**Solution:** Finish current workflow first, then start new one

---

## Advanced Diagnostics

### Enable Debug Logging
```bash
# Add to .opencode/config/parallel-config.yaml
logging:
  level: DEBUG
  file: .opencode/logs/parallel_execution.log
  
# View logs
tail -f .opencode/logs/parallel_execution.log
```

### Check Task Isolation
```bash
# Run contamination detector manually
python3 ~/.config/opencode/nso/scripts/context_contamination_detector.py

# Expected output:
Scanning: .opencode/context/active_tasks/
✅ No contamination detected
All files properly prefixed with task IDs
```

### Validate Configuration
```bash
# Check config syntax
python3 ~/.config/opencode/nso/scripts/validate_config.py

# Check for conflicts
python3 ~/.config/opencode/nso/scripts/check_config_conflicts.py
```

### Test Parallel Execution (Dry Run)
```bash
# Simulate parallel execution without actually running
python3 ~/.config/opencode/nso/scripts/test_parallel_config.py --dry-run \
  --workflow BUILD \
  --agents builder,janitor,designer

# Shows what would happen without actually doing it
```

---

## Emergency Procedures

### Stop All Parallel Tasks Immediately
```bash
# Create emergency stop file
touch .opencode/context/EMERGENCY_STOP

# Oracle will see this and halt all agents gracefully
# Agents will finish current operation and stop
```

### Cleanup Stuck Tasks
```bash
# List all active tasks
ls .opencode/context/active_tasks/

# Remove stuck task (after confirming no useful work)
rm -rf .opencode/context/active_tasks/task_stuck_xyz/

# Or move to quarantine for investigation
mv .opencode/context/active_tasks/task_stuck_xyz/ \
   .opencode/context/quarantine/
```

### Reset Parallel System
```bash
# WARNING: This deletes all active tasks!
# Only use if system is completely broken

# 1. Backup first
cp -r .opencode/context/active_tasks/ /tmp/active_tasks_backup/

# 2. Reset
rm -rf .opencode/context/active_tasks/*
rm -f .opencode/context/PARALLEL_EXECUTION_PAUSED
rm -f .opencode/context/EMERGENCY_STOP

# 3. Restart session
# NSO will recreate directory structure
```

---

## Getting Help

### Self-Service
1. **Check this guide** for common issues
2. **Read logs:** `.opencode/logs/session_init.json`, `parallel_execution.log`
3. **Read task files:** `active_tasks/*/status.md`, `result.md`, `parallel_failure.md`

### Reporting Bugs
If you find a bug in NSO itself:

1. **Collect evidence:**
```bash
# Create bug report directory
mkdir /tmp/nso_bug_report

# Copy relevant files
cp .opencode/logs/* /tmp/nso_bug_report/
cp .opencode/context/active_tasks/task_*/status.md /tmp/nso_bug_report/
cp .opencode/config/*.yaml /tmp/nso_bug_report/

# Create summary
echo "Bug Summary: [describe issue]" > /tmp/nso_bug_report/SUMMARY.txt
```

2. **Include:**
   - NSO version (`cat ~/.config/opencode/nso/VERSION`)
   - Project type (size, language, framework)
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs and config files

---

## Prevention Tips

### ✅ DO:
- **Start small** - test with 2 agents before 4
- **Monitor resource usage** - keep disk <80%, memory <80%
- **Be specific** in requests (explicit about parallel work)
- **Check status files** periodically during long tasks
- **Update configs** based on your project's needs

### ❌ DON'T:
- **Don't manually edit `active_tasks/`** - let agents manage
- **Don't run multiple sessions simultaneously** - causes conflicts
- **Don't force parallel** when sequential makes sense
- **Don't ignore fallback notifications** - investigate why
- **Don't delete task directories** while agents are working

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Not detecting parallel | Be more explicit in request |
| Agent timeout | Check status files, wait or terminate |
| Too many questions | Provide detailed requirements |
| Contamination | Let Oracle quarantine, then rename files |
| Fallback to sequential | Normal safety mechanism, no action needed |
| Can't find task | Check archive or use correct task ID |
| Memory not updating | Wait for workflow closure (Librarian) |
| Git conflicts | Resolve manually, commit |

---

## Next Steps

- **Quick Start:** [HOW_TO_USE_NSO_PARALLEL.md](./HOW_TO_USE_NSO_PARALLEL.md)
- **Configuration:** [NSO_CONFIG_EXAMPLES.md](./NSO_CONFIG_EXAMPLES.md)
- **Best Practices:** [NSO_BEST_PRACTICES.md](./NSO_BEST_PRACTICES.md)
