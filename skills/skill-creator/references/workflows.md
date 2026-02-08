# Skill Creation Workflow

## 1. Intake
- Identify the agent role and trigger.
- Clarify expected inputs/outputs.

## 2. Structure
- Create `.opencode/skills/<skill-name>/SKILL.md`.
- Add YAML frontmatter with `name` and `description`.

## 3. Content
- Keep SKILL.md concise and action-oriented.
- Use sections: Role, Trigger, Inputs, Outputs, Steps.
- Prefer imperative steps and explicit artifacts.

## 4. Progressive Disclosure
- Move long checklists into `references/`.
- Link references from SKILL.md.

## 5. Validation
- Ensure skill discovery via directory structure.
- Check naming and frontmatter.
- Update documentation to reflect new skills.
