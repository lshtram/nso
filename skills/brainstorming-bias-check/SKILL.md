---
name: brainstorming-bias-check
description: Detect cognitive bias in plans and architecture drafts.
---

# Role
Oracle

# Trigger
- Reviewing a flight plan or architecture draft (TECHSPEC-<Feature-Name>.md).

# Inputs
- Draft `flight_plan.json` or `TECHSPEC-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/tech_spec.md`).

# Outputs
- Bias findings reported in the review gate notes.

# Steps
1. Read the plan/spec end-to-end.
2. Check for:
   - Complexity bias
   - Confirmation bias
   - Sunk cost fallacy
   - Novelty bias
3. Report findings and required adjustments before approval.
