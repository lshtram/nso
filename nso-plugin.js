import fs from 'node:fs';
import path from 'node:path';

/**
 * NSO Plugin for OpenCode v2 — Fully Debugged
 * 
 * Fixes applied:
 * 1. validate_intent exit code is checked — blocks are enforced
 * 2. All Python scripts receive --project-root so they resolve paths correctly
 * 3. Telemetry uses file-based IPC (stdin WritableStream was unreliable)
 * 4. Session init passes project root to init_session.py
 * 5. Consistent file-based IPC pattern everywhere
 * 6. Proper error handling that distinguishes "hook blocked" from "hook crashed"
 */
export default async function plugin(context = {}) {
  const { $ } = context;

  const initializedSessions = new Set();

  // Resolve project directory from plugin context
  const getProjectDir = () => context.directory || process.cwd();

  // Helper: debug logger (writes to .opencode/logs/plugin_debug.log)
  const debugLog = (msg) => {
    try {
      const logPath = path.join(getProjectDir(), '.opencode', 'logs', 'plugin_debug.log');
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (_) {}
  };

  // Helper: ensure directory exists
  const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      try { fs.mkdirSync(dirPath, { recursive: true }); } catch (_) {}
    }
  };

  // Helper: write temp payload file and return its path
  const writeTempPayload = (prefix, payload) => {
    const tempDir = path.join(getProjectDir(), '.opencode', 'temp');
    ensureDir(tempDir);
    const payloadPath = path.join(tempDir, `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.json`);
    fs.writeFileSync(payloadPath, JSON.stringify(payload));
    return payloadPath;
  };

  // Helper: clean up temp file
  const cleanupTemp = (filePath) => {
    try { fs.unlinkSync(filePath); } catch (_) {}
  };

  // Prove plugin is alive
  try {
    const logDir = path.join(getProjectDir(), '.opencode', 'logs');
    ensureDir(logDir);
    fs.appendFileSync(
      path.join(logDir, 'plugin_alive.log'),
      `Plugin initialized at ${new Date().toISOString()}\n`
    );
  } catch (_) {}

  /**
   * Track script performance via system_telemetry.py
   * Uses file-based IPC (not stdin) for reliability.
   */
  async function trackPerformance(name, durationMs, status) {
    if (!$) return;
    try {
      const payloadPath = writeTempPayload('telemetry', {
        script: name,
        duration: durationMs,
        status: status
      });
      try {
        await $`python3 /Users/opencode/.config/opencode/nso/scripts/system_telemetry.py --payload ${payloadPath} --project-root ${getProjectDir()}`.nothrow().quiet();
      } finally {
        cleanupTemp(payloadPath);
      }
    } catch (_) {
      // Never let telemetry failures affect the user
    }
  }

  return {
    // ─── SESSION INIT (via event hook) ───
    "event": async (input) => {
      const event = input?.event;
      if (!event) return;

      // Handle session creation and chat start events
      if (event.type === "session.created" || event.type === "chat.started") {
        const sessionID = event.sessionID || event.properties?.sessionID;
        if (sessionID && !initializedSessions.has(sessionID)) {
          const projectDir = getProjectDir();
          const start = performance.now();
          try {
            if ($) {
              const result = await $`python3 /Users/opencode/.config/opencode/nso/scripts/init_session.py ${projectDir}`.nothrow().quiet();
              const elapsed = performance.now() - start;
              initializedSessions.add(sessionID);

              // Log to plugin_alive.log for visibility
              try {
                fs.appendFileSync(
                  path.join(projectDir, '.opencode', 'logs', 'plugin_alive.log'),
                  `✅ [NSO] Session ${sessionID} Initialized at ${new Date().toISOString()}\n`
                );
              } catch (_) {}

              await trackPerformance("init_session.py", elapsed, result.exitCode === 0 ? "success" : "error");
            }
          } catch (e) {
            debugLog(`Session init error: ${e.message}`);
          }
        }
      }
    },

    // ─── PRE-TOOL HOOK: validate_intent.py ───
    "tool.execute.before": async (input, output) => {
      const projectDir = getProjectDir();
      debugLog(`BEFORE hook called for tool: ${input.tool}`);

      try {
        const hookPath = path.join(projectDir, '.opencode', 'hooks', 'pre_tool_use', 'validate_intent.py');
        if (!fs.existsSync(hookPath)) return;
        if (!$) return;

        const payloadPath = writeTempPayload('hook_pre', {
          tool: input.tool,
          args: output.args,
          sessionID: input.sessionID,
          callID: input.callID
        });

        const start = performance.now();
        try {
          const result = await $`python3 ${hookPath} --payload ${payloadPath} --project-root ${projectDir}`.nothrow().quiet();
          const stdout = result.stdout.toString().trim();
          const elapsed = performance.now() - start;

          debugLog(`validate_intent: exitCode=${result.exitCode}, stdout="${stdout}"`);
          await trackPerformance("validate_intent.py", elapsed, result.exitCode === 0 ? "success" : "blocked");

          // EXIT CODE 1 = hook is BLOCKING this tool call
          if (result.exitCode !== 0 && stdout) {
            throw new Error(stdout);
          }
        } finally {
          cleanupTemp(payloadPath);
        }
      } catch (e) {
        // Re-throw blocking errors (from validate_intent)
        if (e.message && e.message.includes("SECURITY ALERT")) {
          throw e;
        }
        // Log but don't block on plugin infrastructure errors
        debugLog(`Pre-hook error (non-blocking): ${e.message}`);
      }
    },

    // ─── POST-TOOL HOOK: profiler.py ───
    // DEACTIVATED 2026-02-11: Profiler hook is non-functional (plugin passes args: {}, error: null hardcoded).
    // Only records tool name + timestamp. OpenCode's session.json provides better data.
    // See: /Users/opencode/.config/opencode/nso/deferred/profiler/README.md
    //
    // "tool.execute.after": async (input, output) => {
    //   const projectDir = getProjectDir();
    //
    //   try {
    //     const hookPath = path.join(projectDir, '.opencode', 'hooks', 'post_tool_use', 'profiler.py');
    //     if (!fs.existsSync(hookPath)) return;
    //     if (!$) return;
    //
    //     const payloadPath = writeTempPayload('hook_post', {
    //       tool: input.tool,
    //       sessionID: input.sessionID,
    //       callID: input.callID,
    //       args: {},
    //       title: output.title,
    //       output: typeof output.output === 'string' ? output.output.substring(0, 2000) : '',
    //       metadata: output.metadata,
    //       error: null
    //     });
    //
    //     const start = performance.now();
    //     try {
    //       const result = await $`python3 ${hookPath} --payload ${payloadPath} --project-root ${projectDir}`.nothrow().quiet();
    //       const stdout = result.stdout.toString().trim();
    //       const elapsed = performance.now() - start;
    //
    //       debugLog(`profiler: exitCode=${result.exitCode}, stdout="${stdout.substring(0, 200)}"`);
    //       await trackPerformance("profiler.py", elapsed, result.exitCode === 0 ? "success" : "error");
    //
    //       // Append any profiler warnings (e.g., loop detection) to tool output
    //       if (stdout) {
    //         output.output += "\n" + stdout;
    //       }
    //     } finally {
    //       cleanupTemp(payloadPath);
    //     }
    //   } catch (e) {
    //     debugLog(`Post-hook error: ${e.message}`);
    //   }
    // }
  };
}
