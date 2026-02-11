---
name: rm-multi-perspective-audit
description: Audit requirements from multiple stakeholder perspectives.
---

# Role
Oracle

# Trigger
- Before finalizing `REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`).

# Inputs
- Draft `docs/requirements/REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`).

# Outputs
- Added “Risks & Mitigations” section in requirements.

# Steps
1. Review requirements as:
   - User
   - Security engineer
   - SRE
   - Legal/compliance
2. Identify gaps, risks, and missing constraints.
3. Append “Risks & Mitigations” to the requirements document.
