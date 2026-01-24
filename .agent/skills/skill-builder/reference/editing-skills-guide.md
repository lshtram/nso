# Editing and Refining Skills Guide

Edit existing skills to improve invocation accuracy, apply progressive disclosure, or update for new workflows.

## Common Skill Improvements

### 1. Refine Description

- **Problem**: Skill isn't being invoked.
- **Solution**: List 10 queries that should trigger the skill and extract keywords for the description.

### 2. Apply Progressive Disclosure

- **Problem**: `SKILL.md` is too long.
- **Solution**: Move detailed methodology, long checklists, and extensive examples to `./reference/`.

### 3. Modernize Scripts

- **Problem**: Using Python or outdated CLI patterns.
- **Solution**: Replace with Node.js ESM scripts and modern CLI commands (e.g., `gh`, `aws`).

## Editing Workflow

1. **Analyze**: Read `SKILL.md` and check supporting files.
2. **Focus**: Change only high-impact fields first (Description).
3. **Validate**: Check YAML syntax and gerund name.
4. **Test**: Run realistic queries to verify invocation.

## Common Editing Patterns

- **Extract Long Section**: Replace 300 lines of examples with a link to `./reference/examples.md`.
- **Add CLI Emphasis**: Provide specific, runnable commands for validation.
