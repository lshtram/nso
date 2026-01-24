# Skill Best Practices Reference

## Core Philosophy

Skills are capabilities. They should be concise, actionable, and specific.

## Structural Best Practices

- **Concise `SKILL.md`**: Target ~150-200 lines.
- **Progressive Disclosure**: Detailed info in `./reference/`.
- **Intention-Revealing Names**: No `helpers.md` or `utils.md`.

## Content Best Practices

- **Actionable**: Start instructions with verbs.
- **Complete Examples**: Provide runnable commands.
- **Validate Outputs**: Include verification steps (e.g., `read_file` instead of `list_dir`).

## Anti-Patterns

- **Don't**: Over-explain (Claude is smart).
- **Don't**: Use first person ("I can help...").
- **Don't**: Write Python scripts.
- **Don't**: Use generic file names.

## Testing Best Practices

- **Syntax Check**: Verify YAML frontmatter.
- **Invocation Test**: Trigger with realistic user queries.
- **Comparison**: Verify the problem the skill solves is actually gone.
