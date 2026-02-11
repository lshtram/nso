---
name: rm-validate-intent
description: Verify drafted requirements match the user's stated intent.
---

# Role
Oracle

# Trigger
- Before finalizing `REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`).

# Inputs
- Conversation history.
- Draft `docs/requirements/REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`).

# Outputs
- Updated requirements that align with user intent.
- List of mismatches or assumptions removed.

# Steps
1. Re-read the original request and clarifications.
2. Compare the draft requirements to the user's intent.
3. Remove hallucinated scope and add missing constraints.
4. Summarize the alignment changes in the requirements notes.
