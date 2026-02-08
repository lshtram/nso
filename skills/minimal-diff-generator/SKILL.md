---
name: minimal-diff-generator
description: Apply the smallest possible code changes to satisfy a task.
---

# Role
Builder

# Trigger
- When editing existing files.

# Inputs
- Target file and specific block needing change.

# Outputs
- Minimal, localized edit with preserved surrounding context.

# Steps
1. Identify the exact block to change.
2. Read only the necessary portion of the file.
3. Use `edit` or `apply_patch` to change the smallest block.
4. Verify indentation and formatting consistency.
