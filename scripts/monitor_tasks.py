#!/usr/bin/env python3
import sys
import json
import time
from pathlib import Path

# NSO Task Monitor (Heartbeat)
# Usage: python monitor_tasks.py

STATUS_FILE = Path(".opencode/logs/task_status.json")
TIMEOUT_SECONDS = 300  # 5 minutes

def main():
    if not STATUS_FILE.exists():
        print("No task status log found.")
        sys.exit(0)
        
    try:
        with open(STATUS_FILE, "r") as f:
            data = json.load(f)
            
        agents = data.get("agents", {})
        now = time.time()
        
        print(f"❤️  NSO Heartbeat Monitor ({len(agents)} agents tracked)")
        print("-" * 40)
        
        for agent_id, info in agents.items():
            last_seen = info.get("last_heartbeat", 0)
            status = info.get("status", "unknown")
            step = info.get("current_step", "unknown")
            delta = now - last_seen
            
            status_icon = "🟢"
            if delta > TIMEOUT_SECONDS:
                status_icon = "🔴 STALLED"
            elif delta > 60:
                status_icon = "ww🟡 LAGGING"
                
            print(f"{status_icon} [{agent_id}] {status}: {step} (Last heard {int(delta)}s ago)")
            
    except Exception as e:
        print(f"Error reading status: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
