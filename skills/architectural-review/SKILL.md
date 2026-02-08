---
name: architectural-review
description: Multi-expert architecture review with simplicity checklist and debate-driven analysis.
---

# Role
Oracle

# Trigger
- Before finalizing `TECHSPEC-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/tech_spec.md`).
- When evaluating complex interfaces, new modalities, or major architectural shifts (e.g., swapping a core library).

# Inputs
- Draft `.opencode/docs/architecture/TECHSPEC-<Feature-Name>.md` (or temporary `.opencode/context/active_features/<feature>/tech_spec.md`).
- Approved requirements (REQ-*.md)
- Existing codebase patterns

# Outputs
- Updated architecture spec with:
  - Multi-expert review section
  - Simplicity/modularity/YAGNI evaluation
  - Risk mitigations
  - Architecture Review Log

# Steps

## Phase 1: Multi-Expert Debate (For Complex Decisions)
When the architecture involves significant choices (new patterns, major refactoring, complex integrations):

1. **Expert Role Nomination**
   Identify 3 tailored expert roles for the specific problem:
   - Example for `IModality`: System Architect, UI/UX Interaction Lead, Performance Engineer
   - Example for database change: Database Architect, Performance Engineer, Operations Lead

2. **The Debate**
   Simulate a debate between three viewpoints:
   
   **Expert A (Proponent)**: 
   - Proposes the current design
   - Arguments for why this approach is best
   - Addresses anticipated concerns
   
   **Expert B (Skeptic)**:
   - Identifies risks, edge cases
   - Questions "IDE Gravity" creep (over-engineering)
   - Challenges assumptions
   
   **Expert C (Alternative)**:
   - Proposes a different pattern
   - Example: "Event Bus" vs "Direct Calls"
   - Explains trade-offs of alternative approach

3. **Consensus & Mitigation**
   - Synthesize the "Golden Path" from the debate
   - List specific mitigations for identified risks
   - Document why the chosen approach wins

## Phase 2: Simplicity Checklist (Always Required)
Evaluate the architecture against core principles:

**Simplicity**
- Can a new team member understand this in 5 minutes?
- Is there a simpler way to achieve the same goal?
- Are we solving the right problem (not over-engineering)?

**Modularity**
- Can components be tested in isolation?
- Are boundaries clear and well-defined?
- Is coupling minimized?

**Abstraction Boundaries**
- Do interfaces hide implementation details?
- Are dependencies flowing in one direction?
- Is there clear separation of concerns?

**YAGNI (You Aren't Gonna Need It)**
- Is every component necessary for MVP?
- Are we building for hypothetical future requirements?
- Can deferred features be added later without breaking changes?

**Scalability & Performance**
- Will this handle expected load?
- Are there obvious bottlenecks?
- Is resource usage reasonable?

## Phase 3: Risk Assessment
Identify and mitigate risks:

1. **Technical Risks**
   - New/unproven technologies
   - Complex integrations
   - Performance concerns

2. **Maintenance Risks**
   - Knowledge silos
   - Documentation gaps
   - Testing complexity

3. **Operational Risks**
   - Deployment complexity
   - Monitoring/observability
   - Rollback procedures

## Phase 4: Specification Update
Update the TECHSPEC with:

1. **Architecture Review Section**:
   - Multi-expert debate summary (if conducted)
   - Simplicity checklist results
   - Risk mitigations
   - Open questions or follow-ups

2. **Architecture Review Log**:
   - Date of review
   - Changes made based on review
   - Outstanding concerns

# Output Template

```markdown
## Architecture Review Section

### Multi-Expert Review (if applicable)
**Expert Panel**: [Role A], [Role B], [Role C]

**Key Debate Points**:
- **[Concern]**: [Synthesized argument]

**Recommended Consensus**:
[Chosen approach and rationale]

**Risk Mitigations**:
- [ ] [Mitigation 1]
- [ ] [Mitigation 2]

### Simplicity Checklist
- [x] Simplicity: [Notes]
- [x] Modularity: [Notes]
- [x] Abstraction: [Notes]
- [x] YAGNI: [Notes]
- [x] Performance: [Notes]

### Risk Assessment
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [Risk] | High/Med/Low | High/Med/Low | [Strategy] |

### Review Log
- [Date]: [Changes made]
```

# When to Use Multi-Expert Debate
Use the debate when:
- Introducing new architectural patterns
- Major refactoring of core systems
- Complex integration with external systems
- Performance-critical components
- Security-sensitive features
- Any decision that "feels big"

Skip debate for:
- Minor feature additions
- Well-understood patterns
- Straightforward implementations

# Gate
User must approve TECHSPEC-*.md (including review section) before Implementation.
