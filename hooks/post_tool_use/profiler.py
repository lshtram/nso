#!/usr/bin/env python3
import sys
import json
import time
import subprocess
from pathlib import Path

# NSO Post-Tool Hook
# Function: Profiling & Auto-Healing

LOG_FILE = Path(".opencode/logs/profile.json")

def append_log(entry):
    entries = []
    if LOG_FILE.exists():
        try:
            with open(LOG_FILE, "r") as f:
                entries = json.load(f)
        except (json.JSONDecodeError, IOError):
            entries = []
        
        if not isinstance(entries, list):
            entries = []
    
    entries.append(entry)
    
    with open(LOG_FILE, "w") as f:
        json.dump(entries, f, indent=2)

def main():
    # Input: JSON with result of tool execution
    # { "tool": "write", "args": {...}, "result": "...", "duration": 123 }
    
    try:
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)
            
        payload = json.loads(input_data)
        
        # 1. Profiling
        log_entry = {
            "timestamp": time.time(),
            "tool": payload.get("tool"),
            "file": payload.get("args", {}).get("filePath"),
            "duration": payload.get("duration"),
            "success": payload.get("error") is None
        }
        
        # Helper to read recent entries for pattern detection
        entries = []
        if LOG_FILE.exists():
            try:
                with open(LOG_FILE, "r") as f:
                    entries = json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
            
            if not isinstance(entries, list):
                entries = []
                
        entries.append(log_entry)
        
        # Write back log
        try:
            with open(LOG_FILE, "w") as f:
                json.dump(entries, f, indent=2)
        except (IOError, TypeError):
            pass
        
        # 3. Pattern Detection (Self-Improvement)
        # Check for repeated errors
        tool_name = payload.get("tool")
        if not log_entry["success"]:
            recent_errors = [e for e in entries[-5:] if not e.get("success") and e.get("tool") == tool_name]
            if len(recent_errors) >= 3:
                # Detected a stall/loop
                print(f"\n\n🛑 SYSTEM WARNING: You have failed {len(recent_errors)} times in a row.")
                print("SUGGESTION: Stop. Read the logs. Check if you are using the correct directory.")
        tool = payload.get("tool")
        if tool in ["write", "edit"]:
            file_path = payload.get("args", {}).get("filePath")
            if file_path:
                # Trigger validator script
                # We assume the validator script is executable
                validator_path = Path(".opencode/scripts/validate.py")
                if validator_path.exists():
                    res = subprocess.run(
                        ["python3", str(validator_path), file_path],
                        capture_output=True,
                        text=True
                    )
                    
                    if res.returncode != 0:
                        # HEALING: If validation fails, we append the error to the tool output
                        # This forces the agent to see the error immediately
                        print(f"\n\n🚨 NSO SELF-HEALING ALERT 🚨\nYour changes saved, but VALIDATION FAILED:\n{res.stdout}\n{res.stderr}\nFIX THIS IMMEDIATELY.")
                        sys.exit(0)

        sys.exit(0)
        
    except Exception:
        sys.exit(0)

if __name__ == "__main__":
    main()
