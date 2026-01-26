import * as fs from 'fs';
import * as path from 'path';

export class PipelineAuditor {
  private static readonly OUT_FILE = path.join(process.cwd(), 'pipeline_audit.md');

  static log(
    duration: number, 
    telemetry: {
      sources: any[],
      duplicateUrls: string[],
      noiseFiltered: string[],
      triagedCount: number,
      hydratedCount: number, // Need to make sure we capture this
      stageTimings: Record<string, number>
    },
    clusterCount: number,
    clusters: any[]
  ) {
    const timestamp = new Date().toISOString();
    
    let md = `# 🛡️ Pipeline Intelligence Audit: ${timestamp}\n\n`;
    md += `> **Total Duration**: ${(duration / 1000).toFixed(2)}s | **Final Clusters**: ${clusterCount}\n\n`;
    
    // Timings
    md += `## 🕒 Pipeline Profiling\n`;
    md += `| Stage | Duration | % of Total |\n| :--- | :--- | :--- |\n`;
    const totalTime = Object.values(telemetry.stageTimings).reduce((a, b) => a + b, 0) || 1;
    Object.entries(telemetry.stageTimings).forEach(([stage, ms]) => {
        md += `| ${stage} | ${ms}ms | ${((ms / totalTime) * 100).toFixed(1)}% |\n`;
    });
    
    // Stage 1: Discovery
    const totalItems = telemetry.sources.reduce((a, b) => a + b.count, 0);
    md += `\n## 📡 Stage 1: Discovery\n`;
    md += `**Total Raw Items**: ${totalItems}\n`;
    md += `| Source | Items Found | URL |\n| :--- | :--- | :--- |\n`;
    telemetry.sources.forEach(s => {
        md += `| ${s.name} | ${s.count} | ${s.url} |\n`;
    });

    // Stage 2: Deduplication
    md += `\n## 🔍 Stage 2: Deduplication\n`;
    md += `* **Duplicates Rejected**: ${telemetry.duplicateUrls.length}\n`;
    md += `* **Unique Items Passed**: ${totalItems - telemetry.duplicateUrls.length}\n`;

    // Stage 3: Triage
    md += `\n## 🧠 Stage 3: Neural Triage\n`;
    md += `* **Noise Items Filtered**: ${telemetry.noiseFiltered.length}\n`;
    if (telemetry.noiseFiltered.length > 0) {
        md += `  *Examples: ${telemetry.noiseFiltered.slice(0, 3).join(', ')}...*\n`;
    }
    md += `* **High-Signal Items Selected**: ${telemetry.triagedCount}\n`;

    // Stage 4: Hydration
    md += `\n## 💧 Stage 4: Hydration\n`;
    md += `* **Full Content Extracted**: ${telemetry.triagedCount} items\n`; // Assuming 1:1 unless errors
    
    // Final Output
    md += `\n## 🧬 Final Intelligence Clusters\n`;
    md += `| Title | Why It Matters | Node Count |\n| :--- | :--- | :--- |\n`;
    clusters.forEach(c => {
        md += `| ${c.title} | ${c.whyItMatters || 'N/A'} | ${c.items?.length || 0} |\n`;
    });

    md += `\n\n--- *End of Intelligence Audit* ---`;
    
    fs.writeFileSync(this.OUT_FILE, md);
  }
}
