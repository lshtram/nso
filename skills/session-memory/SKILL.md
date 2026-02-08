---
name: session-memory
description: Persist decisions, constraints, and learned context across sessions.
---

# Role
Oracle or Builder

# Trigger
- When new durable facts or decisions are made.

# Inputs
- Conversation decisions, constraints, and key artifacts.

# Outputs
- Updated memory notes in `.opencode/context/active_features/<feature>/memory.md`.

# Steps
1. Identify durable facts (decisions, constraints, definitions).
2. Append concise bullets to `memory.md` (create if missing).
3. Link to source artifacts (requirements/spec/tests).
4. Avoid duplicating transient or speculative notes.
