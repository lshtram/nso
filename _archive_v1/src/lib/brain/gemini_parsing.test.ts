import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from './gemini';

// Mock the external library
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
  embedContent: vi.fn().mockResolvedValue({ embedding: { values: [] } })
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

describe('GeminiProvider Parsing', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider('fake-key');
    mockGenerateContent.mockReset();
  });

  it('should parse JSON wrapped in markdown code fences', async () => {
    const jsonResponse = `
Here is the analysis:
\`\`\`json
{
  "title": "Test Title",
  "brief": "Test Brief",
  "summary": "Test Summary",
  "takeaways": [],
  "whyItMatters": "Test Impact"
}
\`\`\`
Hope this helps!
    `;
    
    // Mock the response structure
    mockGenerateContent.mockResolvedValue({
      response: { text: () => jsonResponse }
    });

    const result = await provider.synthesize({ items: [] } as any);
    
    expect(result.title).toBe('Test Title');
    expect(result.whyItMatters).toBe('Test Impact');
    // Ensure "Operational fail" is NOT present in the narrative if success
    expect(result.narrative).not.toContain('Operational fail');
  });

  it('should handle raw JSON correctly', async () => {
     const jsonResponse = `{"title": "Raw Title", "whyItMatters": "Raw Impact"}`;
     mockGenerateContent.mockResolvedValue({
      response: { text: () => jsonResponse }
    });
    
    const result = await provider.synthesize({ items: [] } as any);
    expect(result.title).toBe('Raw Title');
  });

  it('should fallback gracefully on garbage', async () => {
     mockGenerateContent.mockResolvedValue({
      response: { text: () => "I cannot do that." }
    });
    
    const result = await provider.synthesize({ items: [] } as any);
    expect(result.narrative).toContain('Operational fail');
  });
});
