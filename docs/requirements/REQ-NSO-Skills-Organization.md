# Requirements: NSO Skills Organization & Improvement

## 1. Background
The NSO skills currently live as flat `.md` files under `.opencode/skills/`, which does not match the Anthropic/Claude Code skill standard. As a result, the `skill` tool cannot discover or load them. The user requires we adopt the official skill structure, add a **Skill Builder** (skill-creator) based on high‑quality external references, and improve **all** existing skills to the new standard.

Primary references:
- Claude Code Skills documentation: https://code.claude.com/docs/en/skills
- Anthropic skill-creator: https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md

## 2. Goals
1) Reorganize all NSO skills to the Anthropic skill standard so the `skill` tool can discover them.
2) Add a **Skill Builder** skill that guides creation and improvement of skills (based on Anthropic’s skill-creator and other high‑quality sources).
3) Improve the content and structure of **all existing skills** to follow the standard (frontmatter, clear triggers, concise instructions, supporting files as needed).
4) Update NSO documentation to reflect the new skills organization and usage.

## 3. Non‑Goals
- No backwards compatibility for old flat `.opencode/skills/*.md` files.
- No new external libraries without an approved RFC.

## 4. Definitions
- **Skill Standard:** Anthropic/Claude Code skill format: `skills/<skill-name>/SKILL.md` with YAML frontmatter and optional subfolders for resources.
- **Skill Builder:** A skill that instructs how to design, create, validate, and iterate on skills.

## 5. Functional Requirements
### FR‑1: Standard Directory Structure
Each skill MUST be a directory with a `SKILL.md` entrypoint:
```
.opencode/skills/<skill-name>/
  ├── SKILL.md
  ├── scripts/ (optional)
  ├── references/ (optional)
  └── assets/ (optional)
```
Structure aligns with Claude Code skills standard.

### FR‑2: YAML Frontmatter
Each `SKILL.md` MUST contain YAML frontmatter including:
- `name`
- `description`
Additional fields are allowed when needed, but must align with Claude Code skills spec.

### FR‑3: Skill Discovery
Skills must be discoverable by the Claude Code skill loader (automatic discovery via directory structure). The previous flat `.md` files are deprecated.

### FR‑4: Improve All Existing Skills
All current skills under `.opencode/skills/*.md` MUST be migrated into the new structure and improved:
- Rewrite to be concise and action‑oriented.
- Remove outdated paths (e.g., `context/active_features/.../requirements.md` if not correct).
- Add explicit triggers and outputs.
- Split large/auxiliary content into `references/` when appropriate.

### FR‑5: Add Skill Builder
Add a **Skill Builder** skill (e.g., `skill-creator`) based on Anthropic’s canonical skill‑creator, adapted to NSO policies:
- Follow NSO’s `.opencode`‑only artifact rule.
- Include guidance for validating skill structure and naming.
- Prefer concise SKILL.md content and progressive disclosure via references.

### FR‑6: Documentation Updates
Update NSO documentation to reflect:
- New skills directory structure and naming.
- How to create/update skills using the Skill Builder.
- Any renamed skill IDs.

### FR‑7: CC10x Skill Gap Additions
Include the following CC10x skills that are not currently present in NSO, and plan to develop them to the same standard:
- `router` (cc10x:cc10x-router) — intelligent intent detection and workflow routing.
- `session-memory` — persistent memory load/update protocols.
- `debugging-patterns` — systematic debugging with LOG FIRST and root-cause discipline.
- `verification-before-completion` — evidence‑based verification gates with exit codes.
- `code-review-patterns` — structured review patterns with confidence thresholds.
- `planning-patterns` — structured planning workflows and phased plans.
- `code-generation` — disciplined code generation patterns (beyond minimal diff).

Explicitly exclude these CC10x skills for now (not required):
- `frontend-patterns`
- `github-research` (Scout already covers external research)

## 6. Constraints & Standards
- All changes reside under `.opencode/`.
- `opencode.json` remains at repo root.
- Follow tech‑stack and coding rules in `.opencode/context/00_meta/tech-stack.md` and `.opencode/context/00_meta/patterns.md`.
- Align with official Claude Code skills format.

## 7. Acceptance Criteria
1) All skills exist as folders with `SKILL.md` and valid YAML frontmatter.
2) The Skill Builder skill exists and references the official standard.
3) No flat `.opencode/skills/*.md` files remain (migrated or removed).
4) NSO docs reference the new structure and skill usage correctly.

## 8. Traceability Tags

| Requirement | Implementation Tag | Verification Tag |
|-------------|--------------------|-------------------|
| FR-1 (Directory Structure) | `// @implements: FR-SKILLS-001` | `// @verifies: FR-SKILLS-001` |
| FR-2 (Frontmatter) | `// @implements: FR-SKILLS-002` | `// @verifies: FR-SKILLS-002` |
| FR-3/FR-4 (Discovery + Migration) | `// @implements: FR-SKILLS-003` | `// @verifies: FR-SKILLS-003` |
| FR-5/FR-7 (Skill Builder + New Skills) | `// @implements: FR-SKILLS-004` | `// @verifies: FR-SKILLS-004` |

## 9. Open Issues / Risks
- Some existing skills reference outdated paths (e.g., `requirements.md` in context) and must be normalized.
- The `skill` tool currently reports no skills; success depends on directory compliance.
