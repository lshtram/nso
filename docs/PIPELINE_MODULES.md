# Dream News: Modular Pipeline Stage Documentation

This document provides a granular specification for each of the 11 stages in the Dream News ingestion pipeline. Each stage is designed to be independent, steerable, and performance-profiled.

---

## 🚀 Performance Monitoring

Profiling is built into the `IngestionOrchestratorV2`. Every run captures:

- **Duration**: Milliseconds elapsed for the specific stage.
- **Input Count**: Number of items received.
- **Output Count**: Number of items produced.
- **Rate/1k**: Normalized performance metric for scaling analysis.

---

## 🛠 Stage 1: Discovery

- **Function**: Executes bulk discovery of content "pointers" (URLs, titles, timestamps) from external nodes.
- **Input**: `SourceEntity[]` (List of sources with URL, Type, and Signal Score).
- **Controls**:
  - `discovery.maxItemsPerSource`: Cap on items per source to prevent flooding.
  - `discovery.searchWindowHours`: Only ingest items published within this window.
- **Output**: `DiscoveredItem[]` (Raw pointers with a `priorityScore` inherited from the source).
- **Logic**: Uses the `Connector` factory to fetch RSS/XML/JSON. Handles HTML feed discovery if the source is a standard webpage.

---

## 🛠 Stage 2: URL Deduplication

- **Function**: Eliminates items that have already been processed in the last 7 days.
- **Input**: `DiscoveredItem[]`
- **Controls**:
  - `ingestion.lookbackHours`: How far back in the database history to check for duplicates.
- **Output**: `DiscoveredItem[]` (Only new, unseen items).
- **Logic**: Performs a batch lookup against the `IngestionRepository`. Returns only the difference set.

---

## 🛠 Stage 3: Noise Filtering

- **Function**: Heuristic removal of low-value content using pattern matching.
- **Input**: `DiscoveredItem[]`
- **Controls**:
  - `triage.noiseThreshold`: Sensitivity for the heuristic score.
- **Output**: `DiscoveredItem[]` (Cleaned list).
- **Logic**: Scans titles and descriptions for "Noise Patterns" like "SPONSORED", "Daily Briefing", "Weekly Roundup", or generic "Subscribe now" items.

---

## 🛠 Stage 4: Intelligent Triage

- **Function**: A "Fast Scan" using the Neural Brain (LLM) to rank items by interest _before_ expensive scraping.
- **Input**: `DiscoveredItem[]`
- **Controls**:
  - `triage.minInterestScore`: Items scoring below this are dropped.
  - `triage.maxHydrationLimit`: Hard cap on how many items move to Stage 5 (e.g., top 40).
- **Output**: `DiscoveredItem[]` (Sorted by priority, capped at the hydration limit).
- **Logic**: Sends batched titles/snippets to the Brain. The Brain returns a list of interest scores (0-100) based on the user's current Interest Equalizer settings.

---

## 🛠 Stage 5: High-Fidelity Hydration

- **Function**: Heavy-duty extraction of full article text, transcripts, or PDF content.
- **Input**: `DiscoveredItem[]`
- **Controls**:
  - N/A (Inherits the `maxHydrationLimit` from Stage 4).
- **Output**: `HydratedItem[]` (Items with `fullText` populated).
- **Logic**: Iterates through the triage survivors. If the RSS didn't provide full content, it triggers a headless browser scrape.

---

## 🛠 Stage 6: Semantic Embedding

- **Function**: Converts hydrated text into high-dimensional vector representations.
- **Input**: `HydratedItem[]`
- **Controls**:
  - `brain.embeddingModel`: (Hidden) Selects the vector model (e.g., text-embedding-004).
- **Output**: `HydratedItem[]` (Every item now contains an `.embedding` vector).
- **Logic**: Batch-processes full text through the Brain's embedding endpoint.

---

## 🛠 Stage 7: Semantic Deduplication (Near-Duplicate Resolution)

- **Function**: Merges items that are semantically identical but from different sources.
- **Input**: `HydratedItem[]`
- **Controls**:
  - `dedupe.similarityThreshold`: Default 0.95. Higher = more strict.
- **Output**: `HydratedItem[]` (Canonical versions only).
- **Logic**: Calculates a cosine similarity matrix. If two items score > 0.95, they are merged into a single canonical item. The highest-quality source (Signal Score) is kept as the primary.

---

## 🛠 Stage 8: Semantic Clustering

- **Function**: Groups distinct stories into narrative "StoryClusters".
- **Input**: `HydratedItem[]`
- **Controls**:
  - `clustering.epsilon`: Density weight (Distance between items in vector space).
  - `clustering.minClusterSize`: Minimum items to form a story (usually 1 or 2).
- **Output**: `StoryCluster[]`
- **Logic**: Uses a density-based clustering algorithm (DBSCAN).

---

## 🛠 Stage 9: Narrative Synthesis

- **Function**: Brain-driven generation of Titles, Summaries, and "Why It Matters".
- **Input**: `StoryCluster[]`
- **Controls**:
  - `synthesis.persona`: Sets the tone (e.g., "Critical Analyst", "Curious Generalist").
  - `synthesis.detailLevel`: Content length control.
- **Output**: `StoryCluster[]` (Populated with `narrative` and `whyItMatters`).
- **Logic**: Sends cluster data to the High-Brain. The Brain generates a coherent story narrative across all member items.

---

## 🛠 Stage 10: Scoring & Ranking

- **Function**: Final dimensional ranking of clusters for the dashboard.
- **Input**: `StoryCluster[]`
- **Controls**:
  - `Ranker Weights`: Relevance vs. Momentum vs. Novelty.
  - `Forgetting Constant` ($\lambda$): Controls temporal decay speed.
- **Output**: `StoryCluster[]` (Sorted by `finalRank`).
- **Logic**: Calculates a composite score. Applies $e^{-\lambda t}$ to degrade older stories.

---

## 🛠 Stage 11: Persistence

- **Function**: Commits the final intelligence output to the persistent store.
- **Input**: `StoryCluster[]`
- **Controls**: N/A
- **Output**: `StoryCluster[]` (Confirmation of storage).
- **Logic**: Batch upsert to Database/Repository. Clears temporary pipeline caches.
