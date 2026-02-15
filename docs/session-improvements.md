---
id: NSO-SESSION-IMPROVEMENTS
status: ACTIVE
date: 2026-02-15
---

# Session-Discovered Improvements

Canonical append-only log for improvements discovered during work sessions.
Agents (Janitor, Librarian) MUST append here. Oracle reviews and applies.

## Format

Each entry uses this format:
```
### NSO-YYYY-MM-DD-NNN
- **Source**: [agent_id] — [session description]
- **Type**: PATTERN | PROCESS | SKILL_GAP | PROMPT_FIX
- **Status**: PROPOSED | APPROVED | APPLIED | REJECTED
- **Description**: [What was discovered]
- **Proposed Action**: [Specific file/prompt/skill change]
- **Applied Ref**: [File path where change was applied, if APPLIED]
```

---

## Entries

### NSO-2026-02-15-017
- **Source**: librarian — E2E test suite overhaul session
- **Type**: PROCESS
- **Status**: PROPOSED
- **Description**: When large numbers of E2E tests break simultaneously (>20), a specific strategy is needed: fix selectors first, then work group-by-group.
- **Proposed Action**: Add E2E mass-fix playbook to Builder prompt under testing guidance, or create a new skill.

### NSO-2026-02-15-018
- **Source**: librarian — E2E test suite overhaul session
- **Type**: PATTERN
- **Status**: PROPOSED
- **Description**: Radix UI primitives (Popover, Dialog, DropdownMenu) have specific dismissal mechanics that differ from native HTML. Agents writing E2E tests rediscover this each time.
- **Proposed Action**: Add Radix UI interaction patterns to the ui-design-system skill.
