#!/usr/bin/env python3
"""
NSO Automatic Router Monitor
Monitors every user message and determines if workflow routing is needed.

SAFETY CHECKS:
- Only routes if NOT currently in an active workflow
- Only routes for Oracle agent
- Checks session state before routing

Usage:
    python3 router_monitor.py "user message here"
    python3 router_monitor.py "user message here" --check-state
    
Returns:
    JSON with routing decision or None
"""

import sys
import json
import re
import argparse
from enum import Enum
from dataclasses import dataclass, asdict
from pathlib import Path


class Workflow(Enum):
    """Supported NSO workflow types."""
    BUILD = "BUILD"
    DEBUG = "DEBUG"
    REVIEW = "REVIEW"
    PLAN = "PLAN"
    CHAT = "CHAT"  # Default - no workflow, just conversation


# Confidence thresholds
MIN_CONFIDENCE_TO_ROUTE = 0.2  # Don't route if confidence below this
HIGH_CONFIDENCE = 0.5  # Strong routing signal

# Active workflow states that should block routing
ACTIVE_WORKFLOW_STATES = [
    "IN_PROGRESS",
    "PENDING",
    "DISCOVERY",
    "ARCHITECTURE", 
    "IMPLEMENTATION",
    "VALIDATION",
    "INVESTIGATION",
    "FIX",
    "SCOPE",
    "ANALYSIS"
]

# Keywords with weights (higher weight = stronger signal)
KEYWORDS = {
    Workflow.BUILD: {
        r"\bbuild\b": 0.3,
        r"\bimplement\b": 0.4,
        r"\bcreate\b": 0.3,
        r"\bmake\b": 0.2,
        r"\bwrite\b": 0.2,
        r"\badd\b": 0.2,
        r"\bdevelop\b": 0.4,
        r"\bcode\b": 0.3,
        r"\bfeature\b": 0.3,
        r"\bcomponent\b": 0.3,
        r"\bapplication\b": 0.3,
        r"\bnew\s+\w+": 0.2,  # "new feature", "new module"
    },
    Workflow.DEBUG: {
        r"\bdebug\b": 0.4,
        r"\bfix\b": 0.4,
        r"\berror\b": 0.3,
        r"\bbug\b": 0.4,
        r"\bbroken\b": 0.4,
        r"\btroubleshoot\b": 0.4,
        r"\bissue\b": 0.3,
        r"\bproblem\b": 0.3,
        r"\bdoesn't work\b": 0.4,
        r"\bdoes not work\b": 0.4,
        r"\bfailure\b": 0.3,
        r"\bcrash\b": 0.4,
        r"\bexception\b": 0.3,
    },
    Workflow.REVIEW: {
        r"\breview\b": 0.4,
        r"\baudit\b": 0.4,
        r"\bcheck\b": 0.2,
        r"\banalyze\b": 0.3,
        r"\bassess\b": 0.3,
        r"\bevaluate\b": 0.3,
        r"\bwhat do you think\b": 0.4,
        r"\bis this good\b": 0.4,
        r"\bis this correct\b": 0.3,
        r"\blook at\b": 0.2,
        r"\btake a look\b": 0.2,
    },
    Workflow.PLAN: {
        r"\bplan\b": 0.4,
        r"\bdesign\b": 0.4,
        r"\barchitect\b": 0.4,
        r"\broadmap\b": 0.4,
        r"\bstrategy\b": 0.3,
        r"\bspec\b": 0.3,
        r"\bbefore we build\b": 0.4,
        r"\bhow should we\b": 0.3,
        r"\bapproach\b": 0.2,
        r"\bstructure\b": 0.2,
    },
}


def calculate_confidence(message: str, workflow: Workflow) -> tuple[float, list[str]]:
    """Calculate confidence score for a workflow."""
    if not message or not message.strip():
        return 0.0, []
    
    total_score = 0.0
    matched_keywords = []
    
    for pattern, weight in KEYWORDS[workflow].items():
        if re.search(pattern, message, re.IGNORECASE):
            total_score += weight
            matched_keywords.append(pattern)
    
    # Normalize to 0.0 - 1.0 range (max possible score is ~2.0)
    confidence = min(total_score / 1.0, 1.0)
    
    return confidence, matched_keywords


def check_session_state() -> dict:
    """
    Check if we're currently in an active workflow.
    Returns session state information.
    
    Looks for explicit status indicators in session files, not just mentions
    of workflow names.
    """
    # Check for session state files
    session_files = [
        Path(".opencode/context/01_memory/active_context.md"),
        Path(".opencode/context/01_memory/session_tracking.md"),
        Path(".opencode/session_state.json"),
    ]
    
    state = {
        "in_workflow": False,
        "current_workflow": None,
        "current_phase": None,
        "active_agent": None
    }
    
    # Check active_context.md for workflow indicators
    for session_file in session_files:
        if session_file.exists():
            try:
                content = session_file.read_text()
                content_lower = content.lower()
                
                # Look for explicit status line (e.g., "Status: IN_PROGRESS" or "- Status: Discovery")
                for status in ACTIVE_WORKFLOW_STATES:
                    # Check for "Status: STATE" or "- Status: STATE" patterns
                    if f"status: {status.lower()}" in content_lower:
                        state["in_workflow"] = True
                        
                        # Try to extract workflow type from context
                        # Look for "Current Focus" or "Workflow" lines
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if 'current focus' in line.lower() or 'current workflow' in line.lower():
                                # Check next few lines for workflow name
                                for j in range(i, min(i+3, len(lines))):
                                    for wf in ["build", "debug", "review", "plan"]:
                                        if wf in lines[j].lower():
                                            state["current_workflow"] = wf.upper()
                                            break
                        break
                        
            except Exception:
                pass
    
    return state


def should_route(message: str, agent: str = "Oracle", check_state: bool = True) -> dict:
    """
    Determine if message should be routed to a workflow.
    
    SAFETY CHECKS:
    - Only routes if agent is Oracle
    - Only routes if NOT in active workflow (unless check_state=False)
    
    Returns dict with:
    - should_route: bool
    - workflow: str or None
    - confidence: float
    - reason: str
    - suggested_response: str
    """
    # Safety Check 1: Only Oracle can route
    if agent != "Oracle":
        return {
            "should_route": False,
            "workflow": None,
            "confidence": 0.0,
            "reason": f"Agent is {agent}, not Oracle. Only Oracle can initiate routing.",
            "suggested_response": None,
            "safety_check": "AGENT_NOT_ORACLE"
        }
    
    # Safety Check 2: Don't route if empty message
    if not message or not message.strip():
        return {
            "should_route": False,
            "workflow": None,
            "confidence": 0.0,
            "reason": "Empty message",
            "suggested_response": None,
            "safety_check": "EMPTY_MESSAGE"
        }
    
    # Safety Check 3: Check if in active workflow
    if check_state:
        session_state = check_session_state()
        if session_state["in_workflow"]:
            return {
                "should_route": False,
                "workflow": None,
                "confidence": 0.0,
                "reason": f"Already in active workflow ({session_state.get('current_workflow', 'unknown')}). Continue current workflow.",
                "suggested_response": None,
                "safety_check": "ACTIVE_WORKFLOW",
                "session_state": session_state
            }
    
    # Calculate confidence for each workflow
    scores = {}
    for workflow in [Workflow.BUILD, Workflow.DEBUG, Workflow.REVIEW, Workflow.PLAN]:
        conf, keywords = calculate_confidence(message, workflow)
        scores[workflow] = {"confidence": conf, "keywords": keywords}
    
    # Find best match
    best_workflow = None
    best_confidence = 0.0
    best_keywords = []
    
    # Priority order for tie-breaking
    priority_order = [Workflow.DEBUG, Workflow.REVIEW, Workflow.PLAN, Workflow.BUILD]
    
    for workflow in priority_order:
        if scores[workflow]["confidence"] > best_confidence:
            best_confidence = scores[workflow]["confidence"]
            best_workflow = workflow
            best_keywords = scores[workflow]["keywords"]
    
    # Decision logic
    if best_confidence >= MIN_CONFIDENCE_TO_ROUTE and best_workflow is not None:
        # Determine suggested first response
        if best_workflow == Workflow.BUILD:
            suggested = "I'll help you build this. Let me gather requirements first."
        elif best_workflow == Workflow.DEBUG:
            suggested = "I'll help you debug this issue. Let me start by gathering evidence."
        elif best_workflow == Workflow.REVIEW:
            suggested = "I'll review this for you. Let me define the scope first."
        elif best_workflow == Workflow.PLAN:
            suggested = "I'll help you plan this out. Let me understand the requirements first."
        else:
            suggested = None
        
        return {
            "should_route": True,
            "workflow": best_workflow.value,
            "confidence": round(best_confidence, 2),
            "matched_keywords": best_keywords,
            "reason": f"Detected {best_workflow.value} intent with {best_confidence:.0%} confidence",
            "suggested_response": suggested,
            "safety_check": "PASSED",
            "all_scores": {w.value: round(s["confidence"], 2) for w, s in scores.items()}
        }
    else:
        return {
            "should_route": False,
            "workflow": None,
            "confidence": round(best_confidence, 2),
            "matched_keywords": best_keywords,
            "reason": f"Low confidence ({best_confidence:.0%}), treating as chat",
            "suggested_response": None,
            "safety_check": "PASSED",
            "all_scores": {w.value: round(s["confidence"], 2) for w, s in scores.items()}
        }


def main():
    parser = argparse.ArgumentParser(description="NSO Router Monitor")
    parser.add_argument("message", help="User message to analyze")
    parser.add_argument("--agent", default="Oracle", help="Current agent (default: Oracle)")
    parser.add_argument("--no-state-check", action="store_true", help="Skip workflow state checking")
    
    args = parser.parse_args()
    
    result = should_route(
        message=args.message,
        agent=args.agent,
        check_state=not args.no_state_check
    )
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
