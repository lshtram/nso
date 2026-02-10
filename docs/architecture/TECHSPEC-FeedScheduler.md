# TECHSPEC-FeedScheduler (oracle_3f1a)

## Overview
The FeedScheduler manages the lifecycle of RSS feed fetching. It maintains a schedule of registered feeds, determines when they need to be polled based on TTL (Time-To-Live) values, and coordinates the flow from `RSSCollector` to `ArticleStorageService`.

## Interface Design

### `FeedScheduler` Class
```typescript
interface FeedConfig {
  url: string;
  name: string;
  defaultIntervalMinutes?: number; // fallback if no TTL
}

interface FeedStatus {
  url: string;
  lastFetched: Date | null;
  nextFetch: Date;
  lastError?: string;
}

class FeedScheduler {
  constructor(
    private collector: RSSCollector,
    private storage: StorageService,
    private options: { defaultInterval: number } = { defaultInterval: 15 }
  ) {}

  /**
   * Registers a new feed to be polled.
   */
  registerFeed(config: FeedConfig): void;

  /**
   * Starts the scheduler loop.
   */
  start(): void;

  /**
   * Stops the scheduler loop.
   */
  stop(): void;

  /**
   * Force an immediate fetch for a specific feed or all feeds.
   */
  fetchNow(url?: string): Promise<void>;

  /**
   * Returns current status of all managed feeds.
   */
  getStatus(): FeedStatus[];
}
```

## Data Model

### Internal State
- `Map<string, FeedConfig>`: Registry of feeds.
- `Map<string, Date>`: Tracking of `nextFetch` times.
- `Map<string, FeedStatus>`: Runtime status tracking.
- `Timer`: A single main interval or multiple `setTimeout` handles to wake up the service.

### TTL Resolution Logic
1. Check RSS feed `<ttl>` tag (minutes).
2. Check `sy:updatePeriod` and `sy:updateFrequency` (RSS 1.0 extension).
3. If missing, use `defaultIntervalMinutes` from config.
4. If missing, use global `defaultInterval`.
5. Minimum interval enforced: 5 minutes (protection).

## Coordination Flow
1. **Trigger:** `nextFetch` time reached for a feed.
2. **Action:** Call `RSSCollector.collect([url])`.
3. **Handle Result:**
   - On success:
     - Pass `items` to `storage.add()`.
     - Calculate new `nextFetch` from parsed feed TTL.
     - Update `lastFetched` and clear `lastError`.
   - On failure:
     - Update `lastError`.
     - Set `nextFetch` to `now + defaultInterval` (retry).

## Error Handling
- Individual feed failures must not stop the scheduler.
- Errors are captured in `FeedStatus` for observability.
- Transient errors (network) are handled by standard retry in the next scheduled interval.

## Architecture Review
### Simplicity Checklist
- [x] Use a single class to manage coordination.
- [x] Lean on existing `RSSCollector` for fetching/parsing and `ArticleStorage` for saving/dedup.
- [x] In-memory schedule is sufficient for MVP.

### Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Memory usage growth | High | Monitored by Storage stats; Articles are currently in-memory but deduped. |
| Overlapping fetches | Medium | Track "isFetching" state per URL to prevent concurrent fetches of the same feed. |

## Implementation Plan
1. Define `FeedScheduler` types and interface.
2. Implement `registerFeed` and status tracking.
3. Implement TTL extraction from parsed RSS (may require minor update to `FeedNormalizer` or `RSSCollector` to expose raw TTL).
4. Implement the scheduling loop (`start`/`stop`).
5. Integrate `RSSCollector` and `ArticleStorageService`.

## Testing Strategy
- Unit tests for TTL calculation logic.
- Mock `RSSCollector` and `StorageService` to verify coordination.
- Test edge cases: feed returns no items, feed returns error, feed has no TTL.

---
**Author:** Antigravity (Oracle ID: oracle_3f1a)
**Date:** 2026-02-10
