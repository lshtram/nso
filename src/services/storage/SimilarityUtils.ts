/**
 * Utility functions for string similarity and normalization.
 */
export class SimilarityUtils {
  /**
   * Calculates the Levenshtein distance between two strings.
   */
  public static levenshteinDistance(s1: string, s2: string): number {
    if (s1 === null || s1 === undefined || s2 === null || s2 === undefined) {
      throw new Error('[SimilarityUtils] Input strings cannot be null or undefined');
    }
    const v0 = new Array(s2.length + 1);
    const v1 = new Array(s2.length + 1);

    for (let i = 0; i <= s2.length; i++) {
      v0[i] = i;
    }

    for (let i = 0; i < s1.length; i++) {
      v1[0] = i + 1;

      for (let j = 0; j < s2.length; j++) {
        const substitutionCost = s1[i] === s2[j] ? 0 : 1;
        v1[j + 1] = Math.min(
          v1[j] + 1, // insertion
          v0[j + 1] + 1, // deletion
          v0[j] + substitutionCost // substitution
        );
      }

      for (let j = 0; j <= s2.length; j++) {
        v0[j] = v1[j];
      }
    }

    return v0[s2.length];
  }

  /**
   * Calculates title similarity score between 0 and 1.
   * Based on Levenshtein distance.
   */
  public static calculateSimilarity(s1: string, s2: string): number {
    if (s1 === null || s1 === undefined || s2 === null || s2 === undefined) {
      throw new Error('[SimilarityUtils] Input strings cannot be null or undefined');
    }
    if (s1 === s2) return 1;

    const distance = this.levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
    const maxLength = Math.max(s1.length, s2.length);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Normalizes a string for comparison.
   */
  public static normalize(text: string): string {
    if (text === null || text === undefined) {
      throw new Error('[SimilarityUtils] Input text cannot be null or undefined');
    }
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }
}
