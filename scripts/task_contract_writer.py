#!/usr/bin/env python3
"""
NSO Task Contract Writer

Creates structured contract files for agent delegation.
Oracle writes a contract before calling task() so the sub-agent
has a human-readable spec of what to do.

Usage (CLI):
    python3 task_contract_writer.py \
        --task-id "dream-news_build_20260208_abc123_001" \
        --agent "Builder" \
        --workflow "BUILD" \
        --phase "IMPLEMENTATION" \
        --objective "Implement user auth feature" \
        --requirements "REQ-Auth.md" \
        --criteria "Login endpoint works" "Tests pass"

Usage (Python):
    from task_contract_writer import TaskContractWriter
    writer = TaskContractWriter()
    path = writer.write_contract(
        task_id="...", agent="Builder", workflow="BUILD", ...
    )
"""

import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Optional


class TaskContractWriter:
    """Writes task contract files for agent delegation."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or Path(".opencode/context/active_tasks")

    def _task_dir(self, task_id: str) -> Path:
        d = self.base_dir / task_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def write_contract(
        self,
        task_id: str,
        agent: str,
        workflow: str,
        phase: str,
        objective: str,
        requirements_ref: str = "",
        criteria: Optional[List[str]] = None,
        context_files: Optional[List[str]] = None,
    ) -> Path:
        """Write contract.md for a delegation task."""
        criteria = criteria or []
        context_files = context_files or []
        ts = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")

        criteria_md = "\n".join(f"- [ ] {c}" for c in criteria) if criteria else "- [ ] Task completed successfully"
        files_md = "\n".join(f"- {f}" for f in context_files) if context_files else "- (none specified)"

        content = f"""# Task Contract: {task_id}

| Field | Value |
|-------|-------|
| Agent | {agent} |
| Workflow | {workflow} |
| Phase | {phase} |
| Created | {ts} |
| Delegated By | Oracle |

## Objective
{objective}

## Requirements
{requirements_ref or "(inline — see objective)"}

## Success Criteria
{criteria_md}

## Context Files
{files_md}

## Instructions
1. Read all context files listed above
2. If anything is unclear, write questions to `questions.md` in this folder and STOP
3. Update `status.md` as you work
4. Write final results to `result.md`
5. Ensure all success criteria are met before completing
"""
        path = self._task_dir(task_id) / "contract.md"
        path.write_text(content)

        # Also write initial status.md
        self._write_initial_status(task_id)

        return path

    def _write_initial_status(self, task_id: str) -> Path:
        """Write initial status.md (PENDING)."""
        ts = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        content = f"""# Task Status: {task_id}

- Status: PENDING
- Last Update: {ts}
- Current Step: Awaiting agent pickup

## Completed
(none yet)

## Remaining
- Read contract
- Execute task
- Write result

## Artifacts
(none yet)
"""
        path = self._task_dir(task_id) / "status.md"
        path.write_text(content)
        return path

    def read_result(self, task_id: str) -> Optional[str]:
        """Read result.md if it exists."""
        path = self._task_dir(task_id) / "result.md"
        return path.read_text() if path.exists() else None

    def has_questions(self, task_id: str) -> bool:
        """Check if agent wrote questions.md (needs clarification)."""
        return (self._task_dir(task_id) / "questions.md").exists()

    def read_questions(self, task_id: str) -> Optional[str]:
        """Read questions.md if it exists."""
        path = self._task_dir(task_id) / "questions.md"
        return path.read_text() if path.exists() else None

    def list_active_tasks(self) -> List[str]:
        """List all task IDs in active_tasks/."""
        if not self.base_dir.exists():
            return []
        return [d.name for d in self.base_dir.iterdir() if d.is_dir() and d.name != ".gitkeep"]


def main():
    parser = argparse.ArgumentParser(description="NSO Task Contract Writer")
    sub = parser.add_subparsers(dest="command")

    # write command
    write_p = sub.add_parser("write", help="Write a new task contract")
    write_p.add_argument("--task-id", required=True)
    write_p.add_argument("--agent", required=True)
    write_p.add_argument("--workflow", default="BUILD")
    write_p.add_argument("--phase", default="IMPLEMENTATION")
    write_p.add_argument("--objective", required=True)
    write_p.add_argument("--requirements", default="")
    write_p.add_argument("--criteria", nargs="*", default=[])
    write_p.add_argument("--context-files", nargs="*", default=[])

    # check command
    check_p = sub.add_parser("check", help="Check task status")
    check_p.add_argument("--task-id", required=True)

    # list command
    sub.add_parser("list", help="List active tasks")

    args = parser.parse_args()
    writer = TaskContractWriter()

    if args.command == "write":
        path = writer.write_contract(
            task_id=args.task_id,
            agent=args.agent,
            workflow=args.workflow,
            phase=args.phase,
            objective=args.objective,
            requirements_ref=args.requirements,
            criteria=args.criteria,
            context_files=args.context_files,
        )
        print(f"Contract written: {path}")

    elif args.command == "check":
        has_q = writer.has_questions(args.task_id)
        result = writer.read_result(args.task_id)
        print(json.dumps({
            "task_id": args.task_id,
            "has_questions": has_q,
            "has_result": result is not None,
            "questions": writer.read_questions(args.task_id) if has_q else None,
        }, indent=2))

    elif args.command == "list":
        tasks = writer.list_active_tasks()
        print(json.dumps({"active_tasks": tasks, "count": len(tasks)}, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
