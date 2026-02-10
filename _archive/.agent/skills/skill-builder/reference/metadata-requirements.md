# Skill Metadata Requirements Reference

The YAML frontmatter in `SKILL.md` determines how and when skills are invoked.

## Name Field

- **Format**: Gerund form (verb + -ing). e.g., `processing-data`.
- **Validation**: Lowercase, numbers, hyphens only. Max 64 chars.
- **Good Examples**: `building-components`, `testing-apis`.

## Description Field (Critical)

- **Voice**: Third person.
- **Focus**: WHEN to use (not what it is).
- **Max length**: 1024 characters.
- **Formula**: "Use this skill when [primary situation]. This includes [specific use cases and triggers]."

### Trigger Keywords

Include keywords users might say:

- "CSV", "PDF", "deploy", "debug", "audit", "refactor".

### Testing Your Description

- Would query X trigger this skill?
- Is it distinct from other skills?
- Is the "when" clear and unambiguous?
