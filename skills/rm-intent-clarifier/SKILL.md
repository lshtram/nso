---
name: requirement-elicitation
description: Transform vague feature requests into structured Product Requirements Documents (PRDs) with traceability.
---

# Role
Oracle

# Trigger
- Start of `/new-feature` or any new feature request discovery.
- User says: "I want to build...", "Add...", "Implement...", etc.
- Before any requirements document exists.

# Inputs
- User request and conversation history.
- `.opencode/context/00_meta/tech-stack.md`
- `.opencode/context/00_meta/glossary.md`
- Existing requirements (if extending a feature)

# Outputs
- Complete PRD: `docs/requirements/REQ-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/requirements.md`)
- Traceability Matrix (Requirement ID → Verification Method)
- Scope definition (what's in vs. out)

# Steps

## Phase 1: The Interview
Conduct a structured interview with the user to gather requirements:

1. **Scope Questions** (What's in vs. out?):
   - "What specific functionality should this feature include?"
   - "Are there any related features that should be explicitly excluded?"
   - "What's the MVP vs. future enhancements?"

2. **User Story Questions** (How does the user interact?):
   - "Who are the users of this feature?"
   - "What actions will they take?"
   - "What outcomes do they expect?"
   - "What are the edge cases?"

3. **Constraint Questions** (Limits and boundaries):
   - "Are there performance requirements (speed, memory)?"
   - "Any UI/UX constraints or preferences?"
   - "Security or access control requirements?"
   - "Integration requirements with existing systems?"
   - "Timeline or resource constraints?"

## Phase 2: Drafting
Create a comprehensive PRD with:

1. **Feature Overview**
   - Clear feature name
   - One-paragraph summary
   - Business value / user value

2. **User Stories**
   - Format: "As a [user], I want [feature], so that [benefit]"
   - Include acceptance criteria for each

3. **Functional Requirements**
   - Numbered: REQ-001, REQ-002, etc.
   - Each must be testable and specific
   - Group by category if large feature

4. **Non-Functional Requirements**
   - Performance, security, reliability, etc.
   - Numbered: NFR-001, NFR-002, etc.

5. **Scope Boundaries**
   - Explicitly list what's IN scope
   - Explicitly list what's OUT of scope

6. **Traceability Matrix** (CRITICAL)
   | ID | Requirement | Verification Method |
   |----|-------------|---------------------|
   | REQ-001 | [Description] | [Test/Bash command/Playwright] |
   | REQ-002 | [Description] | [Test/Bash command/Playwright] |

## Phase 3: Verification Setup
Ensure every requirement has an executable verification:
- Unit tests for functional requirements
- Integration tests for system requirements
- Manual verification steps where automated tests aren't possible

# Output Template

```markdown
## REQ-<Feature-Name>.md Template

# Feature: [Name]

## Overview
[One-paragraph summary]

## User Stories
- As a [user], I want [feature], so that [benefit]
  - Acceptance: [Criteria]

## Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-001 | [Specific, testable requirement] | Must |
| REQ-002 | [Specific, testable requirement] | Should |

## Non-Functional Requirements
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | [Performance/security/etc] | [Metric] |

## Scope
### In Scope
- [Item 1]
- [Item 2]

### Out of Scope
- [Item 1 - explicitly excluded]
- [Item 2 - future enhancement]

## Traceability Matrix
| ID | Requirement | Verification Method |
|----|-------------|---------------------|
| REQ-001 | [Desc] | `bash cmd` or `pytest test_name` |

## Open Questions
- [Question 1]
- [Question 2]
```

# When to Stop
Stop when:
- All clarifying questions answered OR user says "that's enough detail"
- At least 3-5 functional requirements defined
- Every requirement has a verification method
- Scope is clearly defined (in vs. out)

# Gate
User must approve the PRD before proceeding to Architecture phase.
