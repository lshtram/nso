# How to Use NSO Parallel Execution - Quick Start Guide

**Version:** 1.0.0  
**Last Updated:** 2026-02-09  
**Status:** Production Ready (Phase 1D Complete)

---

## Overview

The NSO (Neuro-Symbolic Orchestrator) parallel execution system allows multiple AI agents to work simultaneously on different parts of a task, significantly reducing total completion time.

**Key Benefits:**
- ⚡ **2-3x faster** for multi-phase workflows (BUILD, DEBUG, REVIEW)
- 🔒 **Complete isolation** - agents cannot interfere with each other
- 🔄 **Automatic fallback** - gracefully degrades to sequential if needed
- 📊 **Contract-based** - clear communication between agents

---

## Prerequisites

### System Requirements
- NSO installed at `~/.config/opencode/nso/`
- Project initialized with `.opencode/` directory
- Git repository (for session closure)
- Python 3.8+ (for NSO scripts)

### Verification
```bash
# Check NSO system
ls ~/.config/opencode/nso/

# Check project context
ls .opencode/context/

# Expected output:
# 00_meta/  (tech stack, patterns, glossary)
# 01_memory/  (active context, progress)
# active_tasks/  (parallel execution workspace)
```

---

## Quick Start (5 Minutes)

### Step 1: Start Session (Automatic)
When you start a new OpenCode session, NSO automatically:
1. Loads project context from `.opencode/context/00_meta/`
2. Loads project memory from `.opencode/context/01_memory/`
3. Checks for active workflows
4. Prepares parallel execution environment

**No action required** - it just works!

### Step 2: Make a Request
Simply ask for work that can be parallelized:

**Examples:**
```
You: "Build a new authentication feature"
→ Oracle detects BUILD workflow
→ Runs Discovery (requirements) → Architecture (design) sequentially
→ Then delegates in parallel:
   - Builder: Implements code
   - Janitor: Prepares review criteria
   - Designer: Creates UI mockup
```

```
You: "Debug the login bug and add tests"
→ Oracle detects DEBUG workflow
→ Janitor investigates in parallel with Builder writing test cases
→ Builder fixes bug while Designer checks UX impact
```

### Step 3: Oracle Coordinates Automatically
You'll see:
```
📋 Analyzing request for parallel opportunities...
✅ Detected 3 parallel tasks (estimated 3x speedup)

Creating isolated task contexts:
  - task_20260209_build_abc123_1 (Builder)
  - task_20260209_build_def456_2 (Janitor)
  - task_20260209_build_ghi789_3 (Designer)

Starting parallel execution...
```

### Step 4: Wait for Results
Agents work in parallel. Oracle will report when complete:
```
✅ Builder completed (implementation.py, tests.py)
✅ Janitor completed (review checklist)
✅ Designer completed (UI mockup)

🎉 All tasks complete! Merging results...
```

---

## How It Works (Under the Hood)

### 1. Automatic Routing
Every user message is analyzed by the router:
```python
# Router detects workflow type
router_monitor.py "user message"
→ {workflow: "BUILD", confidence: 0.85, parallel_potential: 3}
```

### 2. Task ID Generation
Each parallel task gets a unique ID:
```
Format: task_{timestamp}_{workflow}_{hash}_{counter}
Example: task_20260209_103045_build_abc123_001
```

### 3. Isolated Task Contexts
Each agent works in its own directory:
```
.opencode/context/active_tasks/
├── task_20260209_103045_build_abc123_001/  (Builder)
│   ├── contract.md              # Instructions from Oracle
│   ├── status.md                # Agent's progress updates
│   ├── result.md                # Final deliverables
│   ├── task_..._implementation.py  # Code (with task ID prefix)
│   └── task_..._tests.py        # Tests (with task ID prefix)
├── task_20260209_103045_build_def456_002/  (Janitor)
│   └── ... (similar structure)
└── task_20260209_103045_build_ghi789_003/  (Designer)
    └── ... (similar structure)
```

### 4. Contract System
Oracle writes a contract before delegating:

**contract.md:**
```markdown
# Task Contract: task_20260209_103045_build_abc123_001

| Field | Value |
|-------|-------|
| Agent | Builder |
| Workflow | BUILD |
| Phase | IMPLEMENTATION |

## Objective
Implement user authentication feature

## Requirements
REQ-Auth.md (in this task directory)

## Success Criteria
- [ ] Login endpoint works
- [ ] Tests pass (coverage >80%)
- [ ] No lint errors

## Context Files
- task_..._REQ-Auth.md
- task_..._TECHSPEC-Auth.md
```

### 5. Agent Execution
Agent reads contract, works in isolation:
```python
# Agent (Builder) reads contract
contract = read("{{task_context_path}}/contract.md")

# If unclear, writes questions and STOPS
if unclear:
    write("questions.md", "What authentication method? OAuth? Basic?")
    STOP  # Oracle will answer and retry

# Otherwise, does the work
write("{{task_id}}_implementation.py", code)
write("{{task_id}}_tests.py", tests)

# Writes result
write("result.md", "✅ Complete. Deliverables: implementation.py, tests.py")
```

### 6. Result Aggregation
Oracle reads all results and merges:
```python
# Oracle reads all result files
builder_result = read("active_tasks/task_001/result.md")
janitor_result = read("active_tasks/task_002/result.md")
designer_result = read("active_tasks/task_003/result.md")

# Merges deliverables
# Updates global memory
# Notifies user
```

---

## Common Workflows

### BUILD Workflow (Feature Development)
**Sequential Phases:**
1. **Discovery** (Oracle) - Requirements gathering
2. **Architecture** (Oracle) - Technical design

**Parallel Phases:**
3. **Implementation** (Builder + Janitor + Designer in parallel)
   - Builder: Writes code
   - Janitor: Prepares review checklist
   - Designer: Creates UI mockup

**Sequential Phases:**
4. **Validation** (Janitor) - Code review, testing
5. **Closure** (Librarian) - Memory update, git commit

### DEBUG Workflow (Bug Fixing)
**Parallel Phases:**
1. **Investigation** (Janitor investigates + Builder writes failing test)
2. **Fix** (Builder fixes + Designer checks UX impact)

**Sequential Phases:**
3. **Validation** (Janitor) - Verify fix
4. **Closure** (Librarian) - Memory update

### REVIEW Workflow (Code Quality)
**Sequential Phases:**
1. **Scope** (Janitor) - Define review boundaries

**Parallel Phases:**
2. **Analysis** (Janitor reviews + Designer audits UX)

**Sequential Phases:**
3. **Report** (Janitor) - Consolidated review report
4. **Closure** (Librarian) - Document patterns

---

## Fallback Mechanisms

### When Fallback Happens
NSO automatically falls back to sequential mode if:
- Agent fails to start (timeout >30s)
- Agent crashes mid-execution
- Questions loop exceeds 3 iterations
- Contamination detected (file naming violations)
- Resource exhaustion (disk/memory)

### What You'll See
```
⚠️  PARALLEL EXECUTION FAILED - FALLING BACK TO SEQUENTIAL MODE

Reason: Agent timeout (Builder didn't respond in 5 minutes)
Impact: Tasks will now run one at a time (slower but reliable)
Action: Retrying Builder task in sequential mode...

Details: .opencode/context/active_tasks/task_001/parallel_failure.md
```

### User Actions
Most fallbacks are automatic, but you may be asked:
```
Options:
1. Wait longer (agent may be working on complex task)
2. Terminate and retry
3. Investigate manually

What would you like to do? [1/2/3]
```

---

## Troubleshooting

### Issue: "Parallel execution not detected"
**Cause:** Request doesn't have parallel potential  
**Solution:** Make request more explicit:
- ❌ "Build a feature" (too vague)
- ✅ "Build a feature, write tests, and create UI mockup" (3 parallel tasks)

### Issue: "Agent asking too many questions"
**Cause:** Requirements unclear  
**Solution:** Provide more detail in initial request or during Discovery phase

### Issue: "Contamination alert"
**Cause:** Agent created file without task ID prefix  
**Solution:** This is rare (agents are trained). If happens, Oracle will quarantine and notify you.

### Issue: "Tasks taking longer than expected"
**Cause:** Complex task or resource constraints  
**Solution:** 
1. Check status files: `.opencode/context/active_tasks/*/status.md`
2. Agent may be working normally on complex task
3. Wait or choose to terminate if truly stuck

---

## Best Practices

### ✅ DO:
- **Be specific** in requests (mention different aspects: code, tests, UI, docs)
- **Approve architecture** before implementation (Oracle will ask)
- **Check result files** to see what each agent delivered
- **Let Oracle coordinate** - don't micromanage agent interactions

### ❌ DON'T:
- **Don't bypass Oracle** - always work through the coordinator
- **Don't modify active_tasks/ manually** - let agents manage their directories
- **Don't force parallel** - Oracle knows when it's beneficial
- **Don't panic on fallback** - it's a safety feature, not a failure

---

## Performance Expectations

| Workflow Type | Tasks | Agents | Speedup | Example |
|---------------|-------|--------|---------|---------|
| Simple BUILD | 1 | 1 | 1x | "Fix this typo" |
| Standard BUILD | 2-3 | 2-3 | 2-3x | "Build feature + tests" |
| Complex BUILD | 3-4 | 3-4 | 3x | "Full feature: code + tests + UI + docs" |
| DEBUG | 2 | 2 | 2x | "Investigate + fix bug" |
| REVIEW | 2-3 | 2-3 | 2x | "Code review + UX audit" |

**Real-world example:**
- **Sequential:** Builder (30min) → Janitor (20min) → Designer (15min) = **65 minutes**
- **Parallel:** All 3 simultaneously = **30 minutes** (limited by slowest)
- **Speedup:** 2.2x faster

---

## Next Steps

- **Read Configuration Guide:** [NSO_CONFIG_EXAMPLES.md](./NSO_CONFIG_EXAMPLES.md)
- **Troubleshooting:** [NSO_TROUBLESHOOTING.md](./NSO_TROUBLESHOOTING.md)
- **Best Practices:** [NSO_BEST_PRACTICES.md](./NSO_BEST_PRACTICES.md)
- **Agent Details:** [/Users/opencode/.config/opencode/nso/AGENTS.md](~/.config/opencode/nso/AGENTS.md)

---

## Support

**Issues?** Check `.opencode/context/active_tasks/*/` for task details  
**Questions?** See [NSO_TROUBLESHOOTING.md](./NSO_TROUBLESHOOTING.md)  
**Advanced:** See [NSO_BEST_PRACTICES.md](./NSO_BEST_PRACTICES.md)
