# Requirements: NSO Intelligent Router

## 1. Background
CC10x uses an Intelligent Router as the **entry point** for all development tasks. It automatically detects user intent via keywords/patterns and routes to the appropriate workflow (BUILD/DEBUG/REVIEW/PLAN). NSO currently lacks automatic routing; users manually invoke commands.

We will implement a **Minimum Viable Router** that provides intent detection, workflow routing, and Router Contracts, while deferring advanced features (parallel execution, circuit breaker, SKILL_HINTS) to a later phase.

## 2. Goals
1) **Intent Detection:** Automatically detect user intent from natural language requests.
2) **Workflow Routing:** Route requests to BUILD/DEBUG/REVIEW/PLAN workflows based on intent.
3) **Memory Integration:** LOAD memory at router start to inform routing decisions.
4) **Router Contracts:** Agents output structured YAML contracts for validation.
5) **Task Hierarchy:** Create a human-readable task breakdown for each workflow.

## 3. Non-Goals
- No parallel execution coordination (deferred to Phase 2).
- No circuit breaker for remediation attempts (deferred to Phase 2).
- No SKILL_HINTS bridge (deferred to Phase 2).
- No orphan task detection (deferred to Phase 2).
- No auto-heal missing sections (deferred to Phase 2).
- No MCP integration in this phase.

## 4. Router Workflows (Authoritative)

### 4.1 BUILD Workflow (Default)
**Trigger Keywords:** build, implement, create, make, write, add, develop, code, feature, component, app, application

**Agent Chain:** `Oracle (Discovery) → Builder (Implementation) → [Code-Reviewer ∥ Silent-Failure-Hunter] → Integration-Verifier`

**Key Features:** TDD enforcement, parallel review (future), E2E verification (future)

### 4.2 DEBUG Workflow
**Trigger Keywords:** debug, fix, error, bug, broken, troubleshoot, issue, problem, doesn't work, failure

**Agent Chain:** `Bug-Investigator → Code-Reviewer → Integration-Verifier`

**Key Features:** LOG FIRST, regression tests, variant coverage

### 4.3 REVIEW Workflow
**Trigger Keywords:** review, audit, check, analyze, assess, "what do you think", "is this good", evaluate

**Agent Chain:** `Code-Reviewer (single agent)`

**Key Features:** Confidence scoring (≥80), two-stage review, CRITICAL issues block shipping

### 4.4 PLAN Workflow
**Trigger Keywords:** plan, design, architect, roadmap, strategy, spec, "before we build", "how should we"

**Agent Chain:** `Planner (single agent)`

**Key Features:** Research if needed, confidence scoring, phased plans

## 5. Functional Requirements

### FR-1: Intent Detection
The router must detect intent from user requests using keyword/pattern matching.

**Keywords:**
- BUILD: build, implement, create, make, write, add, develop, code, feature, component, app, application
- DEBUG: debug, fix, error, bug, broken, troubleshoot, issue, problem, doesn't work, failure
- REVIEW: review, audit, check, analyze, assess, "what do you think", "is this good", evaluate
- PLAN: plan, design, architect, roadmap, strategy, spec, "before we build", "how should we"

**Acceptance:**
- Router correctly categorizes requests into one of 4 workflows.
- Unknown intent defaults to BUILD workflow.

### FR-2: Workflow Routing
The router must output the selected workflow based on detected intent.

**Acceptance:**
- Router outputs selected workflow (BUILD/DEBUG/REVIEW/PLAN).
- Router logs the routing decision for traceability.

### FR-3: Memory LOAD Protocol
At router start, the router must LOAD existing memory files.

**Acceptance:**
- Router reads `.opencode/context/01_memory/active_context.md`
- Router reads `.opencode/context/01_memory/patterns.md`
- Router reads `.opencode/context/01_memory/progress.md`
- Router uses memory context to inform routing decisions (e.g., check if similar work is in progress).

### FR-4: Router Contract System
Agents must output a structured YAML contract after workflow completion.

**Contract Format (YAML):**
```yaml
router_contract:
  status: COMPLETE | IN_PROGRESS | BLOCKED | NEEDS_REVIEW
  workflow: BUILD | DEBUG | REVIEW | PLAN
  tasks_completed: int
  tasks_total: int
  evidence:
    - type: test | review | verification
      result: PASS | FAIL
      details: str
  next_action: str
```

**Acceptance:**
- Agents output YAML contracts per this format.
- Router validates contract completeness before allowing progression.

### FR-5: Task Hierarchy Creation
The router must create a human-readable task breakdown for each workflow.

**Acceptance:**
- Router outputs a list of tasks for the selected workflow.
- Tasks are scoped to 2-5 minute actions.
- Dependencies between tasks are documented.

### FR-6: Router Command
Add a `/router` command that activates the router for any development task.

**Acceptance:**
- `/router "Your request here"` triggers intent detection and routing.
- Router outputs selected workflow and task breakdown.

### FR-7: Router Skill
Create a `router` skill that encapsulates all router functionality.

**Skill Structure:**
```
.opencode/skills/router/
  ├── SKILL.md
  └── references/
      ├── keywords.md
      └── contracts.md
```

**Acceptance:**
- Skill exists and is discoverable.
- Skill can be invoked manually or via command.

## 6. Constraints & Standards
- All router artifacts must remain under `.opencode/`.
- Follow the coding patterns in `.opencode/context/00_meta/patterns.md`.
- No new libraries without an approved RFC.
- Memory files follow existing structure (no changes).

## 7. Acceptance Criteria
1) Router correctly detects intent for BUILD/DEBUG/REVIEW/PLAN.
2) Router outputs selected workflow and task breakdown.
3) Router LOADs memory files at start.
4) Agents output YAML contracts per spec.
5) `/router` command exists and works.
6) Router skill is discoverable and functional.
7) Validation harness passes (lint, type, pytest, naming).

## 8. Risks & Open Issues
- **Ambiguous intent:** Some requests may map to multiple workflows. Default to BUILD unless DEBUG/REVIEW/PLAN keywords are explicit.
- **Memory overhead:** Loading memory adds latency but is required for context.
- **Future extensibility:** Defer advanced features (parallel, circuit breaker) to keep MVP simple.

## 9. Risks & Mitigations (Multi-Perspective Audit)
### User Perspective
- **Risk:** Router misclassifies intent, leading to wrong workflow.  
  **Mitigation:** Default to BUILD workflow; allow user to override via explicit workflow flag (e.g., `/router --workflow=debug`).

### Security Perspective
- **Risk:** Malicious input to router could cause unexpected behavior.  
  **Mitigation:** Input sanitization; keyword-based matching only (no eval/exec).

### SRE Perspective
- **Risk:** Router failure blocks all development work.  
  **Mitigation:** Fallback to BUILD workflow if router fails; log errors for debugging.

### Legal/Compliance Perspective
- **Risk:** None identified. Router is internal orchestration only.

## 10. Intent Alignment Notes (rm-validate-intent)
- Confirmed user intent: MVP router with intent detection, routing, memory load, and contracts.
- Advanced features (parallel, circuit breaker) explicitly deferred.
- Command `/router` added for manual invocation.
- Skill structure follows Anthropic standard (SKILL.md + references/).
