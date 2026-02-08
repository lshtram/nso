---
name: archive-conversation
description: Archive high-value conversations to permanent documentation. Usage: User says "archive this conversation [topic]"
---

# Role
Librarian (on user request)

# Trigger
**USER MUST EXPLICITLY REQUEST** - Not automatic

User triggers with phrases like:
- "Archive this conversation"
- "Document this session"
- "Save this discussion about [topic]"
- "/archive [optional-topic]"
- "This is important, save it"

# Purpose
Create permanent documentation from high-value conversations that might be missed by regular memory updates. Unlike automatic memory updates (which capture decisions), this archives complete conversations with full context.

# When to Use
Use when:
- User explicitly asks to save/archive a conversation
- Complex decision-making process that should be preserved
- Important design discussions
- Knowledge transfer sessions
- Architecture debates with valuable rationale
- Debugging sessions with lessons learned

Do NOT use automatically - only on explicit user request.

# Inputs
- Current session conversation (all messages)
- Optional topic name from user
- Current memory files (for context)

# Outputs
- Transcript: `docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md`
- Summary: `docs/requirements/summaries/session-NNN-summary.md`
- Verification report: `docs/requirements/summaries/session-NNN-verification.md`
- Optional requirements: `docs/requirements/official/REQ-[PREFIX]-NNN.md`
- Optional requirements verification: `docs/requirements/official/REQ-[PREFIX]-verification.md`
- Updated index: `docs/requirements/INDEX.md`

# Steps

## Phase 1: Capture
1. Confirm with user: "I'll archive this conversation about [topic]. Continue?"
2. Read full session conversation (all messages since session start)
3. Determine session number (increment highest existing)
4. Create verbatim transcript in `docs/requirements/conversations/`
   - Preserve exact wording
   - Keep raw format (don't clean up tool markers)
   - Include timestamps if available

## Phase 2: Summarize
1. Extract key elements:
   - Decisions made
   - Features discussed
   - Insights/realizations
   - Questions asked and answered
   - Action items
   - Open questions

2. Create summary in `docs/requirements/summaries/`
   - Concise but comprehensive
   - Link to specific parts of transcript
   - Highlight critical decisions

## Phase 3: Verify Summary (Quality Loop)
1. Cross-check summary vs transcript
2. If gaps or conflicts found:
   - Update summary
   - Re-verify
3. If ambiguity remains, ask user for clarification
4. Create verification report documenting:
   - What was checked
   - Any corrections made
   - Confidence level

## Phase 4: Generate Requirements (Optional)
Only if conversation included formal requirements:
1. Convert verified summary into formal requirements
2. Use consistent prefix (e.g., REQ-CORE-001)
3. Include traceability links
4. Create requirements file in `docs/requirements/official/`

## Phase 5: Verify Requirements (Optional)
Only if Phase 4 was executed:
1. Cross-check requirements vs summary
2. Ensure no omissions or scope creep
3. Create requirements verification report

## Phase 6: Finalize
1. Update `docs/requirements/INDEX.md`
2. Create `docs/requirements/DOCUMENTATION_PROCESS.md` if missing
3. Report to user:
   - What was archived
   - Where files are located
   - How to access them

# Constraints
- **Scope**: Current session only (unless user explicitly asks to backfill)
- **Verbatim**: Must preserve exact user/agent wording
- **Single Prefix**: All requirements in a module use one prefix
- **Traceability**: Each requirement must link back to session summary
- **Idempotency**: If session already exists, update in place (no duplicates)
- **User Control**: User can skip phases (e.g., "just save the transcript")

# Output Format

```markdown
### 📄 Conversation Archived
**Topic**: [Topic Name]
**Session**: NNN
**Date**: YYYY-MM-DD

**Files Created**:
- Transcript: `docs/requirements/conversations/session-NNN-YYYY-MM-DD-topic.md`
- Summary: `docs/requirements/summaries/session-NNN-summary.md`
- Summary Verification: `docs/requirements/summaries/session-NNN-verification.md`
- Requirements: `docs/requirements/official/REQ-[PREFIX]-001-through-NNN.md` (if applicable)
- Requirements Verification: `docs/requirements/official/REQ-[PREFIX]-verification.md` (if applicable)
- Index Updated: `docs/requirements/INDEX.md`

**Key Decisions Captured**:
- [Decision 1]
- [Decision 2]

**Next Steps**:
- [Any follow-up actions]
```

# Examples

## Example 1: Simple Archive
**User**: "Archive this conversation about the auth system"

**Agent**: "I'll archive this conversation about the auth system. Creating transcript and summary..."

[Proceeds through all 6 phases]

## Example 2: Just Transcript
**User**: "Just save the transcript of this debugging session"

**Agent**: "I'll save the transcript only. Skipping summary and requirements generation."

[Proceeds with Phase 1 only, confirms with user]

## Example 3: Complete Documentation
**User**: "This architecture discussion is important, document everything"

**Agent**: "I'll create complete documentation including requirements. This will take a few minutes."

[Proceeds through all 6 phases, generates formal requirements from the discussion]

# Integration with Regular Memory
This skill complements (not replaces) automatic memory updates:

- **Automatic memory updates**: Capture decisions, constraints, patterns
- **Archive conversation**: Capture full context, rationale, discussions

Both systems can reference each other via links.

# File Structure
```
docs/requirements/
├── INDEX.md                          # Master index
├── DOCUMENTATION_PROCESS.md          # Process documentation
├── conversations/
│   └── session-001-2026-02-08-auth.md
├── summaries/
│   ├── session-001-summary.md
│   └── session-001-verification.md
└── official/
    ├── REQ-CORE-001.md
    └── REQ-CORE-verification.md
```