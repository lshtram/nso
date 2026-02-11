---
name: rm-conflict-resolver
description: Detect requirement conflicts with existing architecture.
---

# Role
Oracle

# Trigger
- Before finalizing `TECHSPEC-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/tech_spec.md`).

# Inputs
- `docs/requirements/REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`)
- `docs/architecture/` docs
- Codebase keywords related to the new requirements

# Outputs
- Conflict analysis notes in `flight_plan.json` or `TECHSPEC-<Feature-Name>.md`.
- Two resolution options for each conflict found.

# Steps
1. Load requirements and relevant architecture docs.
2. Use the Grep tool to search for related keywords in the codebase.
3. Identify conflicts (functional, data model, performance).
4. Record options:
   - Option A: Adjust requirement.
   - Option B: Refactor existing system.
