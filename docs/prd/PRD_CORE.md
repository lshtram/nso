# PRD: Dream News Core (DNC)

> **Status**: Approved
> **Requirement Prefix**: `REQ-CORE-`

## 1. Executive Summary

Dream News is a low-maintenance personal intelligence system that ingests massive volumes of heterogeneous data to synthesize a daily narrative-driven digest. It prioritizes "Signal > Noise" and "Time-to-Understanding".

## 2. Multi-Perspective Audit (MPA)

Summarized in `docs/prd/MPA_CORE.md`. Major focus on **Signal Integrity** and **Autonomic Steering**.

## 3. User Stories

| ID           | Actor | Action                | Outcome                                                   | Priority |
| :----------- | :---- | :-------------------- | :-------------------------------------------------------- | :------- |
| `US-CORE-01` | User  | Scans daily narrative | Understands the day's global themes in < 60s              | P0       |
| `US-CORE-02` | User  | Adjusts Interest EQ   | Real-time re-ranking of the dashboard content             | P0       |
| `US-CORE-03` | User  | Switches to Deep Dive | Reads original source with an AI-synthesized context pane | P1       |

## 4. Information Models

### 4.1 ContentItem (Atomic Input)

| Field                 | Description                                         |
| :-------------------- | :-------------------------------------------------- |
| `id` / `url`          | Primary keys for uniqueness and navigation.         |
| `sourceType`          | `rss`, `reddit`, `x`, `youtube`, `github`, `arxiv`. |
| `rawText`             | Full hydrated content (article text, transcript).   |
| `summary`             | AI-generated 2-3 sentence summary.                  |
| `entities` / `topics` | Extracted metadata for clustering.                  |
| `embedding`           | Vector representation (1536d or similar).           |

### 4.2 StoryCluster (Primary Output)

| Field            | Description                                                  |
| :--------------- | :----------------------------------------------------------- |
| `id`             | Unique cluster identifier.                                   |
| `generatedTitle` | High-level synthesis headline.                               |
| `narrative`      | 1-2 sentence story synthesis.                                |
| `whyItMatters`   | 1-line justification of rank/relevance.                      |
| `items[]`        | Collection of member ContentItems.                           |
| `scores`         | Dimensional breakdown (Relevance, Momentum, Novelty, Depth). |

## 5. The Steerable Intelligence Pipeline

The system processes data in 9 strictly ordered, interchangeable, and steerable stages.

| Stage            | Process                                             | Steerable Parameter                     |
| :--------------- | :-------------------------------------------------- | :-------------------------------------- |
| **1. Ingest**    | Discovery of raw items via Connectors.              | Focus sources/filters.                  |
| **2. Hydrate**   | Fetching full text, transcripts, or PDF content.    | Depth of extraction.                    |
| **3. Normalize** | Mapping raw data to canonical `ContentItem` schema. | N/A                                     |
| **4. Dedupe**    | Exact and semantic duplicate suppression.           | Similarity threshold.                   |
| **5. Embed**     | Vector generation for semantic logic.               | Model choice (Cost vs. Quality).        |
| **6. Cluster**   | Grouping items into semantic trends/stories.        | Granularity (Broad vs. Niche).          |
| **7. Score**     | Dimensional ranking of clusters + items.            | User Weights + **Forgetting Constant**. |
| **8. Summarize** | Multi-level synthesis (Narrative/Cluster).          | Persona, Length, Focus.                 |
| **9. Publish**   | Rendering outputs to Dashboard/Email.               | Layout/Channel preference.              |

### 5.1 Dimensional Ranking Signals (Stage 7)

The `Score` stage calculates a final weighted rank for every cluster based on:

- **Relevance**: Direct alignment with user topic weights from the **Interest Equalizer**.
- **Temporal Decay**: Reduction of score over time based on a **Forgetting Constant ($\lambda$)**.
  - **Concept**: $Score_{final} = Score_{base} \times e^{-\lambda t}$.
  - **Topic-Aware Tuning**: The "Brain" (Stage 3) assigns $\lambda$ based on topic understanding:
    - _Gossip/Breaking_: High $\lambda$ (Half-life: 1-2 days).
    - _Tech/Trends_: Med $\lambda$ (Half-life: 2-4 weeks).
    - _Philosophy/Evergreen_: Low $\lambda$ (Half-life: 1-5 years).
  - **Control**: Defaults are LLM-assigned; Advanced Users can override these in hidden settings.
- **Momentum**: Cross-channel velocity (e.g., story appearing on both GitHub and RSS simultaneously).
- **Novelty**: Surfacing what hasn't been recently seen or digested in the last 7-day rolling window.
- **Depth**: Weighting curated/primary sources (Papers, GitHub Repos) higher than commentary or threads.
- **Diversity**: A "Collision Check" that prevents any single source (e.g. X.com) from dominating a cluster.

### 5.2 Connector Roadmap (Stage 1)

To ensure system stability, sources are onboarded in tiers:

- **Phase 1 (Current)**: RSS (Global news, blogs), GitHub Releases (Code-first updates).
- **Phase 2 (Rich Media)**: Reddit (Community sentiment), YouTube (Transcripts).
- **Phase 3 (High-Velocity)**: X.com (Direct API or aggregator), Arxiv (Academic papers).

### 5.3 Operational Strategy: Two-Tier Brain

To manage performance and LLM costs, tasks are divided by "Brain Tier":

- **Low-Brain Tasks**: Topic tagging, short summaries, dedup heuristics. Uses faster, cost-efficient models.
- **High-Brain Tasks**: Daily narrative synthesis, cluster synthesis, ranking explanations. Uses state-of-the-art reasoning models.

## 6. Functional Requirements

| ID             | Requirement             | Acceptance Criteria                                            | Verification Path        |
| :------------- | :---------------------- | :------------------------------------------------------------- | :----------------------- |
| `REQ-CORE-001` | **Pipeline Strictness** | Data MUST flow through all 9 stages in sequence                | `tests/pipeline.test.ts` |
| `REQ-CORE-002` | **Steerable Interface** | Every pipeline stage MUST accept an optional `SteeringContext` | `tests/steering.test.ts` |
| `REQ-CORE-003` | **Aggressive Dedupe**   | Items with >90% similarity are merged into a single cluster    | `tests/dedupe.test.ts`   |
| `REQ-CORE-004` | **Momentum Ranking**    | Rankings boost clusters with high cross-channel velocity       | `tests/ranking.test.ts`  |
| `REQ-CORE-005` | **Two-Tier Brain**      | High-Brain (Synthesizer) vs Low-Brain (Categorizer) tasks      | `tests/brain.test.ts`    |
| `REQ-CORE-006` | **Ingestion Policy**    | Media > 5k words summarized at edge; transcripts hydrated      | `tests/ingest.test.ts`   |
| `REQ-CORE-007` | **Topic-Aware Decay**   | LLM assigns $\lambda$ during Stage 3; Stage 7 applies decay    | `tests/ranking.test.ts`  |

## 7. Constraints & Operational Strategy

- **Transparency**: Every cluster MUST expose which stages contributed to its final SURVIVAL in the dashboard (Explainability).
- **Steering Latency**: Changes to the Interest EQ must trigger a re-run of stages 7-8 in < 3s.
- **Data Locality**: No source-specific logic is allowed in any stage from Dedupe (4) onwards.
