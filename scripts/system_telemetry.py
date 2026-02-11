#!/usr/bin/env python3
"""
NSO System Telemetry

Logs script execution stats to detect loops and stalls.
Supports both file-based IPC (--payload) and stdin for backwards compatibility.

Input: JSON with { "script": "name.py", "duration": 123.45, "status": "success" }
"""
import sys
import json
import time
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="NSO System Telemetry")
    parser.add_argument("--payload", help="Path to JSON payload file")
    parser.add_argument("--project-root", help="Project root directory")
    args = parser.parse_args()

    try:
        # Read payload from file (primary) or stdin (fallback)
        if args.payload:
            with open(args.payload, 'r') as f:
                input_data = f.read()
        else:
            input_data = sys.stdin.read()

        if not input_data:
            sys.exit(0)

        data = json.loads(input_data)
        script_name = data.get("script")
        duration = data.get("duration", 0)
        status = data.get("status", "unknown")

        # Resolve project root: argument > env > cwd
        if args.project_root:
            project_root = Path(args.project_root)
        elif "NSO_PROJECT_ROOT" in __import__('os').environ:
            project_root = Path(__import__('os').environ["NSO_PROJECT_ROOT"])
        else:
            project_root = Path.cwd()

        log_file = project_root / ".opencode" / "logs" / "system_telemetry.json"
        log_file.parent.mkdir(parents=True, exist_ok=True)

        # Load existing telemetry
        telemetry = {}
        if log_file.exists():
            try:
                telemetry = json.loads(log_file.read_text())
            except (json.JSONDecodeError, IOError):
                telemetry = {}

        if "scripts" not in telemetry:
            telemetry["scripts"] = {}

        if script_name not in telemetry["scripts"]:
            telemetry["scripts"][script_name] = {
                "count": 0,
                "total_duration": 0,
                "max_duration": 0,
                "min_duration": float('inf'),
                "last_duration": 0,
                "failures": 0
            }

        stats = telemetry["scripts"][script_name]
        stats["count"] += 1
        stats["total_duration"] += duration
        stats["max_duration"] = max(stats["max_duration"], duration)
        stats["min_duration"] = min(stats["min_duration"], duration)
        stats["last_duration"] = duration
        stats["avg_duration"] = stats["total_duration"] / stats["count"]

        if status != "success":
            stats["failures"] += 1

        # Global stats
        telemetry["total_calls"] = telemetry.get("total_calls", 0) + 1
        telemetry["last_update"] = time.time()

        # Loop Detection (Rate Limiting)
        current_time = time.time()
        if "recent_calls" not in stats:
            stats["recent_calls"] = []

        # Keep only calls from last 2 seconds
        stats["recent_calls"] = [t for t in stats["recent_calls"] if current_time - t < 2.0]
        stats["recent_calls"].append(current_time)

        # Write telemetry (strip recent_calls from persisted data to keep file clean)
        persist = json.loads(json.dumps(telemetry))
        for s in persist.get("scripts", {}).values():
            s.pop("recent_calls", None)
        log_file.write_text(json.dumps(persist, indent=2))

        if len(stats["recent_calls"]) > 10:
            sys.stderr.write(f"🚨 [LOOP DETECTED] {script_name} called {len(stats['recent_calls'])} times in 2s!\n")

        # Performance Alert (if script takes > 200ms)
        if duration > 200:
            sys.stderr.write(f"⚠️ [PERF ALERT] {script_name} took {duration:.2f}ms\n")

    except Exception as e:
        sys.stderr.write(f"Telemetry Error: {str(e)}\n")


if __name__ == "__main__":
    main()
