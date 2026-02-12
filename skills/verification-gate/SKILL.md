---
name: verification-gate
description: IDENTIFY→RUN→READ→VERIFY→CLAIM gate function with forbidden language detection and fresh evidence requirement.
agents: [Builder, Janitor]
workflows: [BUILD, DEBUG, REVIEW]
---

# Verification Gate — Mandatory Skill

**Agent:** Builder (before result.md), Janitor (during validation)
**Phase:** BUILD Phase 3 completion, BUILD Phase 4, DEBUG Phase 4, REVIEW Phase 3
**Priority:** CRITICAL — This skill is NON-NEGOTIABLE before ANY completion claim

---

## IRON LAW

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

"I ran the tests earlier" is not evidence. "The tests should pass" is not evidence.
Evidence is: you ran the command NOW, you read the output NOW, the output proves the claim.

---

## The Gate Function

Every completion claim — whether in `result.md`, verbal statements, or status updates — MUST pass through this 5-step gate:

### Step 1: IDENTIFY
**What specific claims am I making?**

Write them down explicitly:
```
Claims:
1. All tests pass
2. Typecheck passes
3. Feature X works as specified
4. No regressions introduced
```

### Step 2: RUN
**Execute the verification commands RIGHT NOW.**

Not "I ran them earlier." Not "they passed last time." Run them NOW.

```bash
# Example verification commands:
npx tsc --noEmit              # Typecheck
bun test                       # Unit tests
bun test -- --run             # All tests (no watch mode)
```

### Step 3: READ
**Read the ACTUAL output.**

Not "the exit code was 0." Not "it looked green." Read the output.

```
# GOOD: Actually reading output
"Tests: 47 passed, 0 failed. Time: 2.3s"

# BAD: Assuming from exit code
"Tests passed" (without reading how many, which ones)
```

### Step 4: VERIFY
**Does the output PROVE each claim?**

For each claim from Step 1, match it to specific evidence from Step 3:

```
Claim 1: "All tests pass"
Evidence: "Tests: 47 passed, 0 failed" — VERIFIED ✓

Claim 2: "Typecheck passes"
Evidence: "tsc --noEmit completed with 0 errors" — VERIFIED ✓

Claim 3: "Feature X works as specified"
Evidence: Test "should handle discount for gold tier" passes — VERIFIED ✓
Evidence: Test "should reject negative prices" passes — VERIFIED ✓
```

### Step 5: CLAIM
**Only NOW state the result.**

Write the claim with evidence attached. No claim without evidence.

```markdown
## result.md
- typecheck_status: PASS (tsc --noEmit: 0 errors)
- test_status: PASS (47/47 tests passing)
- feature_verified: YES (see tests: discount-gold, reject-negative)
```

---

## Forbidden Language

These phrases indicate UNVERIFIED claims. If you catch yourself using them, STOP and re-verify:

| Forbidden Phrase | What It Really Means | Replace With |
|---|---|---|
| "should work" | "I haven't tested it" | Run the test. Report the result. |
| "probably fine" | "I'm guessing" | Verify. Report evidence. |
| "seems to work" | "I glanced at it" | Run the full verification. Report output. |
| "I believe it passes" | "I'm remembering, not verifying" | Run it again. Report fresh output. |
| "Done!" | "I stopped working" | Run Gate Function. Then report. |
| "Everything looks good" | "I haven't checked everything" | List what you checked. Report evidence for each. |
| "No issues found" | "I didn't look very hard" | List what you checked. Report evidence. |
| "Tests are green" | Potentially stale | Run them NOW. Report the output. |
| "Should be backwards compatible" | "I haven't verified the API surface" | Check callers. Run integration tests. |
| "I fixed it" | "I changed something" | Prove it: failing test → fix → passing test. |

### Language Policing Rule
If a `result.md` or completion statement contains ANY forbidden phrase, the Janitor MUST:
1. Flag it immediately.
2. Request re-verification with fresh evidence.
3. Not proceed to APPROVE until forbidden language is replaced with evidence.

---

## Rationalization Table

| What You'll Think | Why It's Wrong |
|---|---|
| "I already tested this 5 minutes ago." | Code changes in 5 minutes. An edit you made since could have broken it. Run it again. |
| "The CI will catch it." | CI is a safety net, not a verification method. You verify BEFORE pushing. |
| "It's just a one-line change — what could go wrong?" | One-line changes have caused production outages. Verify. |
| "Running tests takes too long." | Running tests takes less time than debugging a broken deployment. |
| "I can see it works from the code." | Reading code ≠ running code. Compilers and runtimes find things humans miss. |
| "The user is waiting — I should just submit." | Submitting broken code wastes more of the user's time than verification. |
| "I'll verify it in the next step." | There is no "next step" for verification. This IS the step. |
| "The Janitor will catch any issues." | The Janitor checks YOUR claims. If you claim PASS without evidence, the Janitor should REJECT. |

---

## Regression Test Verification Pattern

When fixing a bug, the standard verification is:

```
1. RUN test → FAIL (bug reproduced) ✓
2. APPLY fix
3. RUN test → PASS (fix works) ✓
4. REVERT fix (git stash or undo)
5. RUN test → FAIL (proves test catches bug) ✓
6. RESTORE fix (git stash pop or redo)
7. RUN test → PASS (confirms fix is stable) ✓
8. RUN full suite → ALL PASS (no regressions) ✓
```

This pattern proves:
- The test actually catches the bug (step 1 and 5).
- The fix actually resolves it (step 3 and 7).
- Nothing else broke (step 8).

---

## Scope

This gate applies to ALL positive assertions, including:

- **result.md** — Builder's task completion report
- **Janitor validation reports** — "Code review score: 85"
- **Verbal claims** — "The feature is working"
- **Status updates** — "Phase 3 complete"
- **PR descriptions** — "This PR adds feature X"

---

## Red Flags — If You Notice These, STOP

1. **You're writing result.md without having terminal output on screen.** Go back and run the commands.
2. **You're copying test results from a previous run.** Run them again.
3. **You're writing "PASS" and feeling uncertain.** That uncertainty is data. Verify until certain.
4. **You claim N tests pass but can't name specific test descriptions.** You didn't read the output.
5. **You're using words like "should", "probably", "I think."** These are verification failures.

---

## Integration with Other Skills

### With TDD Skill
The TDD verification checklist (8 items) feeds INTO this gate. After completing the checklist, run the Gate Function on all claims.

### With Systematic Debugging Skill
Phase 4 (Verification) of debugging IS this gate function. The regression test pattern above is mandatory.

### With Code Reviewer Skill
When CodeReviewer checks Builder's result.md, they verify the Gate Function was followed: fresh evidence present, no forbidden language, claims match evidence.

---

## Skill Application Rule

**If there is even a 1% chance this skill applies to your current task, USE IT.**

This skill applies to:
- Any task completion claim
- Any result.md writing
- Any "I'm done" statement
- Any status report
- Any assertion about code correctness
- Any PR description

This skill does NOT apply to:
- Questions ("Does this approach make sense?")
- Plans ("I will implement X")
- Observations ("I see an error in the logs")
