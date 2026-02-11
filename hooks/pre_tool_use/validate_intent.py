#!/usr/bin/env python3
"""
NSO Pre-Tool Hook: Intent Guard & Safety Check (Global Template)

Receives tool call context and either allows (exit 0) or blocks (exit 1).
Input: JSON payload via --payload <file> argument
Output: stdout message on block, exit code 1 on block, 0 on allow.
"""
import sys
import json
import argparse
from pathlib import Path


def debug_log(msg, project_root=None):
    """Log to plugin debug file for diagnostics."""
    try:
        root = Path(project_root) if project_root else Path.cwd()
        log_file = root / ".opencode" / "logs" / "hook_validate_intent.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a") as f:
            from datetime import datetime
            f.write(f"[{datetime.now().isoformat()}] {msg}\n")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="NSO Pre-Tool Intent Validator")
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
            debug_log("No input data, allowing", project_root)
            sys.exit(0)

        payload = json.loads(input_data)
        tool_name = payload.get("tool", "")
        tool_args = payload.get("args", {})

        debug_log(f"Checking tool={tool_name} args_keys={list(tool_args.keys()) if isinstance(tool_args, dict) else 'N/A'}", project_root)

        # ── Rule 1: Block .env file edits ──
        if tool_name in ("write", "edit", "filesystem_write_file", "filesystem_edit_file"):
            file_path = ""
            if isinstance(tool_args, dict):
                file_path = tool_args.get("filePath", tool_args.get("path", ""))
            if ".env" in str(file_path) and ".environment" not in str(file_path):
                msg = "SECURITY ALERT: You are trying to edit a .env file. This is blocked by NSO policy."
                debug_log(f"BLOCKED: {msg}", project_root)
                print(msg)
                sys.exit(1)

        # ── Rule 2: Protect NSO meta context (warn only for now) ──
        if isinstance(tool_args, dict):
            file_path = tool_args.get("filePath", tool_args.get("path", ""))
            if ".opencode/context/00_meta" in str(file_path):
                debug_log(f"WARNING: Tool {tool_name} targeting meta context: {file_path}", project_root)

        # ── Rule 3: Block force push to main/master ──
        if tool_name in ("bash",):
            command = ""
            if isinstance(tool_args, dict):
                command = tool_args.get("command", "")
            if "push" in command and "--force" in command and ("main" in command or "master" in command):
                msg = "SECURITY ALERT: Force push to main/master is blocked by NSO policy."
                debug_log(f"BLOCKED: {msg}", project_root)
                print(msg)
                sys.exit(1)

        debug_log(f"ALLOWED: tool={tool_name}", project_root)
        sys.exit(0)

    except json.JSONDecodeError as e:
        debug_log(f"JSON parse error: {e}", project_root)
        sys.exit(0)  # Fail safe: allow
    except Exception as e:
        debug_log(f"Hook error: {e}", project_root)
        sys.exit(0)  # Fail safe: allow


if __name__ == "__main__":
    main()
