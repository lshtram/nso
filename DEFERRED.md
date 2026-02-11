# NSO Deferred Tasks

This file tracks non-critical improvements and features for the NSO system.

**Last Updated**: 2026-02-11

---

## Profiler Hook — Deferred (Low Priority)

**Status**: DEACTIVATED  
**Location**: `/Users/opencode/.config/opencode/nso/deferred/profiler/`

### Why Deferred

The profiler hook was designed to track per-tool-call metrics (tool name, target file, duration, success/failure, error loop detection). However:

1. **OpenCode already provides comprehensive session data** in `logs/session.json` (token counts, costs, file diffs, turn timing)
2. **The profiler was non-functional** due to plugin bugs:
   - `args: {}` hardcoded → `file` field always `null`
   - `error: null` hardcoded → `success` field always `true`
   - `duration` not passed → always `null`
3. **Overhead doesn't justify the single useful field** (tool name):
   - Spawns Python process per tool call
   - Writes temp files for IPC
   - Adds ~10-50ms latency

### What Would Be Needed to Reactivate

If tool-level analytics become critical:

1. **Fix plugin payload** (`nso-plugin.js`):
   ```javascript
   args: output.args || input.args || {},     // instead of {}
   error: output.error || null,               // instead of null
   duration: output.duration || null          // add this field
   ```

2. **Fix error loop detection** in `profiler.py` to correctly read `error` from payload

3. **Add duration tracking** — OpenCode would need to provide tool execution time

4. **Consider batching** — batch profiling data instead of spawning Python per call

### Alternative Approaches

- Parse `plugin_debug.log` (already records every tool call with exit codes)
- Use OpenCode's native telemetry if it exposes tool-level data
- Build lightweight JS-based profiler directly in plugin (no Python subprocess)

---

## Future Enhancements

*Add other deferred NSO improvements here as they are identified.*
