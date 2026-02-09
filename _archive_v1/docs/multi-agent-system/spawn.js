#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';

const AGENTS_DIR = '.agents';

function spawn(agentName, taskPrompt) {
  const configPath = `${AGENTS_DIR}/${agentName}/agent.json`;
  const promptPath = `${AGENTS_DIR}/${agentName}/prompt.txt`;

  if (!existsSync(configPath)) {
    console.error(`Agent "${agentName}" not found. Create ${configPath}`);
    return null;
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const basePrompt = existsSync(promptPath) ? readFileSync(promptPath, 'utf-8') : config.prompt;

  const fullPrompt = `${basePrompt}

---

## YOUR TASK NOW:
${taskPrompt}
`;

  return {
    subagent_type: "general",
    prompt: fullPrompt,
    description: agentName,
    load_skills: config.skills || []
  };
}

const args = process.argv.slice(2);
if (args[0] === 'code-review' && args[1]) {
  const task = spawn('code-review', args.slice(1).join(' '));
  console.log(JSON.stringify(task, null, 2));
} else {
  console.log('Usage: node spawn.js <agent-name> "<task-prompt>"');
  console.log('Example: node spawn.js code-review "Review src/app/page.tsx"');
}
