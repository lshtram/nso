#!/bin/bash

# NSO Installer
# Registers hooks and sets up environment

echo "🧠 Installing Neuro-Symbolic Orchestrator..."

# 1. Install Dependencies
echo "📦 Installing Python dependencies..."
uv pip install ruff mypy pytest || echo "⚠️  uv not found, skipping python deps"

echo "📦 Installing JS dependencies..."
bun add -d biome typescript || echo "⚠️  bun not found, skipping js deps"

# 2. Make scripts executable
chmod +x .opencode/scripts/validate.py
chmod +x .opencode/hooks/pre_tool_use/validate_intent.py
chmod +x .opencode/hooks/post_tool_use/profiler.py

# 3. Register Hooks (Simulated)
# In a real OpenCode setup, we would append to opencode.json.
# For now, we assume the user will configure the agent to use these scripts.

echo "✅ NSO Installed."
echo "👉 To start a new feature: opencode run 'Oracle: Start new feature'"
