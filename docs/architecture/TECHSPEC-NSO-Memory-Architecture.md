# Tech Spec: NSO Memory Architecture

## 1. Scope
Implement a persistent 3‑file memory system under `.opencode/context/01_memory/`, enforce LOAD/UPDATE protocol, add a user‑initiated memory update command, and provide a validator to enforce anchors and structure.

## 2. Architecture Overview

### 2.1 Memory Files
Location: `.opencode/context/01_memory/`

Files and required anchors:

- **active_context.md**
  - `## Current Focus`
  - `## Decisions`
  - `## Open Questions`
  - `## Next Steps`

- **patterns.md**
  - `## Conventions`
  - `## Gotchas`
  - `## Approved Practices`

- **progress.md**
  - `## Verified Deliverables`
  - `## Evidence Links`
  - `## Deferred Items`

### 2.2 Memory Protocol
**LOAD at Start:** Agents must read all three files at the start of any workflow (Discovery, Architecture, Build, Debug, Review).

**UPDATE at End:** Agents must update all three files at the end of each workflow, with scoped, concise entries:
- `active_context.md`: current focus, decisions, open questions, next steps.
- `patterns.md`: reusable conventions and gotchas.
- `progress.md`: verified deliverables + evidence links.

### 2.3 Automatic Update Points
Memory updates are required at these workflow end‑points:
1) End of Discovery Phase (requirements approved)
2) End of Architecture Phase (tech spec approved)
3) End of Builder Implementation (tests passed)
4) End of Debug Workflow (root cause confirmed + regression test)
5) End of Review Workflow (review complete)

### 2.4 User‑Initiated Memory Update
Provide a command skill (e.g., `/memory-update`) that forces a memory update when the user deems it important.
The command should:
- Read current memory files.
- Summarize the latest changes.
- Update each file within the proper anchors.

## 3. Validator Design
Implement a validator (script or skill) that checks:
- All three files exist.
- Required anchors are present.
- No duplicate anchors.
- Optional warnings for empty sections.

Validator output:
- PASS/FAIL summary
- List of violations with file + anchor

## 4. Integration Points
- **AGENTS.md**: document LOAD/UPDATE rules for all workflows.
- **Oracle/Builder/Janitor prompts**: ensure workflow phases trigger updates.
- **Validation harness**: optionally call validator in `validate.py --full`.

## 5. Data Hygiene Rules
- No secrets, credentials, or PII in memory files.
- Use short bullet entries; avoid verbose narrative.
- Promote only reusable items into `patterns.md`.

## 6. Rollout Plan
1) Create memory files with anchors.
2) Add the `/memory-update` skill.
3) Add validator.
4) Update documentation and workflow prompts.

## 7. Architecture Review Log (Checklist)
**Simplicity:** 3 files, clear anchors, minimal tooling. ✔️

**Modularity:** Memory files and validator are isolated; protocol applies across workflows. ✔️

**Abstraction Boundaries:** Memory storage separated from workflow logic. ✔️

**YAGNI:** No external MCP or multi‑repo memory. ✔️
