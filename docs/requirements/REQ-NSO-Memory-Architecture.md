# Requirements: NSO Memory Architecture

## 1. Background
CC10x uses a persistent, multi-file memory system to avoid context loss between sessions. NSO currently lacks persistent memory, causing repeated re-discovery and loss of project decisions.

We will implement a **3-file memory system** under `.opencode/`, aligned with the two-level project model.

## 2. Goals
1) Persist project context across sessions using three memory files.
2) Enforce **LOAD at start / UPDATE at end** protocol across workflows.
3) Provide an **explicit user command** to force a memory update when needed.
4) Validate memory file structure and anchors to prevent corruption.

## 3. Non-Goals
- No external MCP integration in this phase.
- No cross-repo or global memory beyond this repository.

## 4. Memory File Structure (Authoritative)
Location: `.opencode/context/01_memory/`

### 4.1 active_context.md
Required anchors:
- `## Current Focus`
- `## Decisions`
- `## Open Questions`
- `## Next Steps`

### 4.2 patterns.md
Required anchors:
- `## Conventions`
- `## Gotchas`
- `## Approved Practices`

### 4.3 progress.md
Required anchors:
- `## Verified Deliverables`
- `## Evidence Links`
- `## Deferred Items`

## 5. Functional Requirements
### FR‑1: Memory Files Exist
Create the three memory files with the required anchors.

### FR‑2: LOAD at Start Protocol
At the start of any workflow (Discovery, Architecture, Build, Debug, Review), the agent must read:
1) `active_context.md`
2) `patterns.md`
3) `progress.md`

### FR‑3: UPDATE at End Protocol
At the end of any workflow, the agent must update:
- `active_context.md` with current focus, decisions, open questions, and next steps.
- `patterns.md` with reusable conventions and gotchas.
- `progress.md` with verified deliverables and evidence.

### FR‑4: Automatic Update Points
Memory updates must occur automatically at these points:

1. **End of Discovery Phase** (requirements approved)
2. **End of Architecture Phase** (tech spec approved)
3. **End of Builder Implementation** (tests passed)
4. **End of Debug Workflow** (root cause confirmed + regression test)
5. **End of Review Workflow** (review complete)

### FR‑4b: Mid-Workflow Pattern Capture
For Self-Improvement Automation (future feature):
- Update patterns.md Gotchas section when issues are discovered mid-workflow
- Update patterns.md Conventions when new patterns emerge mid-workflow
- Throttle updates to prevent token waste (e.g., batch or rate-limit)
- Document trigger conditions:
  - Repeated similar issue (3+ occurrences)
  - Critical naming/pattern violation discovered
  - Integration issue affecting 2+ workflows

### FR‑5: User-Initiated Update Command
Provide a user command (skill) to force a memory update on demand (e.g., `/memory-update`).

### FR‑6: Memory Validation
Add a validator (script or skill) that checks:
- Memory files exist
- Required anchors present
- No duplicate anchors
- No empty sections (optional warning)

## 6. Constraints & Standards
- All files must remain under `.opencode/`.
- Follow the coding patterns in `.opencode/context/00_meta/patterns.md`.
- No new libraries without an approved RFC.

## 7. Acceptance Criteria
1) Memory files exist with required anchors.
2) Automatic LOAD/UPDATE protocol documented and enforced.
3) User command for manual update exists.
4) Validator passes on initial state.

## 8. Risks & Open Issues
- Over‑eager updates may add noise if not scoped.
- Requires clear rules for what counts as a “verified deliverable.”

## 9. Risks & Mitigations (Multi‑Perspective Audit)
### User Perspective
- **Risk:** Memory updates feel intrusive or noisy.  
  **Mitigation:** Restrict automatic updates to explicit workflow end points; keep sections concise.

### Security Perspective
- **Risk:** Sensitive data could be stored in memory files.  
  **Mitigation:** Add a rule to exclude secrets/credentials/PII from memory; redaction if discovered.

### SRE Perspective
- **Risk:** Corrupted memory structure breaks automation.  
  **Mitigation:** Validator checks required anchors and duplicate sections; fail fast on corruption.

### Legal/Compliance Perspective
- **Risk:** Accidental retention of personal data.  
  **Mitigation:** Prohibit PII in memory; document retention policy and allow purge workflow.

## 10. Intent Alignment Notes (rm‑validate‑intent)
- Confirmed user intent to automate memory updates at key workflow end points.
- Added explicit user‑initiated update command to allow manual preservation when needed.
