import { BrainProvider, NormalizationResult, ScrutinyResult } from './types';
import { ContentItem, StoryCluster } from '@/types';

export class MockBrain implements BrainProvider {
  /**
   * Stage 3: Normalization. Extracts topics, entities, and generates a summary.
   */
  async normalize(text: string): Promise<NormalizationResult> {
    const topics = text.includes('AI') || text.includes('GPU') ? ['TECH'] : ['GENERAL'];
    const entities = text.match(/[A-Z][a-z]+/g)?.slice(0, 5) || [];
    const summary = text.substring(0, 200) + '...';
    return { topics, entities, summary };
  }

  /**
   * Stage 3: Entity Anchoring. Normalizes a list of entities to canonical forms.
   */
  async anchorEntities(entities: string[]): Promise<string[]> {
    return entities.map(e => e.toUpperCase());
  }

  /**
   * Stage 4: Scrutiny. Cross-references multiple items to find contradictions and quality issues.
   */
  async scrutinize(items: ContentItem[]): Promise<ScrutinyResult> {
    return {
      integrityScore: 94,
      isControverial: false,
      conflictPoints: []
    };
  }

  /**
   * Stage 5: Embedding. Generates a semantic vector for text.
   */
  async embed(text: string): Promise<number[]> {
    // Deterministic mock embedding based on hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    
    // Create a vector where the hash affects the values
    const vector = new Array(1536).fill(0).map((_, i) => (hash + i) % 100);
    // Normalize
    const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / mag);
  }

  async synthesize(cluster: StoryCluster, persona?: string): Promise<Partial<StoryCluster>> {
    const primaryTopic = cluster.category || cluster.items[0]?.topics?.[0] || 'TECH';
    const mainText = cluster.items[0]?.fullText?.replace(/<[^>]*>?/gm, '') || cluster.items[0]?.summary || '';
    
    // Improved Mock Extraction for Scientific/Technical depth
    const sentences = mainText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
    const firstParagraph = sentences.slice(0, 3).join('. ') + '.';
    const logicalPivot = sentences.length > 5 ? sentences[Math.floor(sentences.length / 2)] + '.' : '';

    const isResearch = mainText.toUpperCase().includes('ALGORITHM') || mainText.toUpperCase().includes('STUDY') || mainText.toUpperCase().includes('METHOD');
    
    // Intelligence Pulse Sections
    const brief = isResearch 
      ? `Technical pivot: ${sentences[0]}. This methodology challenges existing benchmarks by ${sentences[1]?.toLowerCase() || 'introducing a novel processing paradigm'}.`
      : `Core pivot in ${primaryTopic}: ${cluster.items[0].summary.split('...')[0]}. This signal indicates a fundamental shift in technical strategy.`;
    
    const summaryParagraphs = [
      isResearch 
        ? `The research introduces a significant departure from standard models. Specifically, the paper outlines ${firstParagraph}`
        : `The development centers on ${cluster.items[0].entities?.[0] || 'autonomous systems'} and their integration into existing frameworks. Preliminary auditing shows a 94% signal integrity across ${cluster.items.length} nodes.`,
      `Technical analysis reveals: ${logicalPivot || mainText.substring(0, 300)}...`
    ];

    const narrative = JSON.stringify({
      brief: brief,
      summary: summaryParagraphs.join('\n\n'),
      takeaways: [
        `High-signal integration of ${cluster.items[0].entities?.[0] || 'emerging protocols'}`,
        sentences[2] || "Cross-sector methodology refinement",
        "Deterministic benchmark scaling"
      ]
    });

    return {
      title: cluster.title,
      narrative: narrative,
      whyItMatters: isResearch ? "This research establishes a new baseline for sub-system performance." : "Strategic alignment with decentralized infrastructure goals."
    };
  }

  /**
   * Global Synthesis. Generates an overarching narrative for all clusters.
   */
  async synthesizeGlobal(clusters: StoryCluster[], persona?: string): Promise<{ headline: string; content: string }> {
    if (clusters.length === 0) {
      return { headline: "Scanning Intelligence Grid...", content: "The pipeline is currently scouting high-signal feeds." };
    }
    return {
      headline: "Convergent Technical Paradigms",
      content: "The global response has been surprisingly unified, with digital sovereignty and scalable infrastructure emerging as the primary points of contention across today's intelligence tracks."
    };
  }

  /**
   * Fast Triage. Ranks raw items based on user interests without full analysis.
   */
  rank(items: { title: string; snippet: string }[], interests: Record<string, number>): Promise<number[]> {
    return Promise.resolve(items.map(item => {
      let score = 50;
      const text = (item.title + item.snippet).toUpperCase();
      
      const topicKeywords: Record<string, string[]> = {
        TECH: ['GPU', 'AI', 'SOFTWARE', 'HARDWARE', 'CHIP'],
        SCIENCE: ['STUDY', 'RESEARCH', 'PAPER', 'QUANTUM'],
        PHILOSOPHY: ['ETHICS', 'CONSCIOUSNESS', 'EXISTENTIAL'],
        GEOPOLITICS: ['CHINA', 'US', 'REGULATION', 'SOVEREIGNTY']
      };

      Object.entries(interests).forEach(([topic, weight]) => {
        const keywords = topicKeywords[topic] || [];
        keywords.forEach(kw => {
          if (text.includes(kw)) score += (weight / 100) * 10;
        });
      });
      return score;
    }));
  }

  async chat(message: string, context: { profile: string; library: string }): Promise<{ response: string; tools?: any[] }> {
    return { response: "I'm a mock brain. I don't chat yet." };
  }
}
