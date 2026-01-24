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

### 3. Stage 1: Dynamic Connector Scheduling

- **Topic**: How to prioritize RSS vs YouTube ingestion based on user interest EQ weights.
- **Goal**: Intelligent throttle control.

### 4. Stage 8: Narrative Persona Convergence

- **Topic**: Synchronizing the "Voice" across the Daily Email and the Dashboard Hero.

---

## 🏗️ Implementation Roadmap (Active)

1. [ ] **v1 Ingestion Pipeline**: RSS & GitHub Connectors.
2. [ ] **Normalization Engine**: Mapping to canonical `ContentItem` schema.
3. [ ] **Clustering Scratchpad**: Initial embedding-based grouping.
