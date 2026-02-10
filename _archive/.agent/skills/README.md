# SKILL REGISTRY

> **System**: High-Integrity Agentic Framework
> **Usage**: The Orchestrator (`strong-prompt`) reads this registry to recommend skills.

## Core Skills (Lifecycle)

| Skill                                                   | Goal                                   | Trigger                           |
| :------------------------------------------------------ | :------------------------------------- | :-------------------------------- |
| **[strong-prompt](./strong-prompt/SKILL.md)**           | **ORCHESTRATOR**. Analysis & Strategy. | **STARTUP**, Complex Requests.    |
| **[start-task](./start-task/SKILL.md)**                 | Initialize workspace & context.        | user: "Start task X"              |
| **[finish-task](./finish-task/SKILL.md)**               | Verify, Commit, Merge, Cleanup.        | user: "I'm done"                  |
| **[context-management](./context-management/SKILL.md)** | Manage Tokens & Living Docs.           | Long conversations (>20k tokens). |

## Specialized Skills (On-Demand)

| Skill                                                             | Goal                                   | Trigger                            |
| :---------------------------------------------------------------- | :------------------------------------- | :--------------------------------- |
| **[code-review](./code-review/SKILL.md)**                         | Simple code review placeholder.        | User requests code review.         |
| **[self-correction](./self-correction/SKILL.md)**                 | **VERIFIER**. Logic/Code Critique.     | Before implementation, After bugs. |
| **[perspective-engineering](./perspective-engineering/SKILL.md)** | **DEBATER**. Multi-persona simulation. | Architectural/Product decisions.   |
| **[pattern-enforcement](./pattern-enforcement/SKILL.md)**         | **ENFORCER**. Code Style Police.       | Writing Code.                      |
| **[meta-prompting](./meta-prompting/SKILL.md)**                   | **OPTIMIZER**. Complex Logic Planning. | "Zero-shot" failures.              |

## Domain Skills (Expertise)

| Skill                                                         | Goal                               | Trigger                       |
| :------------------------------------------------------------ | :--------------------------------- | :---------------------------- |
| **[spec-writer](./spec-writer/SKILL.md)**                     | **PM**. Interview & PRD Gen.       | New Features, Vague Requests. |
| **[security-audit](./security-audit/SKILL.md)**               | OWASP/Red Team Review.             | Auth, APIs, Data Handling.    |
| **[test-architect](./test-architect/SKILL.md)**               | Test Strategy (Unit/E2E).          | Before writing tests.         |
| **[doc-maintainer](./doc-maintainer/SKILL.md)**               | Sync Code -> Docs.                 | Post-implementation.          |
| **[knowledge-integration](./knowledge-integration/SKILL.md)** | **MEMORIZER**. Update master docs. | **STEP 10 (Learning Loop)**.  |

## Service Mastery (MCP Enabled)

| Skill                                                 | Goal                                 | Trigger                     |
| :---------------------------------------------------- | :----------------------------------- | :-------------------------- |
| **[supabase-mastery](./supabase-mastery/SKILL.md)**   | Migration-First Schema Management.   | DB changes, `supabase-mcp`. |
| **[github-automation](./github-automation/SKILL.md)** | Automated PRs & GitHub Actions.      | Merging, Releases.          |
| **[env-security](./env-security/SKILL.md)**           | Secret Hygiene & Monitoring.         | Committing, CI Setup.       |
| **[research-mastery](./research-mastery/SKILL.md)**   | Anti-Hallucination & API Validation. | **Step 2 (Tech Spec)**.     |
