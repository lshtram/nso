#!/usr/bin/env python3
"""
Deduplicate patterns - Group identical patterns and show counts.

This script:
1. Loads pattern_candidates.json
2. Groups patterns by type + description
3. Outputs deduplicated report

PATTERN GROUPS:
- bypass: Consecutive build agent calls
- repeated_failure: File modified N times
- quick_closure: Oracle phase completed too fast
- model_switch: Multiple models used
- missing_approval: Phases without user input

USAGE:
    python3 .opencode/scripts/deduplicate_patterns.py
"""

import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

INPUT_PATH = Path(".opencode/logs/pattern_candidates.json")
OUTPUT_PATH = Path(".opencode/logs/pattern_deduplicated.json")


def deduplicate_patterns():
    """Group patterns by type and description."""
    print("📊 Pattern Deduplication")
    print("=" * 50)
    
    if not INPUT_PATH.exists():
        print(f"⚠️  No patterns file found: {INPUT_PATH}")
        print("   Run: python3 .opencode/skills/pattern-detector/analyze.py first")
        return
    
    with open(INPUT_PATH) as f:
        data = json.load(f)
    
    patterns = data.get("patterns", [])
    summary = data.get("summary", {})
    
    print(f"\n📦 Original: {len(patterns)} patterns")
    
    # Group by type + key characteristics
    grouped = defaultdict(lambda: {
        "type": "",
        "severity": "",
        "description": "",
        "suggestion": "",
        "count": 0,
        "examples": []
    })
    
    for p in patterns:
        # Create unique key for grouping
        key = f"{p['type']}_{p['severity']}_{p['description'][:50]}"
        
        if not grouped[key]["type"]:
            grouped[key] = {
                "type": p["type"],
                "severity": p["severity"],
                "description": p["description"],
                "suggestion": p["suggestion"],
                "count": 0,
                "examples": []
            }
        
        grouped[key]["count"] += 1
        
        # Keep first 3 examples
        if len(grouped[key]["examples"]) < 3:
            grouped[key]["examples"].extend(p.get("evidence", []))
    
    # Create deduplicated output
    deduplicated = []
    for key, group in sorted(grouped.items(), key=lambda x: (-x[1]["count"], -len(x[1]["type"]))):
        deduplicated.append({
            "type": group["type"],
            "severity": group["severity"],
            "description": group["description"],
            "suggestion": group["suggestion"],
            "count": group["count"],
            "examples": group["examples"],
            "severity_weight": 3 if group["severity"] == "high" else 2 if group["severity"] == "medium" else 1
        })
    
    # Sort by severity weight, then count
    deduplicated.sort(key=lambda x: (-x["severity_weight"], -x["count"]))
    
    # Output summary
    print(f"📋 Deduplicated: {len(deduplicated)} unique pattern types")
    print(f"\n🔍 PATTERNS BY TYPE AND SEVERITY:")
    print("-" * 70)
    
    by_severity = {"high": [], "medium": [], "low": []}
    for p in deduplicated:
        by_severity[p["severity"]].append(p)
    
    print(f"\n🔴 HIGH SEVERITY ({len(by_severity['high'])} unique types, {sum(p['count'] for p in by_severity['high'])} total):")
    for p in by_severity["high"][:10]:
        print(f"   • [{p['type']}] {p['description'][:60]}...")
        print(f"     → {p['count']} occurrences | {p['suggestion']}")
    
    print(f"\n🟡 MEDIUM SEVERITY ({len(by_severity['medium'])} unique types, {sum(p['count'] for p in by_severity['medium'])} total):")
    for p in by_severity["medium"][:5]:
        print(f"   • [{p['type']}] {p['description'][:60]}...")
        print(f"     → {p['count']} occurrences | {p['suggestion']}")
    
    print(f"\n🟢 LOW SEVERITY ({len(by_severity['low'])} unique types, {sum(p['count'] for p in by_severity['low'])} total):")
    for p in by_severity["low"][:3]:
        print(f"   • [{p['type']}] {p['description'][:60]}...")
        print(f"     → {p['count']} occurrences | {p['suggestion']}")
    
    # Key insight
    total_occurrences = sum(p["count"] for p in deduplicated)
    unique_types = len(deduplicated)
    
    print(f"\n{'='*70}")
    print(f"📊 SUMMARY:")
    print(f"   Original patterns: {len(patterns)}")
    print(f"   Unique pattern types: {unique_types}")
    print(f"   Compression ratio: {len(patterns) / unique_types:.1f}x fewer items")
    print(f"   Total occurrences: {total_occurrences}")
    print(f"{'='*70}")
    
    # Save deduplicated report
    result = {
        "deduplicated_patterns": deduplicated,
        "summary": {
            "original_count": len(patterns),
            "deduplicated_count": unique_types,
            "compression_ratio": round(len(patterns) / unique_types, 1),
            "total_occurrences": total_occurrences,
            "by_severity": {
                "high": len(by_severity["high"]),
                "medium": len(by_severity["medium"]),
                "low": len(by_severity["low"])
            },
            "analyzed_at": datetime.now().isoformat()
        }
    }
    
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Deduplicated report saved to: {OUTPUT_PATH}")
    
    return result


def main():
    """Entry point."""
    result = deduplicate_patterns()
    print("\n" + "=" * 50)
    return result


if __name__ == "__main__":
    main()
