---
description: Merge, audit, and cleanup. Usage: /finish-task
---

1.  **Read Context**:

    - Read `.agent/scratchpad/CURRENT_TASK`.
    - Read `.agent/scratchpad/WORKFLOW_MODE`.

2.  **Execute Audit**:

    - // turbo
    - Execute: `./agent audit`
    - If fails -> STOP. Notify user.

3.  **Doc Sync Check**:

    - **Constraint**: Have you updated `docs/PRD_Core_Framework.md` status to ✅?
    - **Constraint**: Have you updated the Feature PRD status to ✅?
    - If no -> STOP. Update docs first.

4.  **Merge Logic**:

    - If Mode is STANDARD:
      - Execute: `git fetch origin main`
      - Execute: `git switch main`
      - Execute: `git merge --no-ff <CURRENT_TASK>`
      - Execute: `git branch -d <CURRENT_TASK>`
      - Notify user: "Task <CURRENT_TASK> merged and branch deleted."
    - If Mode is LIGHT:
      - Execute: `git add . && git commit -m "feat: <CURRENT_TASK>"`
      - Notify user: "Light task committed to current branch."

5.  **Cleanup**:
    - Execute: `./agent audit` (One last verify).
