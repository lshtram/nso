#!/usr/bin/env python3
"""
NSO Workflow Orchestrator — Filesystem-Based Phase Enforcement

Enforces the phase sequence for BUILD/DEBUG/REVIEW workflows using
filesystem state. The Oracle template tells the agent what to do;
this script provides programmatic enforcement.

Design: Filesystem is the database. Each task has its own directory
under .opencode/context/active_tasks/{task_id}/. State is tracked
via workflow_state.md. This script reads/writes that file — it does
NOT maintain any in-memory or external state.

Usage:
    python3 workflow_orchestrator.py start --workflow BUILD --task-id rss_collector --agent-id oracle_a3f2
    python3 workflow_orchestrator.py transition --task-id rss_collector --to ARCHITECTURE --agent-id oracle_a3f2
    python3 workflow_orchestrator.py status --task-id rss_collector
    python3 workflow_orchestrator.py list
"""

from __future__ import annotations

import json
import sys
import argparse
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import Optional

# Import gate_check for transition validation
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))
from gate_check import check_gate


# ─── Phase Definitions ──────────────────────────────────────────────

WORKFLOW_PHASES: dict[str, list[str]] = {
    "BUILD": ["DISCOVERY", "ARCHITECTURE", "IMPLEMENTATION", "VALIDATION", "CLOSURE"],
    "DEBUG": ["INVESTIGATION", "FIX", "VALIDATION", "CLOSURE"],
    "REVIEW": ["SCOPE", "ANALYSIS", "REPORT", "CLOSURE"],
}

# Maps (workflow, exiting_phase) → the gate to check before allowing transition
# Gate checks the exiting phase's artifacts. If no gate exists, transition is allowed.
# Every non-CLOSURE phase should have a gate. CLOSURE phases auto-pass (no gate needed).
PHASE_GATES: dict[str, dict[str, str]] = {
    "BUILD": {
        "DISCOVERY": "DISCOVERY",           # Check Discovery gate before → Architecture
        "ARCHITECTURE": "ARCHITECTURE",     # Check Architecture gate before → Implementation
        "IMPLEMENTATION": "IMPLEMENTATION", # Check Implementation gate before → Validation
        "VALIDATION": "VALIDATION",         # Check Validation gate before → Closure
    },
    "DEBUG": {
        "INVESTIGATION": "INVESTIGATION",   # Check Investigation gate before → Fix
        "FIX": "FIX",                       # Check Fix gate before → Validation
        "VALIDATION": "VALIDATION",         # Check Validation gate before → Closure
    },
    "REVIEW": {
        "SCOPE": "SCOPE",                   # Check Scope gate before → Analysis
        "ANALYSIS": "ANALYSIS",             # Check Analysis gate before → Report
        "REPORT": "REPORT",                 # Check Report gate before → Closure
    },
}


@dataclass
class WorkflowState:
    """Persisted state for a single task's workflow."""
    task_id: str
    workflow: str
    current_phase: str
    agent_id: str
    started_at: str
    updated_at: str
    phase_history: list[dict] = field(default_factory=list)
    status: str = "ACTIVE"  # ACTIVE, COMPLETE, CANCELLED

    def to_markdown(self) -> str:
        """Serialize to a markdown file (human-readable + machine-parseable)."""
        lines = [
            "# Workflow State",
            "",
            f"- **Task ID:** {self.task_id}",
            f"- **Workflow:** {self.workflow}",
            f"- **Current Phase:** {self.current_phase}",
            f"- **Status:** {self.status}",
            f"- **Agent ID:** {self.agent_id}",
            f"- **Started:** {self.started_at}",
            f"- **Updated:** {self.updated_at}",
            "",
            "## Phase History",
            "",
        ]
        for entry in self.phase_history:
            lines.append(f"- {entry['timestamp']} | {entry['from_phase']} -> {entry['to_phase']} | agent: {entry.get('agent_id', 'unknown')}")

        return "\n".join(lines) + "\n"

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)

    @classmethod
    def from_markdown(cls, content: str, task_id: str) -> WorkflowState:
        """Parse a workflow_state.md file back into a WorkflowState object."""
        fields: dict[str, str] = {}
        phase_history: list[dict] = []

        in_history = False
        for line in content.split("\n"):
            stripped = line.strip()

            # Parse key-value fields
            if stripped.startswith("- **") and ":**" in stripped:
                key_part = stripped.split(":**")[0].replace("- **", "").strip()
                val_part = stripped.split(":**")[1].strip()
                fields[key_part.lower().replace(" ", "_")] = val_part

            # Parse phase history
            if "## Phase History" in stripped:
                in_history = True
                continue
            if in_history and stripped.startswith("- ") and "|" in stripped:
                parts = stripped[2:].split("|")
                if len(parts) >= 2:
                    timestamp = parts[0].strip()
                    transition = parts[1].strip()
                    agent = parts[2].strip().replace("agent: ", "") if len(parts) > 2 else "unknown"

                    from_to = transition.split("->")
                    if len(from_to) == 2:
                        phase_history.append({
                            "timestamp": timestamp,
                            "from_phase": from_to[0].strip(),
                            "to_phase": from_to[1].strip(),
                            "agent_id": agent,
                        })

        return cls(
            task_id=task_id,
            workflow=fields.get("workflow", "BUILD"),
            current_phase=fields.get("current_phase", "UNKNOWN"),
            agent_id=fields.get("agent_id", "unknown"),
            started_at=fields.get("started", ""),
            updated_at=fields.get("updated", ""),
            phase_history=phase_history,
            status=fields.get("status", "ACTIVE"),
        )


# ─── Core Functions ─────────────────────────────────────────────────

def _get_tasks_dir() -> Path:
    """Get the active_tasks directory (project-relative)."""
    return Path(".opencode/context/active_tasks")


def _get_task_dir(task_id: str) -> Path:
    """Get directory for a specific task."""
    return _get_tasks_dir() / task_id


def _get_state_path(task_id: str) -> Path:
    """Get the workflow_state.md path for a task."""
    return _get_task_dir(task_id) / "workflow_state.md"


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def start_workflow(
    workflow: str,
    task_id: str,
    agent_id: str,
) -> dict:
    """
    Start a new workflow. Creates task directory and initializes state.

    Returns JSON-serializable result dict.
    """
    workflow = workflow.upper()

    # Validate workflow type
    if workflow not in WORKFLOW_PHASES:
        return {
            "success": False,
            "error": f"Unknown workflow '{workflow}'. Valid: {list(WORKFLOW_PHASES.keys())}",
        }

    task_dir = _get_task_dir(task_id)
    state_path = _get_state_path(task_id)

    # Check if task already exists
    if state_path.exists():
        existing = WorkflowState.from_markdown(state_path.read_text(), task_id)
        if existing.status == "ACTIVE":
            return {
                "success": False,
                "error": f"Task '{task_id}' already has an active {existing.workflow} workflow "
                         f"in phase {existing.current_phase}. "
                         f"Use 'transition' to advance or 'cancel' to reset.",
            }

    # Create task directory
    task_dir.mkdir(parents=True, exist_ok=True)

    # Initialize state
    first_phase = WORKFLOW_PHASES[workflow][0]
    now = _now()

    state = WorkflowState(
        task_id=task_id,
        workflow=workflow,
        current_phase=first_phase,
        agent_id=agent_id,
        started_at=now,
        updated_at=now,
        phase_history=[],
        status="ACTIVE",
    )

    state_path.write_text(state.to_markdown())

    return {
        "success": True,
        "task_id": task_id,
        "workflow": workflow,
        "current_phase": first_phase,
        "task_dir": str(task_dir),
        "agent_id": agent_id,
        "message": f"Workflow {workflow} started. Current phase: {first_phase}",
    }


def transition_phase(
    task_id: str,
    to_phase: str,
    agent_id: str,
    skip_gate: bool = False,
) -> dict:
    """
    Transition a task to the next phase. Runs gate_check before allowing.

    Args:
        task_id: Task identifier
        to_phase: Target phase to transition TO
        agent_id: Agent requesting the transition
        skip_gate: If True, skip gate check (for emergency use — logged)

    Returns JSON-serializable result dict.
    """
    to_phase = to_phase.upper()
    state_path = _get_state_path(task_id)
    task_dir = _get_task_dir(task_id)

    # Load current state
    if not state_path.exists():
        return {
            "success": False,
            "error": f"Task '{task_id}' not found. Use 'start' first.",
        }

    state = WorkflowState.from_markdown(state_path.read_text(), task_id)

    if state.status != "ACTIVE":
        return {
            "success": False,
            "error": f"Task '{task_id}' is {state.status}, not ACTIVE.",
        }

    # Validate phase sequence
    phases = WORKFLOW_PHASES.get(state.workflow, [])
    if to_phase not in phases:
        return {
            "success": False,
            "error": f"Phase '{to_phase}' is not valid for workflow {state.workflow}. "
                     f"Valid phases: {phases}",
        }

    current_idx = phases.index(state.current_phase) if state.current_phase in phases else -1
    target_idx = phases.index(to_phase)

    if target_idx != current_idx + 1:
        return {
            "success": False,
            "error": f"Cannot jump from {state.current_phase} to {to_phase}. "
                     f"Next valid phase: {phases[current_idx + 1] if current_idx + 1 < len(phases) else 'COMPLETE'}",
        }

    # Run gate check for the EXITING phase
    gate_result = None
    gate_phase = PHASE_GATES.get(state.workflow, {}).get(state.current_phase)

    if gate_phase and not skip_gate:
        gate_result = check_gate(
            workflow=state.workflow,
            phase=gate_phase,
            task_dir=str(task_dir),
            agent_id=agent_id,
        )

        if not gate_result.passed:
            return {
                "success": False,
                "error": f"Gate check FAILED for {state.workflow}/{state.current_phase}. "
                         f"Cannot transition to {to_phase}.",
                "gate_result": {
                    "passed": gate_result.passed,
                    "reason": gate_result.reason,
                    "missing_artifacts": gate_result.missing_artifacts,
                    "found_artifacts": gate_result.found_artifacts,
                },
            }

    # Record the transition
    now = _now()
    state.phase_history.append({
        "timestamp": now,
        "from_phase": state.current_phase,
        "to_phase": to_phase,
        "agent_id": agent_id,
        "gate_skipped": skip_gate,
    })

    # Update state
    state.current_phase = to_phase
    state.updated_at = now
    state.agent_id = agent_id

    # If transitioning to CLOSURE, mark as COMPLETE
    if to_phase == "CLOSURE":
        state.status = "COMPLETE"

    state_path.write_text(state.to_markdown())

    result = {
        "success": True,
        "task_id": task_id,
        "workflow": state.workflow,
        "from_phase": state.phase_history[-1]["from_phase"],
        "to_phase": to_phase,
        "status": state.status,
        "agent_id": agent_id,
        "message": f"Transitioned {state.phase_history[-1]['from_phase']} -> {to_phase}",
    }

    if gate_result:
        result["gate_result"] = {
            "passed": gate_result.passed,
            "reason": gate_result.reason,
            "found_artifacts": gate_result.found_artifacts,
        }

    if skip_gate:
        result["warning"] = "Gate check was SKIPPED. This is logged."

    return result


def get_status(task_id: str) -> dict:
    """Get current workflow status for a task by reading the filesystem."""
    state_path = _get_state_path(task_id)

    if not state_path.exists():
        return {
            "success": False,
            "error": f"Task '{task_id}' not found.",
        }

    state = WorkflowState.from_markdown(state_path.read_text(), task_id)
    phases = WORKFLOW_PHASES.get(state.workflow, [])

    current_idx = phases.index(state.current_phase) if state.current_phase in phases else -1
    next_phase = phases[current_idx + 1] if current_idx + 1 < len(phases) else None

    return {
        "success": True,
        "task_id": task_id,
        "workflow": state.workflow,
        "current_phase": state.current_phase,
        "status": state.status,
        "agent_id": state.agent_id,
        "started_at": state.started_at,
        "updated_at": state.updated_at,
        "next_phase": next_phase,
        "phases_completed": current_idx + 1,
        "phases_total": len(phases),
        "phase_history": state.phase_history,
    }


def list_tasks() -> dict:
    """List all tasks and their current status by reading the filesystem."""
    tasks_dir = _get_tasks_dir()

    if not tasks_dir.exists():
        return {"success": True, "tasks": [], "message": "No active_tasks directory"}

    tasks = []
    for task_dir in sorted(tasks_dir.iterdir()):
        if not task_dir.is_dir():
            continue

        state_path = task_dir / "workflow_state.md"
        if state_path.exists():
            state = WorkflowState.from_markdown(state_path.read_text(), task_dir.name)
            tasks.append({
                "task_id": task_dir.name,
                "workflow": state.workflow,
                "current_phase": state.current_phase,
                "status": state.status,
                "agent_id": state.agent_id,
                "updated_at": state.updated_at,
            })
        else:
            tasks.append({
                "task_id": task_dir.name,
                "workflow": "UNKNOWN",
                "current_phase": "UNKNOWN",
                "status": "NO_STATE",
                "agent_id": "",
                "updated_at": "",
            })

    return {"success": True, "tasks": tasks, "count": len(tasks)}


def cancel_task(task_id: str, agent_id: str) -> dict:
    """Cancel an active workflow."""
    state_path = _get_state_path(task_id)

    if not state_path.exists():
        return {
            "success": False,
            "error": f"Task '{task_id}' not found.",
        }

    state = WorkflowState.from_markdown(state_path.read_text(), task_id)

    if state.status != "ACTIVE":
        return {
            "success": False,
            "error": f"Task '{task_id}' is already {state.status}.",
        }

    now = _now()
    state.phase_history.append({
        "timestamp": now,
        "from_phase": state.current_phase,
        "to_phase": "CANCELLED",
        "agent_id": agent_id,
    })
    state.status = "CANCELLED"
    state.updated_at = now
    state_path.write_text(state.to_markdown())

    return {
        "success": True,
        "task_id": task_id,
        "message": f"Task '{task_id}' cancelled at phase {state.current_phase}.",
    }


# ─── CLI ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="NSO Workflow Orchestrator — Phase enforcement via filesystem state"
    )
    sub = parser.add_subparsers(dest="command")

    # start
    start_p = sub.add_parser("start", help="Start a new workflow for a task")
    start_p.add_argument("--workflow", required=True, help="BUILD, DEBUG, or REVIEW")
    start_p.add_argument("--task-id", required=True, help="Unique task identifier")
    start_p.add_argument("--agent-id", required=True, help="Agent ID (e.g., oracle_a3f2)")

    # transition
    trans_p = sub.add_parser("transition", help="Transition to next phase (with gate check)")
    trans_p.add_argument("--task-id", required=True, help="Task identifier")
    trans_p.add_argument("--to", required=True, dest="to_phase", help="Target phase")
    trans_p.add_argument("--agent-id", required=True, help="Agent requesting transition")
    trans_p.add_argument("--skip-gate", action="store_true", help="Skip gate check (emergency, logged)")

    # status
    status_p = sub.add_parser("status", help="Get current status of a task")
    status_p.add_argument("--task-id", required=True, help="Task identifier")

    # list
    sub.add_parser("list", help="List all tasks and their statuses")

    # cancel
    cancel_p = sub.add_parser("cancel", help="Cancel an active workflow")
    cancel_p.add_argument("--task-id", required=True, help="Task identifier")
    cancel_p.add_argument("--agent-id", required=True, help="Agent requesting cancellation")

    args = parser.parse_args()

    if args.command == "start":
        result = start_workflow(
            workflow=args.workflow,
            task_id=args.task_id,
            agent_id=args.agent_id,
        )
    elif args.command == "transition":
        result = transition_phase(
            task_id=args.task_id,
            to_phase=args.to_phase,
            agent_id=args.agent_id,
            skip_gate=args.skip_gate,
        )
    elif args.command == "status":
        result = get_status(task_id=args.task_id)
    elif args.command == "list":
        result = list_tasks()
    elif args.command == "cancel":
        result = cancel_task(
            task_id=args.task_id,
            agent_id=args.agent_id,
        )
    else:
        parser.print_help()
        sys.exit(0)

    print(json.dumps(result, indent=2))
    sys.exit(0 if result.get("success", False) else 1)


if __name__ == "__main__":
    main()
