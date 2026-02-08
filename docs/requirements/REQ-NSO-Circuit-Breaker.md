# REQ-NSO-Circuit-Breaker

**Requirements Document for Circuit Breaker Pattern**
**Version:** 1.0.0
**Date:** 2026-02-07
**Status:** Draft (Phase 1: Discovery)
**Feature ID:** CIRCUIT-BREAKER

---

## 1. Purpose

This document defines the requirements for implementing the **Circuit Breaker Pattern** in the NSO (Neuro-Symbolic Orchestrator) framework to provide fault tolerance for agent workflows, LLM calls, and tool executions.

The Circuit Breaker prevents cascading failures by:
- Stopping repeated failed calls to unstable services
- Allowing failing services time to recover
- Providing graceful degradation through fallback strategies
- Protecting the system from retry storms and cost explosions

---

## 2. Problem Statement

### 2.1 Current State

The NSO framework currently lacks resilience mechanisms for:
- LLM provider failures (rate limits, timeouts, API errors)
- Tool execution failures
- Agent delegation failures
- Cascading failures across workflow phases

### 2.2 Failure Scenarios Observed

| Scenario | Impact | Current Handling |
|----------|--------|------------------|
| LLM rate limit (429) | Workflow stalls | No handling |
| LLM timeout (>60s) | Workflow stalls | No handling |
| Tool execution error | Task fails | Propagates upward |
| Repeated failures | Infinite retry loop | No protection |
| Cascading failure | Entire workflow blocked | No isolation |

### 2.3 Business Impact

- **Cost Risk:** Naive retries multiply LLM API costs
- **Availability Risk:** Single failure blocks entire workflow
- **User Experience:** No graceful degradation
- **Observability:** No visibility into failure patterns

---

## 3. Design Decisions (Approved)

The following decisions have been approved by the user and form the basis for these requirements:

### 3.1 Scope

- **Per-agent circuit breakers:** Each agent (Oracle, Builder, Janitor, etc.) has its own circuit breaker
- **Per-LLM-provider circuit breakers:** Each LLM provider (OpenAI, Anthropic) has its own breaker
- **Per-tool circuit breakers:** Each tool type can have its own breaker

### 3.2 State Management

- **Local state only:** Each agent maintains its own circuit breaker state
- **No centralized store:** No Redis or shared state in Phase 2
- **State survives agent restart:** State persists within agent lifetime

### 3.3 Fallback Strategy (Priority Order)

1. **Same Agent Retry:** Agent attempts task with a different approach
2. **Model Fallback:** Switch to smaller/cheaper LLM (e.g., claude-sonnet → claude-haiku)
3. **Escalate to User:** Human-in-the-loop intervention via interrupt()

### 3.4 Observability

- **Basic logging only:** No metrics dashboard in Phase 2
- **Log to file:** `.opencode/logs/circuit-breakers.json`
- **State transitions logged:** CLOSED → OPEN → HALF_OPEN → CLOSED
- **Fallback triggers logged:** Which fallback was triggered and why

---

## 4. Functional Requirements

### FR-001: Three-State Machine

The circuit breaker must implement a three-state machine:

| State | Behavior | Trigger |
|-------|----------|---------|
| **CLOSED** | Requests pass through; failures counted | Initial state |
| **OPEN** | Requests blocked; fallback triggered | `failure_threshold` exceeded |
| **HALF_OPEN** | Limited probe requests allowed | `wait_duration` elapsed |

**Transitions:**
- CLOSED → OPEN: `failure_threshold` consecutive failures
- OPEN → HALF_OPEN: `wait_duration` elapsed
- HALF_OPEN → CLOSED: `success_threshold` consecutive successes
- HALF_OPEN → OPEN: Any failure during probe

### FR-002: Configuration Parameters

The circuit breaker must support configurable parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `failure_threshold` | int | 5 | Failures before opening circuit |
| `success_threshold` | int | 2 | Successes to close circuit (half-open) |
| `wait_duration_seconds` | int | 30 | Time in OPEN before HALF_OPEN |
| `permitted_calls_in_half_open` | int | 3 | Probe calls allowed in HALF_OPEN |
| `slow_call_threshold_ms` | int | 2000 | Latency threshold for slow calls |

### FR-003: Per-Agent Circuit Breakers

Each NSO agent must have its own circuit breaker:

```
Oracle Circuit Breaker:
  - Protects: Routing decisions, architecture review
  - Failure types: Router errors, intent detection failures

Builder Circuit Breaker:
  - Protects: Code generation, TDD cycle
  - Failure types: Code validation failures, test failures

Janitor Circuit Breaker:
  - Protects: Quality checks, pattern detection
  - Failure types: Validation failures, analysis errors

Librarian Circuit Breaker:
  - Protects: Memory updates, git operations
  - Failure types: File I/O errors, git failures

Designer Circuit Breaker:
  - Protects: UI component generation
  - Failure types: Design token errors, rendering failures

Scout Circuit Breaker:
  - Protects: Web research, RFC generation
  - Failure types: Network errors, web fetch failures
```

### FR-004: Per-LLM-Provider Circuit Breakers

Each LLM provider must have its own circuit breaker:

```
Anthropic Circuit Breaker:
  - Protects: All Anthropic API calls
  - Failure types: RateLimitError, APIError, TimeoutError
  - Fallback: OpenAI or Claude Haiku

OpenAI Circuit Breaker:
  - Protects: All OpenAI API calls
  - Failure types: RateLimitError, APIError, ServiceUnavailableError
  - Fallback: Anthropic or GPT-3.5-Turbo
```

### FR-005: Fallback Chain Implementation

The system must implement a priority-based fallback chain:

```
Fallback Chain (evaluated in order):

1. Same Agent Retry
   - Condition: Circuit OPEN for current approach
   - Action: Agent attempts simplified approach
   - Max retries: 2

2. Model Fallback
   - Condition: Agent retry failed or LLM circuit OPEN
   - Action: Switch to fallback model
   - Fallback hierarchy:
     * claude-sonnet-4-20250506 → claude-haiku-3-5-20250506
     * gpt-4o → gpt-4o-mini
   - Max retries: 1

3. Escalate to User
   - Condition: All fallbacks exhausted
   - Action: Pause workflow for human decision
   - User options: Retry, Skip, Abort, Modify
```

### FR-006: Slow Call Detection

The circuit breaker must treat high-latency calls as partial failures:

- **Threshold:** Calls exceeding `slow_call_threshold_ms` are flagged
- **Logging:** Slow calls logged with latency details
- **Not a failure:** Slow calls do not increment failure count
- **Trend detection:** Pattern of slow calls triggers warning

### FR-007: Exception Classification

The circuit breaker must classify exceptions:

| Exception Type | Classification | Circuit Action |
|----------------|----------------|----------------|
| `RateLimitError` (429) | Transient | Count as failure |
| `TimeoutError` | Transient | Count as failure |
| `AuthenticationError` | Permanent | Count as failure, do NOT retry |
| `PermissionError` | Permanent | Count as failure, do NOT retry |
| `ValueError` | Client error | DO NOT count as failure |
| `ValidationError` | Client error | DO NOT count as failure |

### FR-008: Manual Override

The system must support manual circuit breaker control:

- **Force OPEN:** Manually open a circuit for maintenance
- **Force CLOSE:** Manually close an open circuit
- **Reset:** Clear all state and return to CLOSED
- **Status check:** Query current circuit state

**Command:**
```
/circuit-breaker status [agent|provider]
/circuit-breaker open [agent|provider]
/circuit-breaker close [agent|provider]
/circuit-breaker reset [agent|provider]
```

---

## 5. Non-Functional Requirements

### NFR-001: Performance

- **Overhead:** < 1ms per circuit breaker check
- **Memory:** < 1KB per circuit breaker instance
- **Concurrency:** Support async/await patterns

### NFR-002: Observability

- **Logging format:** JSON structured logging
- **Log location:** `.opencode/logs/circuit-breakers.json`
- **Log entries:**
  - State transitions (with timestamps)
  - Failure/success counts
  - Fallback triggers
  - Slow call warnings
  - Manual overrides

### NFR-003: Reliability

- **State persistence:** State survives agent restart (in-memory)
- **No external dependencies:** Circuit breaker works without Redis/db
- **Graceful degradation:** System operates with degraded circuit breakers

### NFR-004: Testability

- **Unit tests:** 100% coverage for circuit breaker logic
- **Integration tests:** End-to-end failure scenario tests
- **Manual testing:** CLI commands for state manipulation

---

## 6. User Stories

### US-001: Rate Limit Handling

**As a** user running a BUILD workflow,
**I want** the system to handle LLM rate limits gracefully,
**So that** my workflow doesn't stall when the rate limit is exceeded.

**Acceptance Criteria:**
- When Anthropic returns 429, circuit opens
- Fallback model (Haiku) is tried automatically
- User sees: "Rate limit exceeded, falling back to Claude Haiku"
- If fallback succeeds, workflow continues
- If fallback fails, escalate to user

### US-002: Timeout Recovery

**As a** user with slow network connectivity,
**I want** the system to handle LLM timeouts intelligently,
**So that** I don't lose work when the LLM is slow.

**Acceptance Criteria:**
- Calls > 60s timeout trigger fallback
- Fallback model (faster) is tried
- Original request is logged as slow call
- User sees: "Request timed out, using faster model"

### US-003: Cascading Failure Prevention

**As a** user running multiple agent workflows,
**I want** failures in one agent to not block others,
**So that** a failure in Janitor doesn't stall Builder.

**Acceptance Criteria:**
- Each agent has independent circuit breaker
- Oracle circuit breaker protects routing
- Builder circuit breaker operates independently
- Failure in one agent doesn't affect others

### US-004: Visibility into Failures

**As a** user debugging a workflow,
**I want** to see circuit breaker status and history,
**So that** I understand what's happening.

**Acceptance Criteria:**
- `/circuit-breaker status` shows all breakers
- Output includes: state, failure count, last failure time
- Logs in `.opencode/logs/circuit-breakers.json`
- State transitions are clearly logged

### US-005: Manual Intervention

**As a** operator,
**I want** to manually control circuit breakers,
**So that** I can perform maintenance or recover from stuck states.

**Acceptance Criteria:**
- `/circuit-breaker open builder` opens Builder circuit
- `/circuit-breaker close all` closes all circuits
- `/circuit-breaker reset all` clears all state
- Manual actions are logged

---

## 7. Integration Points

### 7.1 Router Integration

The Router must wrap routing decisions with circuit breaker:

```
Router Circuit Breaker:
  - Protects: Intent detection, workflow routing
  - Failure types: Classification errors, routing failures
  - Fallback: Default to BUILD workflow
```

### 7.2 Agent Delegation Integration

Each agent must wrap delegation calls with circuit breaker:

```
Agent Circuit Breaker Pattern:
  1. Check circuit state before delegation
  2. If OPEN, trigger fallback chain
  3. If CLOSED, execute delegation
  4. Record success/failure
  5. Update circuit state
```

### 7.3 LLM Client Integration

LLM clients must be wrapped with circuit breaker:

```
LLM Circuit Breaker Pattern:
  1. Check provider circuit state before call
  2. If OPEN, trigger model fallback
  3. If CLOSED, execute call
  4. Record success/failure/classify exception
  5. Update circuit state
```

### 7.4 Tool Execution Integration

Tools must be wrapped with circuit breaker:

```
Tool Circuit Breaker Pattern:
  1. Check tool circuit state before execution
  2. If OPEN, trigger fallback (skip tool)
  3. If CLOSED, execute tool
  4. Record success/failure
  5. Update circuit state
```

---

## 8. Out of Scope

The following are explicitly OUT OF SCOPE for Phase 2:

| Item | Reason |
|------|--------|
| Distributed state (Redis) | No distributed deployment yet |
| Metrics dashboard | Basic logging sufficient |
| Dynamic threshold adjustment | Manual configuration only |
| Cross-agent coordination | Future phase |
| AI-powered failure prediction | Future phase |
| Circuit breaker visualization | Future phase |

---

## 9. Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Async support |
| asyncio | Built-in | Concurrency |
| json | Built-in | Log file format |
| datetime | Built-in | Timestamps |

---

## 10. Acceptance Criteria

### AC-001: State Machine Works

**Given** a circuit breaker in CLOSED state,
**When** `failure_threshold` (5) failures occur,
**Then** the circuit transitions to OPEN state.

**Given** a circuit breaker in OPEN state,
**When** `wait_duration_seconds` (30) elapse,
**Then** the circuit transitions to HALF_OPEN state.

### AC-002: Fallback Chain Executes

**Given** a circuit breaker in OPEN state,
**When** a request is made,
**Then** the fallback chain is triggered.

**Given** fallback chain triggered,
**When** fallback options are available,
**Then** fallbacks are executed in priority order.

### AC-003: Exception Classification Works

**Given** a `RateLimitError` exception,
**When** processed by circuit breaker,
**Then** it is counted as a failure.

**Given** a `ValueError` exception,
**When** processed by circuit breaker,
**Then** it is NOT counted as a failure.

### AC-004: Logging Works

**Given** a circuit breaker state transition,
**When** the transition occurs,
**Then** the transition is logged to `.opencode/logs/circuit-breakers.json`.

**Given** a fallback is triggered,
**When** the fallback executes,
**Then** the fallback is logged.

### AC-005: Manual Override Works

**Given** circuit breakers in any state,
**When** `/circuit-breaker close all` is executed,
**Then** all circuits transition to CLOSED state.

### AC-006: Per-Agent Isolation

**Given** Builder circuit in OPEN state,
**When** Janitor receives a request,
**Then** Janitor circuit is unaffected (CLOSED).

---

## 11. Files to Create

| File | Type | Purpose |
|------|------|---------|
| `REQ-NSO-Circuit-Breaker.md` | Requirements | This document |
| `TECHSPEC-NSO-Circuit-Breaker.md` | Tech Spec | Architecture & implementation |
| `skills/circuit-breaker/SKILL.md` | Skill | Agent skill documentation |
| `skills/circuit-breaker/circuit_breaker.py` | Code | Core implementation |
| `tests/test_circuit_breaker.py` | Tests | Unit tests |
| `logs/circuit-breakers.json` | Log | State transition logs |

---

## 12. References

### Internal
- `.opencode/context/03_proposals/RFC-Circuit-Breaker-Pattern-NSO.md`
- `.opencode/docs/workflows/BUILD.md`
- `.opencode/AGENTS.md`

### External
- Microsoft Agent Framework: Middleware pattern for resilience
- LangGraph: `CircuitBreaker` utility with states CLOSED/OPEN/HALF_OPEN
- Resilience4j: Circuit breaker implementation reference

---

## 13. Approval

| Phase | Approver | Status | Date |
|-------|----------|--------|------|
| Discovery (REQ) | User | PENDING | 2026-02-07 |
| Architecture (TECHSPEC) | User | PENDING | TBD |
| Implementation | Oracle | PENDING | TBD |
| Validation | Janitor | PENDING | TBD |

---

**Document Status:** Ready for User Approval  
**Next Step:** User approves → Architecture Phase (TECHSPEC-NSO-Circuit-Breaker.md)