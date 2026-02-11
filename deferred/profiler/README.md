# Profiler Hook — Deferred (Non-Critical)

**Status**: DEACTIVATED 2026-02-11  
**Priority**: Low — not needed for core NSO functionality

---

## Why Deferred

The profiler hook was designed to track per-tool-call metrics:
- Tool name
- Target file
- Duration
- Success/failure status
- Error loop detection (3 failures in a row)

However:

1. **OpenCode already tracks comprehensive session data** in `logs/session.json`:
   - Token counts, costs, model info
   - File diffs per turn
   - Turn timing (created/completed)
   - Agent/mode per turn

2. **The profiler was non-functional** due to plugin bugs:
   - `args: {}` hardcoded → `file` field always `null`
   - `error: null` hardcoded → `success` field always `true`
   - `duration` not passed → always `null`
   - Only tool name + timestamp were correctly recorded

3. **The one useful feature (tool-level granularity) doesn't justify the overhead**:
   - Spawns a Python process on every tool call
   - Writes temp files for IPC
   - Adds ~10-50ms latency per call
   - Only delivers tool name, which could be extracted from debug logs if needed

---

## What Would Be Needed to Reactivate

If tool-level analytics become critical, these fixes are required:

1. **Fix the plugin payload** (`nso-plugin.js`):
   ```javascript
   args: output.args || input.args || {},     // instead of {}
   error: output.error || null,               // instead of null
   duration: output.duration || null          // add this field
   ```

2. **Fix error loop detection logic** in `profiler.py` to correctly read `error` from payload

3. **Add duration tracking** — OpenCode would need to provide tool execution time in the `tool.execute.after` hook's `output` object

4. **Consider batching** — instead of spawning Python per tool call, batch profiling data and write it once per N calls or on session end

---

## Alternative Approaches

If tool-level insights are needed:

- Parse `plugin_debug.log` (already records every tool call with exit codes)
- Use OpenCode's native telemetry/analytics if it exposes tool-level data
- Build a lightweight JS-based profiler directly in the plugin (no Python subprocess)

---

## Files in This Directory

- `profiler.py` — The hook script (preserved for reference)
- `README.md` — This document
