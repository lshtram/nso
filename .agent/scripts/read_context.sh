#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 🌍 ENVIRONMENT CONTEXT ===${NC}"
ROOT_DIR=$(git rev-parse --show-toplevel)
BRANCH=$(git branch --show-current)
echo "PDT: $PWD"
echo "Git Root: $ROOT_DIR"
echo "Branch: $BRANCH"

# Git Status Check
if [[ -z $(git status --porcelain) ]]; then
    echo -e "Git Status: ${GREEN}✅ Clean${NC}"
else
    echo -e "Git Status: ${RED}❌ Dirty${NC}"
    git status --short
fi

echo -e "\n${BLUE}=== 📄 ACTIVE TASKS (task.md) ===${NC}"
if [ -f "task.md" ]; then
    # Show first 5 unfinished tasks
    grep -n "\[ \]" task.md | head -n 5
else
    echo -e "${YELLOW}No task.md found in current root.${NC}"
fi

echo -e "\n${BLUE}=== 📝 RECENT ARTIFACTS (.agent/scratchpad) ===${NC}"
if [ -d ".agent/scratchpad" ]; then
    ls -t .agent/scratchpad/*.md 2>/dev/null | head -n 5
else
    echo "No scratchpad directory found."
fi

echo -e "\n${BLUE}=== 🔍 CRITICAL CONFIG CHECKS ===${NC}"
[ -f ".gitignore" ] && echo -e "✅ .gitignore exists" || echo -e "${RED}❌ MISSING .gitignore${NC}"
[ -f "AGENTS.md" ] && echo -e "✅ AGENTS.md exists" || echo -e "${RED}❌ MISSING AGENTS.md${NC}"
