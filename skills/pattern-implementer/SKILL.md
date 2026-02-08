# Pattern Implementer Skill

**Agent:** Librarian  
**Phase:** Self-Improvement Workflow  
**Input:** `.opencode/logs/pattern_candidates.json` (from Pattern Detector)  
**Output:** Updated memory files and user flags  

---

## Purpose

Read pattern candidates identified by the Pattern Detector and implement improvements:
- **High severity:** Flag for user attention
- **Medium severity:** Add to `patterns.md`
- **Low severity:** Document in conventions

---

## When Used

After Pattern Detector completes:
1. **Automatic:** At end of `/self-improve` workflow
2. **Manual:** User triggers `/self-improve`

---

## Workflow

```
Pattern Detector (analyze.py)
    ↓
Pattern Candidates (pattern_candidates.json)
    ↓
Pattern Implementer (apply.py)
    ↓
┌─────────────────────────────────────┐
│ High Severity → User Flag          │
│ Medium Severity → patterns.md     │
│ Low Severity → AGENTS.md conventions│
└─────────────────────────────────────┘
```

---

## Usage

```bash
# Step 1: Copy session
python3 .opencode/scripts/copy_session.py

# Step 2: Detect patterns
python3 .opencode/skills/pattern-detector/analyze.py

# Step 3: Implement fixes
python3 .opencode/skills/pattern-implementer/apply.py
```

---

## Integration

1. **Reads:** `.opencode/logs/pattern_candidates.json`
2. **Writes:** 
   - `.opencode/context/01_memory/patterns.md` (medium severity)
   - `.opencode/logs/trends.json` (statistics)
3. **Outputs:** Console messages (high severity)
