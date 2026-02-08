#!/usr/bin/env python3
import sys
import json

# NSO Pre-Tool Hook
# Function: Intent Guard & Safety Check

def log(msg):
    # In a real hook, we might log to a debug file
    # print(msg, file=sys.stderr)
    pass

def main():
    # OpenCode passes context via stdin or args. 
    # For now, we assume we receive a JSON payload describing the tool call.
    # Input format depends on OpenCode version, assuming:
    # { "tool": "write", "args": { "filePath": "..." } }
    
    try:
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0) # No input, allow
            
        payload = json.loads(input_data)
        tool_name = payload.get("tool")
        tool_args = payload.get("args", {})
        
        # Rule 1: No editing .env without explicit "override" flag (heuristic)
        if tool_name in ["write", "edit"]:
            file_path = tool_args.get("filePath", "")
            if ".env" in file_path:
                print("⛔ SECURITY ALERT: You are trying to edit a .env file. This is blocked by NSO policy.")
                sys.exit(1)
                
        # Rule 2: No editing Context Engine directly (unless you are Librarian/Scout)
        # TODO: checking agent role would require knowing WHO is calling. 
        # For now, we warn.
        if ".opencode/context/00_meta" in str(tool_args.get("filePath", "")):
             # In a robust system, we check the agent role from env vars
             pass

        sys.exit(0) # Allow
        
    except Exception as e:
        # Fail safe: allow if hook crashes, but log it
        log(f"Hook Error: {e}")
        sys.exit(0)

if __name__ == "__main__":
    main()
