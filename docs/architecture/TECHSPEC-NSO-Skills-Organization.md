# Tech Spec: NSO Skills Organization & Improvement

## 1. Scope
Implement the Anthropic/Claude Code skill standard for all NSO skills, add a Skill Builder skill, migrate existing skills into the new structure, and update documentation. This spec covers structure, migration, and content standards for all skills, including new CC10x‑derived skill additions.

## 2. Architectural Decisions
### 2.1 Skill Directory Standard (Authoritative)
Adopt the official Claude Code skills structure:
```
.opencode/skills/<skill-name>/
  ├── SKILL.md            # required (frontmatter + instructions)
  ├── scripts/            # optional
  ├── references/         # optional
  └── assets/             # optional
```

### 2.2 SKILL.md Frontmatter
Every SKILL.md must include YAML frontmatter with:
- `name` (lowercase, hyphenated, <= 64 chars)
- `description` (clear trigger language)

Optional fields only when needed and compliant with Claude Code skills spec (e.g., `disable-model-invocation`, `allowed-tools`, `context`, `agent`).

### 2.3 Minimalist Skill Content
Follow the “progressive disclosure” approach:
- Keep SKILL.md concise (under ~500 lines).
- Move bulky content into `references/`.
- Use `scripts/` for deterministic, repeatable work.

### 2.4 No Legacy Flat Skills
All flat `.opencode/skills/*.md` files are deprecated and must be migrated or removed.

## 3. Migration Plan
### 3.1 Existing Skills → New Structure
The following skills must be migrated into folders with SKILL.md:

- rm-intent-clarifier
- rm-validate-intent
- rm-multi-perspective-audit
- rm-conflict-resolver
- brainstorming-bias-check
- architectural-review
- tdflow-unit-test
- minimal-diff-generator
- traceability-linker
- silent-failure-hunter
- tech-radar-scan

### 3.2 Content Normalization
For each migrated skill:
- Fix outdated paths.
- Add explicit **Trigger**, **Inputs**, **Outputs**, and **Steps** sections.
- Ensure language is imperative and action‑oriented.
- Reference supporting files (if added) explicitly in SKILL.md.

### 3.3 New Skill Additions (CC10x Gaps)
Create new skills in the same structure:
- router
- session-memory
- debugging-patterns
- verification-before-completion
- code-review-patterns
- planning-patterns
- code-generation

Explicitly exclude for now:
- frontend-patterns
- github-research

## 4. Skill Builder (Skill Creator)
### 4.1 Source & Adaptation
Base on Anthropic’s canonical `skill-creator` (skill-creator/SKILL.md) plus Claude Code skills docs.
Adaptations for NSO:
- All artifacts live under `.opencode/`.
- Enforce naming conventions and directory layout.
- Prefer concise SKILL.md and progressive disclosure via references.

### 4.2 Structure
```
.opencode/skills/skill-creator/
  ├── SKILL.md
  ├── references/
  │   ├── workflows.md
  │   └── output-patterns.md
```
Note: No extra README or changelog files.

## 5. Documentation Updates
Update these docs to reflect skills restructuring:
- `.opencode/docs/STATUS_REPORT.md` (skills list and statuses)
- `.opencode/ARCHITECTURE.md` (skills layout and standard)
- Any NSO docs referencing old skill paths

## 6. Validation & Acceptance
1) All skills are discoverable via Claude Code skills loader (directory compliance).
2) No flat `.opencode/skills/*.md` remain.
3) Skill Builder exists and references official standards.
4) Documentation updated to new paths and skill names.

## 7. Risks & Mitigations
- **Risk:** Skill content bloats context.  
  **Mitigation:** Enforce progressive disclosure, keep SKILL.md lean.
- **Risk:** Inconsistent naming leads to discovery failures.  
  **Mitigation:** Enforce naming rules in Skill Builder.

## 8. Architecture Review Log (Checklist)
**Simplicity:** Uses the official standard; avoids custom frameworks. ✔️

**Modularity:** Each skill is a self‑contained folder; supports independent evolution. ✔️

**Abstraction:** No leakage of implementation details beyond skill instructions. ✔️

**YAGNI:** Excludes optional skills (frontend-patterns, github-research) for now. ✔️
