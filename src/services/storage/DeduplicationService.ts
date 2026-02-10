import type { NewsItem } from '../rss/types';
import { SimHashEngine } from './SimHashEngine';
import { SimilarityUtils } from './SimilarityUtils';

export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number; // 0 to 1
  reason?: 'exact_url' | 'content_hash' | 'title_similarity';
  originalId?: string;
}

export class DeduplicationService {
  private simHashEngine = new SimHashEngine();
  private indexedHashes: Map<string, { hash: bigint; pubDate: Date }> = new Map(); // id -> hash/date
  private indexedTitles: Map<string, { title: string; pubDate: Date }> = new Map(); // id -> title/date
  
  private readonly HAMMING_THRESHOLD = 3;
  private readonly TITLE_SIMILARITY_THRESHOLD = 0.9;
  private readonly MIN_TITLE_LENGTH = 10;

  /**
   * Checks if an item is a duplicate of one already in the index.
   */
  public check(item: NewsItem): DeduplicationResult {
    if (!item) {
      throw new Error('[DeduplicationService] Item cannot be null or undefined');
    }
    if (!item.title) {
      throw new Error('[DeduplicationService] Item title is required for deduplication');
    }

    const startTime = Date.now();
    console.log(`[DeduplicationService] CHECK_START at ${new Date(startTime).toISOString()} for: ${item.title}`);

    try {
      // 1. Title Similarity Check (if title is long enough)
      const normalizedTitle = SimilarityUtils.normalize(item.title);
      if (normalizedTitle.length >= this.MIN_TITLE_LENGTH) {
        for (const [id, entry] of this.indexedTitles.entries()) {
          const similarity = SimilarityUtils.calculateSimilarity(normalizedTitle, entry.title);
          if (similarity >= this.TITLE_SIMILARITY_THRESHOLD) {
            const result: DeduplicationResult = {
              isDuplicate: true,
              confidence: similarity,
              reason: 'title_similarity',
              originalId: id
            };
            this.logSuccess(startTime, result);
            return result;
          }
        }
      }

      // 2. SimHash Check (on content or summary or title)
      const contentToHash = item.content || item.summary || item.title;
      const currentHash = this.simHashEngine.generate(contentToHash);
      
      if (currentHash !== 0n) {
        for (const [id, entry] of this.indexedHashes.entries()) {
          const distance = this.simHashEngine.getHammingDistance(currentHash, entry.hash);
          if (distance <= this.HAMMING_THRESHOLD) {
            const confidence = 1 - (distance / 64);
            const result: DeduplicationResult = {
              isDuplicate: true,
              confidence,
              reason: 'content_hash',
              originalId: id
            };
            this.logSuccess(startTime, result);
            return result;
          }
        }
      }

      const result: DeduplicationResult = {
        isDuplicate: false,
        confidence: 0
      };
      this.logSuccess(startTime, result);
      return result;
    } catch (error) {
      console.error(`[DeduplicationService] CHECK_FAILURE at ${new Date().toISOString()}:`, error);
      return { isDuplicate: false, confidence: 0 };
    }
  }

  /**
   * Adds an item to the deduplication index.
   */
  public index(item: NewsItem, id: string): void {
    if (!item) {
      throw new Error('[DeduplicationService] Item cannot be null or undefined');
    }
    if (!id) {
      throw new Error('[DeduplicationService] ID is required for indexing');
    }

    const pubDate = item.pubDate || new Date();

    // Index title
    const normalizedTitle = SimilarityUtils.normalize(item.title);
    this.indexedTitles.set(id, { title: normalizedTitle, pubDate });

    // Index content hash
    const contentToHash = item.content || item.summary || item.title;
    try {
      const hash = this.simHashEngine.generate(contentToHash);
      if (hash !== 0n) {
        this.indexedHashes.set(id, { hash, pubDate });
      }
    } catch (e) {
      // If hashing fails (e.g. empty content), we still indexed by title above.
      console.warn(`[DeduplicationService] Could not generate hash for item ${id}: ${e}`);
    }
  }

  /**
   * Prunes the deduplication index based on item age.
   * @param maxAgeDays The maximum age of items to keep in days.
   */
  public prune(maxAgeDays: number): void {
    if (maxAgeDays <= 0) {
      throw new Error('[DeduplicationService] maxAgeDays must be greater than zero');
    }

    const startTime = Date.now();
    const cutoff = new Date(startTime - maxAgeDays * 24 * 60 * 60 * 1000);
    let titlePruned = 0;
    let hashPruned = 0;

    for (const [id, entry] of this.indexedTitles.entries()) {
      if (entry.pubDate < cutoff) {
        this.indexedTitles.delete(id);
        titlePruned++;
      }
    }

    for (const [id, entry] of this.indexedHashes.entries()) {
      if (entry.pubDate < cutoff) {
        this.indexedHashes.delete(id);
        hashPruned++;
      }
    }

    console.log(`[DeduplicationService] PRUNE_SUCCESS in ${Date.now() - startTime}ms. Removed ${titlePruned} titles and ${hashPruned} hashes older than ${maxAgeDays} days.`);
  }

  /**
   * Clears the index (useful for testing).
   */
  public clear(): void {
    this.indexedHashes.clear();
    this.indexedTitles.clear();
  }

  private logSuccess(startTime: number, result: DeduplicationResult): void {
    const duration = Date.now() - startTime;
    console.log(`[DeduplicationService] CHECK_SUCCESS in ${duration}ms. Duplicate: ${result.isDuplicate}${result.reason ? ` Reason: ${result.reason}` : ''}`);
  }
}
