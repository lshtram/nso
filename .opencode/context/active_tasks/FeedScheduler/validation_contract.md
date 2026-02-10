# Validation Contract: Feed Scheduler
- Task ID: FeedScheduler
- Agent: Janitor
- Workflow: BUILD
- Phase: VALIDATION
- Oracle ID: oracle_3f1a

## Objective
Independently validate the `FeedScheduler` implementation.

## Requirements
- Reference `docs/requirements/REQ-FeedScheduler.md`.
- Reference `docs/architecture/TECHSPEC-FeedScheduler.md`.
- Review implementation in `src/services/rss/FeedScheduler.ts`.
- Verify tests in `src/services/rss/FeedScheduler.test.ts`.

## Success Criteria
- [ ] Code adheres to "Interface-First" and "View-Model Separation" (where applicable) standards.
- [ ] TTL logic correctly handles minutes and enforces the 5-minute floor.
- [ ] `isFetching` lock is correctly implemented and prevents race conditions.
- [ ] Error handling ensures one feed failure doesn't stop others.
- [ ] Code review score >= 80.
- [ ] `bun test` and `tsc` pass on your end.

## Deliverables
- Validation result in `.opencode/context/active_tasks/FeedScheduler/validation_result.md`.
- Must include a `code_review_score` (0-100).
