"""
Unit Tests for Heartbeat Monitoring API

Tests for functions in scripts/heartbeat_api.py:
- _load_agents() - tests for file exists, file missing, malformed JSON
- _build_response() - tests for correct JSON structure

@implements: FR-HEARTBEAT-TEST
"""

import json
from datetime import datetime
from unittest.mock import patch

import pytest  # noqa: F401 - Used for fixtures (tmp_path)

# Import the functions to test
from scripts.heartbeat_api import _load_agents, _build_response


class TestLoadAgents:
    """Tests for the _load_agents() function."""

    def test_load_agents_file_exists_valid_json(self, tmp_path):
        """Test loading agents when status file exists with valid JSON."""
        # Create a temporary status file with valid agent data
        # Note: The actual file format wraps agents under "agents" key
        status_data = {
            "agents": {
                "oracle": {
                    "status": "running",
                    "current_step": "Drafting requirements",
                    "last_heartbeat": 1707312000.5,
                    "uptime_seconds": 125.3
                },
                "builder-1": {
                    "status": "idle",
                    "current_step": "Waiting for tasks",
                    "last_heartbeat": 1707311998.2,
                    "uptime_seconds": 3600.0
                }
            }
        }
        
        status_file = tmp_path / ".opencode/logs/task_status.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)
        status_file.write_text(json.dumps(status_data))
        
        with patch('scripts.heartbeat_api.STATUS_FILE_PATH', status_file):
            result = _load_agents()
        
        # _load_agents() returns data.get("agents", {}), not the full file
        expected_agents = status_data["agents"]
        assert result == expected_agents
        assert "oracle" in result
        assert "builder-1" in result
        assert result["oracle"]["status"] == "running"

    def test_load_agents_file_missing(self, tmp_path):
        """Test loading agents when status file is missing."""
        missing_file = tmp_path / ".opencode/logs/nonexistent_status.json"
        
        with patch('scripts.heartbeat_api.STATUS_FILE_PATH', missing_file):
            result = _load_agents()
        
        # Should return empty dict when file is missing
        assert result == {}

    def test_load_agents_malformed_json(self, tmp_path):
        """Test loading agents when status file contains malformed JSON."""
        status_file = tmp_path / ".opencode/logs/task_status.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)
        status_file.write_text("{ this is not valid json }")
        
        with patch('scripts.heartbeat_api.STATUS_FILE_PATH', status_file):
            result = _load_agents()
        
        # Should return empty dict gracefully (NFR-003: handle malformed JSON)
        assert result == {}

    def test_load_agents_empty_file(self, tmp_path):
        """Test loading agents when status file is empty."""
        status_file = tmp_path / ".opencode/logs/task_status.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)
        status_file.write_text("")
        
        with patch('scripts.heartbeat_api.STATUS_FILE_PATH', status_file):
            result = _load_agents()
        
        # Should return empty dict gracefully (NFR-003: handle malformed JSON)
        assert result == {}

    def test_load_agents_empty_json_object(self, tmp_path):
        """Test loading agents when status file contains empty JSON object."""
        status_file = tmp_path / ".opencode/logs/task_status.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)
        status_file.write_text("{}")
        
        with patch('scripts.heartbeat_api.STATUS_FILE_PATH', status_file):
            result = _load_agents()
        
        assert result == {}

    def test_load_agents_single_agent(self, tmp_path):
        """Test loading agents with a single agent entry."""
        # The actual file format wraps agents under "agents" key
        status_data = {
            "agents": {
                "oracle": {
                    "status": "running",
                    "current_step": "Drafting requirements",
                    "last_heartbeat": 1707312000.5,
                    "uptime_seconds": 125.3
                }
            }
        }
        
        status_file = tmp_path / ".opencode/logs/task_status.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)
        status_file.write_text(json.dumps(status_data))
        
        with patch('scripts.heartbeat_api.STATUS_FILE_PATH', status_file):
            result = _load_agents()
        
        # _load_agents() returns data.get("agents", {})
        assert len(result) == 1
        assert "oracle" in result
        assert result["oracle"]["status"] == "running"


class TestBuildResponse:
    """Tests for the _build_response() function."""

    def test_build_response_with_agents(self):
        """Test building response with agent data."""
        agents = {
            "oracle": {
                "status": "running",
                "current_step": "Drafting requirements",
                "last_heartbeat": 1707312000.5,
                "uptime_seconds": 125.3
            },
            "builder-1": {
                "status": "idle",
                "current_step": "Waiting for tasks",
                "last_heartbeat": 1707311998.2,
                "uptime_seconds": 3600.0
            }
        }
        
        # Mock the timestamp to ensure consistent testing
        with patch('scripts.heartbeat_api.get_utc_timestamp') as mock_timestamp:
            mock_timestamp.return_value = "2026-02-07T12:00:00Z"
            response = _build_response(agents)
        
        assert response["status"] == "healthy"
        assert response["timestamp"] == "2026-02-07T12:00:00Z"
        assert "oracle" in response["agents"]
        assert "builder-1" in response["agents"]
        assert response["agents"]["oracle"]["status"] == "running"
        assert response["agents"]["builder-1"]["status"] == "idle"

    def test_build_response_empty_agents(self):
        """Test building response with no agents."""
        agents = {}
        
        with patch('scripts.heartbeat_api.get_utc_timestamp') as mock_timestamp:
            mock_timestamp.return_value = "2026-02-07T12:00:00Z"
            response = _build_response(agents)
        
        assert response["status"] == "healthy"
        assert response["timestamp"] == "2026-02-07T12:00:00Z"
        assert response["agents"] == {}

    def test_build_response_structure(self):
        """Test that response has correct JSON structure."""
        agents = {
            "test-agent": {
                "status": "running",
                "current_step": "Processing tasks",
                "last_heartbeat": 1234567890.0,
                "uptime_seconds": 60.5
            }
        }
        
        with patch('scripts.heartbeat_api.get_utc_timestamp') as mock_timestamp:
            mock_timestamp.return_value = "2024-01-01T00:00:00Z"
            response = _build_response(agents)
        
        # Verify all required fields exist
        assert "status" in response
        assert "timestamp" in response
        assert "agents" in response
        
        # Verify agents structure
        agent = response["agents"]["test-agent"]
        assert "status" in agent
        assert "current_step" in agent
        assert "last_heartbeat" in agent
        assert "uptime_seconds" in agent

    def test_build_response_iso_timestamp(self):
        """Test that timestamp is in ISO 8601 format."""
        agents = {}
        
        response = _build_response(agents)
        
        # Verify ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
        timestamp = response["timestamp"]
        assert timestamp.endswith("Z")
        assert "T" in timestamp
        
        # Parse to verify it's valid ISO format
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        assert parsed.tzinfo is not None

    def test_build_response_status_always_healthy(self):
        """Test that status is always 'healthy' when server is running."""
        agents = {}
        
        response = _build_response(agents)
        
        assert response["status"] == "healthy"
