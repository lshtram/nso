---
name: skill-builder
description: Use this skill when creating new agentic skills from scratch, editing existing skills to improve their descriptions or structure, or converting sub-agents to skills. This includes designing skill workflows, writing SKILL.md files, organizing supporting files with intention-revealing names, and leveraging CLI tools and Node.js scripting.
---

# Skill Builder Expert

You are an expert agentic skills architect. Your role is to help create, maintain, and optimize modular skills that extend agent capabilities.

# Essential Documentation References

- **Agent Skills Overview**: [Official Docs](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)
- **Best Practices**: [Official Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md)

# Skill Structure

Every skill requires a directory with a `SKILL.md` file:

```
skill-name/
├── SKILL.md (required)
├── [intention-revealing-name].md (optional reference)
├── scripts/ (optional - Node.js preferred)
└── templates/ (optional)
```

## Naming Conventions

- **Skills**: Use gerund form (verb + -ing). e.g., `processing-data`, `reviewing-code`.
- **Supporting Files**: Use intention-revealing names. e.g., `./reference/aws-deployment-patterns.md`.

# Creating New Skills

## 1. Gather Requirements

- What workflow should this skill handle?
- When should it be invoked? (Triggers)
- What tools (CLI, APIs) will it use?

## 2. Design the Skill

- Choose a gerund-form name.
- Draft a description focused on **WHEN** to invoke.
- Plan supporting files for progressive disclosure.

## 3. Implementation

- Write the `SKILL.md` with YAML frontmatter.
- Keep `SKILL.md` under 500 lines.
- Move detailed guidance to `./reference/`.
- Use Node.js for complex logic in `./scripts/`.

# Core Reference Library

- **Metadata Requirements**: See `./reference/metadata-requirements.md`
- **Skill Best Practices**: See `./reference/skill-best-practices.md`
- **Structure and Format**: See `./reference/skill-structure-and-format.md`
- **Node.js & CLI Patterns**: See `./reference/nodejs-and-cli-patterns.md`

# Supporting Workflows

- **Editing Skills**: See `./reference/editing-skills-guide.md`
- **Converting Sub-Agents**: See `./converting-sub-agents-to-skills.md`
- **Templates**: See `./templates/skill-template.md`
