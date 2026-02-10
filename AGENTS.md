# Dream News — Project Context

**Project:** Dream News - AI-Powered News Aggregation Platform

> **Process:** This project uses NSO (Neuro-Symbolic Orchestrator) for all development workflows.
> NSO process directives take precedence over any project-level process definitions.
> See `instructions.md` for workflow details.

---

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Runtime:** Bun
- **Testing:** Vitest
- **Styling:** Tailwind CSS (planned)

## Coding Standards

### Interface-First Design
Define types/interfaces before implementations. Write `feature.types.ts` first.

### View-Model Separation
UI components must be pure. Extract logic to ViewModel hooks (`useXxxViewModel()`).

### Context Headers
Every file starts with a context block:
```typescript
/**
 * @file fileName.ts
 * @context Domain / Module
 * @desc What this file does.
 * @dependencies [Dep1, Dep2]
 */
```

### Defensive Programming
Public functions begin with assertions. Fail fast, don't propagate silent errors.

### Test Colocation
Tests live next to source files: `Feature.ts` + `Feature.test.ts` in the same directory.

## Boundaries

- **Forbidden:** Modifying `.env` files, deleting root directories without confirmation, bypassing test failures.
- **Ask First:** Installing new dependencies, database schema changes.
- **Auto-Allowed:** Reading any file, running tests, creating/editing files within established patterns.

## Architecture

```
src/
  services/
    rss/           # RSS feed collector (FeedFetcher, FeedParser, FeedNormalizer)
    storage/       # Article storage (in-memory, dedup by URL hash)
  components/      # React UI components (planned)
```
