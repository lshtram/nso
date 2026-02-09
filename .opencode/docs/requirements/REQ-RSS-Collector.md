# Requirements: RSS Feed Collector Service

**Feature ID:** REQ-RSS-Collector
**Status:** DRAFT
**Author:** Oracle (NSO)
**Date:** 2026-02-09

## 1. Overview
A backend service responsible for fetching, parsing, and normalizing news articles from various RSS and Atom feeds. This service will act as the data ingestion layer for the Dream News platform.

## 2. Goals
- **Performance (CRITICAL):** Lightning-fast execution. Maximize concurrency and minimize parsing overhead. Target < 1s for 10 feeds (network permitting).
- **Aggregation:** Fetch content from multiple sources concurrently.
- **Normalization:** Convert disparate XML formats (RSS 2.0, Atom 1.0) into a single, consistent JSON structure.
- **Reliability:** Handle network failures and malformed feeds without crashing the entire process.

## 3. User Stories
- **US-1:** As a system, I want to accept a list of RSS/Atom feed URLs so that I know where to fetch news from.
- **US-2:** As a developer, I want normalized `NewsItem` objects (title, link, date, description, source) so that I can process them uniformly.
- **US-3:** As a system, I want to handle individual feed failures gracefully (log error, continue with others) so that one bad feed doesn't block the rest.
- **US-4:** As a user, I want the results returned instantly, so the system must use aggressive timeouts and parallel processing.

## 4. Functional Requirements
1.  **Input:** Array of strings (URLs).
2.  **Output:** Promise resolving to `NewsItem[]`.
3.  **Data Model (`NewsItem`):**
    - `id`: string (unique identifier, GUID or hash of link)
    - `title`: string
    - `link`: string (URL)
    - `description`: string (summary/snippet)
    - `pubDate`: Date object
    - `source`: string (feed title or domain)
    - `author`: string (optional)
    - `categories`: string[] (optional)
4.  **Error Handling:**
    - **Aggressive Timeouts:** Strict timeout per request (e.g., 3000ms) to ensure speed.
    - Invalid XML handling (skip item or feed).
    - HTTP error handling (404, 500).

## 5. Non-Functional Requirements
- **Performance:**
    - **Concurrent Fetching:** ALL feeds must be fetched in parallel (`Promise.allSettled`).
    - **Fast Parsing:** Use high-performance XML parser (e.g., `fast-xml-parser`).
    - **Low Overhead:** Minimal object allocation.
- **Language:** TypeScript
- **Runtime:** Node.js (v18+)
- **Testing:** Unit tests with Vitest (mocked network responses).
- **Dependencies:** Lightweight XML parser. No heavy DOM implementation.

## 6. Constraints
- No UI components (pure backend logic).
- Must run in a serverless-compatible environment (stateless).
