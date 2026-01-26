# Task: Stage 1 Ingestion Pipeline (v1)

## 🎯 Goal

Implement the initial Stage 1 (Ingestion) and Stage 2 (Hydration) of the 9-stage intelligence pipeline, starting with RSS and GitHub Release connectors.

## 🏗️ Architecture

Following the **Connector Pattern** defined in `TECH_SPEC.md` and `PRD_CORE.md`.

### Component Checklist

- [x] **Base Connector Interface**: Standardize `discover()`, `hydrate()`, and `normalize()`.
- [x] **RSS Connector**: Implementation for standard XML feeds.
- [x] **GitHub Connector**: Implementation for repository releases.
- [x] **Pipeline Orchestrator (Stage 1&2)**: Draft the logic for discovery -> hydration.

## 🛡️ Multi-Perspective Audit

- ✅ **Backend**: Every source needs a unique `sourceId` to prevent collision.
- ✅ **Quality**: Handle rate limits (especially for GitHub).
- ✅ **Security**: Scrub raw HTML/JS from hydrated content during normalization.

## 📈 Status

- [x] Base Architecture
- [x] RSS implementation
- [x] GitHub implementation
- [ ] Integration Verification (Mocked verified; Real pending)
