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
import re


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


def load_session_agent(project_root, session_id):
    """Resolve agent/mode for the current session from .opencode/logs/session.json."""
    if not project_root or not session_id:
        return None

    try:
        root = Path(project_root)
        session_log = root / ".opencode" / "logs" / "session.json"
        if not session_log.exists():
            return None

        data = json.loads(session_log.read_text())
        messages = data.get("messages", [])
        for msg in reversed(messages):
            if msg.get("sessionID") != session_id:
                continue
            if msg.get("role") != "assistant":
                continue
            agent = msg.get("agent") or msg.get("mode")
            if isinstance(agent, str) and agent.strip():
                return agent.strip().lower()
        return None
    except Exception as e:
        debug_log(f"session agent lookup failed: {e}", project_root)
        return None


def normalize_project_relative(raw_path, project_root):
    if not raw_path:
        return None

    p = str(raw_path).replace("\\", "/")
    if project_root:
        root = Path(project_root).resolve()
        abs_path = Path(p).resolve() if Path(p).is_absolute() else (root / p).resolve()
        try:
            rel = abs_path.relative_to(root)
            return str(rel).replace("\\", "/")
        except Exception:
            # Outside project root
            return str(abs_path).replace("\\", "/")
    return p.lstrip("/")


def extract_apply_patch_targets(patch_text):
    """Extract target file paths from apply_patch text envelope."""
    if not patch_text:
        return []

    targets = []
    patterns = [
        r"^\*\*\* Add File:\s+(.+)$",
        r"^\*\*\* Update File:\s+(.+)$",
        r"^\*\*\* Delete File:\s+(.+)$",
        r"^\*\*\* Move to:\s+(.+)$",
    ]

    for line in str(patch_text).splitlines():
        for pattern in patterns:
            m = re.match(pattern, line.strip())
            if m:
                targets.append(m.group(1).strip())
    return targets


def is_oracle_allowed_path(rel_path):
    """Oracle may edit orchestration docs/context, not implementation source."""
    if not rel_path:
        return False

    allowed_prefixes = (
        "docs/",
        ".opencode/context/",
    )
    return rel_path.startswith(allowed_prefixes)


def collect_mutation_targets(tool_name, tool_args):
    if not isinstance(tool_args, dict):
        return []

    if tool_name in ("write", "edit", "filesystem_write_file", "filesystem_edit_file", "filesystem_create_directory", "filesystem_delete_file"):
        p = tool_args.get("filePath", tool_args.get("path", ""))
        return [p] if p else []

    if tool_name in ("filesystem_move_file",):
        src = tool_args.get("source", "")
        dst = tool_args.get("destination", "")
        return [x for x in (src, dst) if x]

    if tool_name == "apply_patch":
        patch_text = tool_args.get("patchText", "")
        return extract_apply_patch_targets(patch_text)

    return []


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
        session_id = payload.get("sessionID", "")
        payload_agent = str(payload.get("agent", "") or payload.get("mode", "")).strip().lower()
        session_agent = payload_agent or load_session_agent(project_root, session_id)

        debug_log(
            f"Checking tool={tool_name} agent={session_agent or 'unknown'} args_keys={list(tool_args.keys()) if isinstance(tool_args, dict) else 'N/A'}",
            project_root,
        )

        # ── Rule 0: Oracle role guard (hard block) ──
        # Oracle is orchestration-only. Implementation file edits must be delegated.
        oracle_mutation_tools = {
            "apply_patch",
            "write",
            "edit",
            "filesystem_write_file",
            "filesystem_edit_file",
            "filesystem_move_file",
            "filesystem_create_directory",
            "filesystem_delete_file",
        }
        if session_agent == "oracle" and tool_name in oracle_mutation_tools:
            targets = collect_mutation_targets(tool_name, tool_args)
            normalized_targets = [
                t for t in (normalize_project_relative(raw, project_root) for raw in targets) if t
            ]

            if not normalized_targets:
                msg = (
                    "NSO ORACLE GUARD: Mutation blocked. Oracle may not perform direct implementation edits. "
                    "Create contract.md and delegate to Builder."
                )
                debug_log(f"BLOCKED: {msg}", project_root)
                print(msg)
                sys.exit(1)

            disallowed = [t for t in normalized_targets if not is_oracle_allowed_path(t)]
            if disallowed:
                sample = ", ".join(disallowed[:3])
                msg = (
                    "NSO ORACLE GUARD: Implementation edit blocked for Oracle "
                    f"(target: {sample}). Oracle may edit docs/ and .opencode/context/ only; delegate code edits to Builder."
                )
                debug_log(f"BLOCKED: {msg}", project_root)
                print(msg)
                sys.exit(1)

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
