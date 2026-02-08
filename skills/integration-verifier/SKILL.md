---
name: integration-verifier
description: Verify integration tests and E2E scenarios, detect failures, and provide rollback options
agent: Janitor
workflow: BUILD
phase: Validation
keywords: [integration, e2e, verification, rollback, test]
---

# Integration-Verifier Skill

**Agent:** The Janitor
**Workflow:** BUILD
**Phase:** Validation

## Purpose

Verify that integration tests and E2E scenarios pass successfully. Detect various failure types (network, response, auth, timeout) and provide rollback options when failures occur.

## When to Use

Use this skill during the **Validation phase** of the BUILD workflow when:
- Integration tests need to be run and verified
- E2E scenarios need to be executed
- System behavior needs validation across components
- Rollback decisions need to be made after failures

## Inputs

- Approved Tech Spec (TECHSPEC-*.md)
- Implemented code and unit tests
- Integration test definitions
- E2E scenario definitions
- Previous validation results (lint, type, pytest)

## Outputs

- Integration test results (PASS/FAIL)
- E2E scenario results (PASS/FAIL)
- Failure detection and classification
- Rollback recommendation (if needed)
- Validation report

## Skills Used

- `traceability-linker` - Link integration tests to requirements
- `silent-failure-hunter` - Detect silent failures in integration

## Contract

```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  phase: VALIDATION
  agent: Janitor
  skill: integration-verifier
  integration_status: pending
  e2e_status: pending
  failures_detected: []
  rollback_recommended: false
  previous_phase: IMPLEMENTATION
  next_phase: CLOSURE
```

## Usage

### Basic Integration Verification

```python
# Import the verification module
from .opencode.skills.integration-verifier.scripts.e2e_runner import E2ERunner

# Run integration tests
runner = E2ERunner()
results = runner.run_integration_tests()

# Check results
if results.all_passed:
    print("✅ Integration tests PASSED")
else:
    print(f"❌ Integration tests FAILED: {results.failed_count} failures")
    for failure in results.failures:
        print(f"  - {failure.type}: {failure.message}")
```

### E2E Scenario Execution

```python
# Run E2E scenarios
runner = E2ERunner()
scenarios = runner.load_scenarios("path/to/scenarios.yaml")
results = runner.run_scenarios(scenarios)

# Generate report
report = runner.generate_report(results)
print(report.summary)
```

### Failure Detection

```python
from .opencode.skills.integration-verifier.scripts.failure_detector import FailureDetector

detector = FailureDetector()

# Detect and classify failures
failures = detector.analyze_results(test_results)
for failure in failures:
    print(f"[{failure.severity}] {failure.type}: {failure.message}")
    print(f"  Recommendation: {failure.recommendation}")
```

### Rollback Decision

```python
# Get rollback options
rollback = RollbackOptions()
options = rollback.evaluate(test_results, failures)

if options.rollback_recommended:
    print("⚠️ Rollback recommended!")
    for option in options.options:
        print(f"  - {option.description} (risk: {option.risk_level})")
```

## Failure Types

| Type | Description | Recommendation |
|------|------------|---------------|
| NETWORK | Network connectivity failure | Check services, DNS, firewall |
| RESPONSE | Invalid or unexpected response | Check API contracts, data format |
| AUTH | Authentication/authorization failure | Check credentials, tokens, permissions |
| TIMEOUT | Request timed out | Check performance, timeouts, resources |
| DEPENDENCY | Dependency service unavailable | Check service health, dependencies |
| DATA | Data validation failure | Check data format, constraints |

## Integration with BUILD Workflow

1. **Input:** Unit tests have passed, lint/type checks passed
2. **Action:** Run integration tests and E2E scenarios
3. **Detection:** Classify any failures
4. **Decision:** Proceed or rollback based on results
5. **Output:** Validation report for Closure phase

## Examples

### Complete Validation Flow

```python
def validate_integration():
    runner = E2ERunner()
    detector = FailureDetector()
    rollback = RollbackOptions()

    # Step 1: Run integration tests
    int_results = runner.run_integration_tests()

    # Step 2: Run E2E scenarios
    e2e_results = runner.run_e2e_scenarios()

    # Step 3: Combine results
    all_results = combine_results(int_results, e2e_results)

    # Step 4: Detect failures
    failures = detector.analyze(all_results)

    # Step 5: Evaluate rollback
    rollback_options = rollback.evaluate(all_results, failures)

    # Step 6: Generate report
    report = {
        "integration_passed": int_results.all_passed,
        "e2e_passed": e2e_results.all_passed,
        "failures": [f.to_dict() for f in failures],
        "rollback_recommended": rollback_options.rollback_recommended,
        "recommendation": rollback_options.recommended_option,
    }

    return report
```

## Files

- `scripts/e2e_runner.py` - E2E scenario execution
- `scripts/failure_detector.py` - Failure detection and classification
- `references/rollback_options.md` - Rollback decision tree
- `tests/` - Unit tests

## See Also

- BUILD Workflow: `.opencode/docs/workflows/BUILD.md`
- Validation Gate: `.opencode/scripts/validate.py`
- Gate Enforcement: `.opencode/scripts/gate_check.py`
