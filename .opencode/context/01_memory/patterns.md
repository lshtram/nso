# Memory Patterns

## Discovered Issues & Solutions

### NSO Integration
- **Issue:** NSO project_init.py requires interactive confirmation
- **Solution:** Manually created directory structure and files

### Hardcoded Paths (CRITICAL)
- **Issue:** 6+ hardcoded paths in Tier 1 files point to wrong projects
- **Solution:** Replace with `process.cwd()` (JS) or `Path.cwd()` (Python)
- **Files affected:** nso-plugin.js, system_telemetry.py, copy_session.py, parallel_oracle_integration.py

### task() Is Synchronous (HARD CONSTRAINT)
- **Issue:** OpenCode's task() tool blocks the calling agent until sub-agent returns
- **Implication:** No async delegation, no mid-execution communication
- **Solution:** Pre-Flight + Batch + Post-Check pattern

### Agent Message Routing
- **Issue:** Oracle can't distinguish user vs agent messages
- **Solution:** Add `source` parameter to router_monitor.py

### Dead Code / Duplicate Code
- **Issue:** ~4,970 lines of dead code; HeartbeatMonitor reimplemented 4x
- **Prevention:** Delete demos after purpose served. Single source of truth.

## Architecture Patterns

### Filesystem Is the Database (DECIDED, ENFORCED)
- All scripts determine state by reading filesystem, not maintaining internal state
- workflow_orchestrator.py reads/writes `active_tasks/{task_id}/workflow_state.md`
- gate_check.py globs for `REQ-*.md`, `TECHSPEC-*.md`, `result.md` etc.
- close_session.py reads git status and `active_context.md`

### Unique Agent IDs (DECIDED)
- Every agent instance gets a unique ID (e.g., `oracle_a3f2`)
- Used in contracts, status files, and workflow_state.md phase_history
- Enables traceability across parallel sessions

### Parallel-Safe Task Directories (DECIDED)
- Each task gets its own directory: `.opencode/context/active_tasks/{task_id}/`
- Multiple Oracle sessions can run simultaneously
- No shared mutable state between sessions

### Tool Boundaries (ENFORCED via Oracle Template)
- Oracle: CANNOT run tests, git, or edit source code
- Builder: CANNOT run git or review own code
- Janitor: CANNOT implement fixes, only investigate
- Librarian: CANNOT write source code, only memory/docs + git

### Quality Gates Are Quality-Based, Not Just Artifact-Based (DECIDED, ENFORCED)
- Gates check content quality (required sections, field values), not just file existence
- BUILD gates require: Scope/Acceptance Criteria/Constraints in REQ, Interface/Data Model/Error Handling in TECHSPEC
- Implementation gates require typecheck_status: PASS + test_status: PASS in Builder result.md
- Validation gates require code_review_score >= 80 + APPROVE recommendation in Janitor result.md
- ESLint deferred — only tsc + vitest enforced until ESLint is installed

### Phase Enforcement (ENFORCED via workflow_orchestrator.py)
- BUILD: DISCOVERY → ARCHITECTURE → IMPLEMENTATION → VALIDATION → CLOSURE
- DEBUG: INVESTIGATION → FIX → VALIDATION → CLOSURE
- REVIEW: SCOPE → ANALYSIS → REPORT → CLOSURE
- Phase skipping is blocked. Gate checks run on transition.
- All workflows have gates at every non-CLOSURE phase (10 total gates).

### File-Based Communication (DECIDED)
- Agents communicate through filesystem: contract.md → status.md → result.md
- Question protocol: questions.md = "I need help" → Oracle retries with answers
- Location: `.opencode/context/active_tasks/{task_id}/`

### Pre-Flight + Batch + Post-Check (DECIDED)
- **Pre-Flight:** Oracle gathers ALL info, resolves ambiguities, writes contracts
- **Batch:** Oracle calls task() for each agent sequentially
- **Post-Check:** Oracle reads results, validates, reports to user

### Contract Protocol (IMPLEMENTED)
- contract.md → status.md → result.md → questions.md
- Oracle uses `task_contract_writer.py` before calling task()
- Max retries: 2-3 before escalating to user

### Tier 1 vs Tier 2 Separation
- **Tier 1 (~/.config/opencode/nso/):** System-wide scripts, reusable across projects
- **Tier 2 (.opencode/):** Project-specific config, context, tests, templates
- Core scripts in Tier 1. Tests and config in Tier 2.

## Best Practices

### Context Management
- Keep context files <200 lines (MVI Principle)
- Move completed milestones to archives
- Prune aggressively

### Script Design for Agent Consumption
- Always support `--non-interactive` flag (agents can't use stdin)
- Always support `--json` for programmatic parsing
- Return exit code 0 on success, 1 on failure
- Wrap all `input()` calls in try/except EOFError

### Code Hygiene
- Delete demos after they prove their point
- No duplicate implementations
- No hardcoded paths — use cwd()
- Run tests after file moves

---

**Last Updated:** 2026-02-09
