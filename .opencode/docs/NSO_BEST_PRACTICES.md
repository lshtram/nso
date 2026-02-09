# NSO Best Practices

**Version:** 1.0.0  
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Request Formulation](#request-formulation)
3. [Workflow Management](#workflow-management)
4. [Configuration Tuning](#configuration-tuning)
5. [Agent Collaboration](#agent-collaboration)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Memory Management](#memory-management)
9. [Security & Safety](#security--safety)
10. [Team Collaboration](#team-collaboration)

---

## General Principles

### 1. Start Sequential, Scale to Parallel
**Principle:** Master sequential workflows before enabling parallel

**Why:** Understand Oracle's decision-making before adding parallelism complexity

**How:**
```yaml
# Week 1: Sequential only
parallel:
  enabled: false

# Week 2: Limited parallel (2 agents)
parallel:
  enabled: true
  max_concurrent_agents_per_task: 2

# Week 3+: Full parallel (3-4 agents)
parallel:
  max_concurrent_agents_per_task: 3
```

### 2. Let Oracle Lead
**Principle:** Trust Oracle to coordinate, don't micromanage

✅ **DO:**
```
You: "Build authentication feature with tests and UI"
Oracle: [Runs Discovery → Architecture → Delegates in parallel]
```

❌ **DON'T:**
```
You: "Builder, implement auth. Janitor, review it. Designer, make UI."
```
**Why:** Oracle knows optimal delegation, agent capabilities, and dependencies

### 3. Explicit is Better Than Implicit
**Principle:** Be specific about requirements and expectations

✅ **DO:**
```
"Build user authentication using OAuth 2.0 with PKCE flow.
Integrate with Auth0. Include unit tests with >80% coverage.
Create login/signup UI mockups following our design system."
```

❌ **DON'T:**
```
"Add auth"
```

### 4. Approve Before Implementation
**Principle:** Review architecture before code is written

**Why:** Fixing architecture issues is 10x cheaper than refactoring code

**How:**
```
Oracle: "Here's the technical design [TECHSPEC-Auth.md]"
You: [Review] "Approved" OR "Change X to Y"
Oracle: [Implements only after approval]
```

---

## Request Formulation

### 1. Structure Requests for Parallelism

**Pattern:**
```
[ACTION] + [COMPONENT] + [ADDITIONAL ASPECTS]

Examples:
✅ "Build [payment API] + [tests] + [API docs]"
✅ "Debug [checkout bug] + [add regression tests] + [check UX impact]"
✅ "Review [auth module] + [security audit] + [performance check]"
```

**Why it works:**
- Clear action verb (BUILD/DEBUG/REVIEW)
- Multiple distinct aspects (code, tests, docs, UI)
- Each aspect can be parallelized to different agents

### 2. Use Workflow-Triggering Keywords

| Workflow | Keywords | Example |
|----------|----------|---------|
| BUILD | build, implement, create, develop, add | "Build a new dashboard feature" |
| DEBUG | fix, debug, investigate, troubleshoot | "Debug the login timeout issue" |
| REVIEW | review, audit, analyze, check, validate | "Review the payment processing code" |
| PLAN | plan, design, research, evaluate | "Research authentication frameworks" |

### 3. Specify Deliverables

✅ **Good:**
```
"Build user registration with:
- Backend API endpoints
- Frontend form components
- Unit tests (>80% coverage)
- API documentation
- UX mockups"
```

❌ **Vague:**
```
"Add user registration"
```

### 4. Include Context

✅ **Good:**
```
"Add OAuth authentication to replace current basic auth.
Must integrate with existing user table.
Follow patterns from AdminAuth.ts.
Keep backward compatibility for 1 release."
```

❌ **No context:**
```
"Add OAuth"
```

---

## Workflow Management

### 1. Complete One Workflow Before Starting Another

✅ **DO:**
```
Session 1:
  BUILD feature A → COMPLETE ✅

Session 2:
  DEBUG feature A bug → COMPLETE ✅
  
Session 3:
  BUILD feature B → COMPLETE ✅
```

❌ **DON'T:**
```
Session 1:
  START BUILD feature A
  START DEBUG other bug (interruption)
  START REVIEW unrelated code
  → 3 workflows in progress, Oracle confused
```

### 2. Follow Natural Workflow Phases

**BUILD Workflow:**
```
1. Discovery (Oracle) - Sequential
   ↓
2. Architecture (Oracle) - Sequential
   ↓ [User Approval]
   ↓
3. Implementation (Builder + Janitor + Designer) - PARALLEL
   ↓
4. Validation (Janitor) - Sequential
   ↓
5. Closure (Librarian) - Sequential
```

**Don't skip phases:**
❌ "Skip Discovery, I know what I want" → Leads to rework
❌ "Skip Architecture approval" → Leads to wrong solution

### 3. Use Appropriate Workflows

| Task Type | Use Workflow | Not |
|-----------|--------------|-----|
| New feature | BUILD | Not DEBUG |
| Existing bug | DEBUG | Not BUILD |
| Code quality | REVIEW | Not BUILD |
| Technology choice | PLAN | Not BUILD |
| Documentation | BUILD (new docs) or REVIEW (audit docs) | - |

---

## Configuration Tuning

### 1. Tune Timeouts Based on Project

**Small/Fast Projects:**
```yaml
timeouts:
  agent_start_seconds: 20  # Fast startup
  agent_status_update_seconds: 180  # Quick feedback
```

**Large/Complex Projects:**
```yaml
timeouts:
  agent_start_seconds: 60  # Allow for context loading
  agent_status_update_seconds: 600  # 10 min for deep analysis
```

### 2. Adjust Concurrency to Resources

**Formula:** `max_concurrent_agents = (Available CPU Cores - 2) / 2`

**Examples:**
- 4-core machine: max 1-2 agents
- 8-core machine: max 3 agents
- 16-core machine: max 5-7 agents

```yaml
parallel:
  max_concurrent_tasks: 5  # Total tasks across all workflows
  max_concurrent_agents_per_task: 3  # Within one workflow
```

### 3. Environment-Specific Configs

**Development:**
```yaml
parallel:
  enabled: true  # Speed up dev
  fallback:
    notify_user: true  # Verbose
```

**Production:**
```yaml
parallel:
  enabled: false  # Safety first
  # OR very conservative limits
```

---

## Agent Collaboration

### 1. Understand Agent Strengths

| Agent | Best For | Not For |
|-------|----------|---------|
| Oracle | Requirements, architecture, coordination | Writing code |
| Builder | Implementation, bug fixes, TDD | Architecture, code review |
| Janitor | Investigation, code review, quality | Implementation |
| Designer | UI/UX, accessibility, mockups | Backend code |
| Scout | Research, technology evaluation | Implementation |
| Librarian | Memory management, git operations, documentation sync | Coding |

### 2. Let Oracle Delegate

✅ **Ideal Flow:**
```
Oracle: [Analyzes request]
Oracle: "This needs Builder for code, Janitor for tests, Designer for UI"
Oracle: [Writes 3 contracts, delegates in parallel]
Agents: [Work simultaneously]
Oracle: [Aggregates results]
```

❌ **Anti-Pattern:**
```
You: "Builder, do X. Janitor, do Y."  ← Bypassing Oracle
```

### 3. Cross-Agent Dependencies

**When Builder → Janitor dependency exists:**
```
Phase 1: Builder implements feature
         ↓ (completes)
Phase 2: Oracle reads Builder's result
         ↓ (creates Janitor contract referencing Builder's files)
Phase 3: Janitor reviews Builder's code
```

**Oracle handles this automatically** - don't manually sequence

---

## Performance Optimization

### 1. Maximize Parallel Opportunities

✅ **Highly Parallelizable:**
```
"Build feature X with:
- Backend API (Builder)
- Frontend UI (Designer)
- Test suite (Janitor)
- API docs (Scout)"

Speedup: ~3x (4 agents in parallel, limited by slowest)
```

❌ **Sequential by Nature:**
```
"Fix bug A, then fix bug B, then fix bug C"

Speedup: 1x (must run in order)
```

### 2. Batch Similar Work

✅ **Good Batching:**
```
"Review these 3 modules for security:
- AuthModule
- PaymentModule  
- UserModule"

Janitor can review all 3 in parallel (separate tasks)
```

❌ **Too Granular:**
```
"Review line 10 of AuthModule"
"Review line 11 of AuthModule"
...
```

### 3. Avoid Premature Optimization

**Start:**
```yaml
parallel:
  max_concurrent_agents_per_task: 2  # Conservative
```

**Measure:**
```bash
# Track completion times
cat .opencode/context/active_tasks/*/result.md | grep "Completed:"
```

**Scale:**
```yaml
parallel:
  max_concurrent_agents_per_task: 3  # Increase if beneficial
```

---

## Error Handling

### 1. Embrace Fallbacks (They're Good!)

**Mindset Shift:**
```
❌ "Fallback to sequential = FAILURE"
✅ "Fallback to sequential = SAFETY MECHANISM"
```

**Why fallback is good:**
- Ensures progress (vs. total failure)
- Adapts to reality (task more complex than estimated)
- User always gets work done (reliability > speed)

### 2. Learn from Failures

**After any fallback:**
```bash
# 1. Read failure report
cat .opencode/context/active_tasks/*/parallel_failure.md

# 2. Identify pattern
# - Was task genuinely complex? (Expected)
# - Was timeout too short? (Adjust config)
# - Was requirements unclear? (Improve Discovery phase)

# 3. Adjust accordingly
```

### 3. Handle Questions Gracefully

**When agent asks questions:**
✅ **DO:**
```
Oracle: "Builder needs clarification on auth method"
You: [Provide detailed answer]
Oracle: [Updates contract, retries]
```

❌ **DON'T:**
```
You: "Just figure it out!" (leads to wrong solution)
You: [Ignores questions] (leads to timeout)
```

---

## Memory Management

### 1. Keep Memory Files Lean

**Target:** `progress.md` < 300 lines

**How:**
```bash
# Periodically archive
# Librarian does this automatically, but you can trigger:
python3 ~/.config/opencode/nso/scripts/archive_progress.py

# Moves old milestones to progress_archive.md
```

### 2. Use Task-Specific Memory During Workflows

**While workflow is active:**
```
Task Memory (active):
  .opencode/context/active_tasks/task_*/task_*_progress.md

Global Memory (read-only for agents):
  .opencode/context/01_memory/progress.md
```

**After workflow completes:**
```
Librarian merges:
  Task Memory → Global Memory
  
Cleanup:
  Old task directory archived after 7 days
```

### 3. Regular Session Closures

**Pattern:**
```
Work session (1-2 hours)
  ↓
Close session (Librarian):
  - Update memory files
  - Validate changes
  - Commit to git
  ↓
New session
```

**Command:**
```bash
# Automatic via Oracle
/close-session

# Or manual
python3 ~/.config/opencode/nso/scripts/close_session.py
```

---

## Security & Safety

### 1. Never Store Secrets in Memory Files

❌ **NEVER:**
```markdown
# active_context.md
API Key: sk_live_abc123xyz456...  ← Committed to git!
Database password: mySecretPass123  ← Public repo!
```

✅ **DO:**
```markdown
# active_context.md
API Key: [Stored in .env, not committed]
Database: [Credentials in environment variables]
```

### 2. Review Before Git Push

**Automatic checks in close_session.py:**
```bash
# Scans for common secrets
grep -r "sk_live_" .opencode/context/
grep -r "password.*=" .opencode/context/
# Warns before commit if found
```

### 3. Use Permission Boundaries

**Agents follow strict boundaries:**

**Forbidden (Never allowed):**
- Modify `.env` files
- Delete root directories
- Bypass verification (`--no-verify`)
- Force push to main

**Ask First:**
- Install dependencies
- Schema changes
- Architecture changes

**Auto-Allowed:**
- Read code
- Run tests
- Create files (with task ID prefix)

---

## Team Collaboration

### 1. One Session Per Developer

✅ **Good:**
```
Developer A: Works in their session
Developer B: Works in their session (different branch)
```

❌ **Causes Conflicts:**
```
Developer A & B: Both in master branch, both using NSO
→ Git conflicts in progress.md
```

### 2. Share Configurations

**Team Config Repository:**
```
.opencode/config/
├── parallel-config.yaml     # Shared team defaults
├── task-isolation.yaml      # Shared team defaults
└── local-overrides.yaml     # Developer-specific (gitignored)
```

### 3. Document Learnings

**After major workflows:**
```bash
# Librarian captures insights
/archive-conversation

# Creates:
.opencode/docs/learnings/2026-02-09-auth-implementation.md
```

**Share with team** - avoids repeating mistakes

---

## Anti-Patterns to Avoid

### ❌ 1. The Micro-Manager
```
You: "Builder, write line 10"
You: "Builder, write line 11"
You: "Janitor, check line 10"
...
```
**Why bad:** Kills parallelism, wastes Oracle's intelligence

✅ **Instead:**
```
You: "Build authentication feature with tests"
Oracle: [Coordinates everything]
```

### ❌ 2. The Interrupter
```
Workflow 1: BUILD feature A (in progress)
You: "Stop! Do this unrelated thing!"
Workflow 2: REVIEW unrelated code (in progress)
You: "Actually, go back to feature A!"
```
**Why bad:** Context switching is expensive, agents get confused

✅ **Instead:**
```
Complete Workflow 1 → Then start Workflow 2
```

### ❌ 3. The Config Tweaker
```
Day 1: max_concurrent_agents: 2
Day 2: max_concurrent_agents: 5
Day 3: max_concurrent_agents: 1
Day 4: max_concurrent_agents: 10
```
**Why bad:** No time to measure impact, unstable baseline

✅ **Instead:**
```
Week 1-2: max_concurrent_agents: 2 (measure)
Week 3-4: max_concurrent_agents: 3 (measure improvement)
Week 5+: Keep optimal setting
```

### ❌ 4. The Approval Skipper
```
Oracle: "Here's the architecture [TECHSPEC-Auth.md]"
You: "Skip review, just implement!"
[2 days later]
You: "This architecture is wrong, start over!"
```
**Why bad:** Wastes days of implementation time

✅ **Instead:**
```
Oracle: "Here's the architecture"
You: [5-minute review] "Change X to Y"
Oracle: [Fixes architecture]
You: "Approved"
Oracle: [Implements correctly the first time]
```

### ❌ 5. The Manual Meddler
```
[While agents are working]
You: [Manually edits files in active_tasks/]
You: [Renames files without task ID prefix]
→ Contamination alerts, confusion, conflicts
```
**Why bad:** Breaks isolation, defeats parallel execution safety

✅ **Instead:**
```
[Let agents work]
[After completion, review deliverables]
[Request changes through Oracle]
```

---

## Metrics to Track

### 1. Workflow Completion Time
```bash
# Extract from result files
grep "Completed:" .opencode/context/active_tasks/*/result.md

# Compare:
# - Sequential vs. parallel
# - Different agent combinations
# - Before/after config changes
```

### 2. Fallback Rate
```bash
# Count fallbacks
find .opencode/context/active_tasks/ -name "*_FALLBACK_SEQUENTIAL" | wc -l

# Target: <10% of workflows
# If higher, investigate common causes
```

### 3. Question Loop Iterations
```bash
# Count questions files
find .opencode/context/active_tasks/ -name "questions*.md" | wc -l

# Target: <1 per workflow
# If higher, improve requirements clarity
```

### 4. Agent Utilization
```bash
# Which agents are used most?
grep "Agent:" .opencode/context/active_tasks/*/contract.md | sort | uniq -c

# Optimize for your project:
# - Lots of Builder → Good
# - Lots of Designer → UI-heavy project
# - Lots of Scout → Research-heavy phase
```

---

## Quick Reference Checklist

### Before Starting Work:
- [ ] Session initialized (automatic)
- [ ] No active workflows in progress
- [ ] Config appropriate for task
- [ ] Requirements clear in your mind

### During Work:
- [ ] Let Oracle lead
- [ ] Approve architecture before implementation
- [ ] Answer questions promptly
- [ ] Don't manually edit active_tasks/

### After Work:
- [ ] Workflow completed
- [ ] Review deliverables
- [ ] Close session (Librarian)
- [ ] Git commit clean (no secrets)

### Periodically:
- [ ] Review fallback reports (learn from them)
- [ ] Archive old workflows (Librarian)
- [ ] Tune config based on metrics
- [ ] Share learnings with team

---

## Next Steps

- **Quick Start:** [HOW_TO_USE_NSO_PARALLEL.md](./HOW_TO_USE_NSO_PARALLEL.md)
- **Configuration:** [NSO_CONFIG_EXAMPLES.md](./NSO_CONFIG_EXAMPLES.md)
- **Troubleshooting:** [NSO_TROUBLESHOOTING.md](./NSO_TROUBLESHOOTING.md)
- **Agent Details:** `~/.config/opencode/nso/AGENTS.md`

---

**Remember:** NSO is a tool to amplify your productivity. Use it wisely, trust Oracle to coordinate, and focus on high-value creative work while agents handle implementation details.
