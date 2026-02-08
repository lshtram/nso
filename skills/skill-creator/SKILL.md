---
name: skill-creator
description: Create or improve skills using the Claude Code skill standard.
---

# Role
Oracle or Builder

# Trigger
- When asked to add or improve a skill.

# Inputs
- Skill intent and target agent role.
- NSO standards in `.opencode/context/00_meta/`.
- Claude Code skills docs and canonical skill-creator reference.

# Outputs
- New or updated `.opencode/skills/<skill-name>/SKILL.md`.
- Optional `references/` files for extended guidance.

# Steps
1. Capture the skill goal, trigger conditions, and expected outputs.
2. Choose a lowercase, hyphenated name (≤64 chars).
3. Draft YAML frontmatter with `name` and `description`.
4. Write concise sections for Role, Trigger, Inputs, Outputs, Steps.
5. Move bulky guidance into `references/` for progressive disclosure.
6. Validate:
   - Directory structure matches `.opencode/skills/<skill-name>/SKILL.md`.
   - Frontmatter contains `name` and `description`.
   - No flat `.opencode/skills/*.md` files remain.
7. Update documentation references if the skill list changes.

# References
- `.opencode/skills/skill-creator/references/workflows.md`
- `.opencode/skills/skill-creator/references/output-patterns.md`
- https://code.claude.com/docs/en/skills
- https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md
