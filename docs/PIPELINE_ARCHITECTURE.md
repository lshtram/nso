This document defines the strict split of responsibilities and terminology for our information engine.

## 🚀 The Pipeline Funnel (Scaling Strategy)

To handle **thousands of feeds** per user with minimal latency and cost, we utilize a tiered "Funnel" approach:

1.  **Tier 1: Bulk Discovery (Stage 1)**: Parallel headers-only/RSS polling of thousands of endpoints.
    - _Scale_: 1000+ feeds. _Cost_: Near-zero.
2.  **Tier 2: Intelligence Triage (Stage 3)**: Lightweight URL deduplication and keyword-based interest ranking.
    - _Noise Suppression_: Automatic removal of version bumps (`v1.2.3`), release tags, and technical noise (`npm install`).
    - _Ratios_: typically 90% of raw signals are discarded here as noise or low-interest.
3.  **Tier 3: High-Fidelity Hydration (Stage 2)**: Mozilla Readability scraping and full LLM synthesis only for the "top winners".
    - _Performance expectation_: ~1.5 - 2.0 fully synthesized clusters per second on real-world data.

---

## 🏗️ Phase A: Collection & Translation

### Stage 1: Ingest (Discovery)

- **Identity**: The Scout.
- **Responsibility**: Polling external sources (RSS, GitHub, YT) to find **new unique IDs/URLs**.
- **Input**: Source Configuration (URLs, Polling Intervals).
- **Output**: Raw metadata (JSON) + the target URL.
- **Steering**: Throttling, specific source priority.

### Stage 2: Hydrate (Extraction)

- **Identity**: The Reader.
- **Responsibility**: Fetching the full text body and images.
- **Storage Strategy (Intelligent Preservation)**:
  - **The Stash Rule**: Non-favorite full text is deleted after 48 hours _only if_ the system has reached a minimum "Knowledge Stash" threshold for that topic.
  - **Unread Guard**: High-ranking items that the user has not interacted with are preserved indefinitely to prevent missing "Gold" updates.
  - **Semantic Ghosts**: After raw deletion, the system RETAINS the title, link, summary, and embedding to power longitudinal trend analysis.
  - **Favorites (Persistence)**: If a user "Saves" an item, the full content is persisted indefinitely to prevent data loss from broken links.
- **Hard Rule**: Summarize items > 5k words _at the edge_ to keep downstream operations efficient.
- **Output**: Cleaned Text Payload + Source Integrity Metadata (Status codes, Paywall flags).

### Stage 3: Normalize (Alignment)

- **Identity**: The Translator.
- **Responsibility**: Mapping heterogeneous data into the canonical `ContentItem` schema.
- **Process**:
  - Image Extraction (high-res `featuredImage`).
  - Language detection.
  - **Low-Brain Processing**: Initial automated topic tagging (0.5s classification).
- **Output**: Atomic `ContentItem`.

---

## 🧊 Phase B: Intelligence & Validation

### Stage 4: Dedupe & Scrutiny (Filtering)

- **Identity**: The Validator.
- **Responsibility**: Identifying duplicates and auditing content quality.
- **Process**:
  - **Identity Check**: 94% embedding similarity check (near-dupes).
  - **Quality Scrutiny**: Comparison of multiple articles on the same topic.
  - **Contradiction Detection**: LLM cross-references multiple items in a cluster to identify factual disagreements. If conflicts are found, a draft **Conflict Summary** is generated.
  - **Survival of the Fittest**: Building a "Cluster Credibility" score. The highest-quality, most complete piece becomes the "Survival Link."
- **Output**: Unique Items + Scrutiny Metadata.

### Stage 5: Embed (Vectorization)

- **Identity**: The Mathematician.
- **Responsibility**: Converting text/metadata into high-dimensional vectors.
- **Output**: ContentItem with `embedding: number[]`.

---

## 🌪️ Phase C: Synthesis & Delivery

### Stage 6: Cluster (Grouping)

- **Identity**: The Aggregator.
- **Responsibility**: Grouping items into **StoryClusters** based on semantic proximity.
- **Output**: `StoryCluster` objects containing a list of `items[]`.

### Stage 7: Score (Ranking)

- **Identity**: The Prioritizer.
- **Responsibility**: Calculating the cluster's multi-dimensional priority.
- **The Cluster vs. Item Dynamic**:
  - Scoring happens at the **Cluster Level**.
  - While two clusters may have similar topics (e.g., both are about "AI"), their scores will diverge based on their internal metadata (Stage 4 Scrutiny results).
- **Ranking Signals (Independent Dimensions)**:
  - **Relevance (Interest)**: How well it matches the User's Interest Equalizer.
  - **Importance (Credibility/Momentum)**: Factual depth and cross-channel velocity ($e^{-\lambda t}$ "Forgetting Constant").
  - **Novelty (Freshness)**: How much new information is present vs. previous digests.
- **Note**: High Momentum does NOT automatically mean High Interest. The final rank is a weighted balance, but the UI exposes these specific signals so the user knows _why_ a cluster surfaced.
- **Output**: Ranked list of Clusters.

### Stage 8: Summarize (Synthesis)

- **Identity**: The Analyst.
- **Responsibility**: Creating human-readable narratives and longitudinal insights.
- **Process**:
  - Cluster Title (Headline).
  - Narrative Brief (The "vibe" of the story).
  - **Trend Analysis**: Querying the "Semantic Ghost" archive to answer context questions (e.g., "What is hot today in toilet design vs. last month?").
  - "Why it matters" (Analyst reasoning).
  - **Contradiction Summary**: Finalizing the points of conflict discovered in Stage 4 for presentation in the Deep Dive.
- **Output**: Synthesized `StoryCluster`.

### Stage 9: Publish (Distribution)

- **Identity**: The Courier.
- **Responsibility**: Rendering the finalized data for target channels (Dashboard, Email, Terminal).
- **Output**: UI-ready JSON bundles or rendered HTML.
