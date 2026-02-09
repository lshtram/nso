# Memory Patterns

## Discovered Issues & Solutions

### NSO Integration
- **Issue:** NSO project_init.py requires interactive confirmation
- **Solution:** Manually created directory structure and files

### Hardcoded Paths (CRITICAL)
- **Issue:** 6+ hardcoded paths in Tier 1 files point to `/Users/Shared/dev/openspace/` (wrong project)
- **Solution:** Replace with `process.cwd()` (JS) or `Path.cwd()` (Python) for project-awareness
- **Files affected:** nso-plugin.js, system_telemetry.py, copy_session.py, parallel_oracle_integration.py

### task() Is Synchronous (HARD CONSTRAINT)
- **Issue:** OpenCode's task() tool blocks the calling agent until sub-agent returns
- **Implication:** No async delegation, no mid-execution communication, no back-channel
- **Solution:** Pre-Flight + Batch + Post-Check pattern instead of async
- **Evidence:** All workflow docs show sequential chains. parallel_coordinator.py line 415 says "In a real implementation, this would launch the agent process" (never connected)

### Agent Message Routing
- **Issue:** Oracle can't distinguish user vs agent messages → treats task() returns as new user intent
- **Solution:** Add `source` parameter to router_monitor.py. 4 lines of code.

### Dead Code Accumulation
- **Issue:** ~4,970 lines of dead/demo code across 10 files
- **Pattern:** Demo scripts proliferated during prototyping without cleanup
- **Prevention:** Delete demos after they serve their purpose. Don't commit variants.

### Duplicate Code
- **Issue:** HeartbeatMonitor class reimplemented 4 times, TaskIDGenerator exists in 2 places
- **Prevention:** Single source of truth in Tier 1. Project-specific files only for config and tests.

## Architecture Patterns

### File-Based Communication (DECIDED)
- Agents communicate through filesystem, not message queues
- Contract files: contract.md → status.md → result.md
- Question protocol: questions.md = "I need help" → Oracle retries with answers
- Location: `.opencode/context/active_tasks/{task_id}/`

### Pre-Flight + Batch + Post-Check (DECIDED)
- **Pre-Flight:** Oracle gathers ALL info, resolves ambiguities, writes contracts
- **Batch:** Oracle calls task() for each agent (batched if independent)
- **Post-Check:** Oracle reads results, validates, reports to user
- Eliminates 90% of mid-execution questions

### Contract Protocol (IMPLEMENTED)
- **File-based handoff:** contract.md → status.md → result.md → questions.md
- **Location:** `.opencode/context/active_tasks/{task_id}/`
- **Writer:** Oracle uses `task_contract_writer.py` before calling task()
- **Reader:** Sub-agents read contract, work, write results
- **Question Loop:** If unclear → write questions.md → Oracle retries with answers
- **Max retries:** 2-3 attempts before escalating to user

### Tier 1 vs Tier 2 Separation
- **Tier 1 (nso/):** System-wide scripts, reusable across projects
- **Tier 2 (.opencode/):** Project-specific config, context, tests, templates
- Core scripts belong in Tier 1. Tests and config belong in Tier 2.

### MVI Principle
- Keep context files <200 lines
- Core concept → Key points → Minimal example → Reference link
- Prune aggressively. Move history to archives.

## Best Practices

### Context Management
- Use Tier 1 for NSO configuration
- Use Tier 2 for project context
- Keep context files lean (<200 lines)

### Agent Execution
- Always run init_session.py at session start (check marker file)
- Update memory files at workflow completion
- Use router_monitor.py for automatic intent detection (user messages only)

### Code Hygiene
- Delete demos after they prove their point
- No duplicate implementations — single source of truth
- No hardcoded paths — use cwd() for project-awareness
- Run tests after file moves

---

**Last Updated:** 2026-02-09
