import { ContentItem, SourceEntity } from '@/types';

export interface RawItem {
  id: string;
  url: string;
  title: string;
  rawContent: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string; // Optional field for discovered images
}

export interface Connector {
  /**
   * Stage 1: Discovery. Find new items from the source.
   */
  discover(entity: SourceEntity): Promise<RawItem[]>;

  /**
   * Stage 2: Hydration. Fetch full content if the raw item is "thin".
   */
  hydrate(raw: RawItem): Promise<string>;

  /**
   * Stage 3: Normalization. Convert raw data to canonical ContentItem.
   */
  normalize(raw: RawItem, entity: SourceEntity): ContentItem;
}
