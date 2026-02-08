"""
E2E Runner for Integration-Verifier Skill.

@implements: IV-1
"""

from __future__ import annotations

import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class ScenarioResult:
    """Result of a single E2E scenario."""
    name: str
    passed: bool
    duration_ms: int
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    artifacts: dict[str, str] = field(default_factory=dict)


@dataclass
class E2EResults:
    """Aggregated results from E2E execution."""
    scenarios_run: int
    passed: int
    failed: int
    skipped: int
    total_duration_ms: int
    results: list[ScenarioResult] = field(default_factory=list)
    artifacts: dict[str, str] = field(default_factory=dict)

    @property
    def all_passed(self) -> bool:
        return self.failed == 0 and self.scenarios_run > 0


class E2ERunner:
    """Runner for E2E scenarios and integration tests."""

    def __init__(self, working_dir: Optional[Path] = None):
        self.working_dir = working_dir or Path.cwd()

    def run_integration_tests(self) -> E2EResults:
        """Run integration tests using pytest."""
        start_time = time.time()

        try:
            result = subprocess.run(
                ["python3", "-m", "pytest", "tests/integration/", "-v", "--tb=short"],
                cwd=self.working_dir,
                capture_output=True,
                text=True,
                timeout=300,
            )

            output = result.stdout + result.stderr
            passed, failed, skipped = self._parse_pytest_output(output)

            return E2EResults(
                scenarios_run=passed + failed,
                passed=passed,
                failed=failed,
                skipped=skipped,
                total_duration_ms=int((time.time() - start_time) * 1000),
                artifacts={"pytest_output": output},
            )
        except subprocess.TimeoutExpired:
            return E2EResults(
                scenarios_run=0,
                passed=0,
                failed=1,
                skipped=0,
                total_duration_ms=int((time.time() - start_time) * 1000),
                results=[
                    ScenarioResult(
                        name="integration_test_suite",
                        passed=False,
                        duration_ms=int((time.time() - start_time) * 1000),
                        error_type="TIMEOUT",
                        error_message="Integration tests timed out after 300 seconds",
                    )
                ],
            )
        except Exception as e:
            return E2EResults(
                scenarios_run=0,
                passed=0,
                failed=1,
                skipped=0,
                total_duration_ms=int((time.time() - start_time) * 1000),
                results=[
                    ScenarioResult(
                        name="integration_test_suite",
                        passed=False,
                        duration_ms=int((time.time() - start_time) * 1000),
                        error_type="DEPENDENCY",
                        error_message=f"Failed to run tests: {str(e)}",
                    )
                ],
            )

    def run_e2e_scenarios(self, scenario_file: Optional[Path] = None) -> E2EResults:
        """Run E2E scenarios from a YAML file."""
        start_time = time.time()

        if scenario_file is None:
            scenario_file = self.working_dir / "tests/e2e/scenarios.yaml"

        if not scenario_file.exists():
            return E2EResults(
                scenarios_run=0,
                passed=0,
                failed=0,
                skipped=0,
                total_duration_ms=0,
                artifacts={"note": f"Scenario file not found: {scenario_file}"},
            )

        try:
            import yaml
        except ImportError:
            return E2EResults(
                scenarios_run=0,
                passed=0,
                failed=1,
                skipped=0,
                total_duration_ms=0,
                results=[
                    ScenarioResult(
                        name="yaml_import",
                        passed=False,
                        duration_ms=0,
                        error_type="DEPENDENCY",
                        error_message="PyYAML not installed",
                    )
                ],
            )

        try:
            with open(scenario_file) as f:
                scenarios = yaml.safe_load(f) or []

            results: list[ScenarioResult] = []

            for scenario in scenarios:
                result = self._run_single_scenario(scenario)
                results.append(result)

            passed = sum(1 for r in results if r.passed)
            failed = sum(1 for r in results if not r.passed)

            return E2EResults(
                scenarios_run=len(results),
                passed=passed,
                failed=failed,
                skipped=0,
                total_duration_ms=int((time.time() - start_time) * 1000),
                results=results,
                artifacts={"scenario_file": str(scenario_file)},
            )

        except Exception as e:
            return E2EResults(
                scenarios_run=0,
                passed=0,
                failed=1,
                skipped=0,
                total_duration_ms=int((time.time() - start_time) * 1000),
                results=[
                    ScenarioResult(
                        name="e2e_scenario_loading",
                        passed=False,
                        duration_ms=int((time.time() - start_time) * 1000),
                        error_type="DATA",
                        error_message=f"Failed to load scenarios: {str(e)}",
                    )
                ],
            )

    def _run_single_scenario(self, scenario: dict) -> ScenarioResult:
        """Run a single E2E scenario."""
        start_time = time.time()
        name = scenario.get("name", "unnamed_scenario")

        try:
            # Execute scenario steps
            steps = scenario.get("steps", [])

            for step in steps:
                step_result = self._execute_step(step)
                if not step_result.passed:
                    return ScenarioResult(
                        name=name,
                        passed=False,
                        duration_ms=int((time.time() - start_time) * 1000),
                        error_type=step_result.error_type or "RESPONSE",
                        error_message=step_result.error_message or "Step failed",
                    )

            return ScenarioResult(
                name=name,
                passed=True,
                duration_ms=int((time.time() - start_time) * 1000),
            )

        except Exception as e:
            return ScenarioResult(
                name=name,
                passed=False,
                duration_ms=int((time.time() - start_time) * 1000),
                error_type="DEPENDENCY",
                error_message=str(e),
            )

    def _execute_step(self, step: dict) -> ScenarioResult:
        """Execute a single scenario step."""
        step_type = step.get("type", "api_call")
        endpoint = step.get("endpoint", "")
        expected_status = step.get("expected_status", 200)

        try:
            if step_type == "api_call":
                import requests

                method = step.get("method", "GET").lower()
                url = f"{step.get('base_url', 'http://localhost:8080')}{endpoint}"
                headers = step.get("headers", {})
                body = step.get("body")

                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=body,
                    timeout=step.get("timeout", 30),
                )

                passed = response.status_code == expected_status

                if not passed:
                    return ScenarioResult(
                        name=f"{method.upper()} {endpoint}",
                        passed=False,
                        duration_ms=0,
                        error_type="RESPONSE",
                        error_message=f"Expected {expected_status}, got {response.status_code}",
                    )

                return ScenarioResult(
                    name=f"{method.upper()} {endpoint}",
                    passed=True,
                    duration_ms=0,
                )

            elif step_type == "shell_command":
                result = subprocess.run(
                    step.get("command", ""),
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=step.get("timeout", 60),
                )

                passed = result.returncode == 0

                if not passed:
                    return ScenarioResult(
                        name=step.get("command", "")[:50],
                        passed=False,
                        duration_ms=0,
                        error_type="RESPONSE",
                        error_message=f"Command failed with code {result.returncode}",
                    )

                return ScenarioResult(
                    name=step.get("command", "")[:50],
                    passed=True,
                    duration_ms=0,
                )

            else:
                return ScenarioResult(
                    name=f"unknown_step_type_{step_type}",
                    passed=False,
                    duration_ms=0,
                    error_type="DATA",
                    error_message=f"Unknown step type: {step_type}",
                )

        except subprocess.TimeoutExpired:
            return ScenarioResult(
                name=step.get("command", "")[:50] if step_type == "shell_command" else endpoint,
                passed=False,
                duration_ms=0,
                error_type="TIMEOUT",
                error_message="Step timed out",
            )
        except Exception as e:
            return ScenarioResult(
                name=step.get("command", "")[:50] if step_type == "shell_command" else endpoint,
                passed=False,
                duration_ms=0,
                error_type="NETWORK",
                error_message=str(e),
            )

    def _parse_pytest_output(self, output: str) -> tuple[int, int, int]:
        """Parse pytest output to extract pass/fail/skip counts."""
        passed = failed = skipped = 0

        lines = output.split("\n")
        for line in lines:
            if "passed" in line and "failed" in line and "skipped" in line:
                # Example: "3 passed, 1 failed, 1 skipped"
                import re

                match = re.search(r"(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+skipped", line)
                if match:
                    passed = int(match.group(1))
                    failed = int(match.group(2))
                    skipped = int(match.group(3))
                    break

            elif "passed" in line and "failed" in line:
                # Example: "2 passed, 1 failed"
                import re

                match = re.search(r"(\d+)\s+passed.*?(\d+)\s+failed", line)
                if match:
                    passed = int(match.group(1))
                    failed = int(match.group(2))
                    break

            elif "passed" in line:
                # Example: "5 passed"
                import re

                match = re.search(r"(\d+)\s+passed", line)
                if match:
                    passed = int(match.group(1))
                    break

        return passed, failed, skipped

    def generate_report(self, results: E2EResults) -> str:
        """Generate a summary report from E2E results."""
        lines = [
            "=" * 50,
            "E2E Test Report",
            "=" * 50,
            f"Scenarios Run: {results.scenarios_run}",
            f"Passed: {results.passed}",
            f"Failed: {results.failed}",
            f"Skipped: {results.skipped}",
            f"Total Duration: {results.total_duration_ms}ms",
            "",
        ]

        if results.results:
            lines.append("Results:")
            lines.append("-" * 30)

            for result in results.results:
                status = "✅" if result.passed else "❌"
                lines.append(f"{status} {result.name}")

                if result.error_type:
                    lines.append(f"   Type: {result.error_type}")
                    lines.append(f"   Error: {result.error_message}")

        if results.artifacts:
            lines.append("")
            lines.append("Artifacts:")
            lines.append("-" * 30)
            for key, value in results.artifacts.items():
                lines.append(f"  {key}: {value[:100]}")

        lines.append("")
        lines.append("=" * 50)

        if results.all_passed:
            lines.append("✅ ALL TESTS PASSED")
        else:
            lines.append(f"❌ {results.failed} TEST(S) FAILED")
        lines.append("=" * 50)

        return "\n".join(lines)


if __name__ == "__main__":
    runner = E2ERunner()

    print("Running integration tests...")
    int_results = runner.run_integration_tests()
    print(f"Integration: {int_results.passed} passed, {int_results.failed} failed")

    print("\nGenerating report...")
    report = runner.generate_report(int_results)
    print(report)
