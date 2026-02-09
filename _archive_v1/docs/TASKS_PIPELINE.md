# Pipeline Deep-Dive Backlog

This document tracks subsystems and pipeline stages that require a "Wise Discussion" and technical audit before finalization.

## 🟢 Post-MVP Discussion Schedule

### 1. Stage 6: Clustering Decals

- **Goal**: Define the rolling semantic window and memory recall logic.
- **Key Paradox**: How to balance historical context with daily novelty.
- **Draft Reference**: `REQ-CORE-007`.

### 2. Stage 7: The Forgetting Constant System

- **Topic**: Topic-Aware Temporal Decay refinement.
- **User Constraint**: Recalculation logic should be capped at **once per day** to maintain UI stability.
- **Technical Detail**: Establish the "Forget Constant" ($\lambda$) defaults for all 20+ base topics.

### 3. Stage 1: Intelligent Preservation (Waste Management v2)

- **Topic**: Preservation beyond 48 hours.
- **Constraint**: High-ranking items that are "un-read" must be preserved regardless of age until a minimum "stash" size is reached or they are consumed.
- **Ghost Trends**: Titles, links, and embeddings (Semantic Ghosts) must be kept indefinitely to allow the Analyst (Stage 8) to calculate longitudinal trends even without raw HTML.

### 4. Stage 1: Ingestion & Implicit Sync

- **Topic**: Handling the 6-hour cron pulse vs. user-triggered "Implicit Refresh" (Pull-to-refresh).

### 5. Stage 1-9: Autonomic Steering API

- **Topic**: Exposing pipeline "knobs" (discovery density, audit rigor, etc.).
- **Algorithmic Personalities (Post-MVP)**:
  - **Generalist vs. Specialist**: Aggregation breadth vs. niche depth.
  - **Bubble vs. Know Your Enemy**: Similarity bias vs. contrarian exposure (divergence).
  - **Temporal Velocity**: Real-time momentum vs. longitudinal stability.

### 6. The "Discovery Agent" (Research Engine)

- **Topic**: Hybrid source discovery.
- **Goal**: An agent that identifies new RSS/Atom/Social feeds based on the user's current high-interest equalizer weights and proposes them.

### 7. Stage 2: Multimodal Ingestion (Whisper)

- **Topic**: Handling Audio/Video sources using OpenAI Whisper.

### 8. Stage 8: Task-Oriented Synthesis

- **Topic**: From Insights to Actions (Actionable Points/TODOs).

### 9. Stage 4: KNN Noise Filtering

- **Topic**: High-SNR Scrutiny against spam profiles.

---

## 🏗️ Implementation Roadmap (Active)

1. [x] **v1 Ingestion Pipeline**: RSS & GitHub Connectors. (Stages 1-3).
2. [x] **Dedupe & Scrutiny Engine**: Stage 4 logical flow.
3. [x] **Semantic Layers**: Stage 5 (Embed) & 6 (Cluster).
4. [x] **Synthesis & Rank**: Stage 7 (Score) & 8 (Synthesize).
5. [x] **MVP Integration**: Connect Pipeline to Dashboard UI. (Stage 9).
6. [ ] **Intelligence Burn-in**: Testing Stage 4/7/8 with real-world high-volume feeds.
