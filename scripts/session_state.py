"""
Session State Manager for NSO Workflow Recovery.

Tracks active delegations and enables recovery after interruptions.

@implements: NSO-Recovery-1
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


# Session state file
SESSION_STATE_FILE = Path(".opencode/logs/session_state.json")


@dataclass
class DelegationState:
    """State of an active delegation."""
    delegator: str  # "Oracle", "Janitor", etc.
    delegate: str    # "Builder", "Librarian", etc.
    workflow: str    # "BUILD", "DEBUG", "REVIEW"
    phase: str       # "IMPLEMENTATION", "VALIDATION", etc.
    task_description: str
    started_at: str  # ISO timestamp
    last_activity: str  # ISO timestamp
    artifacts: list[str] = field(default_factory=list)
    checkpoint: Optional[str] = None  # Last known checkpoint
    interrupted: bool = False


@dataclass
class SessionState:
    """Complete session state for recovery."""
    active_delegation: Optional[DelegationState] = None
    history: list[DelegationState] = field(default_factory=list)
    current_agent: str = "Oracle"
    current_workflow: Optional[str] = None
    current_phase: Optional[str] = None


def load_session_state() -> SessionState:
    """Load session state from file."""
    if not SESSION_STATE_FILE.exists():
        return SessionState()

    try:
        data = json.loads(SESSION_STATE_FILE.read_text())
        state = SessionState(
            current_agent=data.get("current_agent", "Oracle"),
            current_workflow=data.get("current_workflow"),
            current_phase=data.get("current_phase"),
            history=[
                DelegationState(
                    delegator=h["delegator"],
                    delegate=h["delegate"],
                    workflow=h["workflow"],
                    phase=h["phase"],
                    task_description=h["task_description"],
                    started_at=h["started_at"],
                    last_activity=h["last_activity"],
                    artifacts=h.get("artifacts", []),
                    checkpoint=h.get("checkpoint"),
                    interrupted=h.get("interrupted", False),
                )
                for h in data.get("history", [])
            ],
        )

        if data.get("active_delegation"):
            state.active_delegation = DelegationState(
                delegator=data["active_delegation"]["delegator"],
                delegate=data["active_delegation"]["delegate"],
                workflow=data["active_delegation"]["workflow"],
                phase=data["active_delegation"]["phase"],
                task_description=data["active_delegation"]["task_description"],
                started_at=data["active_delegation"]["started_at"],
                last_activity=data["active_delegation"]["last_activity"],
                artifacts=data["active_delegation"].get("artifacts", []),
                checkpoint=data["active_delegation"].get("checkpoint"),
            )

        return state

    except (json.JSONDecodeError, KeyError) as e:
        print(f"⚠️ Warning: Failed to load session state: {e}")
        return SessionState()


def save_session_state(state: SessionState) -> None:
    """Save session state to file."""
    data = {
        "current_agent": state.current_agent,
        "current_workflow": state.current_workflow,
        "current_phase": state.current_phase,
        "history": [
            {
                "delegator": d.delegator,
                "delegate": d.delegate,
                "workflow": d.workflow,
                "phase": d.phase,
                "task_description": d.task_description,
                "started_at": d.started_at,
                "last_activity": d.last_activity,
                "artifacts": d.artifacts,
                "checkpoint": d.checkpoint,
                "interrupted": d.interrupted,
            }
            for d in state.history
        ],
    }

    if state.active_delegation:
        data["active_delegation"] = {
            "delegator": state.active_delegation.delegator,
            "delegate": state.active_delegation.delegate,
            "workflow": state.active_delegation.workflow,
            "phase": state.active_delegation.phase,
            "task_description": state.active_delegation.task_description,
            "started_at": state.active_delegation.started_at,
            "last_activity": state.active_delegation.last_activity,
            "artifacts": state.active_delegation.artifacts,
            "checkpoint": state.active_delegation.checkpoint,
        }

    SESSION_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_STATE_FILE.write_text(json.dumps(data, indent=2))


def start_delegation(
    delegator: str,
    delegate: str,
    workflow: str,
    phase: str,
    task_description: str,
) -> DelegationState:
    """
    Start a delegation and track it in session state.

    Returns the delegation state for the delegate to use.
    """
    state = load_session_state()

    # Mark any previous delegation as interrupted and move to history
    if state.active_delegation:
        state.active_delegation.interrupted = True
        state.history.append(state.active_delegation)
        state.active_delegation = None

    delegation = DelegationState(
        delegator=delegator,
        delegate=delegate,
        workflow=workflow,
        phase=phase,
        task_description=task_description,
        started_at=datetime.utcnow().isoformat(),
        last_activity=datetime.utcnow().isoformat(),
    )

    state.active_delegation = delegation
    state.current_agent = delegate
    state.current_workflow = workflow
    state.current_phase = phase

    save_session_state(state)
    print(f"📝 Delegation started: {delegator} → {delegate} ({phase})")

    return delegation


def complete_delegation(
    delegate: str,
    checkpoint: Optional[str] = None,
    artifacts: Optional[list[str]] = None,
) -> DelegationState:
    """
    Complete a delegation and return control to delegator.

    Returns the completed delegation for logging.
    """
    state = load_session_state()

    if not state.active_delegation:
        print("⚠️ Warning: No active delegation to complete")
        return None

    if state.active_delegation.delegate != delegate:
        print(f"⚠️ Warning: Delegate mismatch ({delegate} != {state.active_delegation.delegate})")

    # Move to history
    delegation = state.active_delegation
    delegation.checkpoint = checkpoint
    if artifacts:
        delegation.artifacts.extend(artifacts)
    delegation.last_activity = datetime.utcnow().isoformat()

    state.history.append(delegation)
    state.active_delegation = None
    state.current_agent = delegation.delegator
    state.current_phase = None

    save_session_state(state)
    print(f"✅ Delegation completed: {delegation.delegator} ← {delegate}")

    return delegation


def check_for_interrupted_delegation() -> Optional[DelegationState]:
    """
    Check if there was an interrupted delegation that needs recovery.

    Returns the interrupted delegation if found, None otherwise.
    """
    state = load_session_state()

    if state.active_delegation and state.active_delegation.interrupted:
        return state.active_delegation

    return None


def get_active_delegation() -> Optional[DelegationState]:
    """Get the currently active delegation."""
    state = load_session_state()
    return state.active_delegation


def clear_session() -> None:
    """Clear all session state (for new workflows)."""
    if SESSION_STATE_FILE.exists():
        SESSION_STATE_FILE.unlink()
    print("🗑️ Session state cleared")


if __name__ == "__main__":
    # Demo usage
    print("Session State Manager Demo")
    print("=" * 40)

    # Clear any existing state
    clear_session()

    # Start a delegation
    delegation = start_delegation(
        delegator="Oracle",
        delegate="Builder",
        workflow="BUILD",
        phase="IMPLEMENTATION",
        task_description="Implement Integration-Verifier skill",
    )
    print(f"Delegation ID: {delegation.started_at}")

    # Check active delegation
    active = get_active_delegation()
    if active:
        print(f"Active: {active.delegate} is working on {active.phase}")

    # Simulate interruption check
    interrupted = check_for_interrupted_delegation()
    print(f"Interrupted: {interrupted is not None}")

    # Complete delegation
    complete_delegation(
        delegate="Builder",
        checkpoint="All files written, tests passing",
        artifacts=["SKILL.md", "e2e_runner.py", "failure_detector.py"],
    )

    # Verify cleared
    active = get_active_delegation()
    print(f"Active after complete: {active}")

    print("\n✅ Demo complete")
