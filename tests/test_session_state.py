"""
Tests for Session State Manager.

@tests: NSO-Recovery-1
"""

import json
import pytest
from pathlib import Path

import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))


class TestSessionStateManager:
    """Tests for session state management and recovery."""

    def test_session_state_module_import(self):
        """Test that session_state module can be imported."""
        from session_state import (
            load_session_state,
            save_session_state,
            start_delegation,
            complete_delegation,
            check_for_interrupted_delegation,
            get_active_delegation,
            clear_session,
            SESSION_STATE_FILE,
        )

        assert load_session_state is not None
        assert save_session_state is not None
        assert start_delegation is not None
        assert complete_delegation is not None
        assert SESSION_STATE_FILE is not None

    def test_clear_session(self):
        """Test session clearing."""
        from session_state import load_session_state, clear_session

        # Clear any existing state
        clear_session()

        # Verify cleared
        state = load_session_state()
        assert state.active_delegation is None
        assert state.current_agent == "Oracle"

    def test_start_delegation(self):
        """Test starting a delegation."""
        from session_state import load_session_state, start_delegation, clear_session

        clear_session()

        delegation = start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="Implement feature X",
        )

        assert delegation is not None
        assert delegation.delegator == "Oracle"
        assert delegation.delegate == "Builder"
        assert delegation.workflow == "BUILD"
        assert delegation.phase == "IMPLEMENTATION"
        assert delegation.interrupted is False

    def test_get_active_delegation(self):
        """Test getting the active delegation."""
        from session_state import (
            load_session_state,
            start_delegation,
            get_active_delegation,
            clear_session,
        )

        clear_session()

        # No delegation initially
        assert get_active_delegation() is None

        # Start delegation
        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="Implement feature X",
        )

        # Get active
        active = get_active_delegation()
        assert active is not None
        assert active.delegate == "Builder"

    def test_complete_delegation(self):
        """Test completing a delegation."""
        from session_state import (
            load_session_state,
            start_delegation,
            complete_delegation,
            get_active_delegation,
            clear_session,
        )

        clear_session()

        # Start delegation
        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="Implement feature X",
        )

        # Complete delegation
        completed = complete_delegation(
            delegate="Builder",
            checkpoint="All code written",
            artifacts=["src/feature.py", "tests/test_feature.py"],
        )

        assert completed is not None
        assert completed.checkpoint == "All code written"
        assert len(completed.artifacts) == 2

        # Verify cleared
        assert get_active_delegation() is None

    def test_check_for_interrupted_delegation_no_interruption(self):
        """Test checking for interruption when none exists."""
        from session_state import (
            start_delegation,
            check_for_interrupted_delegation,
            clear_session,
        )

        clear_session()

        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="Implement feature X",
        )

        # No interruption should be detected
        assert check_for_interrupted_delegation() is None

    def test_session_state_schema(self):
        """Test that session state follows the schema."""
        from session_state import (
            load_session_state,
            start_delegation,
            complete_delegation,
            clear_session,
            SESSION_STATE_FILE,
        )

        clear_session()

        # Start delegation
        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="Implement feature X",
        )

        # Read file directly
        data = json.loads(SESSION_STATE_FILE.read_text())

        # Verify schema
        assert "current_agent" in data
        assert "current_workflow" in data
        assert "active_delegation" in data
        assert "history" in data

        delegation = data["active_delegation"]
        assert delegation["delegator"] == "Oracle"
        assert delegation["delegate"] == "Builder"
        assert "started_at" in delegation
        assert "last_activity" in delegation

    def test_delegation_history_preserved(self):
        """Test that completed delegations are moved to history."""
        from session_state import (
            load_session_state,
            start_delegation,
            complete_delegation,
            clear_session,
        )

        clear_session()

        # Complete first delegation
        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="First task",
        )
        complete_delegation(
            delegate="Builder", checkpoint="Done", artifacts=["file1.py"]
        )

        # Complete second delegation
        start_delegation(
            delegator="Oracle",
            delegate="Janitor",
            workflow="BUILD",
            phase="VALIDATION",
            task_description="Second task",
        )
        complete_delegation(
            delegate="Janitor", checkpoint="Done", artifacts=["file2.py"]
        )

        # Verify history
        state = load_session_state()
        assert len(state.history) == 2
        assert state.history[0].task_description == "First task"
        assert state.history[1].task_description == "Second task"

    def test_multiple_interrupted_delegations(self):
        """Test handling of multiple interrupted delegations."""
        from session_state import (
            load_session_state,
            start_delegation,
            complete_delegation,
            clear_session,
        )

        clear_session()

        # Start and interrupt (simulate by marking interrupted)
        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="First delegation",
        )

        # Simulate interruption
        state = load_session_state()
        state.active_delegation.interrupted = True
        from session_state import save_session_state

        save_session_state(state)

        # Start another delegation (this should mark previous as interrupted)
        start_delegation(
            delegator="Oracle",
            delegate="Janitor",
            workflow="BUILD",
            phase="VALIDATION",
            task_description="Second delegation",
        )

        # Verify first is in history as interrupted
        state = load_session_state()
        assert len(state.history) == 1
        assert state.history[0].interrupted is True

    def test_workflow_and_phase_tracked(self):
        """Test that workflow and phase are properly tracked."""
        from session_state import (
            load_session_state,
            start_delegation,
            complete_delegation,
            clear_session,
        )

        clear_session()

        # Start BUILD workflow
        start_delegation(
            delegator="Oracle",
            delegate="Builder",
            workflow="BUILD",
            phase="IMPLEMENTATION",
            task_description="Build task",
        )

        state = load_session_state()
        assert state.current_workflow == "BUILD"
        assert state.current_phase == "IMPLEMENTATION"

        complete_delegation(delegate="Builder", checkpoint="Done")

        # Start DEBUG workflow
        start_delegation(
            delegator="Oracle",
            delegate="Janitor",
            workflow="DEBUG",
            phase="INVESTIGATION",
            task_description="Debug task",
        )

        state = load_session_state()
        assert state.current_workflow == "DEBUG"
        assert state.current_phase == "INVESTIGATION"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
