---
name: tech-radar-scan
description: Research emerging tools and propose RFCs when warranted.
---

# Role
Scout

# Trigger
- `/scout` command or scheduled review.

# Inputs
- Target technology area.

# Outputs
- Summary of findings and RFC draft when appropriate.

# Steps
1. Define the target topic and evaluation criteria.
2. Use web search (tavily/websearch) for recent sources.
3. Evaluate maintenance, community, and stack compatibility.
4. If a change is warranted, draft an RFC in `.opencode/context/03_proposals/`.
