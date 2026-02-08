"""
Tests for Integration-Verifier Skill.

@tests: IV-1, IV-2, IV-3
"""

import pytest
from pathlib import Path


class TestIntegrationVerifierSkill:
    """Integration tests for the complete skill."""

    def test_skill_metadata_exists(self):
        """Test that skill metadata file exists."""
        skill_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "SKILL.md"

        assert skill_file.exists()

    def test_skill_metadata_content(self):
        """Test that skill metadata has required fields."""
        skill_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "SKILL.md"

        with open(skill_file) as f:
            content = f.read()

        # Check for required sections
        assert "name:" in content
        assert "description:" in content
        assert "agent:" in content
        assert "workflow:" in content
        assert "phase:" in content

    def test_skill_has_contract_section(self):
        """Test that skill has router contract section."""
        skill_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "SKILL.md"

        with open(skill_file) as f:
            content = f.read()

        assert "router_contract:" in content
        assert "status:" in content
        assert "phase:" in content
        assert "agent:" in content

    def test_e2e_runner_script_exists(self):
        """Test that E2E runner script exists."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "e2e_runner.py"

        assert script_file.exists()

    def test_failure_detector_script_exists(self):
        """Test that failure detector script exists."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "failure_detector.py"

        assert script_file.exists()

    def test_rollback_options_reference_exists(self):
        """Test that rollback options reference file exists."""
        ref_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "references" / "rollback_options.md"

        assert ref_file.exists()

    def test_rollback_options_content(self):
        """Test rollback options file has required sections."""
        ref_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "references" / "rollback_options.md"

        with open(ref_file) as f:
            content = f.read()

        # Should have main options
        assert "Option 1" in content or "Create Fix Task" in content
        assert "Option 2" in content or "Revert" in content


class TestE2ERunnerScript:
    """Tests for E2E Runner script content."""

    def test_e2e_runner_has_required_classes(self):
        """Test that E2E runner has required classes."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "e2e_runner.py"

        with open(script_file) as f:
            content = f.read()

        # Check for required classes
        assert "class E2ERunner" in content
        assert "class E2EResults" in content
        assert "class ScenarioResult" in content

    def test_e2e_runner_has_run_methods(self):
        """Test that E2E runner has required methods."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "e2e_runner.py"

        with open(script_file) as f:
            content = f.read()

        # Check for required methods
        assert "def run_integration_tests" in content
        assert "def run_e2e_scenarios" in content
        assert "def generate_report" in content


class TestFailureDetectorScript:
    """Tests for Failure Detector script content."""

    def test_failure_detector_has_required_classes(self):
        """Test that failure detector has required classes."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "failure_detector.py"

        with open(script_file) as f:
            content = f.read()

        # Check for required classes
        assert "class FailureDetector" in content
        assert "class Failure" in content
        assert "class FailureType" in content
        assert "class Severity" in content

    def test_failure_detector_has_detection_methods(self):
        """Test that failure detector has required methods."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "failure_detector.py"

        with open(script_file) as f:
            content = f.read()

        # Check for required methods
        assert "def analyze" in content
        assert "def summarize" in content
        assert "def format_report" in content
        assert "def _detect_failure_type" in content

    def test_failure_types_defined(self):
        """Test that all failure types are defined."""
        script_file = Path(__file__).parent.parent / "skills" / "integration-verifier" / "scripts" / "failure_detector.py"

        with open(script_file) as f:
            content = f.read()

        # Check for failure type definitions
        assert "NETWORK" in content
        assert "RESPONSE" in content
        assert "AUTH" in content
        assert "TIMEOUT" in content
        assert "DEPENDENCY" in content
        assert "DATA" in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
