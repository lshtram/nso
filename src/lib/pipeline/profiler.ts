
import fs from 'fs';
import path from 'path';

export interface StageStats {
  stage: string;
  durationMs: number;
  inputCount: number;
  outputCount: number;
  ratePer1k: number;
  timestamp: string;
}

export class PipelineProfiler {
  private static instance: PipelineProfiler;
  private stats: Record<string, StageStats> = {};
  private startTime: number = Date.now();
  private debugDir: string = path.join(process.cwd(), 'tmp', 'latest_profile');

  private constructor() {
    if (!fs.existsSync(this.debugDir)) fs.mkdirSync(this.debugDir, { recursive: true });
  }

  static getInstance(): PipelineProfiler {
    if (!PipelineProfiler.instance) {
      PipelineProfiler.instance = new PipelineProfiler();
    }
    return PipelineProfiler.instance;
  }

  startRun() {
    this.stats = {};
    this.startTime = Date.now();
    // Clear previous profile
    if (fs.existsSync(this.debugDir)) {
      const files = fs.readdirSync(this.debugDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.debugDir, file));
      }
    }
  }

  recordStage(
    stageName: string, 
    durationMs: number, 
    inputItems: number, 
    outputItems: any[]
  ) {
    const outputCount = Array.isArray(outputItems) ? outputItems.length : 1;
    const rate = inputItems > 0 ? (durationMs / inputItems) * 1000 : 0;

    const stat: StageStats = {
      stage: stageName,
      durationMs,
      inputCount: inputItems,
      outputCount,
      ratePer1k: rate,
      timestamp: new Date().toISOString()
    };

    this.stats[stageName] = stat;

    // Persist Stage Analytics
    this.saveStageProfile(stageName, stat, outputItems);
    
    // Update Accumulative Summary
    this.saveSummary();
  }

  private saveStageProfile(name: string, stat: StageStats, data: any[]) {
    const safeName = name.replace(/[: ]/g, '_').toLowerCase();
    const filePath = path.join(this.debugDir, `${safeName}.json`);
    
    const payload = {
      analytics: stat,
      // Store first 50 items for inspection to avoid massive files
      sampleData: data.slice(0, 50) 
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  }

  private saveSummary() {
    const summaryPath = path.join(this.debugDir, 'full_analytics_summary.json');
    const summary = {
      runId: `run-${this.startTime}`,
      totalDuration: Date.now() - this.startTime,
      stages: Object.values(this.stats)
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }
}
