---
description: Initialize a new development task. Usage: /start-task [light] <task-name>
---

1.  **Parse Arguments**:
    -   Check if the first argument is "light" or "--light".
    -   If yes: Set `MODE="light"` and use the next argument as `TASK_NAME`.
    -   If no: Set `MODE="standard"` and use the first argument as `TASK_NAME`.

2.  **Execute Agent Command**:
    -   // turbo
    -   If `MODE` is "light":
        -   Execute: `./agent start --light <TASK_NAME>`
    -   If `MODE` is "standard":
        -   Execute: `./agent start <TASK_NAME>`

3.  **Verify Context**:
    -   Read `.agent/scratchpad/WORKFLOW_MODE` to confirm the mode.
    -   Read `.agent/scratchpad/CURRENT_TASK` to confirm the name.

4.  **Initialize Artifacts**:
    -   If in Standard Mode, change directory to `.worktrees/<TASK_NAME>`.
    -   Create or update `task.md`.
    -   Proceed to create `PRD` if it doesn't exist.
