---
name: memory-update
description: Force an on-demand update of NSO memory files with comprehensive context.
---

# Role
Librarian (or Oracle when invoked manually)

# Trigger
- When the user requests a manual memory refresh (e.g., `/memory-update`).
- At the end of each major workflow phase (Discovery, Architecture, Build, Debug, Review).

# Inputs
- Current session summary: what was worked on, decisions made, issues found.
- Existing memory files in `.opencode/context/01_memory/`.
- Active feature context: `.opencode/context/active_features/<feature>/` (if any).
- Approved requirements and tech specs in `.opencode/docs/`.

# Outputs
- Updated `active_context.md`, `patterns.md`, and `progress.md` with comprehensive, actionable entries.
- All entries must be concise but informative enough to restore context for future sessions.

# Steps
## LOAD (Read Existing Memory)
1. Read `.opencode/context/01_memory/active_context.md`.
2. Read `.opencode/context/01_memory/patterns.md`.
3. Read `.opencode/context/01_memory/progress.md`.
4. If an active feature exists, read `.opencode/context/active_features/<feature>/feature.md`.

## UPDATE active_context.md
Update within the required anchors:

### `## Current Focus`
Write a 2-4 sentence summary covering:
- What feature/goal was worked on in this session.
- Current status (in progress, completed, blocked).
- What was just finished or is actively being worked on.

Example:
"- **Memory Architecture (IN PROGRESS):** Implementing 3-file memory system, validator script, and /memory-update command. Just completed initial implementation of memory files and validator. Next: test the /memory-update command."

### `## Decisions`
List each significant decision made:
- The decision itself (what was chosen).
- Rationale (why this choice).
- Implications (what this enables or prevents).

### `## Known Issues / Risks`
- Document any issues discovered during work.
- Note any risks or concerns for future sessions.

### `## Constraints (Active)`
- List any active constraints that affect current work (e.g., "no MCP integration yet", "single repo only").

### `## Deferred Items`
- Features, skills, or work items that were identified but not implemented.
- Brief reason for deferral.

### `## Next Steps (To-Do List)`
Write as a checklist:
- [ ] Short-term next actions (what to do next in this session).
- [ ] Mid-term milestones (what to achieve before calling this feature "done").
- [ ] Long-term roadmap items (future work identified but not scheduled).

## UPDATE patterns.md
Update within the required anchors:

### `## Conventions`
- New project conventions discovered or established (e.g., "always use REQ- prefix for requirements").
- Coding standards or patterns to follow.

### `## Gotchas`
- Pitfalls, bugs, or unexpected behaviors discovered.
- Workarounds that were found.

### `## Approved Practices`
- Patterns or approaches that are now "approved" for reuse.
- Examples of what works well.

## UPDATE progress.md
Update within the required anchors:

### `## Verified Deliverables`
- Concrete items completed and verified.
- Link to evidence (PRs, test results, docs).

### `## Evidence Links`
- Links to test results, documentation, PRs, or other proof of work.

### `## Deferred Items`
- Items that were started but not completed.
- Brief reason for deferral.

## Final Checks
- Ensure no secrets, credentials, or PII are included.
- Keep entries concise but informative.
- Use consistent formatting throughout.
- Preserve existing entries unless they are now outdated.
