#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const AGENTS_DIR = '.agents';

function spawnIsolated(agentName, taskPrompt) {
  const configPath = `${AGENTS_DIR}/${agentName}/agent.json`;
  const promptPath = `${AGENTS_DIR}/${agentName}/prompt.txt`;

  if (!existsSync(configPath)) {
    throw new Error(`Agent "${agentName}" not found at ${configPath}`);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const basePrompt = existsSync(promptPath) ? readFileSync(promptPath, 'utf-8') : config.prompt;

  const fullPrompt = `${basePrompt}

---

## YOUR TASK NOW:
${taskPrompt}
`;

  const taskConfig = {
    subagent_type: "general",
    prompt: fullPrompt,
    description: agentName,
    load_skills: config.skills || []
  };

  return taskConfig;
}

function runIsolated(agentName, taskPrompt) {
  const taskConfig = spawnIsolated(agentName, taskPrompt);
  
  return new Promise((resolve, reject) => {
    const proc = spawn('opencode', ['task', JSON.stringify(taskConfig)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Subagent exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', reject);
  });
}

// CLI usage
const args = process.argv.slice(2);
if (args[0] === 'run' && args[1]) {
  const agentName = args[1];
  const taskPrompt = args.slice(2).join(' ');
  runIsolated(agentName, taskPrompt)
    .then(({ stdout }) => console.log(stdout))
    .catch(err => console.error(err));
} else if (args[0] === 'config') {
  console.log(JSON.stringify(spawnIsolated(args[1], args.slice(2).join(' ')), null, 2));
} else {
  console.log('Usage:');
  console.log('  node run-isolated.js config <agent> "<task>"  # Output task config');
  console.log('  node run-isolated.js run <agent> "<task>"     # Run and get result');
}
