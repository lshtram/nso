---
name: code-review-patterns
description: Perform structured reviews with confidence thresholds.
---

# Role
Janitor or Builder

# Trigger
- When asked to review changes before merge.

# Inputs
- Diff, requirements, tests, and docs.

# Outputs
- Review summary with confidence score and required fixes.

# Steps
1. Validate traceability tags for new code/tests.
2. Check correctness, edge cases, and error handling.
3. Verify tests cover requirements.
4. Assign a confidence score and list fixes if below threshold.
