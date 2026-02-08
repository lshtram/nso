---
name: silent-failure-hunter
description: Detect and surface silent failure patterns in code.
---

# Role
Janitor

# Trigger
- Code review or pre-commit checks.

# Inputs
- Codebase sources.

# Outputs
- Report of dangerous patterns with file/line numbers.
- Recommended fixes for each finding.

# Steps
1. Use the Grep tool to scan for:
   - `except:` (bare except)
   - `except Exception: pass`
   - `catch (e) {}` (empty catch)
   - `// TODO` (unresolved debt)
2. List each match with location.
3. Propose fixes (logging or explicit error handling).
