# Real-World Workflow Test Guide

**Version:** 1.0.0  
**Date:** 2026-02-09  
**Status:** Ready to Execute

---

## Quick Start

**In your NEW session, simply say:**
```
"Build a simple RSS feed reader component that displays news items from an RSS feed.
Include title, description, and link for each item. Add basic styling and component tests."
```

**Oracle will automatically:**
1. Detect BUILD workflow (from keywords: "build", "component")
2. Run Discovery phase (gather requirements)
3. Run Architecture phase (create TECHSPEC)
4. Ask for your approval
5. Delegate to Builder + Designer + Janitor in parallel
6. Validate results
7. Close session with Librarian

---

## What to Observe

### 1. Automatic Routing
Watch for:
```
📋 Analyzing request for parallel opportunities...
✅ Detected BUILD workflow (confidence: 0.85)
```

### 2. Discovery Phase
Oracle will ask clarifying questions:
- Which RSS feed URL?
- What styling framework? (Tailwind, CSS modules, etc.)
- Testing framework? (Vitest, Jest, React Testing Library?)

**Be ready to answer or say "use your best judgment"**

### 3. Architecture Phase
Oracle will create:
- `REQ-RSSFeedReader.md` - Requirements document
- `TECHSPEC-RSSFeedReader.md` - Technical design

**Review and approve or request changes**

### 4. Parallel Execution (The Main Test!)
Watch for task IDs being created:
```
Creating isolated task contexts:
  - task_20260209_140530_build_abc123_001 (Builder)
  - task_20260209_140530_build_def456_002 (Designer)
  - task_20260209_140530_build_ghi789_003 (Janitor)

Starting parallel execution...
```

**Check directories:**
```bash
ls .opencode/context/active_tasks/
# Should show 3 directories (one per agent)
```

### 5. Contract System
Each agent gets a contract:
```bash
cat .opencode/context/active_tasks/task_*/contract.md
# Shows: Objective, Requirements, Success Criteria, Context Files
```

### 6. Agent Work
Agents update status as they work:
```bash
cat .opencode/context/active_tasks/task_*/status.md
# Shows: Status (PENDING/IN_PROGRESS/COMPLETE), Current Step, Progress
```

### 7. Results
After completion:
```bash
cat .opencode/context/active_tasks/task_*/result.md
# Shows: Deliverables, Validation status, Notes
```

### 8. Contamination Check
Verify all files have task ID prefix:
```bash
find .opencode/context/active_tasks/ -type f ! -name "task_*" ! -name "contract.md" ! -name "status.md" ! -name "result.md" ! -name "questions.md"
# Should be empty (no contamination)
```

---

## Success Criteria Checklist

### ✅ Workflow Routing:
- [ ] Oracle detects BUILD workflow automatically
- [ ] No manual workflow specification needed
- [ ] Router confidence ≥ 20% (shows in logs)

### ✅ Discovery Phase:
- [ ] Oracle asks clarifying questions
- [ ] Requirements document created (REQ-*.md)
- [ ] Requirements match your intent

### ✅ Architecture Phase:
- [ ] Technical spec created (TECHSPEC-*.md)
- [ ] Design is simple and appropriate
- [ ] Oracle waits for your approval

### ✅ Parallel Execution:
- [ ] 3 task directories created in `active_tasks/`
- [ ] Unique task IDs generated for each agent
- [ ] Contract files written before delegation
- [ ] All agents work simultaneously (check timestamps)

### ✅ Task Isolation:
- [ ] All generated files have `task_*_` prefix
- [ ] No contamination alerts
- [ ] Agents only access their task directory
- [ ] Status files updated independently

### ✅ Contract System:
- [ ] contract.md exists in each task directory
- [ ] Agents read and follow contracts
- [ ] If unclear, agents write questions.md and STOP
- [ ] Oracle answers questions and retries

### ✅ Agent Deliverables:
- [ ] Builder: Component code + API integration
- [ ] Designer: UI mockup or styled component
- [ ] Janitor: Test plan or review checklist
- [ ] All files in proper directories

### ✅ Validation:
- [ ] Janitor reviews Builder's code
- [ ] Tests run (if implemented)
- [ ] Code quality checked
- [ ] Confidence score ≥80 (Janitor's rating)

### ✅ Closure:
- [ ] Librarian updates memory files
- [ ] progress.md shows completed milestone
- [ ] active_context.md updated
- [ ] Git commit created (if changes made)

### ✅ Fallback (If Triggered):
- [ ] User notified with clear message
- [ ] Reason explained (timeout, questions, etc.)
- [ ] Automatic fallback to sequential
- [ ] Work continues without failure

---

## Monitoring Commands

### During Execution:
```bash
# Watch active tasks
watch -n 5 "ls -la .opencode/context/active_tasks/*/status.md"

# Check agent progress
tail -f .opencode/context/active_tasks/task_*/status.md

# Monitor for contamination
find .opencode/context/active_tasks/ -type f ! -name "task_*" ! -name "*.md"

# Check for fallback signals
find .opencode/context/active_tasks/ -name "*_FALLBACK_*"
```

### After Completion:
```bash
# View results
cat .opencode/context/active_tasks/task_*/result.md

# Check deliverables
find .opencode/context/active_tasks/ -name "task_*_*" -type f

# Verify memory updates
git diff .opencode/context/01_memory/
```

---

## Expected Output Structure

```
.opencode/context/active_tasks/
├── task_20260209_140530_build_abc123_001/    # Builder
│   ├── contract.md
│   ├── status.md
│   ├── result.md
│   ├── task_20260209_140530_build_abc123_001_RSSFeedReader.jsx
│   ├── task_20260209_140530_build_abc123_001_useFetchRSS.js
│   └── task_20260209_140530_build_abc123_001_RSSFeedReader.test.jsx
├── task_20260209_140530_build_def456_002/    # Designer
│   ├── contract.md
│   ├── status.md
│   ├── result.md
│   ├── task_20260209_140530_build_def456_002_RSSFeedReader.css
│   └── task_20260209_140530_build_def456_002_mockup.md
└── task_20260209_140530_build_ghi789_003/    # Janitor
    ├── contract.md
    ├── status.md
    ├── result.md
    └── task_20260209_140530_build_ghi789_003_review_checklist.md
```

---

## Troubleshooting

### Issue: "Parallel execution not detected"
**Cause:** Request too vague  
**Fix:** Be more explicit: "Build [X] with [tests] and [UI styling]"

### Issue: "Agent asking too many questions"
**Cause:** Requirements unclear  
**Fix:** Provide more detail or say "use your best judgment"

### Issue: "Agent timeout"
**Normal:** If task is complex (>5 min)  
**Action:** Oracle will ask you: Wait? Terminate? Investigate?

### Issue: "Contamination alert"
**Rare:** Agent didn't follow naming convention  
**Action:** Oracle quarantines files and asks what to do

### Issue: "Fallback to sequential"
**Normal:** Safety mechanism, not a failure  
**Action:** Let Oracle retry in sequential mode (slower but reliable)

---

## Post-Test Analysis

After the workflow completes:

### 1. Review Deliverables
```bash
# What did Builder create?
ls .opencode/context/active_tasks/task_*_001/task_*

# What did Designer create?
ls .opencode/context/active_tasks/task_*_002/task_*

# What did Janitor create?
ls .opencode/context/active_tasks/task_*_003/task_*
```

### 2. Check Timing
```bash
# Compare timestamps
stat -f "%Sm - %N" .opencode/context/active_tasks/task_*/result.md

# Were they parallel? (similar completion times)
# Or sequential? (staggered completion times)
```

### 3. Measure Speedup
```bash
# If parallel: Max(agent times) = total time
# If sequential: Sum(agent times) = total time
# Speedup = Sequential / Parallel
```

### 4. Review Memory Updates
```bash
# Was progress.md updated?
git diff .opencode/context/01_memory/progress.md

# Was active_context.md updated?
git diff .opencode/context/01_memory/active_context.md
```

### 5. Validate Git Commit
```bash
# Clean commit (no secrets)?
git log -1 --stat

# Reasonable commit message?
git log -1 --pretty=format:"%s"
```

---

## Next Steps After Test

### If Test Passes ✅
1. Try a more complex feature (authentication, dashboard, etc.)
2. Test all 6 agents (include Scout for research, Librarian for docs)
3. Intentionally trigger fallback scenarios
4. Proceed to Phase 2 (MVI Implementation)

### If Test Fails ❌
1. Review failure reports in `active_tasks/*/parallel_failure.md`
2. Check logs: `.opencode/logs/parallel_execution.log`
3. Document issues found
4. Fix bugs before proceeding

### If Fallback Triggered ⚠️
1. This is NORMAL (fallback = safety, not failure)
2. Review why it happened (timeout, questions loop, resource constraints)
3. Adjust config if needed (increase timeouts, clarify requirements)
4. Retry with adjusted settings

---

## Test Variations

After the simple RSS reader test, try:

### Variation 1: Complex Feature
```
"Build user authentication with OAuth 2.0 integration.
Include login/signup UI, backend API endpoints, tests, and security audit."
```
**Tests:** All 6 agents (Scout researches OAuth, Designer for UI, etc.)

### Variation 2: Bug Fix
```
"Debug and fix the pagination bug in the news list.
Add regression tests and check for similar issues elsewhere."
```
**Tests:** DEBUG workflow (Janitor investigates, Builder fixes)

### Variation 3: Code Review
```
"Review the news aggregation module for:
- Security vulnerabilities
- Performance bottlenecks
- Code quality issues
- UX problems"
```
**Tests:** REVIEW workflow (Janitor + Designer in parallel)

---

## Documentation

For detailed information:
- Quick Start: [HOW_TO_USE_NSO_PARALLEL.md](../docs/HOW_TO_USE_NSO_PARALLEL.md)
- Configuration: [NSO_CONFIG_EXAMPLES.md](../docs/NSO_CONFIG_EXAMPLES.md)
- Troubleshooting: [NSO_TROUBLESHOOTING.md](../docs/NSO_TROUBLESHOOTING.md)
- Best Practices: [NSO_BEST_PRACTICES.md](../docs/NSO_BEST_PRACTICES.md)

---

**Ready to test!** Open a new session and make your request. Oracle will handle everything. 🚀
