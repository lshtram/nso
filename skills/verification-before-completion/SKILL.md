---
name: verification-before-completion
description: Require evidence-based checks before declaring completion.
---

# Role
Builder

# Trigger
- Before reporting a task as complete.

# Inputs
- Updated code and tests.

# Outputs
- Verification evidence (tests, lint, validate harness).

# Steps
1. Run relevant unit tests.
2. Run `.opencode/scripts/validate.py --full` from repo root.
3. Confirm expected artifacts exist (docs, skills, etc.).
4. Summarize verification results with exit status.
