# Memory Patterns

## Architecture Patterns

### 4-Layer Directive Architecture (DECIDED, ENFORCED — M5)
| Layer | File | Loaded By | Purpose |
|-------|------|-----------|---------|
| 1 | `instructions.md` | All agents | Universal: memory protocol, workflows, boundaries (~68 lines) |
| 2 | `opencode.json` prompts | Per-agent | Agent-specific enforcement (~30-60 lines each) |
| 3 | Project `AGENTS.md` | All agents | Project context: tech stack, coding standards (~55 lines) |
| 4 | `.opencode/context/` | As needed | Memory files, tech-stack, patterns |

**Total per agent: ~160-180 lines (was 875+)**

### NSO Precedence (DECIDED, ENFORCED)
- NSO process directives override project-level SDLC (AGENTS.md, .agent/, CLAUDE.md, etc.)
- Project files provide context (tech stack, coding standards), not process
- Run `/nso-init` on new projects to detect and resolve conflicts

### Filesystem Is the Database (DECIDED, ENFORCED)
- All scripts determine state by reading filesystem
- `workflow_orchestrator.py` reads/writes `active_tasks/{task_id}/workflow_state.md`
- `gate_check.py` globs for `REQ-*.md`, `TECHSPEC-*.md`, `result.md`

### Tool Boundaries (ENFORCED via opencode.json prompts)
- Oracle: CANNOT run tests, git, or edit source code
- Builder: CANNOT run git or review own code
- Janitor: CANNOT implement fixes, only investigate
- Librarian: CANNOT write source code, only memory/docs + git

### Quality Gates (ENFORCED)
- BUILD gates: Scope/Acceptance in REQ, Interface/Data Model in TECHSPEC
- Implementation: typecheck PASS + test PASS
- Validation: code_review_score ≥ 80 + APPROVE
- ESLint deferred — only tsc + vitest enforced

### Phase Enforcement (ENFORCED)
- BUILD: DISCOVERY → ARCHITECTURE → IMPLEMENTATION → VALIDATION → CLOSURE
- DEBUG: INVESTIGATION → FIX → VALIDATION → CLOSURE
- REVIEW: SCOPE → ANALYSIS → REPORT → CLOSURE
- Phase skipping blocked. User approval required after Discovery and Architecture.

## Discovered Issues & Solutions

### task() Is Synchronous (HARD CONSTRAINT)
- OpenCode's task() blocks the calling agent until sub-agent returns
- Solution: Pre-Flight + Batch + Post-Check pattern

### Script Design for Agents
- Always support `--non-interactive` and `--json` flags
- Return exit code 0/1. Wrap `input()` in try/except EOFError.

### Directive Overload Causes Non-Compliance (ROOT CAUSE — M5)
- 875+ lines of contradicting directives → agents ignore most rules
- Solution: Per-agent isolation, ~160-180 lines max, no cross-agent noise

## Best Practices

- Keep memory files <200 lines
- Delete demos after they prove their point
- No hardcoded paths — use cwd()
- Interface-first: write types before implementations
- Test colocation: Feature.ts + Feature.test.ts in same directory

---

**Last Updated:** 2026-02-10
