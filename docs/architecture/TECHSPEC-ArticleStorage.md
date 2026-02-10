# TECHSPEC-ArticleStorage: Article Storage Service (In-Memory)

## 1. Overview
This technical specification details the implementation of the in-memory Article Storage Service, which provides persistence, deduplication, and retrieval capabilities for news articles.

## 2. Architecture
The service will be implemented as a class `ArticleStorageService` implementing a `StorageService` interface. It will reside in `src/services/storage/` and will not depend on any external database for this iteration.

### 2.1 Dependencies
- `NewsItem` (from `src/services/rss/types.ts`)
- No external runtime dependencies (pure TypeScript/Node.js).

## 3. Interface/API Definitions
The service must implement the following interface:

```typescript
import { NewsItem } from '../rss/types';

export interface StorageStats {
  totalCount: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}

export interface AddResult {
  added: number;
  skipped: number;
}

export interface ArticleFilter {
  startDate?: Date;
  endDate?: Date;
  keywords?: string[]; // search query split by spaces
}

export interface StorageService {
  /**
   * Adds a batch of items to the store.
   * Handles deduplication based on URL.
   */
  add(items: NewsItem[]): AddResult;

  /**
   * Retrieves an article by its unique ID.
   */
  getById(id: string): NewsItem | null;

  /**
   * Retrieves articles published within a specific date range.
   * Inclusive of start and end dates.
   */
  getByDateRange(start: Date, end: Date): NewsItem[];

  /**
   * Searches articles by keyword in title or description.
   * Case-insensitive.
   */
  search(query: string): NewsItem[];

  /**
   * Returns current storage statistics.
   */
  getStats(): StorageStats;

  /**
   * Clears the storage (useful for testing/reset).
   */
  clear(): void;
}
```

## 4. Data Model
Since this is an in-memory store, the data model consists of TypeScript interfaces and internal data structures.

### 4.1 Internal Storage Structure
The `ArticleStorageService` will use the following internal structures for efficiency:

```typescript
class ArticleStorageService implements StorageService {
  // Primary store: ID -> NewsItem
  private articles: Map<string, NewsItem> = new Map();

  // Deduplication index: URL -> ID
  private urlIndex: Map<string, string> = new Map();

  // Date index: YYYY-MM-DD -> Set<ID> (for faster range queries, optional optimization)
  // For MVP, simple iteration over values might be sufficient given <10k items constraint,
  // but an index is better for scalability.
  private dateIndex: Map<string, Set<string>> = new Map();
}
```

### 4.2 ID Generation
- If `NewsItem` has an `id`, use it.
- If not, generate a deterministic hash (e.g., SHA-256 or simple DJB2) of the `link` (URL).
- This ensures consistency across restarts if re-fetching the same feeds.

## 5. Error Handling
- **Invalid Input:** `add()` should handle null/undefined items gracefully (skip them).
- **Date Handling:** `getByDateRange` should throw an error or return empty array if `start > end`.
- **Concurrency:** Since Node.js is single-threaded, race conditions on `Map` operations are not a concern within a single process.
- **Memory Limit:** For the MVP, we assume memory is sufficient. A hard limit (e.g., 50k items) can be added to prevent OOM, throwing a `StorageError` if exceeded.

## 6. Testing Strategy
- **Unit Tests:**
  - `add()`: Verify count increases, duplicates skipped.
  - `getById()`: Verify retrieval.
  - `search()`: Verify keyword matching (case-insensitive).
  - `getByDateRange()`: Verify filtering logic.
- **Performance Tests:**
  - Benchmark `add()` with 10k items.
  - Benchmark `search()` with 10k items.
- **Tools:** Vitest.

## 7. Security Considerations
- **Input Sanitization:** Search queries should be sanitized to prevent regex DoS if using regex.
- **Memory usage:** Monitoring required to prevent DoS via massive feed ingestion.
