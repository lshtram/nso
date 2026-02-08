#!/usr/bin/env python3
"""
Pattern Implementer - Apply pattern fixes to memory files.

This script:
1. Reads .opencode/logs/pattern_candidates.json
2. Applies fixes based on severity
3. Updates patterns.md, AGENTS.md, or flags for user

USAGE:
    python3 .opencode/skills/pattern-implementer/apply.py

TRIGGERED BY:
    1. /self-improve command (after pattern detection)
    2. Automatic at workflow end
"""

import json
from datetime import datetime
from pathlib import Path

# Configuration
PATTERNS_INPUT = Path(".opencode/logs/pattern_candidates.json")
PATTERNS_FILE = Path(".opencode/context/01_memory/patterns.md")
AGENTS_FILE = Path(".opencode/AGENTS.md")
TRENDS_FILE = Path(".opencode/logs/trends.json")


def load_patterns():
    """Load pattern candidates."""
    if not PATTERNS_INPUT.exists():
        print(f"Pattern file not found: {PATTERNS_INPUT}")
        print("Run: python3 .opencode/skills/pattern-detector/analyze.py first")
        return None
    
    with open(PATTERNS_INPUT) as f:
        return json.load(f)


def count_patterns_by_type(patterns: list) -> dict:
    """Count patterns by type."""
    counts = {}
    for p in patterns:
        ptype = p.get("type", "unknown")
        counts[ptype] = counts.get(ptype, 0) + 1
    return counts


def flag_high_severity(patterns: list):
    """Output high severity patterns for user attention."""
    high_severity = [p for p in patterns if p.get("severity") == "high"]
    
    if high_severity:
        print("\nHIGH SEVERITY PATTERNS REQUIRING ATTENTION:")
        print("=" * 60)
        for p in high_severity:
            print(f"\n[{p['type']}]")
            print(f"   {p['description']}")
            print(f"   -> {p['suggestion']}")
        print("\n" + "=" * 60)
        print("These patterns require manual intervention.")


def add_to_patterns_md(patterns: list):
    """Add medium severity patterns to patterns.md."""
    medium_severity = [p for p in patterns if p.get("severity") == "medium"]
    
    if not medium_severity:
        return
    
    existing_content = ""
    if PATTERNS_FILE.exists():
        with open(PATTERNS_FILE) as f:
            existing_content = f.read()
    
    new_entries = []
    for p in medium_severity:
        if p["description"] in existing_content:
            continue
        
        entry = f"""
### {p['type'].replace('_', ' ').title()} Pattern

**Detected:** {datetime.now().isoformat()}  
**Severity:** {p['severity']}  
**Description:** {p['description']}  
**Evidence:** {len(p.get('evidence', []))} occurrences  
**Suggestion:** {p['suggestion']}

**Auto-generated from session analysis.**
"""
        new_entries.append(entry)
    
    if not new_entries:
        print("No new patterns to add (all already exist)")
        return
    
    with open(PATTERNS_FILE, "a") as f:
        f.write("\n".join(new_entries))
    
    print(f"Added {len(new_entries)} patterns to {PATTERNS_FILE}")


def update_agents_md(patterns: list):
    """Update AGENTS.md with low severity conventions."""
    low_severity = [p for p in patterns if p.get("severity") == "low"]
    
    if not low_severity:
        return
    
    conventions = []
    for p in low_severity:
        convention = f"- **{p['type']}**: {p['suggestion']}"
        conventions.append(convention)
    
    if conventions:
        print(f"Convention updates identified (manual review needed in AGENTS.md)")
        for c in conventions:
            print(f"   {c}")


def update_trends(patterns: list):
    """Update trend analysis."""
    counts = count_patterns_by_type(patterns)
    
    trends = {}
    if TRENDS_FILE.exists():
        with open(TRENDS_FILE) as f:
            trends = json.load(f)
    
    if "by_type" not in trends:
        trends["by_type"] = {}
    
    for ptype, count in counts.items():
        if ptype not in trends["by_type"]:
            trends["by_type"][ptype] = []
        trends["by_type"][ptype].append({
            "date": datetime.now().isoformat()[:10],
            "count": count
        })
    
    trends["last_updated"] = datetime.now().isoformat()
    trends["total_patterns"] = sum(counts.values())
    
    with open(TRENDS_FILE, "w") as f:
        json.dump(trends, f, indent=2)
    
    print(f"Updated trends in {TRENDS_FILE}")


def apply_patterns():
    """Main implementation function."""
    print("Pattern Implementer")
    print("=" * 40)
    
    patterns_data = load_patterns()
    if not patterns_data:
        return {"status": "error", "applied": 0}
    
    patterns = patterns_data.get("patterns", [])
    print(f"Processing {len(patterns)} patterns...")
    
    flag_high_severity(patterns)
    add_to_patterns_md(patterns)
    update_agents_md(patterns)
    update_trends(patterns)
    
    result = {
        "status": "success",
        "high_severity": len([p for p in patterns if p.get("severity") == "high"]),
        "medium_severity": len([p for p in patterns if p.get("severity") == "medium"]),
        "low_severity": len([p for p in patterns if p.get("severity") == "low"]),
        "applied": len(patterns)
    }
    
    print(f"\nPattern implementation complete!")
    print(f"   High severity: {result['high_severity']} (flagged)")
    print(f"   Medium severity: {result['medium_severity']} (added to patterns.md)")
    print(f"   Low severity: {result['low_severity']} (documented)")
    
    return result


def main():
    """Entry point."""
    result = apply_patterns()
    print("\n" + "=" * 40)
    return result


if __name__ == "__main__":
    main()
