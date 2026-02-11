---
name: traceability-linker
description: Ensure requirements map to implementation and tests.
---

# Role
Janitor

# Trigger
- Pre-merge review or QA gate.

# Inputs
- `docs/requirements/REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`)
- Code under `src/`
- Tests under `tests/`

# Outputs
- Table of missing `@implements` and `@verifies` tags.

# Steps
1. Extract requirement IDs from the active requirements file.
2. Use the Grep tool to find `@implements` in code and `@verifies` in tests.
3. Report any orphaned or unverified requirements.
4. Assign gaps back to Builder if needed.
