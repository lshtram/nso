/**
 * SimHashEngine handles the generation and comparison of 64-bit SimHash fingerprints.
 * Based on the algorithm by Moses Charikar.
 */
export class SimHashEngine {
  private static readonly MAX_CONTENT_LENGTH = 5000;

  /**
   * Generates a 64-bit SimHash fingerprint for the given text.
   * @param text The input text to hash.
   */
  public generate(text: string): bigint {
    if (text === null || text === undefined) {
      throw new Error('[SimHashEngine] Input text cannot be null or undefined');
    }
    if (text.trim().length === 0) {
      throw new Error('[SimHashEngine] Input text cannot be empty');
    }

    // Normalization and truncation
    const normalized = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .substring(0, SimHashEngine.MAX_CONTENT_LENGTH);

    const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
    
    if (tokens.length === 0) {
      return 0n;
    }

    const v = new Array(64).fill(0);

    for (const token of tokens) {
      const hash = this.hash64(token);
      for (let i = 0; i < 64; i++) {
        const bit = (hash >> BigInt(i)) & 1n;
        if (bit === 1n) {
          v[i]++;
        } else {
          v[i]--;
        }
      }
    }

    let fingerprint = 0n;
    for (let i = 0; i < 64; i++) {
      if (v[i] > 0) {
        fingerprint |= (1n << BigInt(i));
      }
    }

    return fingerprint;
  }

  /**
   * Calculates the Hamming distance between two 64-bit fingerprints.
   */
  public getHammingDistance(h1: bigint, h2: bigint): number {
    if (h1 < 0n || h2 < 0n) {
      throw new Error('[SimHashEngine] Fingerprints must be non-negative');
    }
    let x = h1 ^ h2;
    let distance = 0;
    while (x > 0n) {
      if (x & 1n) {
        distance++;
      }
      x >>= 1n;
    }
    return distance;
  }

  /**
   * Simple 64-bit hash function (Fowler-Noll-Vo variant).
   */
  private hash64(str: string): bigint {
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;

    for (let i = 0; i < str.length; i++) {
      hash ^= BigInt(str.charCodeAt(i));
      hash *= prime;
      // Truncate to 64 bits
      hash &= 0xffffffffffffffffn;
    }
    return hash;
  }
}
