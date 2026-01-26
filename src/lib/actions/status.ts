'use server';

import * as fs from 'fs';
import * as path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'pipeline_status.json');

import { getActiveBrainName } from '../brain/factory';

export async function updatePipelineStatus(message: string, isComplete = false) {
  try {
    const status = {
      message,
      isComplete,
      timestamp: Date.now()
    };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status));
  } catch (e) {}
}

export async function getPipelineStatus() {
  try {
    if (!fs.existsSync(STATUS_FILE)) return { message: "Initializing...", isComplete: false };
    const content = fs.readFileSync(STATUS_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { message: "Waiting for signal...", isComplete: false };
  }
}

export async function getActiveBrainAction() {
  return getActiveBrainName();
}
