# Self-Improve Skill

**Agent:** Librarian
**Phase:** Closure (automatic)
**Trigger:** Invoked automatically at Closure phase of BUILD/DEBUG/REVIEW workflows
**Input:** OpenCode session messages (from `~/.local/share/opencode/storage/message`)
**Output:** Updated memory files and approved pattern implementations

---

## Purpose

Run the complete self-improvement workflow at workflow closure using agent skills:
1. Copy new session messages since last review (script)
2. Detect patterns using Janitor's pattern-detection skills
3. Deduplicate identical patterns (script)
4. Present findings and get user approval
5. Implement approved changes to memory using agent skills

---

## When Used

**Automatic:** Invoked at the START of Closure phase by the Librarian agent

**Manual:** User can trigger via:
- `/self-improve` command

---

## Workflow (Agent-Managed)

```
1. COPY SESSION (Script)
   ├─ Librarian runs: python3 .opencode/scripts/copy_session.py
   ├─ Reads: ~/.local/share/opencode/storage/message/
   ├─ Filters: Only messages for current project (auto-detected from git/directory)
   └─ Outputs: .opencode/logs/session.json

2. DETECT PATTERNS (Agent Skill)
   ├─ Librarian delegates to Janitor
   ├─ Janitor uses: pattern-detector, intelligent-pattern-detector skills
   ├─ Reads: .opencode/logs/session.json
   ├─ Skips: Already reviewed messages (from reviewed_sessions.json)
   ├─ Detects: bypass, repeated_failure, quick_closure, model_switch, missing_approval
   └─ Outputs: .opencode/logs/pattern_candidates.json

3. DEDUPLICATE (Script)
   ├─ Librarian runs: python3 .opencode/scripts/deduplicate_patterns.py
   ├─ Reads: .opencode/logs/pattern_candidates.json
   ├─ Groups: Identical patterns together
   ├─ Counts: Occurrences per pattern type
   └─ Outputs: .opencode/logs/pattern_deduplicated.json

4. PRESENT FINDINGS (Agent)
   ├─ Librarian reviews deduplicated patterns
   ├─ Presents findings to user
   └─ Asks: User approval for implementation

5. IMPLEMENT (Agent Skills)
   ├─ Librarian uses: pattern-implementer skill
   ├─ Janitor applies fixes as needed
   ├─ Updates: .opencode/context/01_memory/patterns.md
   ├─ Updates: .opencode/logs/trends.json
   └─ Updates: .opencode/logs/reviewed_sessions.json

6. MEMORY UPDATE (Agent Skill)
   └─ Librarian uses: memory-update skill
```

---

## Configuration

**Project Detection:** Auto-detected from git repository or current directory name (filters session messages to current project only)

**Session Tracking:** `.opencode/logs/reviewed_sessions.json`
```json
{
  "reviewed": [
    {
      "first_message_time": 1769607220757,
      "last_message_time": 1770505663885,
      "message_count": 1554,
      "reviewed_at": "2026-02-07T15:07:57",
      "patterns_found": 544
    }
  ],
  "last_review": "2026-02-07T15:07:57"
}
```

---

## Pattern Types Detected

| Pattern | Severity | Description | Action |
|---------|----------|-------------|--------|
| `bypass` | high | Consecutive build calls without Oracle | Flag (may be normal development) |
| `repeated_failure` | medium | Same file modified 5+ times | Add to patterns.md |
| `quick_closure` | low | Oracle phase < 2 minutes | Informational |
| `model_switch` | low | Multiple models used | Document |
| `missing_approval` | high | Oracle phases without user approval | Flag |

---

## Usage in Closure Phase

**For the Librarian Agent:**

At the START of Closure phase:

```bash
# Step 1: Copy session (script)
python3 .opencode/scripts/copy_session.py

# Step 2: Detect patterns (delegate to Janitor)
task(
    agent="Janitor",
    prompt="Use pattern-detection skills to analyze .opencode/logs/session.json for patterns. Output to .opencode/logs/pattern_candidates.json."
)

# Step 3: Deduplicate (script)
python3 .opencode/scripts/deduplicate_patterns.py

# Step 4: Present findings and get approval
# (Librarian presents findings, asks user for approval)

# Step 5: Implement approved patterns (delegate as needed)
# (Librarian uses pattern-implementer skill or delegates to Janitor)
```

**After self-improve completes:**
1. Update memory files with findings (memory-update skill)
2. Complete Closure contract
3. Optionally git commit

---

## Example Output

```
📋 SELF-IMPROVEMENT FINDINGS (DEDUPLICATED)

📊 SUMMARY:
   • Total patterns detected: 544
   • Unique pattern types: 4
   • Compression ratio: 136x

🔍 PATTERNS BY SEVERITY:
   🔴 HIGH: 1 unique types (541 occurrences - development iterations)
   🟡 MEDIUM: 2 unique types (2 occurrences - file churn)
   🟢 LOW: 1 unique types (1 occurrence - model switch)

📝 IMPLEMENTATION PLAN:
1. [FLAG] 541 high-severity patterns → Console output
2. [ADD_PATTERNS] 2 medium-severy patterns → patterns.md
3. [UPDATE_TRENDS] 544 total → trends.json

✅ APPROVAL REQUIRED
Type 'approve' to implement, 'skip' to skip.
```

---

## Integration with AGENTS.md

The Librarian's responsibilities in AGENTS.md include:

> **Responsibilities:**
> - Maintains memory files (active_context.md, patterns.md, progress.md)
> - Performs workflow closure (memory update, git commit)
> - **Runs self-improvement analysis at Closure using skills**

> **Skills:**
> - `memory-update` - Refresh memory files
> - `context-manager` - Organize memory
> - **`self-improve` - Orchestrates self-improvement using agent skills**

---

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `.opencode/logs/session.json` | Output | Copied session messages |
| `.opencode/logs/pattern_candidates.json` | Output | Raw pattern detections |
| `.opencode/logs/pattern_deduplicated.json` | Output | Deduplicated patterns |
| `.opencode/logs/reviewed_sessions.json` | Output | Session tracking |
| `.opencode/logs/trends.json` | Output | Pattern trends |
| `.opencode/context/01_memory/patterns.md` | Modified | New patterns added |

---

## Performance Notes

- **First run:** Analyzes all messages (~30 seconds, 1500 messages)
- **Subsequent runs:** Skips already-reviewed (~1 second, only new messages)
- **Efficiency gain:** 95%+ time savings after first run

---

## Troubleshooting

**"No new messages since last review"**
- Normal! The session is up to date
- Self-improve completes in <1 second

**"Permission denied"**
- Check OpenCode storage permissions
- Run: `chmod -R u+rw ~/.local/share/opencode/storage/message/`

---

## Key Principles

- Scripts are used only for **data extraction** (copy_session) and **deduplication** (grouping patterns)
- All **intelligence** is handled by agent skills (pattern detection, pattern implementation)
- The **Librarian orchestrates** the workflow, delegating to the Janitor as needed
- User approval is always required before implementing pattern changes
