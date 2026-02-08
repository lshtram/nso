# Rollback Decision Tree

When E2E verification fails, present these options to the Oracle/User:

## Quick Decision Flow

```
                    Test Failures Detected?
                           |
              +------------+------------+
              |                         |
             NO                         YES
              |                         |
              v                         v
    ✅ Proceed to Closure        Check Severity
                                    |
                    +---------------+---------------+
                    |               |               |
               CRITICAL         HIGH           MEDIUM/LOW
                    |               |               |
                    v               v               v
            🔴 ROLLBACK       🟡 Review        🟢 Hot Fix / Continue
```

---

## Rollback Options

### Option 1: Create Fix Task
**Action:** Return to DEBUG workflow  
**When to use:** The failure is a real bug that needs fixing  

**Steps:**
1. Document the failure in memory
2. Create a new task for the bug fix
3. Run DEBUG workflow

**Risk Level:** LOW (preserves all changes)

---

### Option 2: Revert Branch
**Action:** Git revert or reset  
**When to use:** The failure is blocking and you want to undo changes quickly  

**Steps:**
1. Identify the problematic commit(s)
2. Revert or reset to a known good state
3. Verify E2E passes after revert

**Commands:**
```bash
# Revert the last commit
git revert HEAD

# Or reset to previous state (destructive)
git reset --hard HEAD~1

# Force push (if needed)
git push --force-with-lease origin main
```

**Risk Level:** MEDIUM (removes changes from history)

---

### Option 3: Hot Fix
**Action:** Deploy an emergency patch  
**When to use:** Quick fix available (< 1 hour), issue is isolated  

**Steps:**
1. Create hot fix branch
2. Make minimal changes
3. Test quickly
4. Deploy immediately

**Risk Level:** MEDIUM (rushing changes)

---

### Option 4: Document & Continue
**Action:** Log the failure and proceed  
**When to use:** The failure is a known issue, non-blocking, or environment-specific  

**Steps:**
1. Document the failure in memory (patterns.md - Gotchas)
2. Add to progress.md (deferred items)
3. Proceed with deployment (if other checks pass)

**Risk Level:** MEDIUM (shipping with known issue)

---

## Severity Definitions

| Severity | Criteria | Recommendation |
|----------|----------|----------------|
| **CRITICAL** | Core functionality broken, data loss possible, security breach | IMMEDIATE ROLLBACK (Option 2) |
| **HIGH** | Major feature broken, user-facing issue, regression | Review + Fix (Option 1) or Rollback |
| **MEDIUM** | Minor feature impaired, edge case failure | Hot Fix (Option 3) or Document |
| **LOW** | Cosmetic issue, logging error | Document & Continue (Option 4) |

---

## Decision Matrix

| Scenario | Severity | Recommended Option |
|----------|----------|-------------------|
| Auth service completely broken | CRITICAL | Option 2: Revert |
| API returns wrong data format | HIGH | Option 1: Create Fix Task |
| UI button color wrong | LOW | Option 4: Document & Continue |
| Third-party service timeout | MEDIUM | Option 4: Document & Continue |
| Performance regression | HIGH | Option 3: Hot Fix if quick, else Option 2 |
| Database connection failing | CRITICAL | Option 2: Revert |

---

## Decision Criteria

Before deciding on rollback, answer these questions:

1. **Scope**
   - [ ] How many users are affected?
   - [ ] Is it a critical path or edge case?

2. **Root Cause**
   - [ ] Do we know the exact cause?
   - [ ] Is it reproducible?

3. **Fix Time**
   - [ ] Can we fix it in < 1 hour?
   - [ ] Does the fix require extensive testing?

4. **Impact**
   - [ ] Any data integrity issues?
   - [ ] Any security implications?

5. **Recovery**
   - [ ] Do we have a working backup?
   - [ ] Is rollback tested?

---

## Post-Action Checklist

After executing any option:

- [ ] Update memory files (active_context.md, patterns.md)
- [ ] Notify relevant stakeholders
- [ ] Create tracking item if needed
- [ ] Schedule remediation if deferred

---

## Example Scenarios

### Scenario 1: Authentication Breaking Change

```
Failure: Auth service returns 401 for all requests
Severity: CRITICAL
Users Affected: 100%
Recommendation: Option 2 (Revert Branch)

Steps:
1. Execute: git revert HEAD
2. Run: validate.py --full
3. Deploy: git push origin main
4. Monitor: Check error logs
5. Document: Add to patterns.md
```

### Scenario 2: Performance Regression

```
Failure: API response time increased 500%
Severity: HIGH
Users Affected: 50%
Recommendation: Option 3 (Hot Fix) if quick fix available, else Option 2

Quick Fix Options:
1. Scale up resources
2. Add caching layer
3. Optimize query
```

### Scenario 3: Minor UI Issue

```
Failure: Button color incorrect on dark mode
Severity: LOW
Users Affected: 10%
Recommendation: Option 4 (Document & Continue)

Action: Create ticket, fix in next sprint
```

---

*Document Version: 1.1.0*
*Last Updated: 2026-02-07*
