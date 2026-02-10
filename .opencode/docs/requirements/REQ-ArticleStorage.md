# REQ-ArticleStorage: Article Storage Service (In-Memory)

## 1. Introduction
The Article Storage Service provides a centralized mechanism for persisting, retrieving, and managing news articles collected from RSS feeds. This initial implementation focuses on an efficient in-memory store with deduplication and search capabilities, laying the groundwork for future database integration.

## 2. Scope
The scope of this module includes the development of an in-memory Article Storage Service.

**In Scope:**
- In-memory storage of `NewsItem` objects.
- Deduplication logic based on URL.
- Retrieval by ID and Date Range.
- Keyword search functionality.
- Statistics reporting.
- Integration with existing `NewsItem` type.

**Out of Scope:**
- Persistent database integration (PostgreSQL, Redis).
- User authentication/authorization.
- Advanced search features (fuzzy matching, stemming).
- UI implementation (Dashboard).

## 3. Acceptance Criteria
- **AC-01:** `add()` accepts a batch of articles and correctly returns the count of added vs. skipped (duplicate) items.
- **AC-02:** `getById()` returns the correct article for a valid ID and `null` for an invalid ID.
- **AC-03:** `getByDateRange()` returns only articles within the specified start and end dates (inclusive).
- **AC-04:** `search()` returns articles containing the query string in either title or summary (case-insensitive).
- **AC-05:** `stats()` returns the correct total count and date ranges.
- **AC-06:** The service handles 10,000 items with query latency under 100ms.
- **AC-07:** The implementation passes all TypeScript strict checks (`tsc --noEmit`).
- **AC-08:** Unit test coverage is at least 90%.

## 4. Functional Requirements

### 4.1 Storage & Deduplication
- **REQ-AS-001:** The system MUST store `NewsItem` objects in memory.
- **REQ-AS-002:** The system MUST prevent duplicate entries based on the article's `link` (URL).
- **REQ-AS-003:** The `add()` method MUST accept an array of `NewsItem` objects and return the count of newly added items.
- **REQ-AS-004:** Each stored article MUST have a unique ID (generated if not provided, or derived from URL hash).

### 4.2 Retrieval & Search
- **REQ-AS-005:** The system MUST provide `getById(id: string)` to retrieve a specific article.
- **REQ-AS-006:** The system MUST provide `getByDateRange(start: Date, end: Date)` to retrieve articles published within a timeframe.
- **REQ-AS-007:** The system MUST provide `search(query: string)` to find articles matching keywords in `title` or `summary`.
  - Search should be case-insensitive.
  - Partial matches should be supported.

### 4.3 Management & Stats
- **REQ-AS-008:** The system MUST provide `stats()` returning:
  - Total article count.
  - Date of the oldest article.
  - Date of the newest article.
- **REQ-AS-009:** The system MUST provide `clear()` to remove all stored articles (for testing/reset).

## 5. Non-Functional Requirements
- **NFR-AS-001:** **Performance:** `add()` and query operations must complete in <100ms for datasets up to 10,000 items.
- **NFR-AS-002:** **Memory Efficiency:** Data structures should minimize redundant storage.
- **NFR-AS-003:** **Type Safety:** All public methods must use strict TypeScript types (`NewsItem`, `StorageStats`).
- **NFR-AS-004:** **Testing:** Code coverage must be >90%, including edge cases (empty store, duplicates).

## 6. Constraints
- **CON-AS-001:** Must implement `StorageService` interface.
- **CON-AS-002:** No external database (PostgreSQL/Redis) for this iteration; purely in-memory.
- **CON-AS-003:** Must reuse `NewsItem` interface from `src/services/rss/types.ts`.

## 7. Interface Definition (Draft)
```typescript
interface StorageStats {
  totalCount: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}

interface AddResult {
  added: number;
  skipped: number; // duplicates
}

interface StorageService {
  add(items: NewsItem[]): AddResult;
  getById(id: string): NewsItem | null;
  getByDateRange(start: Date, end: Date): NewsItem[];
  search(query: string): NewsItem[];
  getAll(): NewsItem[]; // Helper for debug/listing
  clear(): void;
  getStats(): StorageStats;
}
```

## 8. Success Metrics
- **Typecheck Status:** `PASS` (tsc --noEmit)
- **Test Status:** `PASS` (vitest)
- **Code Review Score:** ≥ 80/100
