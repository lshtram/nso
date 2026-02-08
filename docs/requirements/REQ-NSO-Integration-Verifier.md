# Requirements: NSO Integration-Verifier

## 1. Background
CC10x includes an **integration-verifier** agent that performs end-to-end (E2E) validation with exit code evidence. It tests E2E scenarios, network failures, invalid responses, and auth expiry. It also handles rollback decisions if E2E tests fail.

NSO currently lacks E2E verification. The **Janitor** runs validation (`validate.py --full`) but does not perform dedicated E2E scenario testing.

We will implement an **Integration-Verifier skill** that the Janitor uses during the BUILD workflow's Validation phase.

## 2. Goals
1) **E2E Scenario Testing:** Verify integration between components with real-world scenarios.
2) **Exit Code Evidence:** Collect pass/fail evidence from test execution.
3) **Failure Handling:** Support rollback decision tree when E2E tests fail.
4) **Memory Integration:** Document integration insights in memory files.
5) **Janitor Integration:** The Integration-Verifier is a **skill** used by the Janitor.

## 3. Non-Goals
- No standalone Integration-Verifier agent (it's a skill used by Janitor).
- No parallel execution (deferred to Phase 2).
- No automatic rollback (manual decision tree only).
- No MCP integration in this phase.

## 4. Integration-Verifier Skill Definition

### 4.1 Skill Overview

**Name:** `integration-verifier`

**Purpose:** Perform end-to-end validation with exit code evidence.

**Used By:** The Janitor (during BUILD Validation phase)

**Trigger:** Janitor invokes during Validation phase when E2E testing is needed.

### 4.2 Key Behaviors

1. **E2E Scenario Execution**
   - Define integration scenarios (API calls, database queries, service interactions)
   - Execute scenarios and collect exit codes
   - Report PASS/FAIL for each scenario

2. **Failure Detection**
   - Network failures
   - Invalid responses
   - Authentication/authorization expiry
   - Timeout scenarios

3. **Rollback Decision Tree**
   - If E2E fails → Prompt user: Create Fix Task / Revert Branch / Document & Continue
   - Janitor presents options to Oracle/User

4. **Memory Integration**
   - Add integration insights to `patterns.md` (Integration Patterns)
   - Add verified E2E scenarios to `progress.md`

### 4.3 Skills Used
- `verification-before-completion` - Exit code evidence
- `architecture-patterns` - Integration patterns
- `debugging-patterns` - Failure diagnosis

### 4.4 Tools
- `read`, `bash`, `grep`, `glob`, `lsp`

### 4.5 Mode
READ-ONLY (no Edit tool). The skill only verifies, does not fix.

## 5. Functional Requirements

### FR-1: E2E Scenario Definition
Define integration scenarios based on the feature being verified.

**Acceptance:**
- Scenarios cover API calls, database queries, service interactions
- Scenarios are documented in a test file or script
- Scenarios can be executed with clear PASS/FAIL criteria

### FR-2: E2E Execution
Execute E2E scenarios and collect exit codes.

**Acceptance:**
- Run scenarios via bash commands
- Capture exit codes (0 = PASS, non-zero = FAIL)
- Report results for each scenario

### FR-3: Failure Detection
Identify and categorize failures.

**Acceptance:**
- Detect network failures
- Detect invalid responses
- Detect auth expiry
- Detect timeout scenarios
- Categorize failures in report

### FR-4: Rollback Decision Tree
Present rollback options when E2E fails.

**Acceptance:**
- If any scenario fails, present options:
  - **Create Fix Task:** Return to DEBUG workflow
  - **Revert Branch:** Git revert/reset
  - **Document & Continue:** Log failure and proceed
- Oracle/User selects option

### FR-5: Memory Integration
Document integration insights.

**Acceptance:**
- Add successful patterns to `patterns.md` (Integration Patterns section)
- Add failed scenarios to `patterns.md` (Gotchas section)
- Add verified E2E scenarios to `progress.md`

### FR-6: Janitor Integration
The Janitor uses the Integration-Verifier skill during Validation.

**Acceptance:**
- Janitor invokes `integration-verifier` skill
- Skill outputs E2E report with PASS/FAIL
- Janitor includes results in Validation contract

### FR-7: Router Contract Output
Generate YAML contract with E2E results.

**Contract Format:**
```yaml
router_contract:
  status: PASS | FAIL
  workflow: BUILD
  phase: VALIDATION
  agent: Janitor
  integration_verifier:
    scenarios_total: int
    scenarios_passed: int
    scenarios_failed: int
    failures:
      - type: network | response | auth | timeout
        details: str
        evidence: str
  rollback_decision: CREATE_FIX_TASK | REVERT_BRANCH | DOCUMENT_AND_CONTINUE
  next_action: str
```

## 6. Workflow Integration

### 6.1 BUILD Workflow - Validation Phase

**Current State:**
```
Builder (Implementation) → Janitor (Validation) → Librarian (Closure)
```

**With Integration-Verifier:**
```
Builder (Implementation) → Janitor (Validation with Integration-Verifier) → Librarian (Closure)
```

**Janitor Steps in Validation:**
1. Run `validate.py --full` (existing)
2. **Invoke `integration-verifier` skill** (new)
3. If E2E passes → Continue to Closure
4. If E2E fails → Present rollback options to Oracle/User

### 6.2 Decision Flow

```
E2E Results
    ↓
┌─────────────────┐
│ All PASS?       │
└─────────────────┘
    ↓ YES → Continue to Closure
    ↓ NO
┌─────────────────────────────┐
│ Present Rollback Options: │
│ - Create Fix Task (DEBUG)  │
│ - Revert Branch (Git)     │
│ - Document & Continue       │
└─────────────────────────────┘
    ↓
Oracle/User Selects Option
    ↓
Continue per selection
```

## 7. Constraints & Standards
- Integration-Verifier is a **skill** (not an agent).
- Used by Janitor during BUILD Validation phase.
- No automatic rollback (manual decision only).
- All artifacts under `.opencode/`.
- Follow coding patterns in `.opencode/context/00_meta/patterns.md`.
- No new libraries without RFC.

## 8. Acceptance Criteria
1) Integration-Verifier skill exists in `.opencode/skills/integration-verifier/`
2) Skill defines E2E scenarios and executes them
3) Exit codes collected and reported
4) Rollback decision tree presented on failure
5) Integration insights added to memory
6) Janitor uses skill during Validation
7) Router contract includes E2E results
8) Validation harness passes

## 9. Risks & Open Issues
- **Complexity:** E2E scenarios may be complex to define.
- **Execution Time:** E2E tests may be slow.
- **Environment:** E2E tests may require running services.

## 10. Risks & Mitigations (Multi-Perspective Audit)
### User Perspective
- **Risk:** E2E tests slow down the workflow.  
  **Mitigation:** Allow skipping E2E for trivial changes.

### Security Perspective
- **Risk:** E2E tests may expose credentials.  
  **Mitigation:** Use test credentials only; no production secrets.

### SRE Perspective
- **Risk:** E2E tests may fail due to environment issues.  
  **Mitigation:** Clear separation of test vs production environments.

### Legal/Compliance Perspective
- **Risk:** None identified.

## 11. Intent Alignment Notes (rm-validate-intent)
- Confirmed: Integration-Verifier is a SKILL used by Janitor.
- Confirmed: E2E scenario execution with exit code evidence.
- Confirmed: Rollback decision tree on failure.
- Confirmed: Memory integration for integration insights.
- Deferred: Parallel execution (future phase).
