---
name: debugging-patterns
description: Apply LOG FIRST and root-cause debugging discipline.
---

# Role
Builder

# Trigger
- When diagnosing bugs or failing tests.

# Inputs
- Error output, logs, failing tests.

# Outputs
- Root-cause hypothesis and verified fix.

# Steps
1. Reproduce the issue consistently.
2. LOG FIRST: add targeted logging to observe state.
3. Form a single hypothesis and test it.
4. Change one variable at a time.
5. Verify with the original failing test.
