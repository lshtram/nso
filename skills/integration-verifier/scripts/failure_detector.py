"""
Failure Detector for Integration-Verifier Skill.

Detects and classifies failures from integration and E2E test results.

@implements: IV-2
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class FailureType(Enum):
    """Classification of failure types."""
    NETWORK = "NETWORK"
    RESPONSE = "RESPONSE"
    AUTH = "AUTH"
    TIMEOUT = "TIMEOUT"
    DEPENDENCY = "DEPENDENCY"
    DATA = "DATA"
    UNKNOWN = "UNKNOWN"


class Severity(Enum):
    """Failure severity levels."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class Failure:
    """A detected failure."""
    test_name: str
    failure_type: FailureType
    severity: Severity
    message: str
    recommendation: str
    context: dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "test_name": self.test_name,
            "type": self.failure_type.value,
            "severity": self.severity.value,
            "message": self.message,
            "recommendation": self.recommendation,
            "context": self.context,
        }


@dataclass
class FailureSummary:
    """Summary of detected failures."""
    total_failures: int
    by_type: dict[FailureType, int]
    by_severity: dict[Severity, int]
    critical_failures: list[Failure]
    rollback_recommended: bool
    summary_message: str


class FailureDetector:
    """Detects and classifies failures from test results."""

    # Keywords for automatic failure type detection
    NETWORK_KEYWORDS = [
        "connection refused",
        "connection reset",
        "network unreachable",
        "dns",
        "socket",
        "no route to host",
        "timeout",
    ]

    RESPONSE_KEYWORDS = [
        "status code",
        "expected",
        "got",
        "unexpected",
        "invalid json",
        "parse error",
    ]

    AUTH_KEYWORDS = [
        "unauthorized",
        "forbidden",
        "authentication",
        "authorization",
        "token",
        "credential",
        "permission denied",
    ]

    TIMEOUT_KEYWORDS = [
        "timed out",
        "timeout",
        "took too long",
        "deadline exceeded",
    ]

    DEPENDENCY_KEYWORDS = [
        "dependency",
        "service unavailable",
        "not found",
        "no such file",
        "module not found",
        "import error",
    ]

    DATA_KEYWORDS = [
        "validation",
        "constraint",
        "null",
        "undefined",
        "type error",
        "schema",
    ]

    def analyze(self, test_results) -> list[Failure]:
        """Analyze test results and detect failures."""
        failures: list[Failure] = []

        # Extract scenario results from E2EResults
        results = getattr(test_results, "results", [])

        for result in results:
            if not result.passed:
                failure = self._classify_failure(result)
                if failure:
                    failures.append(failure)

        return failures

    def analyze_scenario_result(self, result) -> Optional[Failure]:
        """Analyze a single scenario result for failures."""
        if result.passed:
            return None

        return self._classify_failure(result)

    def _classify_failure(self, result) -> Optional[Failure]:
        """Classify a failure based on error type and message."""
        error_type = getattr(result, "error_type", None) or "UNKNOWN"
        error_message = getattr(result, "error_message", "") or ""
        test_name = getattr(result, "name", "unknown_test")

        # Determine failure type
        failure_type = self._detect_failure_type(error_type, error_message)

        # Determine severity
        severity = self._determine_severity(failure_type, test_name)

        # Generate recommendation
        recommendation = self._generate_recommendation(failure_type, test_name)

        return Failure(
            test_name=test_name,
            failure_type=failure_type,
            severity=severity,
            message=error_message,
            recommendation=recommendation,
            context={
                "original_error_type": error_type,
                "duration_ms": str(getattr(result, "duration_ms", 0)),
            },
        )

    def _detect_failure_type(
        self, error_type: str, error_message: str
    ) -> FailureType:
        """Detect the type of failure from error information."""
        # If error type is already set and valid, use it
        try:
            return FailureType(error_type)
        except ValueError:
            pass

        # Otherwise, detect from message
        message_lower = error_message.lower()

        for keyword in self.NETWORK_KEYWORDS:
            if keyword in message_lower:
                return FailureType.NETWORK

        for keyword in self.AUTH_KEYWORDS:
            if keyword in message_lower:
                return FailureType.AUTH

        for keyword in self.TIMEOUT_KEYWORDS:
            if keyword in message_lower:
                return FailureType.TIMEOUT

        for keyword in self.DEPENDENCY_KEYWORDS:
            if keyword in message_lower:
                return FailureType.DEPENDENCY

        for keyword in self.DATA_KEYWORDS:
            if keyword in message_lower:
                return FailureType.DATA

        for keyword in self.RESPONSE_KEYWORDS:
            if keyword in message_lower:
                return FailureType.RESPONSE

        return FailureType.UNKNOWN

    def _determine_severity(self, failure_type: FailureType, test_name: str) -> Severity:
        """Determine failure severity based on type and context."""
        # Critical severity for certain failure types
        critical_types = {
            FailureType.DEPENDENCY,
            FailureType.AUTH,
        }

        high_types = {
            FailureType.NETWORK,
            FailureType.TIMEOUT,
        }

        medium_types = {
            FailureType.RESPONSE,
            FailureType.DATA,
        }

        # Check for critical test names
        critical_names = ["health", "auth", "core", "main"]
        is_critical_test = any(name in test_name.lower() for name in critical_names)

        if failure_type in critical_types:
            return Severity.CRITICAL if is_critical_test else Severity.HIGH

        if failure_type in high_types:
            return Severity.HIGH if is_critical_test else Severity.MEDIUM

        if failure_type in medium_types:
            return Severity.MEDIUM

        return Severity.LOW

    def _generate_recommendation(
        self, failure_type: FailureType, test_name: str
    ) -> str:
        """Generate a recommendation for fixing the failure."""
        recommendations = {
            FailureType.NETWORK: (
                "Check network connectivity, DNS resolution, and firewall rules. "
                "Verify that all required services are running and accessible."
            ),
            FailureType.RESPONSE: (
                "Review the API contract and expected response format. "
                "Check if the API has changed or if there's a data mismatch."
            ),
            FailureType.AUTH: (
                "Verify authentication credentials and tokens. "
                "Check if the service requires updated permissions or scopes."
            ),
            FailureType.TIMEOUT: (
                "Review performance of the affected service. "
                "Check for resource constraints (CPU, memory, connections). "
                "Consider increasing timeout values or optimizing the operation."
            ),
            FailureType.DEPENDENCY: (
                "Check if required dependencies are installed and configured. "
                "Verify that all external services are available."
            ),
            FailureType.DATA: (
                "Review data validation rules and constraints. "
                "Check for null values, type mismatches, or schema violations."
            ),
            FailureType.UNKNOWN: (
                "Investigate the root cause of the failure. "
                "Check logs for more detailed error information."
            ),
        }

        return recommendations.get(failure_type, recommendations[FailureType.UNKNOWN])

    def summarize(self, failures: list[Failure]) -> FailureSummary:
        """Generate a summary from detected failures."""
        by_type: dict[FailureType, int] = {}
        by_severity: dict[Severity, int] = {}
        critical_failures: list[Failure] = []

        for failure in failures:
            by_type[failure.failure_type] = by_type.get(failure.failure_type, 0) + 1
            by_severity[failure.severity] = by_severity.get(failure.severity, 0) + 1

            if failure.severity == Severity.CRITICAL:
                critical_failures.append(failure)

        # Determine if rollback is recommended
        rollback_recommended = (
            len([f for f in failures if f.severity == Severity.CRITICAL]) > 0
            or len([f for f in failures if f.severity == Severity.HIGH]) >= 3
        )

        # Generate summary message
        if not failures:
            summary_message = "No failures detected."
        elif rollback_recommended:
            summary_message = (
                f"Rollback recommended: {len(critical_failures)} critical failure(s), "
                f"{len([f for f in failures if f.severity == Severity.HIGH])} high severity failure(s)."
            )
        else:
            summary_message = (
                f"Validation issues found: {len(failures)} failure(s). "
                "Review recommended before proceeding."
            )

        return FailureSummary(
            total_failures=len(failures),
            by_type=by_type,
            by_severity=by_severity,
            critical_failures=critical_failures,
            rollback_recommended=rollback_recommended,
            summary_message=summary_message,
        )

    def format_report(self, failures: list[Failure], summary: FailureSummary) -> str:
        """Format a human-readable failure report."""
        lines = [
            "=" * 60,
            "Failure Analysis Report",
            "=" * 60,
            "",
            f"Total Failures: {summary.total_failures}",
            "",
            "By Type:",
        ]

        for failure_type, count in sorted(
            summary.by_type.items(), key=lambda x: x[1], reverse=True
        ):
            lines.append(f"  - {failure_type.value}: {count}")

        lines.append("")
        lines.append("By Severity:")
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            count = summary.by_severity.get(severity, 0)
            lines.append(f"  - {severity.value}: {count}")

        lines.append("")
        lines.append("-" * 60)
        lines.append("DETAILED FAILURES")
        lines.append("-" * 60)

        for failure in failures:
            severity_emoji = {
                Severity.CRITICAL: "🔴",
                Severity.HIGH: "🟠",
                Severity.MEDIUM: "🟡",
                Severity.LOW: "🟢",
            }.get(failure.severity, "⚪")

            lines.append("")
            lines.append(f"{severity_emoji} [{failure.severity.value}] {failure.test_name}")
            lines.append(f"   Type: {failure.failure_type.value}")
            lines.append(f"   Message: {failure.message}")
            lines.append(f"   Recommendation: {failure.recommendation}")

        lines.append("")
        lines.append("=" * 60)
        lines.append(f"SUMMARY: {summary.summary_message}")
        lines.append("=" * 60)

        return "\n".join(lines)


if __name__ == "__main__":
    # Demo usage
    from e2e_runner import ScenarioResult
    from failure_detector import FailureDetector, Failure, FailureType, Severity

    detector = FailureDetector()

    # Create some sample failures
    sample_failures = [
        ScenarioResult(
            name="test_api_health",
            passed=False,
            duration_ms=5000,
            error_type="NETWORK",
            error_message="Connection refused to localhost:8080",
        ),
        ScenarioResult(
            name="test_user_auth",
            passed=False,
            duration_ms=1000,
            error_type="AUTH",
            error_message="401 Unauthorized: Invalid token",
        ),
        ScenarioResult(
            name="test_data_validation",
            passed=False,
            duration_ms=200,
            error_type="DATA",
            error_message="Field 'email' cannot be null",
        ),
    ]

    failures = detector.analyze(sample_failures)
    summary = detector.summarize(failures)

    print(detector.format_report(failures, summary))
