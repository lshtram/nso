# NSO Issue Analysis: Builder Stall & Recovery Failure

**Date:** 2026-02-08  
**Status:** Investigation Complete  
**Priority:** HIGH

---

## Issue Summary

When working with NSO, the following sequence of events occurred:

1. ✅ Oracle recognized BUILD workflow intent
2. ✅ Oracle completed Discovery phase (requirements)
3. ✅ Oracle completed Architecture phase (tech spec)
4. ✅ Oracle delegated to Builder for Implementation
5. ❌ **Builder stalled** (likely due to LLM provider credit exhaustion)
6. ❌ **User stopped the Builder task**
7. ❌ **Oracle failed to properly recover** - tried to delegate to "new builder"
8. ❌ **Workflow state became corrupted** - process didn't continue as planned

---

## Root Causes Identified

### 1. **Plugin Router Loop Risk** ⚠️

**Location:** `~/.config/opencode/nso/nso-plugin.js` (lines 59-84)

**Issue:** The `message.updated` hook fires on EVERY message update, including:
- User messages
- Assistant messages
- Agent task responses
- Internal system messages

**Current Protection:**
```javascript
const routedMessages = new Set();
// ...
if (routedMessages.has(messageId)) {
  return; // Already routed this message
}
routedMessages.add(messageId);
```

**Problem:** The `messageId` is derived from `input.message?.id || input.message?.content`, which may:
- Not uniquely identify messages across session
- Cause duplicate routing if message ID changes
- Not persist across plugin reloads

**Risk Level:** MEDIUM - Could cause routing loops, but Set tracking provides basic protection

---

### 2. **No Circuit Breaker Implementation** ❌

**Status:** Documented but NOT implemented

The circuit breaker pattern is fully specified in:
- `REQ-NSO-Circuit-Breaker.md` (499 lines)

But the actual implementation does NOT exist:
- No `skills/circuit-breaker/circuit_breaker.py`
- No `tests/test_circuit_breaker.py`
- No agent-level or LLM-level circuit breakers

**Impact:**
- When Builder stalls due to LLM provider failure (rate limit, timeout, credit exhaustion), there's NO fallback mechanism
- No automatic retry with different model
- No graceful degradation
- No state recovery protocol

**This is the PRIMARY cause of the workflow failure.**

---

### 3. **Missing Stall Detection** ❌

**Expected:** System should detect when an agent hasn't made progress

**Reality:** No stall detection mechanism exists in the current implementation

The plugin has telemetry hooks (`tool.execute.after` calls `profiler.py`), but:
- Profiler.py path is hardcoded to `/Users/Shared/dev/openspace/.opencode/hooks/post_tool_use/profiler.py`
- This is NOT a global NSO script
- This is project-specific and may not exist

**Result:** When Builder stalls, the system has no way to detect it until user intervention

---

### 4. **No Workflow State Recovery** ❌

**Issue:** When a delegated agent (Builder) fails or is stopped, the Oracle doesn't have a recovery protocol

**Expected Behavior:**
```
Builder stalls → Detect stall → Update active_context.md → Notify Oracle → Oracle offers options:
  1. Resume with same agent
  2. Re-delegate to fresh Builder instance
  3. Fallback to simpler approach
  4. Escalate to user
```

**Actual Behavior:**
```
Builder stalls → User stops task → Oracle becomes confused → Tries to delegate to "new builder" → Workflow state corrupted
```

**Root Cause:** No session state recovery protocol in `BUILD.md` workflow documentation

---

### 5. **Active Context State Management Confusion** ⚠️

**Issue:** The `active_context.md` file is NOT automatically updated during workflow phase transitions

**Current Protocol (from instructions.md):**
- Oracle checks `active_context.md` to see if workflow is active
- Router skips routing if Status shows "IN_PROGRESS"

**Problem:** When Builder is delegated via `task()` tool:
1. Oracle doesn't update `active_context.md` with "Status: IMPLEMENTATION"
2. Builder may or may not update it
3. When Builder stalls and is stopped, `active_context.md` may still show "IN_PROGRESS"
4. Oracle becomes confused about current state

**Solution:** Explicit phase transition protocol with state updates

---

## Plugin Analysis

### Current Plugin Behavior

**✅ Good:**
- Session initialization runs once per session (tracked with `initializedSessions` Set)
- Router monitoring has duplicate message protection
- Telemetry tracking for performance monitoring

**⚠️ Concerns:**
1. **Router runs on ALL message.updated events**
   - Risk of processing agent responses as user messages
   - Depends on `input.message?.role !== 'user'` check
   - If role detection fails, could cause loops

2. **Hardcoded project paths**
   - `validate_intent.py` path: `/Users/Shared/dev/openspace/.opencode/hooks/...`
   - `profiler.py` path: `/Users/Shared/dev/openspace/.opencode/hooks/...`
   - These should be project-agnostic or dynamically resolved

3. **No error visibility**
   - Router warnings logged to console but not shown to user
   - Agent may not see routing decisions
   - Failures silently swallowed with `.nothrow()`

---

## Recommended Solutions

### Priority 1: Implement Circuit Breaker (CRITICAL)

**Timeline:** Immediate

**Action:**
1. Implement `CircuitBreaker` class per `REQ-NSO-Circuit-Breaker.md`
2. Add per-agent circuit breakers (Oracle, Builder, Janitor, etc.)
3. Add per-LLM-provider circuit breakers (Anthropic, OpenAI)
4. Implement fallback chain:
   - Same agent retry (simplified approach)
   - Model fallback (claude-sonnet → claude-haiku)
   - Escalate to user (human-in-the-loop)

**Files to Create:**
- `~/.config/opencode/nso/skills/circuit-breaker/circuit_breaker.py`
- `~/.config/opencode/nso/skills/circuit-breaker/SKILL.md`
- `~/.config/opencode/nso/tests/test_circuit_breaker.py`

**Integration Points:**
- Task delegation in Oracle
- LLM API calls
- Agent execution wrapper

---

### Priority 2: Add Workflow State Recovery Protocol

**Timeline:** High priority

**Action:**
1. Define explicit state transitions in `active_context.md`
2. Update state at each phase boundary
3. Add recovery logic for stopped/failed agents

**Protocol:**
```yaml
# active_context.md structure
Status: IMPLEMENTATION  # Track current phase
Workflow: BUILD
Phase: Implementation
Agent: Builder
Task_ID: task_12345  # Track delegated task
Started: 2026-02-08 04:00:00
Last_Heartbeat: 2026-02-08 04:05:00
```

**Recovery Logic (Oracle):**
```python
def handle_agent_failure(agent, phase, task_id):
    # 1. Check active_context.md
    state = load_active_context()
    
    # 2. Determine failure type
    if state.last_heartbeat > 5_minutes_ago:
        failure_type = "stalled"
    elif task_stopped_by_user:
        failure_type = "stopped"
    else:
        failure_type = "error"
    
    # 3. Offer recovery options
    if failure_type == "stalled":
        # Circuit breaker should handle this
        return trigger_circuit_breaker()
    elif failure_type == "stopped":
        return ask_user([
            "Resume with same agent",
            "Re-delegate to fresh instance",
            "Simplify approach",
            "Abort workflow"
        ])
```

---

### Priority 3: Fix Plugin Router Safety

**Timeline:** Medium priority

**Action:**
1. Make router message ID tracking more robust
2. Add explicit role checking for user vs agent messages
3. Add router invocation logging visible to agents

**Changes:**
```javascript
// More robust message tracking
const routedMessages = new Map(); // messageId -> timestamp

"message.updated": async (input) => {
  // Only process user messages
  if (input.message?.role !== 'user') {
    return;
  }
  
  // Check if already routed (within last 60 seconds)
  const messageId = input.message?.id;
  if (routedMessages.has(messageId)) {
    const lastRouted = routedMessages.get(messageId);
    if (Date.now() - lastRouted < 60000) {
      return; // Skip duplicate within 60s window
    }
  }
  
  // Mark as routed
  routedMessages.set(messageId, Date.now());
  
  // Run router with explicit logging
  const result = await $`python3 /Users/opencode/.config/opencode/nso/scripts/router_monitor.py ${input.message.content}`.json();
  
  // Make routing decision visible to agents
  if (result && result.should_route) {
    console.log(`🎯 NSO ROUTING: ${result.workflow} (${Math.round(result.confidence * 100)}% confidence)`);
    console.log(`   Oracle should see this in context`);
  }
}
```

---

### Priority 4: Add Stall Detection

**Timeline:** Medium priority

**Action:**
1. Implement heartbeat mechanism for delegated agents
2. Add timeout detection in Oracle
3. Trigger circuit breaker on stall

**Mechanism:**
```python
# In Builder (or any delegated agent)
def heartbeat():
    """Update active_context.md with current timestamp"""
    context = load_active_context()
    context.last_heartbeat = datetime.now()
    save_active_context(context)

# In Oracle (monitoring loop)
def check_agent_heartbeat(task_id):
    context = load_active_context()
    if context.task_id == task_id:
        time_since_heartbeat = datetime.now() - context.last_heartbeat
        if time_since_heartbeat > timedelta(minutes=5):
            # Agent stalled
            trigger_stall_recovery()
```

---

### Priority 5: Improve Plugin Error Visibility

**Timeline:** Low priority

**Action:**
1. Log router decisions to file visible to Oracle
2. Make validation errors visible in tool output
3. Add telemetry dashboard command

**Changes:**
```javascript
// Write router decision to file for Oracle to read
if (result && result.should_route) {
  const fs = require('fs');
  fs.writeFileSync('.opencode/logs/last_router_decision.json', JSON.stringify(result, null, 2));
}
```

---

## Testing Plan

### Test Case 1: Builder Stall Recovery

**Scenario:** Builder stalls due to LLM timeout

**Steps:**
1. Start BUILD workflow
2. Oracle delegates to Builder
3. Simulate LLM timeout (mock API)
4. Verify circuit breaker opens
5. Verify fallback to Haiku model
6. Verify workflow continues

**Expected Result:** Workflow completes with fallback model

---

### Test Case 2: User Stops Agent

**Scenario:** User stops Builder mid-implementation

**Steps:**
1. Start BUILD workflow
2. Oracle delegates to Builder
3. User stops Builder task
4. Oracle detects stopped state
5. Oracle offers recovery options

**Expected Result:** Oracle presents recovery menu, user can resume or abort

---

### Test Case 3: Plugin Router Loop Prevention

**Scenario:** Router fires on agent response message

**Steps:**
1. Oracle responds to user
2. Monitor `message.updated` hook fires
3. Verify router skips non-user messages
4. Verify no duplicate routing

**Expected Result:** Router only fires once per user message

---

## Implementation Priority

1. **CRITICAL:** Circuit Breaker implementation
2. **HIGH:** Workflow state recovery protocol
3. **HIGH:** Stall detection mechanism
4. **MEDIUM:** Plugin router safety improvements
5. **LOW:** Error visibility enhancements

---

## Next Steps

**Immediate Actions:**
1. Create `circuit_breaker.py` implementation
2. Update `BUILD.md` with recovery protocol
3. Add state transition tracking to `active_context.md`
4. Test with simulated failures

**User Decision Required:**
- Approve Priority 1 & 2 for immediate implementation?
- Should we build circuit breaker first, or recovery protocol first?
- What's the acceptable stall timeout? (default: 5 minutes)

---

## References

- Circuit Breaker Requirements: `~/.config/opencode/nso/docs/requirements/REQ-NSO-Circuit-Breaker.md`
- BUILD Workflow: `~/.config/opencode/nso/docs/workflows/BUILD.md`
- Plugin: `~/.config/opencode/nso/nso-plugin.js`
- Router: `~/.config/opencode/nso/scripts/router_monitor.py`
