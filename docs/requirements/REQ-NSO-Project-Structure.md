# Requirements: NSO Project Structure & Governance (Two-Level Project Model)

## 1. Background
We operate two distinct scopes within a single repository:
1) **NSO System Project** (meta/orchestration): agents, workflows, hooks, scripts, docs, architecture, skills, and system policies.
2) **Working Application Project**: the actual product/application built by the NSO workflows.

The user has clarified that **all NSO system artifacts must reside under `.opencode/`**, while the working application remains at the repository root. `opencode.json` should remain at root as required by OpenCode.

## 2. Goals
1) Enforce a **two-level project model** with clear boundaries.
2) Ensure **all NSO system artifacts are housed under `.opencode/`** (docs, scripts, hooks, architecture, policies, skills).
3) Update architecture and system documentation to reflect this model.
4) Establish a **hard rule**: agents must refuse to write NSO artifacts outside `.opencode/` unless the user explicitly grants permission and the agent explains why.
5) Codify a **missing-skill resolution process**: search known sources first, then implement a new skill if not found.

## 3. Non-Goals
- No backward-compatibility shims or legacy redirects are required at this time.
- No changes to application (root) code structure beyond differentiating NSO vs app artifacts.
- No new external libraries without an approved RFC.

## 4. Definitions
- **NSO System Artifacts:** Any files that define, document, configure, implement, or govern the orchestration system (agents, skills, hooks, scripts, policies, architecture, requirements, logs, and system docs).
- **Working Application Artifacts:** The actual product code and its documentation that NSO workflows help build.

## 5. Functional Requirements
### FR-1: Two-Level Project Model
Document and enforce the distinction between **NSO System Project** and **Working Application Project** in architecture and instructions.

### FR-2: NSO Artifacts Location
All NSO system artifacts MUST reside under `.opencode/`, **except** `opencode.json` which stays at repo root.

### FR-3: Hard Refusal Rule
Agents must **refuse** to write NSO artifacts outside `.opencode/` unless the user grants explicit permission and the agent explains the exception.

### FR-4: Architecture Update
Update `.opencode/ARCHITECTURE.md` to:
- Reflect the two-level project model.
- Clarify the root vs `.opencode/` separation.
- Resolve conflicts with existing statements (e.g., Pillar 8 "docs live in standard `docs/` folders").

### FR-5: Documentation Structure
Adopt the following NSO doc structure:
- `docs/requirements/`
- `docs/architecture/`
- `docs/plans/`

### FR-6: Migration of NSO Artifacts
Identify and move any NSO artifacts that currently live outside `.opencode/` (excluding `opencode.json`). Provide a mapping of **old path → new path** and update references accordingly.

### FR-7: Missing Skill Resolution Process
When a required skill is missing:
1) Search known sources in this order:
   - CC10x repository artifacts
   - Community skill repositories
   - User’s other local projects (e.g., `/Users/Shared/dev/*`)
2) If still not found, implement the skill from scratch based on learned patterns.
3) Make the skill available to the system and document it.

## 6. Constraints & Standards
- **`opencode.json` remains at repo root** as required by OpenCode.
- Follow existing tech stack and allowed library constraints in `.opencode/context/00_meta/tech-stack.md`.
- Follow coding standards in `.opencode/context/00_meta/patterns.md`.

## 7. Acceptance Criteria
1) `.opencode/ARCHITECTURE.md` reflects the two-level project model and `.opencode`‑only NSO artifacts rule.
2) A clear NSO doc structure exists under `docs/`.
3) A policy is documented that agents must refuse to write NSO artifacts outside `.opencode/` without explicit permission.
4) Any NSO artifacts found outside `.opencode/` are moved and references updated.
5) Missing-skill resolution process is documented and enforced.

## 8. Open Issues / Risks
- **Skill availability gap:** The required skills `rm-validate-intent` and `rm-multi-perspective-audit` are not currently available via the `skill` tool. This must be resolved per FR-7 before full automation.
- **Scope identification:** We must reliably classify which root files are NSO vs application artifacts before migration.

## 9. Notes from Discovery
- User explicitly confirmed:
  - `opencode.json` stays at root.
  - No backward-compatibility shims needed.
  - Full refactor required to keep architecture and docs consistent.
  - Hard refusal rule for NSO artifacts outside `.opencode/`.
