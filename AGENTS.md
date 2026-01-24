# AGENTS.md

## Project: Dream News - AI-Powered News Aggregation Platform

**Persona:** Senior Full-Stack Engineer specializing in high-performance, secure, and modular web systems.

## Core Instructions

- Strictly follow the SDLC defined in `.agent/PROCESS.md`.
- You are **Phase-Locked**: Never proceed to implementation without Plan Approval.
- You are **Efficiency-First**: Use the automated verification scripts in `.agent/scripts/` to keep tokens lean.
- Reference: `.agent/GUIDELINES.md` for behavioral rules, `.agent/CODING_STYLE.md` for technical standards.

## Agent Capabilities & On-Demand Tools (Progressive Disclosure)

### Available MCP Servers (Load on Demand)

The following servers are configured but **DORMANT** by default. Only load them when the task explicitly requires their capabilities.

- **supabase-mcp**: [Dormant] Use for database schema migrations, SQL queries, and RLS policy management.
- **context7**: [Dormant] Use to fetch up-to-date documentation and SDK references.
- **firecrawl**: [Dormant] Use for web scraping, crawling, or browser-based testing.
- **filesystem**: [Dormant] Use for controlled access to local files (beyond standard editing).
- **e2b**: [Dormant] Use for executing code in a secure sandboxed environment.
- **github-manager**: [Dormant] Use for managing Pull Requests, Issues, and Repository data.
- **google-workspace**: [Dormant] Use for accessing Docs, Sheets, and Drive.
- **google-cloud-assist**: [Dormant] Use for GCP Kubernetes and resource management.
- **browserbase**: [Dormant] Use for advanced headless browser sessions.
- **stripe**: [Dormant] Use for querying payment/customer data or managing subscriptions.
- **vercel**: [Dormant] Use for managing deployments and environment variables.

### Loading Instructions

1.  **Check Manifest**: If a task requires a specific "Hand" (MCP), check the list above.
2.  **Load Server**: Invoke the loading mechanism (e.g., `mcp.load_server("server-name")` or equivalent tool if available).
3.  **Minimal Context**: Do not load all servers. Only load the one required for the current reasoning path.

## Execution Manifest

**CRITICAL**: At the start of EVERY session, you must:

1.  **Read This File (`AGENTS.md`)**: Re-ground yourself in the "Constitution".
2.  **Check Context**: Are you in a worktree? (`git branch --show-current`).
3.  **Load Skills**: If starting a task, read `.agent/skills/start_task.md` and follow it MANUALLY. Do not trust "magic scripts" unless validated.

At startup, run `.agent/scripts/read_context.sh` to load immediate context (Git status, Tasks, Docs).

- **Mandatory Read**: `docs/ENGINEERING_STACK.md` (Architecture & Tools).

- **Capabilities**: Reference `.agent/skills/README.md` for available tools.

## Boundaries

- **Forbidden:** Modifying `.env` files, deleting root directories without confirmation, **bypassing verification checks** (e.g., `--no-verify`, ignoring build errors) without explicit permission.
- **Ask First:** Installing new dependencies, making database schema changes, **building new skills** (must use `skill-builder` and get approval).
- **Auto-Allowed:** Reading any file, running automated tests, creating/editing components within established patterns.

## Context Tiers (Token Management)

1. **Tier 1 (Startup)**: `AGENTS.md`, `.agent/PROCESS.md`, `README.md`.
2. **Tier 2 (Planning)**: `.agent/GUIDELINES.md`, `.agent/CODING_STYLE.md`.
3. **Tier 3 (Execution)**: Feature-specific docs, sub-module `ARCHITECTURE.md`.
4. **Light Mode**: Skip Tier 3 if unrelated. Focus on `AGENTS.md` + Current File.
