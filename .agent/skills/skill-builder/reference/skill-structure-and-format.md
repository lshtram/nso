# Skill Structure and Format Reference

## Directory Structure

```
skill-name/
├── SKILL.md (Core instructions)
├── reference/ (Detailed docs)
├── scripts/ (Node.js utils)
└── templates/ (Output skeletons)
```

## SKILL.md Format

```yaml
---
name: gerund-name
description: Trigger-focused invocation guide.
---

# Instructions
...
## Reference
- `./reference/methodology.md`
```

## YAML Frontmatter

- **No** `allowed-tools`.
- **No** `model`.
- **No** legacy `tools` fields.
- Use spaces, not tabs.

## Progressive Disclosure Example

Instead of putting a 100-item checklist in `SKILL.md`, put:
"See `./reference/full-checklist.md` for comprehensive criteria."
This keeps the initial context load low.
