# PRD Critique: Dream News

## 1. Overall Impression

The PRD is strong, focused, and philosophical. It correctly identifies the core problem (noise) and proposes a high-value solution (synthesis). The "Signal > Noise" and "Narrative First" principles are excellent North Stars.

## 2. Strengths to Preserve

- **Concept**: The "Personal World-Model" framing is unique and sticky.
- **Constraints**: Explicitly stating "Missing some items is acceptable" is brave and necessary for this product.
- **Edge Lane**: This answers the bubble/echo-chamber criticism effectively.
- **Two-Tier Brain**: A pragmatic architectural decision for cost/latency balance.

## 3. Critical Gaps & Areas for Improvement

### A. The "Dream" vs. The "Digest"

**Critique**: The current spec describes a very efficient "Digest Engine". providing a "Dream" experience implies more than just text summaries. It needs more _delight_ and _visualization_.
**Proposal**:

- **Visual Synthesis**: Add a requirement for "Entity Maps" or "Trend Lines" generated from the clusters.
- **Audio Experience**: A "Commute Mode" (TTS podcast of the digest) would massively increase stickiness for busy users.

### B. "Actionability" is Weak

**Critique**: The "Call to Action" section is generic. "Open dashboard" is a friction point.
**Proposal**:

- **Deep Links**: The email should allow "Save for Weekend" or "Mute Topic" directly via one-click magic links (if possible without auth) or simple actions.
- **Source Direct**: One click to "Copy to Clipboard" for sharing.

### C. Personalization Loop Mechanics

**Critique**: "Implicit Signals" (open, dwell) are noisy. "Explicit Signals" require user effort.
**Proposal**:

- **"The Tuning Knob"**: A specific UI concept where users can visualize their "bubble" (e.g., "You are 80% Tech, 20% Politics - Adjust?") to make steering fun and transparent.

### D. Ingestion & "The Firehose"

**Critique**: The "ContentItem" schema assumes we can just "hydrate" everything. For YouTube or Papers, full text is too heavy.
**Proposal**:

- **Ingestion Strategies**: Define specific policies for heavy media (e.g., "Transcripts > 5k words: Summarize to 500 words BEFORE storage").

### E. User Stories & "Day in the Life"

**Critique**: The "Daily Experience" is good, but lacks specific user journeys.
**Proposal**:

- Add concrete user stories (e.g., "As a user, I want to ignore 'Election' news for 24h because I'm overwhelmed").

## 4. Specific Section Upgrades

- **Success Criteria**: Add "User Trust Score" (subjective) and "Time Saved" (estimated).
- **Ranking**: Add "Source Diversity" as a hard constraint (don't show 5 items from X.com).
- **Tech Stack**: Move "Tech Constraints" to `ENGINEERING_STACK.md` or keep it high-level here? (Keep it here as _boundary conditions_ is fine).

## 5. Verdict

Refine the PRD to include the "Delight/Magic" features (Audio, Visuals) and tighten the Ingestion specs.
