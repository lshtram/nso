#!/usr/bin/env python3
"""
NSO Post-Tool Hook: Profiler & Auto-Healing (Global Template)

Logs tool execution data to profile.jsonl for pattern detection.
Detects error loops and emits warnings to stdout (injected into tool output).

Input: JSON payload via --payload <file> argument
       --project-root <dir> for correct log file resolution
Output: Warning messages to stdout if error patterns detected.
"""
import sys
import json
import time
import argparse
from pathlib import Path


def get_log_file(project_root=None):
    """Resolve profile.jsonl path using project root (not CWD)."""
    root = Path(project_root) if project_root else Path.cwd()
    log_file = root / ".opencode" / "logs" / "profile.jsonl"
    log_file.parent.mkdir(parents=True, exist_ok=True)
    return log_file


def debug_log(msg, project_root=None):
    """Log to profiler debug file."""
    try:
        root = Path(project_root) if project_root else Path.cwd()
        log_path = root / ".opencode" / "logs" / "hook_profiler.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a") as f:
            from datetime import datetime
            f.write(f"[{datetime.now().isoformat()}] {msg}\n")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="NSO Post-Tool Profiler")
    parser.add_argument("--payload", help="Path to JSON payload file")
    parser.add_argument("--project-root", help="Project root directory")
    args = parser.parse_args()

    project_root = args.project_root

    try:
        # Read payload from file (primary) or stdin (fallback)
        if args.payload:
            with open(args.payload, 'r') as f:
                input_data = f.read()
        else:
            input_data = sys.stdin.read()

        if not input_data:
            sys.exit(0)

        payload = json.loads(input_data)
        log_file = get_log_file(project_root)

        # ── 1. Build log entry ──
        log_entry = {
            "timestamp": time.time(),
            "tool": payload.get("tool"),
            "file": payload.get("args", {}).get("filePath") if isinstance(payload.get("args"), dict) else None,
            "duration": payload.get("duration"),
            "success": payload.get("error") is None
        }

        debug_log(f"Logging: tool={log_entry['tool']} success={log_entry['success']}", project_root)

        # ── 2. Append to JSONL (atomic-ish append) ──
        try:
            with open(log_file, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except (IOError, TypeError) as e:
            debug_log(f"Write error: {e}", project_root)

        # ── 3. Pattern Detection: detect error loops ──
        if not log_entry["success"]:
            try:
                lines = []
                if log_file.exists():
                    with open(log_file, "r") as f:
                        lines = f.readlines()[-10:]

                recent_errors = 0
                tool_name = payload.get("tool")

                for line in lines:
                    try:
                        entry = json.loads(line)
                        if not entry.get("success") and entry.get("tool") == tool_name:
                            recent_errors += 1
                    except json.JSONDecodeError:
                        continue

                if recent_errors >= 3:
                    warning = f"\n\n🛑 SYSTEM WARNING: You have failed {recent_errors} times recently with {tool_name}.\nSUGGESTION: Stop. Read the logs. Check if you are using the correct directory."
                    debug_log(f"Loop detected: {recent_errors} failures for {tool_name}", project_root)
                    print(warning)
            except Exception as e:
                debug_log(f"Pattern detection error: {e}", project_root)

        sys.exit(0)

    except json.JSONDecodeError as e:
        debug_log(f"JSON parse error: {e}", project_root)
        sys.exit(0)
    except Exception as e:
        debug_log(f"Hook error: {e}", project_root)
        sys.exit(0)


if __name__ == "__main__":
    main()
