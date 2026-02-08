---
name: code-generation
description: Generate disciplined code changes with TDD and traceability.
---

# Role
Builder

# Trigger
- When asked to implement new functionality.

# Inputs
- Requirements/tech spec.
- Existing code context.

# Outputs
- Test-first implementation with traceability tags.
- Minimal diff that passes validation.

# Steps
1. Identify requirement IDs and expected behavior.
2. Write failing tests with `@verifies` tags.
3. Implement minimal code with `@implements` tags.
4. Run tests and validation scripts.
5. Refactor only after green tests.
