# TECHSPEC: Phase 1D — Enhanced Multi-Agent Workflows

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2026-02-09 | IN PROGRESS |

---

## 0. Executive Summary

Phase 1D completes the multi-agent infrastructure by:

1. **Creating remaining agent templates:** Designer, Scout, Librarian (with contract protocol)
2. **Testing 3+ agent parallel execution:** Verify isolation and contract system end-to-end
3. **Implementing fallback mechanisms:** Graceful degradation when parallel fails
4. **Writing enablement documentation:** How-to guides for using the system

This phase makes the NSO fully operational for all 6 agent types.

---

## 1. Remaining Agent Templates

### 1.1 Designer Template

**Role:** Frontend/UX Specialist

**Key Sections:**
- Agent Identity (role, specialization, task ID, context path)
- Core Instructions (UI implementation, accessibility focus)
- Contract Protocol (same as Builder/Janitor)
- Task Isolation Rules (prefixed files, context boundaries)
- Responsibilities (UI components, accessibility, design tokens)
- Tools (chrome-devtools, edit, lsp)
- Workflow Examples (component implementation, accessibility audit)

**Skills:**
- `ui-component-gen` - Generate UI components
- `accessibility-audit` - WCAG compliance

**Workflow Assignments:**
- BUILD → Implementation (Frontend components)
- REVIEW → Analysis (UX quality review)

### 1.2 Scout Template

**Role:** Research & Technology Evaluation

**Key Sections:**
- Agent Identity
- Core Instructions (external research, technology evaluation)
- Contract Protocol (same structure)
- Task Isolation Rules
- Responsibilities (library evaluation, Buy vs Build decisions)
- Tools (web-search, web-fetch, codesearch, context7-query-docs)
- Workflow Examples (tech evaluation, RFC creation)

**Skills:**
- `tech-radar-scan` - Evaluate emerging technologies
- `rfc-generator` - Create RFCs for new patterns

**Workflow Assignments:**
- PLAN → Research (External technology research)
- Any → Discovery (Technology evaluation)

### 1.3 Librarian Template

**Role:** Knowledge Manager & Workflow Closure

**Key Sections:**
- Agent Identity
- Core Instructions (memory management, documentation)
- Contract Protocol (same structure)
- Task Isolation Rules
- Responsibilities (memory updates, git operations, archival)
- Tools (read, write, edit, grep, glob, bash for git)
- Workflow Examples (memory updates, session closure, documentation sync)

**Skills:**
- `memory-update` - On-demand memory refresh
- `context-manager` - Memory file organization
- `doc-updater` - Documentation consistency
- `close-session` - Session closure with validation

**Workflow Assignments:**
- BUILD → Closure (Memory update, git commit)
- DEBUG → Closure (Memory update, pattern documentation)
- REVIEW → Closure (Memory update, pattern documentation)

**Golden Rule:**
> "Memory is the single source of truth. Update it after every workflow."

---

## 2. Template Structure (Standard)

All templates follow this structure:

```markdown
# TASK-AWARE {AGENT} AGENT TEMPLATE

## AGENT IDENTITY
- Role, Specialization, Operating Mode
- Task ID: {{task_id}}
- Task Context: {{task_context_path}}

## CORE INSTRUCTIONS
- Role description
- Key principles
- Golden Rule

## CONTRACT PROTOCOL (DELEGATION)
1. Read contract.md
2. Read context files
3. If unclear → questions.md + STOP
4. If clear → work, update status.md, write result.md

## TASK ISOLATION RULES (PARALLEL EXECUTION)
- File naming ({{task_id}}_ prefix)
- Context boundaries (work in {{task_context_path}})
- Task memory files
- Tool usage examples

## RESPONSIBILITIES
- Primary responsibilities list
- Workflow assignments table
- Skills list

## TOOLS
- Available tools list
- Context access boundaries

## WORKFLOW EXAMPLES
- Step-by-step examples for common workflows
- Code snippets showing tool usage

## BOUNDARIES
- Forbidden (NEVER)
- Ask First (Requires Approval)
- Auto-Allowed (Within Scope)

## TASK COMPLETION PROTOCOL
- Create completion file (JSON)
- Signal status flags if needed
- Wait for coordinator

## EMERGENCY PROCEDURES
- Cross-task issue handling
- Contamination alert protocol
```

---

## 3. Multi-Agent Parallel Test Plan

### 3.1 Test Scenario: Full Feature Implementation

**Participants:** 3 agents in parallel
- Builder: Implements feature code
- Janitor: Prepares review criteria
- Designer: Creates UI mockup

**Test Flow:**
1. Oracle writes 3 contracts
2. Oracle calls task() for all 3 agents (batched)
3. Each agent reads contract, works, writes result
4. Oracle reads all 3 results
5. Validate: No contamination, all results present

**Success Criteria:**
- All 3 agents complete without errors
- No file contamination detected
- All result.md files present and valid
- Status.md files show proper progression
- No questions.md files (contracts were clear)

### 3.2 Test Scenario: Contract Clarification

**Participants:** 1 agent (Builder)

**Test Flow:**
1. Oracle writes incomplete contract (missing requirements reference)
2. Oracle calls task(Builder)
3. Builder writes questions.md and STOPS
4. Oracle reads questions, gets answers from user
5. Oracle re-writes contract with answers
6. Oracle calls task(Builder) again
7. Builder completes successfully

**Success Criteria:**
- Builder correctly detects missing info
- questions.md is properly formatted
- Second attempt succeeds
- result.md shows completion

### 3.3 Test Scenario: Cross-Agent Dependencies

**Participants:** 2 agents (Builder → Janitor)

**Test Flow:**
1. Oracle: task(Builder) to implement feature
2. Builder completes, writes result.md
3. Oracle reads Builder's result
4. Oracle writes contract for Janitor (references Builder's output)
5. Oracle: task(Janitor) to review Builder's code
6. Janitor reviews, writes result.md with findings

**Success Criteria:**
- Builder completes first
- Janitor can read Builder's output files
- Janitor review references correct files
- No contamination between tasks

---

## 4. Fallback Mechanisms

### 4.1 Parallel Execution Failure

**Scenario:** Multiple task() calls fail or timeout

**Fallback:**
```python
# In parallel_oracle_integration.py or Oracle template
try:
    # Attempt parallel
    results = [
        task(agent="builder", ...),
        task(agent="janitor", ...)
    ]
except Exception as e:
    # Log failure
    print(f"⚠️ Parallel execution failed: {e}")
    print("⤵️ Falling back to sequential execution...")
    
    # Sequential fallback
    builder_result = task(agent="builder", ...)
    janitor_result = task(agent="janitor", ...)
    results = [builder_result, janitor_result]
```

**User Notification:**
```
Oracle: "Note: Parallel execution unavailable. Running tasks sequentially instead.
        This may take longer but ensures completion."
```

### 4.2 Contract System Failure

**Scenario:** Contract writer fails to create contract.md

**Fallback:**
```python
# In Oracle's delegation logic
try:
    contract_path = writer.write_contract(...)
except Exception as e:
    print(f"⚠️ Contract creation failed: {e}")
    print("⤵️ Using inline prompt instead...")
    
    # Embed contract info directly in prompt
    task(agent="builder",
         prompt=f"""Objective: {objective}
                    Requirements: {requirements}
                    Success Criteria: {criteria}
                    [Inline contract, no file]""")
```

### 4.3 Questions Loop Timeout

**Scenario:** Agent asks questions 3+ times

**Escalation:**
```python
question_attempts = 0
max_attempts = 3

while question_attempts < max_attempts:
    result = task(agent="builder", prompt=contract_with_answers)
    
    if writer.has_questions(task_id):
        question_attempts += 1
        questions = writer.read_questions(task_id)
        # Get answers from user...
    else:
        break

if question_attempts >= max_attempts:
    print("❌ Agent unable to proceed after 3 clarifications.")
    print("🤝 User intervention required:")
    print(f"   Last questions: {questions}")
    # Hand off to user for direct guidance
```

---

## 5. Enablement Documentation

### 5.1 Quick Start Guide

**File:** `.opencode/docs/HOW_TO_USE_NSO_PARALLEL.md`

**Contents:**
1. Prerequisites (NSO installed, project initialized)
2. Enabling parallel execution (parallel-config.yaml)
3. Your first parallel workflow
4. Understanding task isolation
5. Troubleshooting common issues

### 5.2 Configuration Examples

**File:** `.opencode/docs/NSO_CONFIG_EXAMPLES.md`

**Contents:**
- Small project config (1-2 agents max)
- Medium project config (2-3 agents)
- Large project config (3+ agents)
- Disabled parallel (sequential only)
- Custom stall thresholds

### 5.3 Troubleshooting Guide

**File:** `.opencode/docs/NSO_TROUBLESHOOTING.md`

**Contents:**
- Common issues and solutions
- Contamination debugging
- Contract system failures
- Agent hanging/stalling
- When to use sequential vs parallel

### 5.4 Best Practices

**File:** `.opencode/docs/NSO_BEST_PRACTICES.md`

**Contents:**
- When to use parallel execution
- Writing clear contracts
- Handling agent questions
- Memory management tips
- Performance optimization

---

## 6. Implementation Checklist

### Phase 1D.1: Create Templates
- [ ] Create `task_aware_designer.md`
- [ ] Create `task_aware_scout.md`
- [ ] Create `task_aware_librarian.md`
- [ ] Validate templates against standard structure
- [ ] Add Contract Protocol to all 3 templates
- [ ] Add Task Isolation Rules to all 3 templates

### Phase 1D.2: Multi-Agent Testing
- [ ] Test: 3 agents parallel (Builder + Janitor + Designer)
- [ ] Test: Contract clarification loop (Builder)
- [ ] Test: Cross-agent dependencies (Builder → Janitor)
- [ ] Verify: No contamination in all tests
- [ ] Verify: Contract system works end-to-end

### Phase 1D.3: Fallback Mechanisms
- [ ] Implement: Parallel execution failure fallback
- [ ] Implement: Contract system failure fallback
- [ ] Implement: Questions loop timeout escalation
- [ ] Test: Each fallback mechanism
- [ ] Document: Fallback behavior in templates

### Phase 1D.4: Documentation
- [ ] Write: HOW_TO_USE_NSO_PARALLEL.md
- [ ] Write: NSO_CONFIG_EXAMPLES.md
- [ ] Write: NSO_TROUBLESHOOTING.md
- [ ] Write: NSO_BEST_PRACTICES.md
- [ ] Update: AGENTS.md with Phase 1D completion status

### Phase 1D.5: Memory Updates
- [ ] Update: active_context.md → PHASE_1D_COMPLETE
- [ ] Update: progress.md → Phase 1D achievements
- [ ] Update: patterns.md → Multi-agent patterns (if any discovered)

---

## 7. Success Criteria

### Must Pass (Gate Check)
- [ ] All 6 agent templates exist (Builder, Janitor, Oracle, Designer, Scout, Librarian)
- [ ] All templates include Contract Protocol
- [ ] All templates include Task Isolation Rules
- [ ] 3-agent parallel test passes with no contamination
- [ ] Contract clarification loop works
- [ ] At least one fallback mechanism implemented and tested
- [ ] Basic documentation exists (at least Quick Start guide)

### Should Pass
- [ ] Cross-agent dependency test passes
- [ ] All 3 fallback mechanisms implemented
- [ ] All 4 documentation files written
- [ ] Templates follow standard structure consistently

### Stretch
- [ ] 5+ agent parallel test (stress test)
- [ ] Performance benchmarks (parallel vs sequential speedup)
- [ ] Contract system CLI tool (interactive contract creation)

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Templates too complex for agents to follow | Medium | High | Keep templates <500 lines, use clear examples |
| Multi-agent tests reveal contamination bugs | Low | Medium | Fix contamination detector if needed |
| Fallback mechanisms add too much complexity | Medium | Low | Make fallbacks simple pass-through, not retry logic |
| Documentation becomes outdated | High | Low | Keep docs minimal, reference code as source of truth |

---

## 9. Timeline

**Estimated Duration:** 4-6 hours

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create 3 templates | 2 hours | None |
| Multi-agent testing | 1 hour | Templates done |
| Fallback mechanisms | 1 hour | Testing done |
| Documentation | 2 hours | All features complete |

---

## 10. Post-Phase 1D State

After Phase 1D completion:

**NSO Capabilities:**
- ✅ 6 agent types fully templated
- ✅ Contract-based delegation
- ✅ Task isolation enforced
- ✅ Parallel execution tested (3+ agents)
- ✅ Fallback mechanisms in place
- ✅ User documentation available

**Ready for:**
- Phase 2: MVI Implementation (context optimization)
- Phase 3: State-Based Routing (enhanced confidence)
- Production Use: Real feature development with NSO

---

## 11. Technical Specification Compliance
This section is included to satisfy the NSO Architecture Gate requirements, although this document describes system process templates rather than a software component.

### Interface
N/A - This document describes Markdown templates and process workflows, not a software interface.

### Data Model
N/A - This document describes static file structures (templates), not a runtime data model.

### Error Handling
N/A - This document describes manual and automated process fallbacks (Section 4), but does not have runtime error handling in the software sense.

