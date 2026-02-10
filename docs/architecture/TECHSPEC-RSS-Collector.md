# Technical Specification: High-Performance RSS Collector

**Feature:** RSS Feed Collector (Backend Service)
**Status:** DRAFT
**Author:** Oracle (NSO)
**Date:** 2026-02-09
**Related Requirements:** REQ-RSS-Collector.md

## 1. Executive Summary

A standalone, high-performance TypeScript module designed to concurrently fetch, parse, and normalize RSS/Atom feeds with minimal latency. The system prioritizes speed through parallel network requests (using `Promise.allSettled`), a fast XML parser (`fast-xml-parser`), and aggressive timeout handling to prevent slow sources from bottlenecking the entire batch.

## 2. Architecture Overview

The system is composed of three main layers:
1.  **Fetcher Layer (`FeedFetcher`):** Handles HTTP requests with strict timeouts and concurrency control.
2.  **Parser Layer (`FeedParser`):** Converts raw XML buffers into JavaScript objects using a high-performance stream-based or SAX-like parser.
3.  **Normalizer Layer (`FeedNormalizer`):** Maps disparate feed formats (RSS 2.0, Atom 1.0, RDF) into a unified `NewsItem` schema.

The entry point is the `RSSCollector` class, which orchestrates these layers.

### Component Diagram
```
[Client] -> [RSSCollector]
                 |
                 +-> [FeedFetcher] (Parallel HTTP Requests)
                 |       |
                 |       v
                 |   [Raw XML Buffer]
                 |
                 +-> [FeedParser] (Fast XML -> JS Object)
                 |       |
                 |       v
                 |   [Raw Feed Object]
                 |
                 +-> [FeedNormalizer] (Map to Standard Schema)
                         |
                         v
                     [NewsItem[]]
```

## 3. Data Models

### 3.1 Normalized Output (`NewsItem`)
This is the standard format for all processed items.

```typescript
interface NewsItem {
  id: string;          // GUID or hash of link
  title: string;       // Cleaned title (HTML entities decoded)
  link: string;        // Original URL
  description: string; // Summary or snippet (max 300 chars usually)
  pubDate: Date;       // Standardized Date object
  source: string;      // Feed title or domain name
  author?: string;     // Optional author name
  categories?: string[]; // Optional tags
  raw?: any;           // (Debug only) Original item for troubleshooting
}
```

### 3.2 Configuration (`CollectorOptions`)
```typescript
interface CollectorOptions {
  timeoutMs: number;   // Default: 3000ms
  maxRetries: number;  // Default: 1
  userAgent: string;   // Default: "DreamNewsBot/1.0"
  concurrencyLimit: number; // Default: 20 (batch size)
}
```

## 4. Implementation Strategy

### 4.1 Fetching Strategy (Speed Optimization)
- **Library:** Native `fetch` (Node 18+) or `axios` (if specific features needed, but `fetch` is lighter).
- **Concurrency:** `Promise.allSettled()` to ensure one failure doesn't reject the whole batch.
- **Timeouts:** Use `AbortController` to strictly enforce timeouts.
- **DNS Caching:** (Optional v2) To speed up repeated requests to same domains.

### 4.2 Parsing Strategy (Speed Optimization)
- **Library:** `fast-xml-parser` (FXP).
- **Configuration:**
  - `ignoreAttributes: false` (Need attributes for Atom links)
  - `parseTagValue: true` (Auto-convert primitives)
  - `trimValues: true`
- **Why FXP?** Benchmarks consistently show it as 10-50x faster than `xml2js` or DOM parsers because it avoids building a heavy DOM tree.

### 4.3 Normalization Strategy
- **Format Detection:** Heuristic check for root tag (`<rss>`, `<feed>`, `<rdf:RDF>`).
- **Field Mapping:**
  - **Date:** Try `pubDate`, `dc:date`, `updated`, `published`. Use a fast date parser if native `new Date()` is too slow (though native is usually fine for this scale).
  - **Content:** Prefer `description` or `summary`. Fallback to `content:encoded` if necessary but strip heavy HTML tags for speed.

## 5. Error Handling

1.  **Network Timeout:** Log warning, return `null` for that feed, proceed with others.
2.  **Invalid XML:** Log warning, return `null`.
3.  **Partial Data:** If an item is missing a title or link, skip that item (validation).

## 6. Testing Plan

### 6.1 Unit Tests (Vitest)
- **Fetcher:** Mock HTTP responses (200, 404, 500, Timeout). Verify `AbortSignal` works.
- **Parser:** Feed XML samples (RSS 2.0, Atom, Malformed). Verify parsing speed and correctness.
- **Normalizer:** Verify field mapping for different standards.

### 6.2 Performance Tests
- **Benchmark:** Measure time to fetch & parse 10, 50, 100 feeds.
- **Constraint:** < 1000ms for 10 feeds (network latency excluded/mocked).

## 7. Dependencies
- `fast-xml-parser`: Production dependency.
- `vitest`: Dev dependency.
- `nock` or `msw`: Dev dependency for network mocking (optional, or just mock global fetch).

## 8. Directory Structure
```
src/
  services/
    rss/
      collector.ts      # Main orchestration
      fetcher.ts        # Network layer
      parser.ts         # XML parsing
      normalizer.ts     # Data mapping
      types.ts          # Interfaces
  utils/
    logger.ts
```
