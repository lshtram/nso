Features to work on:

- integrate news sources and check this is wroking with guardian, times, haaretz, ...
- [CRITICAL] Test adding arbitrary RSS source and verifying successful ingestion (e.g. politics, food)
- [CRITICAL] Verify "Source Unknown" / "Author Unknown" bugs are resolved in UI
- [CRITICAL] Ensure cataloging covers diverse topics (Politics, Food, Culture) beyond just Tech
- integrate youtube channels
- integrate control knobs: bubble, credibility, ...
- work on brain integration

Completed:

- [x] Refactor ingestion pipeline into 11 modular stages (`orchestrator_v2`)
- [x] Implement integration tests and performance profiling for all stages
- [x] Update PRD/Tech Spec with traceability to tests
- [x] RSS discovery improvements (HTML feed detection, relative URL resolution)
- [x] Triage/Filtering logic to reduce scraping costs
