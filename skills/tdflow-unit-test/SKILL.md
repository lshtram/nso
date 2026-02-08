---
name: tdflow-unit-test
description: Enforce the Test → Code → Verify micro-loop for development tasks.
---

# Role
Builder

# Trigger
- Start of any coding task.

# Inputs
- `flight_plan.json` step or task description.

# Outputs
- Failing test first, then passing implementation.
- Evidence of test execution.

# Steps
1. Read the task scope and expected behavior.
2. Write a failing test that captures the requirement.
3. Run the test (must fail).
4. Implement the minimal code to pass.
5. Re-run tests (must pass).
6. Refactor and keep changes minimal.
