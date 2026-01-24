# Node.js and CLI Patterns Reference

Prefer CLI-first workflows, using Node.js for complex logic.

## CLI Tools to Leverage

- **GitHub**: `gh` for PRs, issues, and repo management.
- **Cloud**: `aws` or `gcloud` for infrastructure.
- **Utility**: `jq` for JSON, `xsv` (if available) for CSV.

## Node.js v24+ Patterns

Use ESM imports (`import`) and `async/await`.

### File Operations

```javascript
import { readFile, writeFile } from "fs/promises";
const content = await readFile("input.txt", "utf-8");
```

### Running CLI Commands

```javascript
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
const { stdout } = await execAsync("gh repo view");
```

### API Interaction

```javascript
const response = await fetch("https://api.github.com/repos/owner/repo");
const data = await response.json();
```

## Best Practices

1. shebang: `#!/usr/bin/env node`
2. Graceful error handling (try-catch).
3. Exit with codes (`process.exit(1)`).
4. No Python (use Node.js).
