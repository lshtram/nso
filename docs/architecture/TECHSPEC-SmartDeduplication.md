---
id: TECHSPEC-SmartDeduplication
author: oracle_5555
status: APPROVED
date: 2026-02-10
task_id: SmartDeduplication
---

# TECHSPEC-SmartDeduplication: Smart Article Deduplication Service

## 1. Overview
The Smart Article Deduplication Service provides high-accuracy near-duplicate detection using SimHash for content and fuzzy string matching for titles. It is designed to be integrated into the `ArticleStorageService` pipeline.

## 2. Architecture

### 2.1 Components
- `SimHashEngine`: A utility class responsible for tokenization, weighting, and generating 64-bit fingerprints.
- `DeduplicationService`: The primary service that orchestrates comparison logic and maintains a temporary index of seen hashes/titles.
- `SimilarityUtils`: Utility functions for Levenshtein distance and string normalization.

### 2.2 Data Flow
1. **Normalization**: Input text is stripped of HTML, punctuation, and converted to lowercase.
2. **Tokenization**: Text is split into k-grams (for SimHash) or words (for title matching).
3. **Hashing**: `SimHashEngine` generates a 64-bit fingerprint.
4. **Comparison**:
   - Exact Hash Match (O(1))
   - Hamming Distance ($\le 3$ bits)
   - Title Similarity ($\ge 90\%$)

## 3. Interface Definitions

```typescript
export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number; // 0 to 1
  reason?: 'exact_url' | 'content_hash' | 'title_similarity';
  originalId?: string;
}

export interface SimHashEngine {
  generate(text: string): bigint;
  getHammingDistance(h1: bigint, h2: bigint): number;
}

export interface DeduplicationService {
  /**
   * Checks if an item is a duplicate of one already in storage or the current batch.
   */
  check(item: NewsItem): DeduplicationResult;
  
  /**
   * Adds an item to the deduplication index.
   */
  index(item: NewsItem, id: string): void;
}
```

## 4. Implementation Details

### 4.1 SimHash Algorithm
1. Tokenize content into words.
2. Hash each word to a 64-bit value using a fast hash (e.g., DJB2 or a simple 64-bit Jenkins hash).
3. For each bit position $i$ (0-63):
   - Maintain a weight counter $V_i$, initialized to 0.
   - If the $i$-th bit of the word hash is 1, $V_i += 1$.
   - If the $i$-th bit of the word hash is 0, $V_i -= 1$.
4. Generate the final 64-bit fingerprint: if $V_i > 0$, the $i$-th bit is 1, else 0.

### 4.2 Title Similarity
Use the Levenshtein distance algorithm:
$similarity = 1 - (distance / max(length1, length2))$

## 5. Integration Plan
`ArticleStorageService.add()` will be modified to:
1. Iterate through incoming items.
2. Call `DeduplicationService.check()`.
3. If `isDuplicate` is true, skip the item (optionally merge metadata).
4. If not a duplicate, add to storage and call `DeduplicationService.index()`.

## 6. Observability & Loop Safety
- **Logging**: All checks log `[DeduplicationService] CHECK_START` and `[DeduplicationService] CHECK_SUCCESS` with result.
- **Constraints**: 
  - `MAX_CONTENT_LENGTH`: Limit SimHash evaluation to first 5000 chars to avoid CPU spikes.
  - `MIN_TITLE_LENGTH`: Require at least 10 chars for title similarity check to avoid false positives on "Breaking News".
