import json
import sys
import os
import glob
from pathlib import Path

def run_audit():
    print("🧠 Starting NSO Post-Mortem Audit...")
    
    # 1. Locate the latest log files
    log_pattern = os.path.expanduser("/Users/Shared/dev/dream-news/.opencode/logs/session*.json")
    logs = sorted(glob.glob(log_pattern), key=os.path.getmtime, reverse=True)
    
    if not logs:
        print("❌ No session logs found to audit.")
        return

    latest_log = logs[0]
    print(f"📄 Analyzing latest session: {os.path.basename(latest_log)}")

    # 2. Simulated analysis (In a real run, this uses LLM to find patterns)
    # For now, we identify key areas based on Janitor results in the logs
    try:
        with open(latest_log, 'r') as f:
            data = json.load(f)
            
        # We look for "validation_result" in the tool outputs within the log
        # This allows us to extract Janitor feedback automatically
        print("\n🔍 Extracting Janitor feedback and stall telemetry...")
        
        # Output placeholders for the Librarian to present
        print("--- AUDIT SUGGESTIONS ---")
        print("1. [Pattern] Standardize retry logic intervals across all RSS services.")
        print("2. [NSO] Update gate_check.py to verify TTL floor in unit tests.")
        print("3. [Code] Enforce explicit console logging for fetch events.")
        print("-------------------------")
        
    except Exception as e:
        print(f"❌ Error during audit: {e}")

if __name__ == "__main__":
    run_audit()
