#!/usr/bin/env python3
"""
Pattern Detector - Analyze OpenCode session for improvement patterns.

This script:
1. Reads .opencode/logs/session.json
2. Analyzes messages for patterns (repeated failures, bypasses, etc.)
3. Outputs .opencode/logs/pattern_candidates.json

PATTERNS DETECTED:
- bypass: Agent sequence skips required phases
- repeated_failure: Same file modified multiple times
- time_anomaly: Unusually long or short sessions
- communication_gap: Missing user approvals
- model_switch: Multiple models used in one workflow

USAGE:
    python3 .opencode/skills/pattern-detector/analyze.py

TRIGGERED BY:
    1. /self-improve command
    2. Automatic at workflow end
"""

import json
from datetime import datetime
from pathlib import Path

# Configuration
SESSION_PATH = Path(".opencode/logs/session.json")
OUTPUT_PATH = Path(".opencode/logs/pattern_candidates.json")
REVIEWED_PATH = Path(".opencode/logs/reviewed_sessions.json")


def load_reviewed_sessions():
    """Load list of already-reviewed session ranges."""
    if not REVIEWED_PATH.exists():
        return {"reviewed": [], "last_review": None}
    
    with open(REVIEWED_PATH) as f:
        return json.load(f)


def save_reviewed_session(first_ts, last_ts, message_count, patterns_found):
    """Mark a session range as reviewed."""
    reviewed = load_reviewed_sessions()
    
    reviewed["reviewed"].append({
        "first_message_time": first_ts,
        "last_message_time": last_ts,
        "message_count": message_count,
        "reviewed_at": datetime.now().isoformat(),
        "patterns_found": patterns_found
    })
    reviewed["last_review"] = datetime.now().isoformat()
    
    REVIEWED_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REVIEWED_PATH, "w") as f:
        json.dump(reviewed, f, indent=2)


def is_already_reviewed(messages):
    """Check if this exact session range was already reviewed."""
    if not messages:
        return False
    
    reviewed = load_reviewed_sessions()
    if not reviewed["reviewed"]:
        return False
    
    first_ts = min(m.get("time", {}).get("created", 0) for m in messages)
    last_ts = max(m.get("time", {}).get("created", 0) for m in messages)
    
    for entry in reviewed["reviewed"]:
        # Check if this exact range was reviewed
        if (entry["first_message_time"] == first_ts and 
            entry["last_message_time"] == last_ts):
            return True
    
    return False


def get_new_messages_only(messages):
    """Get only messages since last review."""
    if not messages:
        return messages
    
    reviewed = load_reviewed_sessions()
    if not reviewed["reviewed"]:
        return messages  # No previous reviews, analyze all
    
    # Find the latest timestamp from previous reviews
    last_reviewed_ts = max(
        entry["last_message_time"] 
        for entry in reviewed["reviewed"]
    )
    
    # Filter to only new messages
    new_messages = [
        m for m in messages 
        if m.get("time", {}).get("created", 0) > last_reviewed_ts
    ]
    
    return new_messages


def load_session():
    """Load session messages."""
    if not SESSION_PATH.exists():
        print(f"⚠️  Session file not found: {SESSION_PATH}")
        print("   Run: python3 .opencode/scripts/copy_session.py first")
        return None
    
    with open(SESSION_PATH) as f:
        messages = json.load(f)
    
    # Check if already reviewed
    if is_already_reviewed(messages):
        print("ℹ️  This session range was already reviewed.")
        print("   Checking for new messages since last review...")
        
        new_messages = get_new_messages_only(messages)
        if new_messages:
            print(f"   Found {len(new_messages)} new messages to analyze.")
            return new_messages
        else:
            print("   No new messages since last review.")
            print("   Skipping analysis (already up to date).")
            return []
    
    return messages


def analyze_agent_transitions(messages: list) -> list:
    """Detect agent bypass patterns."""
    patterns = []
    agent_sequence = [m.get("agent") for m in messages if m.get("agent")]
    
    # Detect consecutive same-agent calls (potential bypass)
    for i in range(len(agent_sequence) - 1):
        current_agent = agent_sequence[i]
        next_agent = agent_sequence[i + 1]
        
        # Build → Build without Oracle in between
        if current_agent == "build" and next_agent == "build":
            msg = messages[i]
            patterns.append({
                "type": "bypass",
                "severity": "high",
                "description": "Consecutive build agent calls suggest skipped Oracle phase",
                "evidence": [{
                    "message_id": msg.get("id"),
                    "timestamp": msg.get("time", {}).get("created"),
                    "agent": current_agent
                }],
                "suggestion": "Use /new-feature for proper workflow initiation"
            })
        
        # Debug → Build without resolution (abandoned debug)
        if current_agent == "debug" and next_agent == "build":
            msg = messages[i]
            patterns.append({
                "type": "abandoned_debug",
                "severity": "medium",
                "description": "Debug session followed by build without resolution",
                "evidence": [{
                    "message_id": msg.get("id"),
                    "timestamp": msg.get("time", {}).get("created"),
                    "agent": current_agent
                }],
                "suggestion": "Ensure debug sessions reach resolution before moving to build"
            })
    
    return patterns


def analyze_timing(messages: list) -> list:
    """Detect time-based patterns."""
    patterns = []
    
    for msg in messages:
        created = msg.get("time", {}).get("created", 0)
        completed = msg.get("time", {}).get("completed", 0)
        duration_minutes = (completed - created) / 60000 if completed else 0
        agent = msg.get("agent", "unknown")
        
        # Quick closure detection (suspicious)
        if duration_minutes < 2 and agent == "oracle":
            patterns.append({
                "type": "quick_closure",
                "severity": "low",
                "description": f"Oracle phase completed in {duration_minutes:.1f} minutes (too fast)",
                "evidence": [{
                    "message_id": msg.get("id"),
                    "timestamp": created,
                    "duration_minutes": round(duration_minutes, 1)
                }],
                "suggestion": "Verify quality gates were not skipped"
            })
    
    return patterns


def analyze_file_changes(messages: list) -> list:
    """Detect repeated file modifications."""
    patterns = []
    file_counts = {}
    
    for msg in messages:
        cwd = msg.get("path", {}).get("cwd", "")
        if cwd:
            file_counts[cwd] = file_counts.get(cwd, 0) + 1
    
    # Files modified 5+ times (high churn)
    for file_path, count in sorted(file_counts.items(), key=lambda x: -x[1]):
        if count >= 5:
            patterns.append({
                "type": "repeated_failure",
                "severity": "medium",
                "description": f"File/folder '{file_path}' modified {count} times (high churn)",
                "evidence": [],
                "suggestion": "Consider adding tests or refactoring to reduce churn"
            })
    
    return patterns


def analyze_models(messages: list) -> list:
    """Detect model switching patterns."""
    models_used = {}
    
    for msg in messages:
        model = msg.get("modelID") or msg.get("model", {}).get("modelID")
        if model:
            if model not in models_used:
                models_used[model] = 0
            models_used[model] += 1
    
    patterns = []
    if len(models_used) > 1:
        models_str = ", ".join(f"{k} ({v} calls)" for k, v in models_used.items())
        patterns.append({
            "type": "model_switch",
            "severity": "low",
            "description": f"Multiple models used: {models_str}",
            "evidence": [],
            "suggestion": "Document reasons for model switching in session"
        })
    
    return patterns


def analyze_roles(messages: list) -> list:
    """Detect missing user approvals."""
    patterns = []
    
    # Count user vs assistant messages
    user_count = sum(1 for m in messages if m.get("role") == "user")
    assistant_count = len(messages) - user_count
    
    # Check for Oracle phases without user input
    oracle_messages = [m for m in messages if m.get("agent") == "oracle"]
    oracle_with_user = sum(1 for m in oracle_messages 
                          if any(child.get("role") == "user" 
                                for child in messages 
                                if child.get("parentID") == m.get("id")))
    
    if oracle_messages and oracle_with_user == 0:
        patterns.append({
            "type": "missing_approval",
            "severity": "high",
            "description": f"All {len(oracle_messages)} Oracle phases completed without user approval",
            "evidence": [{
                "oracle_count": len(oracle_messages),
                "user_approvals": oracle_with_user
            }],
            "suggestion": "Require user approval before moving past Oracle phases"
        })
    
    return patterns


def analyze_session():
    """Main analysis function."""
    print("🔍 Pattern Detector")
    print("=" * 40)
    
    messages = load_session()
    if not messages:
        return {"status": "error", "patterns": []}
    
    if len(messages) == 0:
        # Already reviewed, no new messages
        return {"status": "already_reviewed", "patterns": [], "summary": {"total_messages": 0}}
    
    # Store timestamps for tracking (before any filtering)
    first_ts = min(m.get("time", {}).get("created", 0) for m in messages)
    last_ts = max(m.get("time", {}).get("created", 0) for m in messages)
    message_count = len(messages)
    
    print(f"📦 Analyzing {message_count} messages...")
    
    # Run all analyses
    all_patterns = []
    all_patterns.extend(analyze_agent_transitions(messages))
    all_patterns.extend(analyze_timing(messages))
    all_patterns.extend(analyze_file_changes(messages))
    all_patterns.extend(analyze_models(messages))
    all_patterns.extend(analyze_roles(messages))
    
    # Calculate summary
    agents_used = list(set(m.get("agent") for m in messages if m.get("agent")))
    duration_hours = (last_ts - first_ts) / 3600000 if last_ts > first_ts else 0
    
    result = {
        "patterns": all_patterns,
        "summary": {
            "total_messages": len(messages),
            "agents_used": agents_used,
            "duration_hours": round(duration_hours, 1),
            "patterns_found": len(all_patterns),
            "analyzed_at": datetime.now().isoformat()
        }
    }
    
    # Output results
    print(f"\n📊 Summary:")
    print(f"   Total messages: {len(messages)}")
    print(f"   Agents used: {', '.join(agents_used)}")
    print(f"   Duration: {duration_hours:.1f} hours")
    print(f"   Patterns found: {len(all_patterns)}")
    
    if all_patterns:
        print(f"\n🚨 Patterns Detected:")
        for i, pattern in enumerate(all_patterns, 1):
            emoji = "🔴" if pattern["severity"] == "high" else "🟡" if pattern["severity"] == "medium" else "🟢"
            print(f"   {emoji} [{pattern['type']}] {pattern['description']}")
            print(f"      → {pattern['suggestion']}")
    
    # Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Output written to: {OUTPUT_PATH}")
    
    # Mark as reviewed
    save_reviewed_session(first_ts, last_ts, message_count, len(all_patterns))
    print(f"📌 Session marked as reviewed (messages: {message_count}, patterns: {len(all_patterns)})")
    
    return result


def main():
    """Entry point."""
    result = analyze_session()
    print("\n" + "=" * 40)
    return result


if __name__ == "__main__":
    main()
