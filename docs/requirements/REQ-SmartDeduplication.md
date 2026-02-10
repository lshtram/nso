---
id: REQ-SmartDeduplication
author: oracle_5555
status: APPROVED
date: 2026-02-10
task_id: SmartDeduplication
---

# REQ-SmartDeduplication: Smart Article Deduplication Service

## Overview
The Smart Article Deduplication Service aims to reduce noise in the news feed by identifying and filtering out duplicate or near-duplicate articles. It uses a combination of title similarity and content hashing (SimHash) to detect duplicates that might have slightly different URLs or minor formatting variations.

## User Stories
- As a user, I want to see only unique news articles so that I don't get overwhelmed by the same story from different sources.
- As a system, I want to identify near-duplicate articles efficiently so that I can group them or filter them out during the aggregation process.

## Acceptance Criteria
- [ ] **AC-01:** Detect exact duplicates based on content hash (SimHash).
- [ ] **AC-02:** Detect near-duplicates based on SimHash Hamming distance (threshold configurable).
- [ ] **AC-03:** Detect duplicates based on title similarity (Levenshtein distance or similar).
- [ ] **AC-04:** Integration with `ArticleStorageService` to skip duplicates during `add()`.
- [ ] **AC-05:** Observability: Log start/success/failure with timestamps.
- [ ] **AC-06:** Performance: Deduplication check for a batch of 100 items should take < 500ms.
- [ ] **AC-07:** Pass all strict TypeScript checks.
- [ ] **AC-08:** Unit test coverage >= 90%.

## Scope
### In Scope
- `SimHashEngine`: Utility to generate and compare SimHash fingerprints.
- `DeduplicationService`: Core logic for comparing articles using titles and hashes.
- Integration with `ArticleStorageService`.
- Handling of short content/titles (fallback to simple match).

### Out of Scope
- Semantic clustering (beyond near-duplicate detection).
- Persistent storage of hashes (in-memory for now).
- External ML models for deduplication.

## Constraints
- **C-01:** SimHash must use a 64-bit fingerprint.
- **C-02:** Hamming distance threshold for near-duplicates must be <= 3 by default.
- **C-03:** Title similarity threshold must be >= 0.9 (90%).

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| High False Positives | Users miss unique articles | High threshold for similarity and manual verification during dev. |
| High CPU usage for SimHash | Slow ingestion | Efficient bit-manipulation and caching of hashes. |
| Short titles causing collisions | Incorrect deduplication | Use combined title + summary for hashing; use exact match for very short titles. |

## Dependencies
- `ArticleStorageService`
- `NewsItem` type definition
