# Dream News: Master Requirements Index

> **Vision**: Personal "World Model" Digest Engine. Signal > Noise.

This project follows a **Modular PRD Architecture**. Requirements are coupled by domain to ensure a Single Source of Truth and prevent "Vibe Drift".

---

## 🗺️ Specification Directory

### 1. [Product Strategy Spec](./prd/PRD_STRATEGY.md)

**Prefix**: `REQ-STRAT-`

- Vision, Non-Goals, and Core Principles.
- Target User and Success Criteria.

### 2. [Core Pipeline Spec](./prd/PRD_CORE.md)

**Prefix**: `REQ-CORE-`

- Ingestion, Clustering, Ranking, and Information Models.
- Intelligence Pipeline (The Brain) and Connector Roadmap.

### 3. [UI & Experience Spec](./prd/PRD_UI.md)

**Prefix**: `REQ-UI-`

- Presentation Layer & Layout logic.
- Interaction Models (Card/Detail view) and Daily Email structure.

### 4. [UI Style & Design Guidelines](./STYLE_GUIDE.md)

- Color tokens, Typography, and Premium Motion patterns.
- CSS Utility standards and Interaction cues.

### 5. [Technical Architecture](./TECH_SPEC.md)

- System Diagram and Component breakdown.
- Data Flow and Environment configuration.

---

## 🛡️ Verification & Multi-Perspective Audit

Every module in this project is audited against the **7 Perspectives**: User, Frontend, Backend, Quality, Security, Performance, and Testing.

- **Current Master Audit**: [MPA_CORE.md](./prd/MPA_CORE.md)

---

## 📈 Status Dashboard

- **Core Engine**: ✅ (v1 implemented)
- **UI Architecture**: ✅ (v1 implemented)
- **Source Connectors**: 🏗️ (RSS/GitHub in progress)
- **Direct Steering**: ✅ (Dashboard implementation active)
