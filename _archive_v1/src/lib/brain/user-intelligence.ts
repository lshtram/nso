import * as fs from 'fs';
import * as path from 'path';
import { SourceEntity } from '@/types';

/**
 * UserIntelligence handles the long-term memory of the user's interests,
 * reading habits, and explicit feedback.
 * 
 * It manages two primary "Context Texts":
 * 1. user_profile.md: A summary of WHO the user is and what they care about.
 * 2. source_library.md: A summary of WHAT the user currently follows.
 */
export class UserIntelligence {
  private profilePath = path.join(process.cwd(), 'docs/user_profile.md');
  private libraryPath = path.join(process.cwd(), 'docs/source_library.md');

  constructor() {
    this.ensureFilesExist();
  }

  private ensureFilesExist() {
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
    
    if (!fs.existsSync(this.profilePath)) {
      fs.writeFileSync(this.profilePath, '# User Intelligence Profile\n\n*Initial profile generated. Awaiting user interaction signals...*');
    }
  }

  async getProfile(): Promise<string> {
    return fs.readFileSync(this.profilePath, 'utf8');
  }

  async getLibrarySummary(sources: SourceEntity[]): Promise<string> {
    let md = '# Current Source Library\n\n';
    md += `Active Subscriptions: ${sources.filter(s => s.isActive).length}\n\n`;
    md += '| ID | Name | Type | Signal Score |\n| :--- | :--- | :--- | :--- |\n';
    sources.forEach(s => {
      md += `| ${s.id} | ${s.name} | ${s.type} | ${s.signalScore || 'N/A'}% |\n`;
    });
    return md;
  }

  /**
   * Registers a new insight into the user profile.
   * This is called by the LLM when it detects a shift in user behavior/preference.
   */
  async registerInsight(insight: string) {
    const current = await this.getProfile();
    const newProfile = `${current}\n\n### Insight [${new Date().toLocaleDateString()}]\n- ${insight}`;
    fs.writeFileSync(this.profilePath, newProfile);
  }

  /**
   * Re-synthesizes the entire profile to keep it concise.
   * This prevents the file from growing indefinitely and losing focus.
   */
  async optimizeProfile(summarizer: (text: string) => Promise<string>) {
    const current = await this.getProfile();
    const optimized = await summarizer(current);
    fs.writeFileSync(this.profilePath, optimized);
  }
}
