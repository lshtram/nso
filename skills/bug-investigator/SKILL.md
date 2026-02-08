---
name: bug-investigator
description: Investigate bugs with LOG FIRST approach, regression tests, and variant coverage.
---

# Role
Debug Agent

# Trigger
- User invokes DEBUG workflow.
- Router routes DEBUG intent to bug-investigator.

# Description
The Bug-Investigator skill provides systematic debugging capabilities following the LOG FIRST approach. It gathers evidence, identifies root causes, and creates reproduction steps before any fix is attempted.

# Agent Capabilities
- **Evidence Collection:** Gather logs, errors, stack traces systematically
- **Root Cause Analysis:** Identify underlying causes using evidence
- **Reproduction Steps:** Create minimal steps to reproduce the issue
- **Regression Test Guidance:** Help write tests that prevent future occurrences
- **Variant Coverage:** Ensure edge cases and non-default scenarios are considered

# Inputs
- User description of the issue
- Logs, error messages, stack traces
- Existing memory (patterns.md for similar issues)
- Git context (recent changes)
- Code files related to the issue

# Outputs
- Evidence summary
- Root cause hypothesis
- Reproduction steps
- Regression test requirements
- Router contract (YAML)

# Steps

## 1. LOAD Memory
Read `.opencode/context/01_memory/patterns.md` for similar issues.
```
patterns = load_memory_file("patterns.md")
similar_issues = find_similar_issues(patterns, issue_description)
```

## 2. Gather Evidence
Collect all available evidence systematically:
- Error messages and exceptions
- Stack traces (full traceback)
- Log files and outputs
- User reproduction steps
- Git history (recent changes)
- Test failures

**Evidence Collection Checklist:**
- [ ] Error messages captured verbatim
- [ ] Full stack trace recorded
- [ ] Log files examined
- [ ] User steps documented
- [ ] Git blame checked for recent changes
- [ ] Related tests reviewed

## 3. Analyze Evidence
Group evidence by category:
- **Environment:** OS, version, configuration
- **Code:** Stack trace, line numbers, function calls
- **Data:** Input values, state at failure
- **Timing:** When failure occurred, sequence of events

Look for patterns:
- Repeated errors
- Common code paths
- Environmental factors
- Recent changes that may have introduced the issue

## 4. Formulate Root Cause Hypothesis
Create hypothesis based on evidence (NOT speculation):
```
Root Cause: [Specific cause]
Evidence: [List of supporting evidence]
Confidence: [HIGH/MEDIUM/LOW]
```

**Criteria for Root Cause:**
- Must be supported by evidence
- Must explain all symptoms
- Must be actionable (can be fixed)

## 5. Create Reproduction Steps
Write minimal steps to reproduce the issue:
```
1. [Step 1]
2. [Step 2]
...
N. [Observe failure]
```

**Reproduction Requirements:**
- Minimal (no extra steps)
- Reproducible (works consistently)
- Verifiable (can confirm fix)

## 6. Define Regression Test Requirements
Specify what tests should prevent this issue:
- Test type (unit, integration, e2e)
- Input scenarios
- Expected behavior

## 7. Output Contract
Generate YAML contract with investigation results.

# Output Contract Template
```yaml
router_contract:
  status: COMPLETE
  workflow: DEBUG
  phase: INVESTIGATION
  evidence_collected:
    - "Error: Connection refused in auth.py:42"
    - "Stack trace: TimeoutException at network.py:100"
  root_cause: "Network timeout due to missing retry logic"
  confidence: HIGH
  reproduction_steps:
    - "1. Start the server"
    - "2. Send 100 concurrent requests"
    - "3. Observe connection refused errors"
  regression_test_requirements:
    type: "integration"
    scenarios:
      - "Concurrent requests exceed pool size"
      - "Network timeout under load"
    expected_behavior: "Graceful degradation with retry"
  similar_issues_in_memory:
    - "Issue: Auth timeout in PR #123"
    - "Fix: Added exponential backoff"
  next_phase: FIX
```

# LOG FIRST Protocol

The LOG FIRST protocol is mandatory for all investigations:

1. **L**ist all evidence (errors, logs, traces)
2. **O**rganize evidence by category
3. **G**roup related evidence
4. **F**ormulate hypothesis from evidence
5. **I**dentify root cause
6. **R**eproduce the issue
7. **S**pecify fix requirements
8. **T**est the hypothesis

**Anti-Pattern (NOT ALLOWED):**
- Guessing the cause before gathering evidence
- Implementing fixes without reproduction steps
- Skipping evidence collection

# Variant Coverage Requirements

Ensure investigation considers:
- **Empty/null values:** What happens with empty input?
- **Boundary conditions:** Edge cases and limits
- **Concurrency:** Race conditions, thread safety
- **Network issues:** Timeouts, partitions, retries
- **Error states:** Failure modes and recovery
- **Load conditions:** Performance under stress

# Memory Integration

**Before Investigation:**
```python
patterns = read_file(".opencode/context/01_memory/patterns.md")
similar_issues = extract_gotchas(patterns)
```

**After Investigation (to be done in Closure):**
```python
new_gotcha = """
## <Date>: <Issue Title>
- **Issue:** <Description>
- **Root Cause:** <Root cause>
- **Fix:** <How it was fixed>
- **Reference:** <Commit/PR>
"""
append_to_patterns(new_gotcha)
```

# Examples

## Example 1: Network Timeout Issue

**User Report:** "Login fails under load with timeout errors"

**Investigation:**
1. Evidence:
   - Error: "Connection refused" in auth.py:42
   - Stack trace shows TimeoutException
   - Logs show pool exhaustion at 100 connections
2. Root cause: Connection pool size too small for concurrent users
3. Reproduction: Send 100+ concurrent login requests
4. Regression test: Test login with 150 concurrent requests

## Example 2: Data Corruption Issue

**User Report:** "User profiles showing wrong data"

**Investigation:**
1. Evidence:
   - Error: None (silent failure)
   - Logs show race condition in user_store.py:88
   - Recent commit #456 added async code
2. Root cause: Race condition in async user update
3. Reproduction: Two concurrent updates to same user
4. Regression test: Concurrent user profile updates

# Error Handling

If evidence collection fails:
1. Try alternative sources (different logs, instruments)
2. Ask user for additional information
3. Document what evidence was missing
4. Proceed with best hypothesis given available evidence

If root cause cannot be determined:
1. Document all attempted approaches
2. Suggest areas for further investigation
3. Propose potential causes with confidence levels

# Confidence Scoring

Confidence in root cause hypothesis:

| Level | Criteria |
|-------|----------|
| HIGH | Evidence from multiple sources, reproducible |
| MEDIUM | Evidence from one source, logical inference |
| LOW | Speculation without direct evidence |

# Best Practices

1. **Always gather evidence first** - Never hypothesize without data
2. **Document everything** - Evidence, hypotheses, attempts
3. **Reproduce before fixing** - Verify you understand the problem
4. **Write regression tests** - Prevent the issue from recurring
5. **Consider variants** - Edge cases and non-default scenarios
6. **Update memory** - Share findings with future investigators

# Anti-Patterns

- ❌ Guessing the cause before looking at evidence
- ❌ Implementing fixes without reproduction steps
- ❌ Skipping regression tests
- ❌ Ignoring variant coverage
- ❌ Not checking memory for similar issues
- ❌ Failing to update patterns.md after fix
