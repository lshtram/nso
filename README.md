# Dream News

AI-Powered News Aggregation Platform

## Overview

Dream News is a modern news aggregation platform that uses AI to curate, summarize, and personalize news content from multiple sources.

## Development

This project uses a high-integrity SDLC framework with automated verification and quality assurance processes.

### Getting Started

```bash
npm install
npm run dev
```

### SDLC Process

This project follows a strict Software Development Life Cycle:

1. **Start Task**: Use `./agent start <task-name>` to initialize work
2. **Requirements**: Create PRD documents in `docs/PRD_<feature>.md`
3. **Technical Spec**: Generate `docs/TECH_SPEC.md` with implementation details
4. **Implementation**: Write code following the patterns in `.agent/CODING_STYLE.md`
5. **Verification**: Run `npm run verify` to ensure quality
6. **Finish Task**: Use `./agent finish` to merge and cleanup

### Key Directories

- `.agent/` - SDLC framework and automation tools
- `docs/` - Documentation and specifications
- `src/` - Application source code
- `tests/` - Test files

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS (planned)
- **Testing**: Vitest with AI-powered test generation
- **Quality**: Automated linting, type checking, and verification

## Contributing

See `.agent/PROCESS.md` for the complete development workflow.