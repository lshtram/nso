# REQ-FeedScheduler (oracle_3f1a)

## Overview
The Feed Scheduler Service is responsible for periodically orchestrating the fetching of articles from registered RSS feeds. It ensures that the system stays up-to-date with new content while respecting source constraints (TTL) and utilizing existing infrastructure (FeedFetcher and ArticleStorage).

## User Stories
- As the system, I want to periodically poll RSS feeds so that I can automatically discover new articles.
- As a developer, I want the scheduler to respect RSS TTL/Refresh headers so that we don't overwhelm or get blocked by source servers.
- As a user, I want new articles to be automatically saved to storage so that they are available for reading.

## Acceptance Criteria
- [ ] Ability to register multiple RSS feeds with the scheduler.
- [ ] Periodic execution of feed fetching for all registered feeds.
- [ ] Respect `ttl` field in RSS feeds or HTTP caching headers (if available) to determine next fetch time.
- [ ] Integration with `FeedFetcher` (or `FeedParser`) to get article data.
- [ ] Integration with `ArticleStorage` to save unique articles.
- [ ] Basic error handling (e.g., if one feed fails, others should continue).

## Scope
### In Scope
- Scheduling logic (intervals, next-run calculation).
- Respecting RSS TTL headers.
- Coordination between `RSS Collector` and `Article Storage`.
- Logging of fetch attempts and results.

### Out of Scope
- Advanced UI for managing feeds (this is service-level).
- Complex retry strategies (e.g., exponential backoff) for the MVP.
- Persistent storage of the *schedule* itself (can be in-memory for MVP).

## Constraints
- Must run in the Bun runtime.
- Must not exceed memory limits for in-memory storage during MVP.
- Fetching must be non-blocking.

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Overwhelming source servers | IP Block / Server load | Strictly follow TTL and default to reasonable minimum (e.g., 15 mins). |
| Memory leaks from long-running timers | Service crash | Use robust scheduling patterns; avoid nested timeouts. |
| Duplicate article processing | High storage usage | Rely on `ArticleStorage` built-in deduplication. |

## Dependencies
- `FeedFetcher` / `FeedParser` (RSS Service)
- `ArticleStorage` (Storage Service)

---
**Author:** Antigravity (Oracle ID: oracle_3f1a)
**Date:** 2026-02-10
