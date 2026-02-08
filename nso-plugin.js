export default async function plugin({ $ }) {
  // Track initialized sessions to run init_session.py only once per session
  const initializedSessions = new Set();
  // Track routed messages to avoid duplicate routing
  const routedMessages = new Set();

  return {
    // Initialize session when created (runs once per session)
    "session.created": async (input) => {
      try {
        // Run init_session.py to load project context
        const initOutput = await $`python3 ~/.config/opencode/nso/scripts/init_session.py`.nothrow().text();
        
        // Track this session as initialized
        initializedSessions.add(input.sessionID);
        
        console.log("✅ NSO Session Initialized");
      } catch (e) {
        // Don't fail if init_session.py has issues, just log it
        console.warn("⚠️ NSO init_session.py warning:", e.message);
      }
    },
    
    // Monitor messages for router (runs on every message update)
    "message.updated": async (input) => {
      try {
        // Only route if this is a new message (not an update to existing)
        const messageId = input.message?.id || input.message?.content;
        if (routedMessages.has(messageId)) {
          return; // Already routed this message
        }
        routedMessages.add(messageId);
        
        // Only process user messages
        if (input.message?.role !== 'user') {
          return;
        }
        
        // Run router monitor
        const result = await $`python3 ~/.config/opencode/nso/scripts/router_monitor.py ${input.message.content}`.nothrow().json();
        
        // Log routing decision for Oracle to see
        if (result && result.should_route) {
          console.log(`🎯 NSO ROUTING: ${result.workflow} (${Math.round(result.confidence * 100)}% confidence)`);
        }
      } catch (e) {
        // Don't fail if router has issues
        console.warn("⚠️ NSO router warning:", e.message);
      }
    },
    
    "tool.execute.before": async (input, output) => {

      try {
        const payload = JSON.stringify({
          tool: input.tool,
          args: output.args,
          sessionID: input.sessionID,
          callID: input.callID
        });
        
        // Use Bun shell ($) to run the python hook
        // .opencode/hooks/pre_tool_use/validate_intent.py
        const res = await $`python3 .opencode/hooks/pre_tool_use/validate_intent.py`.stdin(payload).nothrow().text();
        
        if (res.trim()) {
           // If the hook printed something, it's likely an error message
           // validate_intent.py prints to stdout and exits with 1 on failure
        }
      } catch (e) {
        // validate_intent.py exits with 1 on security alert
        if (e.stdout) {
           throw new Error(e.stdout.toString().trim());
        }
        // If it's just a non-zero exit code without stdout
        throw e;
      }
    },
    "tool.execute.after": async (input, output) => {
      try {
        const payload = JSON.stringify({
          tool: input.tool,
          sessionID: input.sessionID,
          callID: input.callID,
          args: {}, // tool.execute.after input doesn't provide args directly in the type, but let's be safe
          title: output.title,
          output: output.output,
          metadata: output.metadata,
          error: null // Assuming success if we are here
        });

        const res = await $`python3 .opencode/hooks/post_tool_use/profiler.py`.stdin(payload).nothrow().text();
        
        if (res.trim()) {
          // profiler.py might print "detected a stall" or "VALIDATION FAILED"
          // We append this to the output to force the agent to see it
          output.output += "\n" + res.trim();
        }
      } catch (e) {
        // Ignore profiler errors to not break the tool loop
      }
    }
  };
}
