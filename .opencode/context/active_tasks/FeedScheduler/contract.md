# Task Contract: Feed Scheduler Implementation
- Task ID: FeedScheduler
- Agent: Builder
- Workflow: BUILD
- Phase: IMPLEMENTATION
- Oracle ID: oracle_3f1a

## Objective
Implement the `FeedScheduler` service as defined in `docs/architecture/TECHSPEC-FeedScheduler.md`.

## Requirements
- Reference `docs/requirements/REQ-FeedScheduler.md`.
- Implement `src/services/rss/FeedScheduler.ts`.
- Implement `src/services/rss/FeedScheduler.test.ts`.
- Update `src/services/rss/types.ts` and `src/services/rss/collector.ts` (if needed) to expose TTL/metadata from fetched feeds.
- Ensure integration with `RSSCollector` and `ArticleStorageService`.

## Success Criteria
- [ ] `FeedScheduler` can register feeds and start/stop a polling loop.
- [ ] Scheduler respects `<ttl>` tag from RSS feeds.
- [ ] New articles are successfully saved to `ArticleStorageService`.
- [ ] Unit tests cover scheduling logic, TTL parsing, and coordination.
- [ ] `bun test` passes.
- [ ] `tsc` (type check) passes.

## Implementation Details
- Enforce a minimum interval of 5 minutes even if TTL is lower.
- Track "isFetching" state to prevent overlapping polls for the same feed.
- Handle feed errors gracefully (log and retry next cycle).
