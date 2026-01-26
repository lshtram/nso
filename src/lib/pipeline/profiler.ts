import * as fs from 'fs';
import * as path from 'path';

export interface StageMetric {
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  inputCount?: number;
  outputCount?: number;
  metadata?: any;
}

export class PipelineProfiler {
  private static instance: PipelineProfiler;
  private metrics: StageMetric[] = [];
  private startTime: number = Date.now();
  private outputDir: string;
  
  private constructor() {
     this.outputDir = path.join(process.cwd(), 'tmp');
     if (!fs.existsSync(this.outputDir)) {
       fs.mkdirSync(this.outputDir, { recursive: true });
     }
  }

  public static getInstance(): PipelineProfiler {
    if (!PipelineProfiler.instance) {
      PipelineProfiler.instance = new PipelineProfiler();
    }
    return PipelineProfiler.instance;
  }

  startRun() {
    this.metrics = [];
    this.startTime = Date.now();
    this.save();
  }

  // Compatible with V1 Orchestrator
  startPipeline() {
    this.startRun();
  }

  // V1 startStage
  startStage(name: string, metadata?: any) {
    this.metrics.push({
      name,
      startTime: Date.now(),
      metadata
    });
    this.save();
  }

  // V1 endStage
  endStage(name: string, metadata?: any) {
    const stage = this.metrics.find(m => m.name === name && !m.endTime);
    if (stage) {
      stage.endTime = Date.now();
      stage.durationMs = stage.endTime - stage.startTime;
      if (metadata) {
         if (metadata.count) stage.outputCount = metadata.count;
         stage.metadata = { ...stage.metadata, ...metadata };
      }
    }
    this.save();
  }

  // V2 recordStage (Atomic recording)
  recordStage(name: string, durationMs: number, inputCount: number, output: any[]) {
    // If we had a running stage with this name (from V1 calls), close it.
    const openStage = this.metrics.find(m => m.name === name && !m.endTime);
    if (openStage) {
        openStage.endTime = Date.now();
        openStage.durationMs = durationMs; // Trust the passed duration
        openStage.inputCount = inputCount;
        openStage.outputCount = output.length;
    } else {
        // Create new record
        this.metrics.push({
            name,
            startTime: Date.now() - durationMs,
            endTime: Date.now(),
            durationMs,
            inputCount,
            outputCount: output.length
        });
    }
    this.save();
  }

  private save() {
    const report = {
      pipelineStartTime: new Date(this.startTime).toISOString(),
      currentDuration: Date.now() - this.startTime,
      stages: this.metrics,
      summary: this.getSummary()
    };
    
    // Save "latest"
    const filePath = path.join(this.outputDir, 'profiling_latest.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  }

  private getSummary() {
    return this.metrics.map(m => ({
      stage: m.name,
      duration: m.durationMs ? `${m.durationMs.toFixed(2)}ms` : 'Running...',
      io: `${m.inputCount || '-'} -> ${m.outputCount || '-'}`
    }));
  }
}
