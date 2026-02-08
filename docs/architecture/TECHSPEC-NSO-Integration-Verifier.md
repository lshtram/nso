# Tech Spec: NSO Integration-Verifier

## 1. Scope
Implement an Integration-Verifier skill that performs end-to-end (E2E) validation with exit code evidence, failure detection, and rollback decision tree. The skill is used by the Janitor during the BUILD workflow's Validation phase.

## 2. Architecture Overview

### 2.1 Skill Directory Structure
```
.opencode/skills/integration-verifier/
  ├── SKILL.md                    # Main skill entry point
  ├── scripts/
  │   └── e2e_runner.py          # E2E scenario execution logic
  │   └── failure_detector.py     # Failure detection logic
  └── references/
      └── rollback_options.md     # Rollback decision tree
```

### 2.2 Integration Flow
```
Builder (Implementation)
    ↓
Janitor (Validation)
    ↓
┌─────────────────────────────────────────┐
│ Integration-Verifier Skill               │
│ - Define E2E scenarios                  │
│ - Execute scenarios                     │
│ - Detect failures                      │
│ - Present rollback options              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Router Contract Output                  │
│ - STATUS: PASS | FAIL                  │
│ - scenarios_passed/failed              │
│ - rollback_decision                    │
└─────────────────────────────────────────┘
    ↓
If PASS → Librarian (Closure)
If FAIL → Oracle/User selects rollback option
```

## 3. Component Specification

### 3.1 Skill Entry Point: SKILL.md

**File:** `.opencode/skills/integration-verifier/SKILL.md`

```yaml
---
name: integration-verifier
description: Perform end-to-end validation with exit code evidence, failure detection, and rollback decision tree.
---

# Role
Verification Agent (used by Janitor)

# Trigger
- Janitor invokes during BUILD Validation phase when E2E testing is needed.
- User explicitly requests E2E verification.

# Inputs
- Feature context (what was implemented)
- Test files or scripts for E2E scenarios
- Any configuration files (env vars, endpoints)

# Outputs
- E2E execution report (PASS/FAIL)
- Failure details (type, evidence)
- Rollback options presented
- Router contract YAML

# Steps
## 1. LOAD Context
READ feature context and test files.

## 2. DEFINE E2E Scenarios
Identify integration scenarios:
- API endpoint calls
- Database queries
- Service interactions
- Authentication flows

## 3. EXECUTE Scenarios
Run each scenario and capture exit codes.

## 4. DETECT Failures
Analyze results for:
- Network failures
- Invalid responses
- Authentication/authorization expiry
- Timeout scenarios

## 5. REPORT Results
Generate report with:
- Scenarios passed/failed
- Failure details
- Evidence (exit codes, error messages)

## 6. ROLLBACK Decision Tree (if FAIL)
Present options:
- Create Fix Task (return to DEBUG)
- Revert Branch (git revert/reset)
- Document & Continue (log failure)

## 7. OUTPUT Router Contract
Generate YAML contract with results.
```

### 3.2 E2E Runner Script

**File:** `.opencode/skills/integration-verifier/scripts/e2e_runner.py`

```python
"""
E2E Scenario Runner - Executes integration scenarios and captures exit codes.

@implements: FR-1, FR-2
"""

from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class ScenarioResult:
    """Result of a single E2E scenario."""
    name: str
    passed: bool
    exit_code: int
    stdout: str
    stderr: str
    duration_seconds: float


@dataclass
class E2EResult:
    """Result of E2E scenario execution."""
    scenarios_total: int
    scenarios_passed: int
    scenarios_failed: int
    results: list[ScenarioResult]
    duration_seconds: float


def find_scenario_files(feature_path: Path) -> list[Path]:
    """Find E2E test files in the feature directory."""
    patterns = [
        "**/test_e2e*.py",
        "**/e2e*.py",
        "**/*_e2e_test.py",
        "**/integration*.py",
    ]
    
    scenarios: list[Path] = []
    for pattern in patterns:
        scenarios.extend(feature_path.glob(pattern))
    
    return sorted(set(scenarios))


def run_scenario(scenario_path: Path, timeout: int = 60) -> ScenarioResult:
    """
    Execute a single E2E scenario.
    
    Returns:
        ScenarioResult with pass/fail, exit code, output, and duration.
    """
    import time
    start = time.time()
    
    try:
        result = subprocess.run(
            [sys.executable, str(scenario_path)],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        duration = time.time() - start
        
        return ScenarioResult(
            name=str(scenario_path),
            passed=result.returncode == 0,
            exit_code=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
            duration_seconds=duration,
        )
    except subprocess.TimeoutExpired:
        duration = time.time() - start
        return ScenarioResult(
            name=str(scenario_path),
            passed=False,
            exit_code=-1,
            stdout="",
            stderr=f"Timeout after {timeout} seconds",
            duration_seconds=duration,
        )
    except Exception as e:
        duration = time.time() - start
        return ScenarioResult(
            name=str(scenario_path),
            passed=False,
            exit_code=-2,
            stdout="",
            stderr=str(e),
            duration_seconds=duration,
        )


def run_e2e_scenarios(feature_path: Path, timeout: int = 60) -> E2EResult:
    """
    Run all E2E scenarios in the feature directory.
    
    Args:
        feature_path: Path to the feature implementation
        timeout: Timeout for each scenario in seconds
    
    Returns:
        E2EResult with all scenario results
    """
    scenarios = find_scenario_files(feature_path)
    
    if not scenarios:
        # No E2E scenarios found - return empty result
        return E2EResult(
            scenarios_total=0,
            scenarios_passed=0,
            scenarios_failed=0,
            results=[],
            duration_seconds=0.0,
        )
    
    import time
    start = time.time()
    
    results: list[ScenarioResult] = []
    for scenario in scenarios:
        result = run_scenario(scenario, timeout)
        results.append(result)
    
    duration = time.time() - start
    
    passed = sum(1 for r in results if r.passed)
    failed = sum(1 for r in results if not r.passed)
    
    return E2EResult(
        scenarios_total=len(results),
        scenarios_passed=passed,
        scenarios_failed=failed,
        results=results,
        duration_seconds=duration,
    )


# CLI for testing
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Run E2E scenarios")
    parser.add_argument("feature_path", type=Path, help="Path to feature directory")
    parser.add_argument("--timeout", type=int, default=60, help="Timeout per scenario")
    
    args = parser.parse_args()
    
    result = run_e2e_scenarios(args.feature_path, args.timeout)
    
    print(f"E2E Results:")
    print(f"  Total: {result.scenarios_total}")
    print(f"  Passed: {result.scenarios_passed}")
    print(f"  Failed: {result.scenarios_failed}")
    print(f"  Duration: {result.duration_seconds:.2f}s")
    
    for r in result.results:
        status = "PASS" if r.passed else "FAIL"
        print(f"\n  [{status}] {r.name}")
        print(f"    Exit code: {r.exit_code}")
        if r.stderr:
            print(f"    Error: {r.stderr[:100]}...")
```

### 3.3 Failure Detector Script

**File:** `.opencode/skills/integration-verifier/scripts/failure_detector.py`

```python
"""
Failure Detector - Identifies and categorizes E2E failures.

@implements: FR-3
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class FailureType(Enum):
    """Types of E2E failures."""
    NETWORK = "network"
    RESPONSE = "response"
    AUTH = "auth"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"


@dataclass
class Failure:
    """A detected failure."""
    type: FailureType
    details: str
    evidence: str
    scenario: str


FAILURE_PATTERNS: dict[FailureType, list[str]] = {
    FailureType.NETWORK: [
        "Connection refused",
        "Network is unreachable",
        "No route to host",
        "Connection reset by peer",
        "socket hang up",
        "EHOSTUNREACH",
        "ENETUNREACH",
    ],
    FailureType.RESPONSE: [
        "404 Not Found",
        "500 Internal Server Error",
        "400 Bad Request",
        "403 Forbidden",
        "Invalid JSON",
        "Malformed response",
        "Response does not match",
    ],
    FailureType.AUTH: [
        "401 Unauthorized",
        "403 Forbidden",
        "Authentication required",
        "Token expired",
        "Invalid credentials",
        "Bearer token",
        "JWT expired",
    ],
    FailureType.TIMEOUT: [
        "Connection timed out",
        "Request timeout",
        "Timeout reached",
        "504 Gateway Timeout",
        "timed out",
    ],
}


def detect_failure_type(error_message: str) -> FailureType:
    """
    Detect the type of failure based on error message.
    
    Returns:
        FailureType enum value
    """
    error_lower = error_message.lower()
    
    for failure_type, patterns in FAILURE_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in error_lower:
                return failure_type
    
    return FailureType.UNKNOWN


def analyze_failures(scenario_results: list) -> list[Failure]:
    """
    Analyze scenario results and detect failures.
    
    Args:
        scenario_results: List of ScenarioResult from e2e_runner
    
    Returns:
        List of Failure objects
    """
    failures: list[Failure] = []
    
    for result in scenario_results:
        if not result.passed:
            # Analyze the error
            error_message = result.stderr or result.stdout
            failure_type = detect_failure_type(error_message)
            
            failure = Failure(
                type=failure_type,
                details=f"Scenario '{result.name}' failed with {failure_type.value} error",
                evidence=f"Exit code: {result.exit_code}\nError: {error_message[:500]}",
                scenario=result.name,
            )
            failures.append(failure)
    
    return failures


def categorize_failures(failures: list[Failure]) -> dict[FailureType, list[Failure]]:
    """
    Categorize failures by type.
    
    Returns:
        Dictionary mapping FailureType to list of Failures
    """
    categorized: dict[FailureType, list[Failure]] = {}
    
    for failure in failures:
        if failure.type not in categorized:
            categorized[failure.type] = []
        categorized[failure.type].append(failure)
    
    return categorized
```

### 3.4 Rollback Options Reference

**File:** `.opencode/skills/integration-verifier/references/rollback_options.md`

```markdown
# Rollback Decision Tree

When E2E verification fails, present these options to the Oracle/User:

## Option 1: Create Fix Task
**Action:** Return to DEBUG workflow
**When to use:** The failure is a real bug that needs fixing
**Steps:**
1. Document the failure in memory
2. Create a new task for the bug fix
3. Run DEBUG workflow

## Option 2: Revert Branch
**Action:** Git revert or reset
**When to use:** The failure is blocking and you want to undo changes
**Steps:**
1. Identify the problematic commit(s)
2. Revert or reset to a known good state
3. Verify E2E passes after revert

## Option 3: Document & Continue
**Action:** Log the failure and proceed
**When to use:** The failure is a known issue, non-blocking, or environment-specific
**Steps:**
1. Document the failure in memory (patterns.md - Gotchas)
2. Add to progress.md (deferred items)
3. Proceed with deployment (if other checks pass)

## Decision Criteria

| Scenario | Recommended Option |
|----------|-------------------|
| Real bug in new code | Create Fix Task |
| Test environment issue | Document & Continue |
| Blocker that blocks release | Revert Branch |
| Known issue, can be deferred | Document & Continue |
| Integration with external service failing | Document & Continue (may be external) |
```

## 4. Janitor Integration

### 4.1 Updated BUILD Workflow - Validation Phase

**File:** `.opencode/docs/workflows/BUILD.md`

Update the Validation phase to include Integration-Verifier:

```markdown
## Phase 4: Validation (Janitor)

**Agent:** The Janitor

**Skills Used:**
- `traceability-linker` - Requirements to code mapping
- `silent-failure-hunter` - Detect silent failures
- **`integration-verifier`** - E2E scenario execution (NEW)

**Steps:**
1. RUN full validation harness: `python3 .opencode/scripts/validate.py --full`
2. **INVOKE `integration-verifier` skill** (NEW)
   - Define E2E scenarios
   - Execute scenarios
   - Detect failures
   - Present rollback options if FAIL
3. If E2E passes → Continue to Closure
4. If E2E fails → Present rollback options to Oracle/User
5. OUTPUT YAML contract

**Contract:**
```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: VALIDATION
  agent: Janitor
  lint_status: PASS
  type_status: PASS
  test_status: PASS
  naming_status: PASS
  memory_status: PASS
  integration_verifier:
    status: PASS | FAIL
    scenarios_total: int
    scenarios_passed: int
    scenarios_failed: int
    failures:
      - type: network | response | auth | timeout
        details: str
        evidence: str
  rollback_decision: CREATE_FIX_TASK | REVERT_BRANCH | DOCUMENT_AND_CONTINUE
  previous_phase: IMPLEMENTATION
  next_phase: CLOSURE | DEBUG
```
```

### 4.2 Janitor Skill Invocation

The Janitor uses the Integration-Verifier skill:

```python
# Janitor invokes Integration-Verifier
task(
    agent="Janitor",
    prompt="""
    Run E2E verification for the feature implementation.
    
    1. Define E2E scenarios based on the feature.
    2. Execute scenarios using the integration-verifier skill.
    3. Report results: PASS/FAIL, scenarios passed/failed.
    4. If FAIL, present rollback options:
       - Create Fix Task (DEBUG workflow)
       - Revert Branch (git)
       - Document & Continue
    5. Output router contract with E2E results.
    """
)
```

## 5. Memory Integration

### 5.1 Memory UPDATE Protocol

```python
def update_memory_integration(e2e_result: E2EResult, failures: list[Failure]) -> None:
    """Update memory with integration results."""
    
    # Add to patterns.md (Integration Patterns section)
    if e2e_result.scenarios_passed == e2e_result.scenarios_total:
        # All passed - add as approved pattern
        pattern_note = f"[{datetime.now().isoformat()}] E2E verification passed for feature"
    else:
        # Some failed - add to Gotchas
        pattern_note = f"[{datetime.now().isoformat()}] E2E verification failed"
        for failure in failures:
            pattern_note += f"\n  - {failure.type.value}: {failure.details}"
    
    # Add to progress.md
    progress_note = f"[{datetime.now().isoformat()}] E2E: {e2e_result.scenarios_passed}/{e2e_result.scenarios_total} passed"
```

## 6. Router Contract Output

### 6.1 Contract Format (YAML)

```yaml
router_contract:
  status: PASS | FAIL
  workflow: BUILD
  phase: VALIDATION
  agent: Janitor
  integration_verifier:
    status: PASS | FAIL
    scenarios_total: 5
    scenarios_passed: 4
    scenarios_failed: 1
    duration_seconds: 45.2
    failures:
      - type: network
        details: "Connection refused to auth service"
        evidence: |
          Exit code: 1
          Error: Connection refused in auth.py:42
    rollback_decision: CREATE_FIX_TASK | REVERT_BRANCH | DOCUMENT_AND_CONTINUE
  previous_phase: IMPLEMENTATION
  next_phase: CLOSURE | DEBUG
```

## 7. Testing Strategy

### 7.1 Unit Tests
| Test | Coverage Target |
|------|----------------|
| E2E scenario discovery | 100% |
| Scenario execution | 100% |
| Failure detection | 100% |
| Failure categorization | 100% |
| Rollback decision logic | 100% |

### 7.2 Integration Tests
| Test | Coverage Target |
|------|----------------|
| BUILD Validation with Integration-Verifier | Full path |
| Rollback decision presentation | Mocked scenarios |
| Memory update | Mocked memory files |

## 8. Validation & Acceptance
1) Integration-Verifier skill exists in `.opencode/skills/integration-verifier/`
2) Skill defines and executes E2E scenarios
3) Exit codes collected and reported
4) Rollback decision tree presented on failure
5) Integration insights added to memory
6) Janitor uses skill during Validation
7) Router contract includes E2E results
8) Validation harness passes

## 9. Risks & Mitigations
- **Complexity:** E2E scenarios may be hard to define.  
  **Mitigation:** Provide templates and examples.

- **Execution Time:** E2E tests may be slow.  
  **Mitigation:** Allow timeout configuration.

- **Environment:** E2E tests may require running services.  
  **Mitigation:** Clear documentation for test environment setup.

## 10. Architecture Review Log (Checklist)
**Simplicity:** E2E runner and failure detector are simple, focused scripts. ✔️

**Modularity:** Skills, scripts, and references are isolated. ✔️

**Abstraction Boundaries:** Integration-Verifier outputs contract; Janitor handles presentation. ✔️

**YAGNI:** No automatic rollback, no parallel execution in Phase 1. ✔️
