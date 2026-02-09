# Phase 1C: Agent Communication & Architecture Improvements

**Date:** 2026-02-08  
**Status:** PLANNING  
**Priority:** P0 - Critical

---

## Issues Identified

### 1. NSO Directory Structure (Organization)
**Problem:** Files scattered between:
- `/Users/opencode/.config/opencode/nso/` (NSO system)
- `/Users/Shared/dev/dream-news/.opencode/` (Project)

**Solution:** Consolidate core NSO files to NSO directory, keep project-specific files in project.

### 2. Oracle Delegation with User Continuation
**Problem:** Oracle delegates work and waits synchronously. User cannot continue discussion while work happens.

**Question:** Can we achieve async delegation where:
- Oracle delegates to agent
- Work happens in background
- Oracle can continue talking to user
- Agent can interrupt with questions
- User can interject at any time

**Answer:** YES, but requires architectural changes:
- Background task execution
- Message passing system
- Interrupt handling
- State management

### 3. Init Session Not Running
**Problem:** Oracle didn't initiate `init.py` in new session.

**Current behavior (from nso-plugin.js):**
```javascript
"session.created": async (input) => {
  await trackPerformance("init_session.py", 
    $`python3 /Users/opencode/.config/opencode/nso/scripts/init_session.py`.nothrow().text()
  );
}
```

**Issues:**
- Plugin may not be loaded
- Session may not trigger "session.created" event
- Error handling may hide failures

### 4. Agent-to-Agent Message Routing
**Problem:** Builder asks Oracle question → Oracle answers → Oracle thinks it's user message → Oracle stops.

**Current behavior:**
1. Builder has question
2. Builder outputs to Oracle
3. Oracle receives message
4. Oracle router checks message
5. Router thinks "should_route: false" (not a user intent)
6. Oracle stops responding

**Root cause:** Oracle cannot distinguish between:
- Messages from user
- Messages from agents
- System messages

**Solution:** Add message source tagging and routing logic.

---

## Comprehensive Plan

### Phase 1C.1: NSO Directory Consolidation (2 hours)

**Goal:** Organize files properly

**Actions:**
1. Move core NSO files to NSO directory:
   ```
   FROM: /Users/Shared/dev/dream-news/.opencode/scripts/
   TO: /Users/opencode/.config/opencode/nso/scripts/
   
   Files to move:
   - parallel_coordinator.py
   - task_id_generator.py
   - task_context_manager.py
   - context_contamination_detector.py
   ```

2. Keep project-specific files in project:
   ```
   IN: /Users/Shared/dev/dream-news/.opencode/scripts/
   
   - test_oracle_integration.py (tests)
   - test_parallel_isolation.py (tests)
   - stall_demo_simple.py (demos)
   - PHASE1B_COMPLETION.md (documentation)
   ```

3. Update all imports and references

**Deliverables:**
- Clean NSO directory structure
- Working imports
- Documentation of file locations

---

### Phase 1C.2: Agent Message Protocol (4 hours)

**Goal:** Enable agent-to-agent communication with message source tagging

**Architecture:**
```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Oracle    │◄────│  Message Queue  │────►│   Builder   │
│  (User IF)  │     │  + Routing      │     │  (Worker)   │
└──────┬──────┘     └─────────────────┘     └──────▲──────┘
       │                                            │
       │ User/Agent Messages                        │ Questions
       ▼                                            │
┌─────────────────────────────────────────────────────┐
│              Message Router (Enhanced)               │
│                                                     │
│  Sources:                                           │
│  - user: High priority, routes to router_monitor    │
│  - agent: Medium priority, routes to agent_handler  │
│  - system: Low priority, auto-handled               │
└─────────────────────────────────────────────────────┘
```

**Implementation:**

1. **Message Format with Source Tagging:**
```python
{
  "source": "builder|oracle|janitor|designer|user|system",
  "message": "Actual message text",
  "task_id": "Optional task context",
  "priority": "high|medium|low",
  "timestamp": "ISO format"
}
```

2. **Enhanced Router Monitor:**
```python
def should_route(message: str, source: str = "user") -> dict:
    # Only route user messages through intent detection
    if source != "user":
        return {
            "should_route": False,
            "reason": f"Message from {source}, not user intent",
            "handler": "agent_communication_handler"
        }
    
    # Existing routing logic for user messages
    ...
```

3. **Agent Communication Handler:**
```python
def handle_agent_message(message: dict) -> str:
    """
    Route agent messages appropriately.
    - Questions → Route to human user
    - Status updates → Log and acknowledge
    - Completions → Update task state
    - Errors → Log and trigger recovery
    """
```

**Deliverables:**
- Message source tagging system
- Enhanced router monitor
- Agent communication handler
- Tests for all message types

---

### Phase 1C.3: Async Delegation with User Continuation (6 hours)

**Goal:** Oracle can delegate work and continue talking to user

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                     Oracle Session                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  State Machine                                          │ │
│  │                                                         │ │
│  │  IDLE → DELEGATING → WAITING → INTERACTING → COMPLETE │ │
│  │     │            │           │            │              │ │
│  │     │            │           │            │              │ │
│  │     │            │           ▼            │              │ │
│  │     │            │    ┌─────────────┐      │              │ │
│  │     │            │    │ Background │      │              │ │
│  │     │            └───►│   Agent    │──────┘              │ │
│  │     │                 │  Task      │                     │ │
│  │     │                 └─────────────┘                     │ │
│  │     │                       │                              │ │
│  │     │        Questions ◄────┘                              │ │
│  │     │                       │                              │ │
│  └─────┼───────────────────────┼──────────────────────────────┘ │
│        │                       │                               │
│        ▼                       ▼                               │
│  ┌─────────────┐        ┌─────────────┐                       │
│  │   User      │◄──────►│  Message    │                       │
│  │  Interface  │        │   Buffer    │                       │
│  └─────────────┘        └─────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

1. **Non-blocking Task Delegation:**
```python
async def delegate_task(task: dict, user_context: dict) -> str:
    """
    Delegate task to agent without blocking.
    Returns task_id immediately, work continues in background.
    """
    task_id = TaskIDGenerator.generate()
    
    # Create isolated context
    context_path = create_task_context(task_id, task)
    
    # Launch agent task in background
    agent_task = asyncio.create_task(
        run_agent_background(
            agent_type=task["agent"],
            context_path=context_path,
            task_id=task_id,
            message_queue=global_message_queue
        )
    )
    
    # Store task state
    active_tasks[task_id] = {
        "task": agent_task,
        "status": "running",
        "user_context": user_context
    }
    
    return task_id
```

2. **Message Buffer for User Interjection:**
```python
class MessageBuffer:
    """
    Buffers messages from agents while Oracle talks to user.
    Allows user to interject at any time.
    """
    
    def __init__(self):
        self.buffer = []
        self.user_interaction_active = False
    
    def add_agent_message(self, message: dict):
        if self.user_interaction_active:
            # Queue message for later
            self.buffer.append(message)
        else:
            # Forward immediately
            self.forward_to_oracle(message)
    
    def pause_user_interaction(self):
        self.user_interaction_active = True
    
    def resume_user_interaction(self):
        self.user_interaction_active = False
        # Flush buffered messages
        for message in self.buffer:
            self.forward_to_oracle(message)
        self.buffer.clear()
```

3. **User Message Priority:**
```python
def handle_user_message(message: str) -> str:
    """
    User messages always get priority.
    Agent messages are buffered while user is talking.
    """
    global message_buffer
    
    # Flush any buffered agent messages
    message_buffer.resume_user_interaction()
    
    # Process user message
    response = process_user_intent(message)
    
    # User done, resume buffering
    message_buffer.pause_user_interaction()
    
    return response
```

4. **Agent Question Handling:**
```python
async def handle_agent_question(question: dict) -> str:
    """
    When agent has question, interrupt user interaction
    and route question to user (with Oracle facilitation).
    """
    # Pause user interaction
    message_buffer.pause_user_interaction()
    
    # Present question to user
    await oracle.speak(f"🤖 {question['agent']} has a question: {question['text']}")
    
    # Wait for user answer
    user_answer = await oracle.listen_for_user()
    
    # Resume agent with answer
    await resume_agent_with_answer(question['task_id'], user_answer)
    
    # Resume user interaction
    message_buffer.resume_user_interaction()
    
    return user_answer
```

**Deliverables:**
- Non-blocking task delegation
- Message buffering system
- User priority handling
- Agent question interruption
- Async task execution

---

### Phase 1C.4: Init Session Fix (1 hour)

**Goal:** Ensure init_session.py runs on every new session

**Implementation:**

1. **Debug Init Session Issue:**
```bash
# Check if plugin is loaded
# Check session.created event firing
# Check error logs
```

2. **Robust Init:**
```python
def robust_init():
    """
    Try multiple methods to initialize session.
    """
    methods = [
        run_init_session_via_plugin,
        run_init_session_direct,
        run_init_session_fallback
    ]
    
    for method in methods:
        try:
            result = method()
            if result["success"]:
                return result
        except Exception as e:
            continue
    
    return {"success": False, "error": "All init methods failed"}
```

3. **Init Verification:**
```python
def verify_init():
    """
    Verify all context files loaded.
    Check active_context.md exists and valid.
    """
    required_files = [
        ".opencode/context/00_meta/tech-stack.md",
        ".opencode/context/00_meta/patterns.md",
        ".opencode/context/01_memory/active_context.md",
        ".opencode/context/01_memory/progress.md"
    ]
    
    for file in required_files:
        if not Path(file).exists():
            return {"success": False, "missing": file}
    
    return {"success": True, "files": required_files}
```

**Deliverables:**
- Working init session
- Error recovery
- Verification system
- Debug logging

---

## File Organization

### NSO System Directory (`/Users/opencode/.config/opencode/nso/`)

**Core Scripts (MOVE HERE):**
```
scripts/
├── parallel_coordinator.py          ⬅️ MOVE from project
├── parallel_oracle_integration.py   ✅ Already here
├── task_id_generator.py            ⬅️ MOVE from project
├── task_context_manager.py          ⬅️ MOVE from project
├── context_contamination_detector.py ⬅️ MOVE from project
├── router_monitor.py                ✅ Already here
├── init_session.py                  ✅ Already here
├── close_session.py                 ✅ Already here
├── heartbeat_api.py                ✅ Already here
├── system_telemetry.py              ✅ Already here
├── session_state.py                 ✅ Already here
└── message_router.py                🆕 NEW - Agent communication
```

**Agent Templates:**
```
agent_templates/
├── task_isolation_header.md        ✅ Already here
├── task_isolation_rules.md         ✅ Already here
├── task_isolation_examples.md      ✅ Already here
├── task_aware_builder.md           ✅ Already here
├── task_aware_janitor.md           ✅ Already here
├── task_aware_oracle.md            ✅ Already here
├── task_aware_designer.md          🆕 NEW
├── task_aware_scout.md             🆕 NEW
└── task_aware_librarian.md         🆕 NEW
```

**Configuration:**
```
config/
├── task-isolation.yaml             ✅ Already here
└── parallel-config.yaml            ✅ Already here
```

### Project Directory (`/Users/Shared/dev/dream-news/.opencode/`)

**Project-Specific (KEEP HERE):**
```
scripts/
├── test_oracle_integration.py      ✅ Already here
├── test_parallel_isolation.py      ✅ Already here
├── stall_demo_simple.py            ✅ Already here
├── PHASE1B_COMPLETION.md           ✅ Already here
└── PHASE1C_PLAN.md                 ✅ Already here (this file)
```

---

## Implementation Sequence

### Week 1 (This Week)

#### Day 1-2: Directory Consolidation
- [ ] Move core NSO files to NSO directory
- [ ] Update imports and references
- [ ] Test all scripts work from new locations
- [ ] Document file organization

#### Day 3-4: Agent Message Protocol
- [ ] Implement message source tagging
- [ ] Enhance router monitor with source parameter
- [ ] Create agent communication handler
- [ ] Test agent-to-agent messaging
- [ ] Fix Builder → Oracle → User routing

#### Day 5: Init Session Fix
- [ ] Debug why init not running
- [ ] Implement robust init
- [ ] Add verification system
- [ ] Test init on new sessions

### Week 2

#### Day 1-3: Async Delegation
- [ ] Implement non-blocking delegation
- [ ] Create message buffer
- [ ] Implement user priority handling
- [ ] Test async delegation flow
- [ ] Document async architecture

#### Day 4-5: Integration Testing
- [ ] Test complete delegation flow
- [ ] Test agent questions to user
- [ ] Test user interjection
- [ ] Test error recovery
- [ ] Performance testing

---

## Success Criteria

### Must Have (P0):
- [ ] NSO files consolidated to NSO directory
- [ ] Init session runs reliably
- [ ] Agent messages routed correctly (Builder → Oracle → User)
- [ ] Oracle can distinguish agent vs. user messages
- [ ] Message source tagging implemented

### Should Have (P1):
- [ ] Non-blocking task delegation
- [ ] User can continue talking while work happens
- [ ] Agent questions interrupt user interaction
- [ ] Message buffering works correctly
- [ ] All agent templates updated

### Nice to Have (P2):
- [ ] Performance metrics for async delegation
- [ ] Visual dashboard of active tasks
- [ ] Automatic retry on agent failure
- [ ] Comprehensive test suite

---

## Risks and Mitigations

### Risk: Breaking Changes
**Mitigation:** 
- Test all changes in isolation
- Keep fallback to synchronous mode
- Document all breaking changes
- Rollback plan ready

### Risk: Message Buffer Overflow
**Mitigation:**
- Set maximum buffer size
- Priority expiration
- Error handling for full buffer
- Monitoring and alerting

### Risk: Race Conditions
**Mitigation:**
- Use thread-safe queues
- Lock critical sections
- Test concurrent scenarios
- Comprehensive logging

---

## Questions for Clarification

1. **Message Routing Priority:** When user is talking and agent has question, should we:
   - A) Immediately interrupt user (agent priority)
   - B) Queue question until user done (user priority)
   - C) Let user choose (interactive)
   
   **Recommendation:** B) Queue until user done, unless urgent (timeout).

2. **Background Execution:** Should background tasks:
   - A) Run in same Python process (simpler, shared memory)
   - B) Run in separate processes (isolation, but complex)
   
   **Recommendation:** A) Separate asyncio tasks for now, separate processes when needed.

3. **State Persistence:** If session closes with running tasks:
   - A) Kill all running tasks
   - B) Persist task state, resume on reopen
   - C) Ask user preference
   
   **Recommendation:** C) Ask user preference by default.

---

## References

- **NSO Plugin:** `/Users/opencode/.config/opencode/nso/nso-plugin.js`
- **Router Monitor:** `/Users/opencode/.config/opencode/nso/scripts/router_monitor.py`
- **Parallel Coordinator:** `/Users/opencode/.config/opencode/nso/scripts/parallel_coordinator.py`
- **Init Session:** `/Users/opencode/.config/opencode/nso/scripts/init_session.py`
- **Architecture:** `/Users/opencode/.config/opencode/nso/ARCHITECTURE.md`
- **Agents:** `/Users/opencode/.config/opencode/nso/AGENTS.md`
- **Instructions:** `/Users/opencode/.config/opencode/nso/instructions.md`

---

**Document Version:** 1.0.0  
**Created:** 2026-02-08  
**Status:** Ready for Review  
**Next:** Awaiting user approval to proceed
