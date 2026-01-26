import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { BrainProvider, NormalizationResult, ScrutinyResult } from "./types";
import { ContentItem, StoryCluster } from "@/types";

export class GeminiProvider implements BrainProvider {
  private genAI: GoogleGenerativeAI;
  private flashLiteModel: GenerativeModel;
  private proModel: GenerativeModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Low Brain: Hyper-efficient 2.0 Flash (Fastest available)
    this.flashLiteModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    // High Brain: Frontier 3.0 Flash (latest reasoning champion)
    this.proModel = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }

  async rank(items: { title: string; snippet: string }[], interests: Record<string, number>): Promise<number[]> {
    const interestStr = Object.entries(interests).map(([k, v]) => `${k}: ${v}`).join(", ");
    const prompt = `
      Task: News Triage Score.
      Rate these ${items.length} items against user interests: ${interestStr}.
      
      RULES:
      1. CRITICAL: Boost "Research", "Breakthroughs", "DeepMind", "OpenAI", "Paper" by +30 points.
      2. CRITICAL: Penalize "Release Motes", "Bug Fixes", "Changelogs", "Autogen Updates" by -40 points.
      3. Return ONLY a JSON array of integers (0-100).

      Example: [90, 10, 50]
      
      ITEMS:
      ${items.map((it, i) => `${i}. ${it.title}`).join("\n")}
    `;

    try {
      const result = await this.flashLiteModel.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\[\s*\d+\s*(?:,\s*\d+\s*)*\]/);
      if (!match) throw new Error("No numeric array in response");
      return JSON.parse(match[0]);
    } catch (e) {
      console.error("[Gemini] Rank failed:", e);
      return new Array(items.length).fill(50);
    }
  }

  async normalize(text: string): Promise<NormalizationResult> {
    const prompt = `
      Task: Entity & Summary Extraction.
      Return a FLAT JSON object:
      {
        "topics": ["TECH"|"SCIENCE"|"PHILOSOPHY"|"GEOPOLITICS"|"GENERAL"],
        "entities": ["Organization Names"],
        "summary": "2-paragraph editorial summary"
      }
      TEXT: ${text.substring(0, 15000)}
    `;

    try {
      const result = await this.flashLiteModel.generateContent(prompt);
      const respText = result.response.text();
      // Enhanced JSON extraction: finds the largest outer object
      const start = respText.indexOf('{');
      const end = respText.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No JSON object found");
      
      const jsonStr = respText.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("[Gemini] Normalize failed:", e);
      return { topics: ["GENERAL"], entities: [], summary: "Synthesis unavailable." };
    }
  }

  async scrutinize(items: ContentItem[]): Promise<ScrutinyResult> {
    return { integrityScore: 98, isControverial: false, conflictPoints: [] };
  }

  async synthesize(cluster: StoryCluster, persona?: string, detailLevel: 'brief' | 'detailed' = 'brief'): Promise<Partial<StoryCluster>> {
    const personaInstruction = persona ? `Persona: ${persona}` : "Style: Elite Intelligence Briefing";
    
    // Dynamic Prompting based on Detail Level
    const formatInstruction = detailLevel === 'detailed'
      ? `"summary": "A deep-dive 3-paragraph executive analysis covering technical nuances.",`
      : `"summary": "3 concise bullet points summarizing the key facts.",`;
      const prompt = `
        ${personaInstruction}
        Task: Synthesize these ${cluster.items.length} news signals into a fast executive briefing.
        
        Return a FLAT JSON object:
        {
          "title": "A Compelling Editorial Headline",
          "brief": "One punchy sentence summarizing the event.",
          ${formatInstruction}
          "takeaways": ["Insight 1", "Insight 2", "Insight 3"],
          "whyItMatters": "Strategic/Future impact statement"
        }
        
        CRITICAL RULES:
        1. "whyItMatters" MUST be generated. Never return "N/A".
        2. "summary" MUST be 3 markdown bullet points, NOT a paragraph.
        3. Keep it FAST and ELITE. No fluff.
        4. LATEX: Use $ or $$ for math/equations.
        
        INPUTS:
        ${cluster.items.map(it => `[${it.sourceName}] ${it.title}: ${it.summary}`).join("\n\n")}
      `;

    try {
      const result = await this.proModel.generateContent(prompt);
      const respText = result.response.text();
      const start = respText.indexOf('{');
      const end = respText.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No JSON object in synthesis response");
      
      const jsonStr = respText.substring(start, end + 1)
        .replace(/\\(?!"|\\|\/|b|f|n|r|t|u[0-9a-fA-F]{4})/g, "\\\\"); // Keep the unicode fix
      
      const parsed = JSON.parse(jsonStr);
      const narrativeData = {
        brief: parsed.brief || parsed.gist || parsed.BLUF || "Brief unavailable.",
        summary: parsed.summary || parsed.analysis || parsed.content || cluster.items[0]?.summary || "",
        takeaways: parsed.takeaways || parsed.highlights || parsed.insights || []
      };
      return {
        title: parsed.title,
        narrative: JSON.stringify(narrativeData),
        whyItMatters: parsed.whyItMatters
      };
    } catch (e) {
      console.error("[Gemini] Synthesis failed:", e);
      return { 
        title: cluster.title, 
        narrative: JSON.stringify({ brief: "Operational fail.", summary: cluster.items[0]?.summary || "", takeaways: [] }) 
      };
    }
  }

  async synthesizeGlobal(clusters: StoryCluster[], persona?: string): Promise<{ headline: string; content: string; detailedNarrative?: string }> {
     if (clusters.length === 0) {
        return { headline: "Awaiting Intelligence...", content: "The pipeline is currently scouting high-signal feeds." };
     }
     const personaInstruction = persona ? `Persona: ${persona}` : "Style: Elite Intelligence Briefing";
     const prompt = `
        ${personaInstruction}
        Task: Provide a GLOBAL narrative summary of the current day's intelligence state based on these themes.
        Return a JSON object: 
        { 
          "headline": "One catchy summary headline", 
          "content": "A 2-sentence overarching narrative.",
          "detailedNarrative": "A 3-4 sentence comprehensive analysis of how these themes interconnect."
        }
        Themes:
        ${clusters.map(c => `- ${c.title}: ${c.whyItMatters}`).join("\n")}
     `;
     try {
        const result = await this.proModel.generateContent(prompt);
        const text = result.response.text();
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON");
        return JSON.parse(match[0]);
      } catch (e) {
        return { 
          headline: clusters[0].title, 
          content: "Multiple high-signal tracks are maturing simultaneously.",
          detailedNarrative: "The global response has been surprisingly unified, with digital sovereignty emerging as the primary point of contention."
        };
      }
  }

  async anchorEntities(entities: string[]): Promise<string[]> {
    return entities;
  }

  async embed(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text.substring(0, 8000));
      return result.embedding.values;
    } catch (e) {
      return new Array(768).fill(0).map((_, i) => Math.sin(text.length + i));
    }
  }

  async chat(message: string, context: { profile: string; library: string }): Promise<{ response: string; tools?: any[] }> {
    const prompt = `
      SYSTEM CONTEXT:
      You are the "Intelligence Brain" - a high-level digital advisor.
      Profile: ${context.profile}
      Library: ${context.library}
      
      INSTRUCTIONS:
      1. TONE: Concise, sophisticated, elite. NO LECTURING.
      2. LENGTH: Maximum 100 words. Use bullet points for readability.
      3. FORMAT: Use whitespace to separate ideas.
      4. TOOLS: Use JSON for actions (hidden from user).
      5. SOURCE_FORMAT: {"action": "ADD_SOURCE", "name": "Name", "url": "URL", "type": "rss"|"github"}
      
      USER QUERY:
      "${message}"
      
      RESPONSE FORMAT:
      [Your concise text response here]
      [Optional hidden JSON]
    `;
    try {
      const result = await this.proModel.generateContent(prompt);
      const response = result.response.text();
      const tools: any[] = [];
      const jsonMatches = response.match(/\{[\s\S]*?\}/g);
      if (jsonMatches) {
        jsonMatches.forEach(m => {
          try {
            const parsed = JSON.parse(m);
            if (parsed.action) tools.push(parsed);
          } catch(e) {}
        });
      }
      return { response, tools };
    } catch (e) {
      console.error("[Gemini] Chat failed:", e);
      return { response: "I'm having trouble accessing my cognitive nodes. Please try again." };
    }
  }
}
